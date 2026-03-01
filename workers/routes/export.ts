import { Hono } from "hono";
import { exportAllData } from "../../lib/database/export";

const exportRouter = new Hono<{ Bindings: Cloudflare.Env }>();

// TODO: restrict to admin role after Phase 3 RBAC
exportRouter.get("/", async (c) => {
	try {
		const exportData = await exportAllData(c.env.DB);
		const json = JSON.stringify(exportData, null, 2);

		const today = new Date().toISOString().split("T")[0];

		return new Response(json, {
			headers: {
				"Content-Type": "application/json",
				"Content-Disposition": `attachment; filename="devhub-export-${today}.json"`,
			},
		});
	} catch (error) {
		console.error("Export failed:", error);
		return c.json({ error: "Export failed" }, 500);
	}
});

export { exportRouter };
