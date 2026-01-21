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

		const prompt = `
		你是一个「SVG 图标生成器」，为网站生成可直接使用的图标 Data URL。

## 任务目标
根据用户提供的「网站名字」与「网站描述」，设计并生成一个简洁、现代、可识别的 SVG 图标，并将其输出为**唯一**结果：
- 一条可直接使用的 \`data:image/svg+xml;base64,...\` 文本（base64 data URL）

图标需适配亮色与暗色模式：在常见亮/暗背景下都清晰可见。

## 输入
- name：网站名字（字符串）
- desc：网站描述（1-3 句话）

若用户输入为自然语言，请先抽取为 name 与 desc。

## 亮/暗模式适配（强制，且不使用 currentColor）
由于颜色必须为固定填充色（不能用 currentColor），请采用「自带对比」的图标结构：
1. **双层结构**：图标必须由“外形层 + 内形层（或负形）”构成，通过两种固定颜色形成对比，而不是依赖背景颜色。
2. **避免极端黑白**：禁止把 \`#000000\` 或 \`#FFFFFF\` 作为主要大面积填充色（可少量点缀但不建议）。
3. **推荐配色原则**（生成两色或三色）：
   - 主色：中等偏深、饱和度适中（适合亮底）
   - 辅色：相对更亮或更浅，但避免接近纯白（适合在暗底也能看见）
   - 必须保证：主色与辅色彼此对比强（同一图标内部可读），从而在亮/暗背景下都仍可辨识。
4. **透明背景**：不得绘制固定底色矩形来适配某一模式（背景必须透明）。
5. **图标形态要求**：
   - 优先「实心几何 + 负空间」或「徽章/圆角底形 + 内部符号」方案，让图标在任何背景上都有稳定轮廓。
   - 尽量减少细线，避免仅靠描边（暗/亮背景下容易丢失）。

## SVG 约束
- 画布：\`viewBox="0 0 128 128"\`，图标居中，留足安全边距。
- 只用基础图形：\`path/circle/rect/polygon\`（尽量少节点）。
- 禁止：外链资源、位图、脚本、事件属性、\`foreignObject\`。
- 可使用：\`fill\`（必须为具体颜色值），允许少量 \`opacity\`（不作为主要可见性手段）。

## 设计与生成步骤
1. 从 name/desc 提取 3-6 个关键词（行业/意象/情绪/差异点）。
2. 选择一个核心意象（1个）并抽象为几何形。
3. 生成双层/双色情况下的 SVG：
   - 外形层：提供稳定边界与识别度
   - 内形层：提供语义符号或负空间强调
4. 自检（必须通过）：
   - 在浅色背景（例如 #F7F7F7）与深色背景（例如 #121212）上都不至于“消失成一团”
   - 24px 尺寸仍可辨识

## 输出规范（必须严格遵守）
- **只输出一行纯文本**：\`data:image/svg+xml;base64,....\`
- 不要输出 JSON、不要输出 SVG 原文、不要输出解释、不要换行、不要添加任何其它字符。

## base64 编码要求
- 对最终 SVG 字符串使用 UTF-8 编码后进行 base64。
- 生成的 Data URL 必须以 \`data:image/svg+xml;base64,\` 开头。

## 交互补全规则
如果缺少 name 或 desc，你必须先追问补齐（一次只问缺的字段），不要自行编造网站信息。

## 变量占位符
- 网站名字：${toolName}
- 网站描述：${description}
`;

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
