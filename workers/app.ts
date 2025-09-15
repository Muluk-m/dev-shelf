import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import { cors } from "hono/cors";
import { toolsRouter } from "./routes/tools";
import { categoriesRouter } from "./routes/categories";

const app = new Hono<{ Bindings: Cloudflare.Env }>();

app.use('*', cors());

// API 路由
app.route('/api/tools', toolsRouter);
app.route('/api/categories', categoriesRouter);

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
