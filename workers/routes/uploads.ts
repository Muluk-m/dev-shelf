import { Hono } from "hono";

export type UploadFile = {
		key: string;
		urls: Record<string, string>;
		name: string;
		size: number;
		type: string;
	}

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

export const uploadsRouter = new Hono<{ Bindings: Cloudflare.Env }>();

uploadsRouter.post("/", async (c) => {
	try {
		const formData = await c.req.formData();
		const files: File[] = [];

		for (const [key, value] of formData.entries()) {
			if (key === "files" && value instanceof File) {
				files.push(value);
			}
		}

		if (files.length === 0) {
			return c.json({ error: "No files provided" }, 400);
		}

		const baseDir = 'uploads/cdn_source/images';
		const results = [] as Array<UploadFile>;

		for (const file of files) {
			const originalName = sanitizeFilename(file.name || "file");
			const ext = originalName.includes(".")
				? originalName.substring(originalName.lastIndexOf(".") + 1)
				: getExtensionFromType(file.type, "bin");
			const basename = originalName.replace(/\.[^.]+$/, "");
			const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
			const key = `${baseDir}/${basename}-${stamp}.${ext}`;

			await c.env.ASSETS_BUCKET.put(key, file.stream(), {
					httpMetadata: { contentType: file.type || "application/octet-stream" },
					customMetadata: { originalName },
				});

			results.push({
				key,
				urls: {
					r2: `${c.env.IMAGE_PREFIX}/${key}`,
				},
				name: file.name,
				size: file.size,
				type: file.type,
			});
		}

		return c.json({ files: results }, 201);
	} catch (error) {
		console.error("Upload error", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});


