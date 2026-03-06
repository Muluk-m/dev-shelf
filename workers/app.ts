import { Hono } from "hono";
import { cors } from "hono/cors";
import { createRequestHandler } from "react-router";
import { authMiddleware } from "./middleware/auth";
import { adminRouter } from "./routes/admin";
import { auth } from "./routes/auth";
import { categoriesRouter } from "./routes/categories";
import { exportRouter } from "./routes/export";
import { setupRouter } from "./routes/setup";
import { toolsRouter } from "./routes/tools";
import { uploadsRouter } from "./routes/uploads";

const app = new Hono<{ Bindings: Cloudflare.Env }>();

app.use(
	"*",
	cors({
		origin: (origin) => origin || "",
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
	authMiddleware,
);

// API routes
app.route("/api/auth", auth);
app.route("/api/setup", setupRouter);
app.route("/api/admin", adminRouter);
app.route("/api/tools", toolsRouter);
app.route("/api/categories", categoriesRouter);
app.route("/api/export", exportRouter);
app.route("/api/uploads", uploadsRouter);

app.get("/.well-known/appspecific/com.chrome.devtools.json", (ctx) =>
	ctx.json({}),
);

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
