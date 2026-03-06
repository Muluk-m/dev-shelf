import { Hono } from "hono";
import { requireAuth } from "../middleware/rbac";

export type UploadFile = {
	key: string;
	urls: Record<string, string>;
	name: string;
	size: number;
	type: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set([
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/svg+xml",
	"application/pdf",
	"text/plain",
	"application/json",
]);

function sanitizeFilename(input: string) {
	return input
		.normalize("NFKC")
		.replace(/[^a-zA-Z0-9._-]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^[-.]+|[-.]+$/g, "");
}

function getExtensionFromType(
	contentType: string | null | undefined,
	fallback: string,
) {
	if (!contentType) return fallback;
	const map: Record<string, string> = {
		"image/jpeg": "jpg",
		"image/jpg": "jpg",
		"image/png": "png",
		"image/gif": "gif",
		"image/webp": "webp",
		"image/svg+xml": "svg",
		"application/pdf": "pdf",
		"text/plain": "txt",
		"application/json": "json",
	};
	return map[contentType] || fallback;
}

export const uploadsRouter = new Hono<{ Bindings: Cloudflare.Env }>();

uploadsRouter.post("/", requireAuth, async (c) => {
	try {
		if (!c.env.ASSETS_BUCKET) {
			return c.json({ error: "File storage is not configured" }, 503);
		}

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

		// Validate files
		for (const file of files) {
			if (file.size > MAX_FILE_SIZE) {
				return c.json({ error: `File "${file.name}" exceeds 10MB limit` }, 400);
			}
			if (file.type && !ALLOWED_TYPES.has(file.type)) {
				return c.json(
					{ error: `File type "${file.type}" is not allowed` },
					400,
				);
			}
		}

		const baseDir = "uploads/cdn_source/images";
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
				httpMetadata: {
					contentType: file.type || "application/octet-stream",
				},
				customMetadata: { originalName },
			});

			results.push({
				key,
				urls: {
					r2: `/api/assets/${key}`,
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
