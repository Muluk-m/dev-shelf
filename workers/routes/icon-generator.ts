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
		const DIFY_API_KEY = "app-w3ySSC6PLTlrjldSPErTwE6x";

		// Build prompt for icon generation
		const baseRequirements = `
要求：
1. 生成 SVG 格式的图标，尺寸为 24x24
2. 图标应简洁、专业，适合在工具列表中展示
3. 重要：填充色必须使用中等亮度的彩色（如 #3B82F6 蓝色、#10B981 绿色、#F59E0B 橙色、#8B5CF6 紫色等），禁止使用纯黑色(#000)或纯白色(#fff)，确保在明亮和暗色背景下都清晰可见
4. 请直接返回 data URI 格式，即：data:image/svg+xml;base64,<base64编码的SVG内容>
5. 只返回 data URI 字符串，不要有其他说明文字

示例输出格式：
data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjM0I4MkY2IiBkPSJNMTIgMmM1LjUyIDAgMTAgNC40OCAxMCAxMHMtNC40OCAxMC0xMCAxMFMyIDE3LjUyIDIgMTIgNi40OCAyIDEyIDJ6Ii8+PC9zdmc+`;

		const prompt = description
			? `请为"${toolName}"工具生成一个图标。工具描述：${description}
${baseRequirements}`
			: `请为"${toolName}"工具生成一个图标。
${baseRequirements}`;

		const response = await fetch(`${DIFY_API_URL}/chat-messages`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${DIFY_API_KEY}`,
			},
			body: JSON.stringify({
				inputs: {},
				query: prompt,
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
