import { Hono } from "hono";

const iconGeneratorRouter = new Hono<{ Bindings: Cloudflare.Env }>();

interface GenerateIconRequest {
	toolName: string;
	description?: string;
}

/**
 * Generate tool icon using AI
 */
iconGeneratorRouter.post("/generate", async (c) => {
	try {
		const body = await c.req.json<GenerateIconRequest>();
		const { toolName, description } = body;

		if (!toolName?.trim()) {
			return c.json({ error: "工具名称不能为空" }, 400);
		}

		const DIFY_API_URL = "https://api-ai.qiliangjia.org/v1";
		const DIFY_API_KEY = "app-Uwz1jNDR32zex0xTuYO1fVku";

		const response = await fetch(`${DIFY_API_URL}/chat-messages`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${DIFY_API_KEY}`,
			},
			body: JSON.stringify({
				inputs: {
					toolName: toolName,
					description: description,
				},
				query: "请生成",
				response_mode: "blocking",
				user: "admin",
			}),
			signal: AbortSignal.timeout(30000), // 30s timeout
		});

		if (!response.ok) {
			if (response.status === 429) {
				return c.json({ error: "请求过于频繁，请稍后再试" }, 429);
			}
			const errorData: any = await response.json().catch(() => ({}));
			return c.json({ error: errorData.message || "AI 图标生成失败" }, 500);
		}

		const data: any = await response.json();

		// Extract icon URL from response
		let iconUrl = data.answer || data.iconUrl || data.result?.iconUrl || "";

		// Clean response content, extract data URI
		if (iconUrl) {
			// Remove possible markdown code block markers
			iconUrl = iconUrl.replace(/```[\s\S]*?```/g, "").trim();
			iconUrl = iconUrl.replace(/`/g, "").trim();

			// Find data:image/svg+xml;base64, format content
			const dataUriMatch = iconUrl.match(
				/data:image\/svg\+xml;base64,[A-Za-z0-9+/=]+/,
			);
			if (dataUriMatch) {
				iconUrl = dataUriMatch[0];
			}

			// Validate data URI format
			if (!iconUrl.startsWith("data:image/svg+xml;base64,")) {
				return c.json({ error: "AI 返回的图标格式不正确，请重试" }, 500);
			}
		}

		if (!iconUrl) {
			return c.json({ error: "未能从响应中获取图标 URL" }, 500);
		}

		return c.json({ iconUrl });
	} catch (error) {
		console.error("Generate icon error:", error);
		if (error instanceof Error && error.name === "TimeoutError") {
			return c.json({ error: "请求超时，请稍后重试" }, 500);
		}
		return c.json(
			{
				error:
					error instanceof Error ? error.message : "网络错误，请检查连接后重试",
			},
			500,
		);
	}
});

export { iconGeneratorRouter };
