import { Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

const abRouterProxy = new Hono<{ Bindings: Cloudflare.Env }>();

const AB_ROUTER_UPSTREAM = "https://app.downloads.my";

/**
 * Map response status to valid Hono status code
 */
function mapStatusCode(status: number): ContentfulStatusCode {
	if (status === 400) return 400;
	if (status === 404) return 404;
	return 500;
}

/**
 * Extract array from various response formats
 */
function extractArray(data: unknown): unknown[] {
	// 已经是数组
	if (Array.isArray(data)) {
		return data;
	}
	// 对象格式，尝试提取 links, data, items, results 等常见字段
	if (data && typeof data === "object") {
		const obj = data as Record<string, unknown>;
		for (const key of ["links", "data", "items", "results", "list"]) {
			if (Array.isArray(obj[key])) {
				return obj[key] as unknown[];
			}
		}
	}
	// 无法提取，返回空数组
	console.warn("Unable to extract array from response:", data);
	return [];
}

/**
 * GET /api/ab-router/links - 获取所有链接配置
 */
abRouterProxy.get("/links", async (c) => {
	try {
		const response = await fetch(`${AB_ROUTER_UPSTREAM}/api/links`);
		const data: unknown = await response.json();

		if (!response.ok) {
			return c.json(data as object, mapStatusCode(response.status));
		}

		// 确保返回数组
		const links = extractArray(data);
		return c.json(links);
	} catch (error) {
		console.error("Proxy AB Router links error:", error);
		return c.json({ error: "获取链接列表失败" }, 500);
	}
});

/**
 * GET /api/ab-router/links/:id - 获取单个链接配置
 */
abRouterProxy.get("/links/:id", async (c) => {
	const id = c.req.param("id");

	try {
		const response = await fetch(`${AB_ROUTER_UPSTREAM}/api/links/${id}`);
		const data: unknown = await response.json();

		if (!response.ok) {
			return c.json(data as object, mapStatusCode(response.status));
		}

		return c.json(data as object);
	} catch (error) {
		console.error("Proxy AB Router link error:", error);
		return c.json({ error: "获取链接配置失败" }, 500);
	}
});

/**
 * POST /api/ab-router/links - 创建新链接配置
 */
abRouterProxy.post("/links", async (c) => {
	try {
		const body = await c.req.json();
		const response = await fetch(`${AB_ROUTER_UPSTREAM}/api/links`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		const data: unknown = await response.json();

		if (!response.ok) {
			return c.json(data as object, mapStatusCode(response.status));
		}

		return c.json(data as object);
	} catch (error) {
		console.error("Proxy AB Router create link error:", error);
		return c.json({ error: "创建链接配置失败" }, 500);
	}
});

/**
 * PUT /api/ab-router/links/:id - 更新链接配置
 */
abRouterProxy.put("/links/:id", async (c) => {
	const id = c.req.param("id");

	try {
		const body = await c.req.json();
		const response = await fetch(`${AB_ROUTER_UPSTREAM}/api/links/${id}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		const data: unknown = await response.json();

		if (!response.ok) {
			return c.json(data as object, mapStatusCode(response.status));
		}

		return c.json(data as object);
	} catch (error) {
		console.error("Proxy AB Router update link error:", error);
		return c.json({ error: "更新链接配置失败" }, 500);
	}
});

/**
 * DELETE /api/ab-router/links/:id - 删除链接配置
 */
abRouterProxy.delete("/links/:id", async (c) => {
	const id = c.req.param("id");

	try {
		const response = await fetch(`${AB_ROUTER_UPSTREAM}/api/links/${id}`, {
			method: "DELETE",
		});

		const data: unknown = await response.json();

		if (!response.ok) {
			return c.json(data as object, mapStatusCode(response.status));
		}

		return c.json(data as object);
	} catch (error) {
		console.error("Proxy AB Router delete link error:", error);
		return c.json({ error: "删除链接配置失败" }, 500);
	}
});

/**
 * POST /api/ab-router/links/:id/preview - 预览链接决策
 */
abRouterProxy.post("/links/:id/preview", async (c) => {
	const id = c.req.param("id");

	try {
		const body = await c.req.json();
		const response = await fetch(
			`${AB_ROUTER_UPSTREAM}/api/links/${id}/preview`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
			},
		);

		const data: unknown = await response.json();

		if (!response.ok) {
			return c.json(data as object, mapStatusCode(response.status));
		}

		return c.json(data as object);
	} catch (error) {
		console.error("Proxy AB Router preview error:", error);
		return c.json({ error: "预览决策失败" }, 500);
	}
});

/**
 * GET /api/ab-router/logs - 查询所有访问日志
 */
abRouterProxy.get("/logs", async (c) => {
	try {
		const url = new URL(c.req.url);
		const queryString = url.search;
		const upstreamUrl = `${AB_ROUTER_UPSTREAM}/api/logs${queryString}`;

		const response = await fetch(upstreamUrl);
		const data: unknown = await response.json();

		if (!response.ok) {
			return c.json(data as object, mapStatusCode(response.status));
		}

		return c.json(data as object);
	} catch (error) {
		console.error("Proxy AB Router logs error:", error);
		return c.json({ error: "查询日志失败" }, 500);
	}
});

/**
 * DELETE /api/ab-router/logs - 删除日志
 */
abRouterProxy.delete("/logs", async (c) => {
	try {
		const url = new URL(c.req.url);
		const queryString = url.search;
		const upstreamUrl = `${AB_ROUTER_UPSTREAM}/api/logs${queryString}`;

		const response = await fetch(upstreamUrl, { method: "DELETE" });
		const data: unknown = await response.json();

		if (!response.ok) {
			return c.json(data as object, mapStatusCode(response.status));
		}

		return c.json(data as object);
	} catch (error) {
		console.error("Proxy AB Router delete logs error:", error);
		return c.json({ error: "删除日志失败" }, 500);
	}
});

/**
 * GET /api/ab-router/links/:id/logs - 查询指定链路的访问日志
 */
abRouterProxy.get("/links/:id/logs", async (c) => {
	const id = c.req.param("id");

	try {
		const url = new URL(c.req.url);
		const queryString = url.search;
		const upstreamUrl = `${AB_ROUTER_UPSTREAM}/api/links/${id}/logs${queryString}`;

		const response = await fetch(upstreamUrl);
		const data: unknown = await response.json();

		if (!response.ok) {
			return c.json(data as object, mapStatusCode(response.status));
		}

		return c.json(data as object);
	} catch (error) {
		console.error("Proxy AB Router link logs error:", error);
		return c.json({ error: "查询日志失败" }, 500);
	}
});

/**
 * DELETE /api/ab-router/links/:id/logs - 删除指定链路的日志
 */
abRouterProxy.delete("/links/:id/logs", async (c) => {
	const id = c.req.param("id");

	try {
		const response = await fetch(`${AB_ROUTER_UPSTREAM}/api/links/${id}/logs`, {
			method: "DELETE",
		});
		const data: unknown = await response.json();

		if (!response.ok) {
			return c.json(data as object, mapStatusCode(response.status));
		}

		return c.json(data as object);
	} catch (error) {
		console.error("Proxy AB Router delete link logs error:", error);
		return c.json({ error: "删除日志失败" }, 500);
	}
});

/**
 * GET /api/ab-router/links/:id/stats - 获取指定链路的统计信息
 */
abRouterProxy.get("/links/:id/stats", async (c) => {
	const id = c.req.param("id");

	try {
		const url = new URL(c.req.url);
		const queryString = url.search;
		const upstreamUrl = `${AB_ROUTER_UPSTREAM}/api/links/${id}/stats${queryString}`;

		const response = await fetch(upstreamUrl);
		const data: unknown = await response.json();

		if (!response.ok) {
			return c.json(data as object, mapStatusCode(response.status));
		}

		return c.json(data as object);
	} catch (error) {
		console.error("Proxy AB Router link stats error:", error);
		return c.json({ error: "获取统计信息失败" }, 500);
	}
});

export { abRouterProxy };
