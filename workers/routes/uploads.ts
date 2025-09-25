import { Hono } from "hono";

function sanitizeFilename(input: string) {
	return input
		.normalize("NFKC")
		.replace(/[^a-zA-Z0-9._-]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^[-.]+|[-.]+$/g, "");
}

function getExtensionFromType(contentType: string | null | undefined, fallback: string) {
	if (!contentType) return fallback;
	const map: Record<string, string> = {
		"image/jpeg": "jpg",
		"image/jpg": "jpg",
		"image/png": "png",
		"image/gif": "gif",
		"image/webp": "webp",
		"image/svg+xml": "svg",
		"video/mp4": "mp4",
		"video/webm": "webm",
		"text/plain": "txt",
		"text/css": "css",
		"text/javascript": "js",
		"application/javascript": "js",
		"application/json": "json",
	};
	return map[contentType] || fallback;
}

async function sha256Hex(input: ArrayBuffer | string) {
    const data = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256(key: ArrayBuffer | Uint8Array, data: string | Uint8Array) {
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        key,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
    );
    const enc = typeof data === "string" ? new TextEncoder().encode(data) : data;
    const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc);
    return new Uint8Array(sig);
}

function toHex(buffer: Uint8Array) {
    return [...buffer].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function getSignatureKey(secretKey: string, dateStamp: string, region: string, service: string) {
    const kDate = await hmacSha256(new TextEncoder().encode("AWS4" + secretKey), dateStamp);
    const kRegion = await hmacSha256(kDate, region);
    const kService = await hmacSha256(kRegion, service);
    const kSigning = await hmacSha256(kService, "aws4_request");
    return kSigning;
}

function buildS3Host(bucket: string, region: string, endpoint?: string) {
    if (endpoint && endpoint.length > 0) {
        const u = new URL(endpoint);
        // Prefer virtual-hosted style if endpoint is root host
        return `${bucket}.${u.host}`;
    }
    return `${bucket}.s3.${region}.amazonaws.com`;
}

function buildS3Url(bucket: string, region: string, key: string, endpoint?: string) {
    const host = buildS3Host(bucket, region, endpoint);
    return `https://${host}/${encodeURI(key)}`;
}

async function putToS3(params: {
    env: Cloudflare.Env;
    key: string;
    body: ArrayBuffer;
    contentType: string;
}) {
    const accessKey = (params.env as any).AWS_ACCESS_KEY_ID as string | undefined;
    const secretKey = (params.env as any).AWS_SECRET_ACCESS_KEY as string | undefined;
    const bucket = (params.env as any).AWS_S3_BUCKET as string | undefined;
    const region = (params.env as any).AWS_S3_REGION as string | undefined;
    const endpoint = (params.env as any).AWS_S3_ENDPOINT as string | undefined;

    if (!accessKey || !secretKey || !bucket || !region) {
        throw new Error("Missing AWS S3 credentials or config in environment");
    }

    const host = buildS3Host(bucket, region, endpoint);
    const url = `https://${host}/${encodeURI(params.key)}`;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z"; // YYYYMMDDTHHMMSSZ
    const dateStamp = amzDate.slice(0, 8); // YYYYMMDD

    const method = "PUT";
    const canonicalUri = `/${encodeURI(params.key)}`;
    const canonicalQueryString = "";

    const payloadHash = await sha256Hex(params.body);

    const canonicalHeaders =
        `content-type:${params.contentType || "application/octet-stream"}\n` +
        `host:${host}\n` +
        `x-amz-content-sha256:${payloadHash}\n` +
        `x-amz-date:${amzDate}\n`;
    const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
    const canonicalRequest = [method, canonicalUri, canonicalQueryString, canonicalHeaders, signedHeaders, payloadHash].join("\n");

    const algorithm = "AWS4-HMAC-SHA256";
    const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
    const stringToSign = [algorithm, amzDate, credentialScope, await sha256Hex(canonicalRequest)].join("\n");
    const signingKey = await getSignatureKey(secretKey, dateStamp, region, "s3");
    const signature = toHex(await hmacSha256(signingKey, stringToSign));
    const authorizationHeader = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const res = await fetch(url, {
        method: "PUT",
        headers: {
            "content-type": params.contentType || "application/octet-stream",
            host,
            "x-amz-date": amzDate,
            "x-amz-content-sha256": payloadHash,
            Authorization: authorizationHeader,
        },
        body: params.body,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`S3 upload failed: ${res.status} ${res.statusText} ${text}`);
    }

    return buildS3Url(bucket, region, params.key, endpoint);
}

export const uploadsRouter = new Hono<{ Bindings: Cloudflare.Env }>();

uploadsRouter.post("/", async (c) => {
	try {
		const formData = await c.req.formData();
		console.log(formData, '====formData');
		// 新版：单选参数 target=r2|s3
		const target = (formData.get("target") as string | null)?.toLowerCase() || null;
		let targetR2 = false;
		let targetS3 = false;
		if (target === "r2") targetR2 = true;
		if (target === "s3") targetS3 = true;
		// 兼容旧版：两个布尔字段
		if (!targetR2 && !targetS3) {
			const oldR2 = String(formData.get("target_r2") || "false") === "true";
			const oldS3 = String(formData.get("target_s3") || "false") === "true";
			targetR2 = oldR2;
			targetS3 = oldS3;
		}

		const folder = (formData.get("folder") as string | null) || undefined;
		const files: File[] = [];

		for (const [key, value] of formData.entries()) {
			if (key === "files" && value instanceof File) {
				files.push(value);
			}
		}

		if (files.length === 0) {
			return c.json({ error: "No files provided" }, 400);
		}

		const now = new Date();
		const yyyy = now.getUTCFullYear();
		const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
		const dd = String(now.getUTCDate()).padStart(2, "0");

		const baseDir = folder ? sanitizeFilename(folder) : `/uploads`;

		const results = [] as Array<{
			key: string;
			urls: Record<string, string>;
			name: string;
			size: number;
			type: string;
		}>;

		for (const file of files) {
			const originalName = sanitizeFilename(file.name || "file");
			const ext = originalName.includes(".")
				? originalName.substring(originalName.lastIndexOf(".") + 1)
				: getExtensionFromType(file.type, "bin");
			const basename = originalName.replace(/\.[^.]+$/, "");
			const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
			const key = `${baseDir}/${basename}-${stamp}.${ext}`;

			const urls: Record<string, string> = {};

			if (targetR2) {
				const r2 = await c.env.ASSETS_BUCKET.put(key, file.stream(), {
					httpMetadata: { contentType: file.type || "application/octet-stream" },
					customMetadata: { originalName },
				});
                console.log(r2, '====r2');
				const apiBase = (c.env.API_BASE_URL as string) || "";
				urls.r2 = `${apiBase}/assets/${encodeURIComponent(key)}`;
			}

			results.push({
				key,
				urls,
				name: file.name,
				size: file.size,
				type: file.type,
			});

			// if (targetS3) {
			// 	const body = await file.arrayBuffer();
			// 	const s3Url = await putToS3({
			// 		env: c.env,
			// 		key,
			// 		body,
			// 		contentType: file.type || "application/octet-stream",
			// 	});
			// 	urls.s3 = s3Url;
			// }
		}

		return c.json({ files: results }, 201);
	} catch (error) {
		console.error("Upload error", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

export type UploadResult = {
	files: Array<{
		key: string;
		url: string;
		name: string;
		size: number;
		type: string;
	}>;
};


