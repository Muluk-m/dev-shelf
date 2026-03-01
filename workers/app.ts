import { Hono } from "hono";
import { cors } from "hono/cors";
import { createRequestHandler } from "react-router";
import { authMiddleware } from "./middleware/auth";
import { adminRouter } from "./routes/admin";
import { auth } from "./routes/auth";
import { categoriesRouter } from "./routes/categories";
import { setupRouter } from "./routes/setup";
import { toolsRouter } from "./routes/tools";
import { uploadsRouter } from "./routes/uploads";

const app = new Hono<{ Bindings: Cloudflare.Env }>();

app.use("*", cors(), authMiddleware);

// API routes
app.route("/api/auth", auth);
app.route("/api/setup", setupRouter);
app.route("/api/admin", adminRouter);
app.route("/api/tools", toolsRouter);
app.route("/api/categories", categoriesRouter);
app.route("/api/uploads", uploadsRouter);

app.get("/.well-known/appspecific/com.chrome.devtools.json", (ctx) =>
	ctx.json({}),
);

// Public R2 asset serving
app.get("/assets/*", async (c) => {
	const key = c.req.path.replace(/^\/assets\//, "");
	if (!key || key.length === 0) {
		return c.json({ error: "Missing key" }, 400);
	}

	const obj = await c.env.ASSETS_BUCKET.get(key);
	if (!obj) {
		return c.json({ error: "Not found" }, 404);
	}

	const headers = new Headers();
	if (obj.httpMetadata?.contentType) {
		headers.set("Content-Type", obj.httpMetadata.contentType);
	}
	headers.set("Cache-Control", "public, max-age=31536000, immutable");

	return new Response(obj.body, { status: 200, headers });
});

app.get("*", (c) => {
	const requestHandler = createRequestHandler(
		() => import("virtual:react-router/server-build"),
		import.meta.env.MODE,
	);

	return requestHandler(c.req.raw, {
		cloudflare: { env: c.env, ctx: c.executionCtx },
	});
});

export default app;
