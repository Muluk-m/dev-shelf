import { Hono } from "hono";
import { cors } from "hono/cors";
import { createRequestHandler } from "react-router";
import { categoriesRouter } from "./routes/categories";
import { toolsRouter } from "./routes/tools";

const app = new Hono<{ Bindings: Cloudflare.Env }>();

app.use("*", cors());

// API 路由
app.route("/api/tools", toolsRouter);
app.route("/api/categories", categoriesRouter);

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
