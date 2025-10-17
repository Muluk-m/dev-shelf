import { Hono } from "hono";
import { cors } from "hono/cors";
import { createRequestHandler } from "react-router";
import { authMiddleware } from "./middleware/auth";
import { auth } from "./routes/auth";
import { categoriesRouter } from "./routes/categories";
import { cfLogsRouter } from "./routes/cf-logs";
import { queryAnalyzerRouter } from "./routes/query-analyzer";
import { toolsRouter } from "./routes/tools";
import { uploadsRouter } from "./routes/uploads";

const app = new Hono<{ Bindings: Cloudflare.Env }>();

app.use("*", cors(), authMiddleware);

// 挂载认证路由
app.route("/auth", auth);

// API 路由
app.route("/api/tools", toolsRouter);
app.route("/api/categories", categoriesRouter);
app.route("/api/uploads", uploadsRouter);
app.route("/api/cf-logs", cfLogsRouter);
app.route("/api/query-analyzer", queryAnalyzerRouter);

app.get("/.well-known/appspecific/com.chrome.devtools.json", (ctx) =>
	ctx.json({}),
);

// 公开读取 R2 对象以形成稳定 CDN URL（带 Cache-Control）
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
