import { Hono } from "hono";

const queryAnalyzerRouter = new Hono<{ Bindings: Cloudflare.Env }>();

interface ConvertToSQLRequest {
	naturalLanguage: string;
	schema: {
		tableName: string;
		database: string;
		columns: Array<{
			name: string;
			type: string;
			comment?: string;
		}>;
	};
}

interface ExecuteQueryRequest {
	sql: string;
}

interface AnalyzeDataRequest {
	data: any[];
	sql: string;
	naturalQuery?: string;
}

/**
 * Convert natural language to SQL using LLM
 */
queryAnalyzerRouter.post("/convert-to-sql", async (c) => {
	try {
		const body = await c.req.json<ConvertToSQLRequest>();
		const { naturalLanguage, schema } = body;

		if (!naturalLanguage?.trim()) {
			return c.json({ error: "自然语言查询不能为空" }, 400);
		}

		// Build prompt for LLM
		const columnsInfo = schema.columns
			.map(
				(col) =>
					`  - ${col.name} (${col.type})${
						col.comment ? `: ${col.comment}` : ""
					}`,
			)
			.join("\n");

		// Event codes mapping
		const eventCodesInfo = `
91001: 广告平台内-落地页访问
91053: chrome内访问
91002: 广告平台内-点击play
91068: 广告平台内-Play Now点击
91004: 广告平台内-自动跳转Chrome
91005: 成功进入chrome
91006: chrome内-首次点击
91023: 原生安装事件准备好了
91008: 成功弹起原生安装弹窗
91018: 安装PWA拒绝
91003: 安装PWA允许
91032: PWA已卸载
91024: chrome内-弹起订阅
91025: chrome内-允许订阅
91026: chrome内-拒绝订阅
91038: chrome内-订阅失败
91027: chrome内-订阅授权无操作
91028: chrome内-弹起引导安装弹窗
91039: chrome内-点击引导安装点击弹窗
91045: chrome内-点击引导安装取消弹窗
91029: chrome内-弹起vip邀请弹窗
91048: chrome内-点击vip邀请弹窗
91030: chrome内-弹起pwa启动浮层
91035: chrome内-点击pwa启动浮层
91033: 通过安装流程进入PWA
91034: 通过桌面进入PWA
91036: 关闭引导启动
91037: 全屏进入H5
91040: 游戏loading弹框显示
91041: 游戏loading弹框点击
91042: 底部安装弹框显示
91043: 底部安装弹框点击
91051: 短剧引导播放弹框显示
91052: 短剧引导播放弹框点击
91055: 悬浮球点击
91060: 悬浮球展示
91056: 悬浮球弹框展示
91057: 悬浮球弹框cta点击
91058: 悬浮球弹框取消
91059: 返回拦截
91061: 全体验引导下载弹窗展示
91062: 全功能引导下载弹窗展示
91063: 继续later引导下载弹窗展示
91064: 全体验引导下载弹窗点击
91065: 全功能引导下载弹窗点击
91066: 继续later引导下载弹窗点击
91067: 全体验引导下载弹窗取消
91069: 继续later引导下载弹窗取消
11002: 安装install点击-fb内
11003: 返回拦截跳转Chrome-fb内
11004: 自动跳-fb内
11005: 返回弹窗显示-fb内
11006: 返回弹窗点击-fb内
11053: 已安装用户再次访问广告-fb内
21030: 返回弹窗显示-Chrome内
21031: 返回弹窗点击-Chrome内
21001: 落地页访问量-Chrome内
21002: rapid install点击-Chrome内
21006: 返回拦截调起安装install-Chrome内
21009: 安装install点击-Chrome内总的
21015: rapid install点击没成功调起
21011: 点击install now
21016: 点击install now没成功调起
21012: 点击fake-alert上的install
21017: 点击fake-alert上的install没成功调起
21023: 原生安装事件准备好了
21008: 调起原生安装窗口-Chrome内
21003: install点击
21018: 取消安装
21004: 商店页play点击-chrome内
21007: 返回拦截调起Play-Chrome内
21010: 商店页play点击-Chrome内总的
21019: 商店页play启动失败
21013: 检测页面浏览
21014: 检测页面open点击
21020: 检测页面open启动失败
21005: app启动量
21022: 手动点击play-app启动
21021: 点击open-成功启动app
21024: Chrome弹起订阅通知
21025: 允许订阅
21026: 拒绝订阅
21027: 订阅授权无操作
21028: 推送通知显示
21029: 推送通知点击
21032: app卸载
21034: 浏览器启动
21040: 广告平台进入分享页面
21041: 广告平台点击分享按钮
21042: 广告平台输入分享弹窗邮箱
21043: 广告平台内成功调起起分享API
21044: chrome进入分享页面
21045: chrome点击分享按钮
21046: chrome输入分享弹窗邮箱
21047: chrome内成功调起起分享API
21048: 三星成功安装点击次数
21049: 三星失败安装点击次数
21051: 复制分享裂变弹窗显示
21052: 复制分享裂变弹窗点击
21053: 已安装用户再次访问广告-Chrome内
21056: 抽奖弹窗显示
21057: 点击go按钮
21058: 点击安装按钮
21059: 抽奖弹窗显示-Chrome内
21060: 点击go按钮-Chrome内
21061: 点击安装按钮-Chrome内
21062: 三星抽奖弹窗显示
21063: 点击go按钮-三星
21064: 点击安装按钮-三星
21070: 轮询结束
21072: 轮询开始
21073: CHROME_INSTALL_PIXEL_REPORT
21071: 调起原生安装窗口失败
11080: 广告环境页面隐藏
11081: 广告环境页面显示
21080: Chrome环境页面隐藏
21081: Chrome环境页面显示
11011: play页面返回拦截-fb内
21074: play页面返回拦截-Chrome内
21075: scan页面返回拦截-Chrome内
21076: play页面点击返回，app启动
21077: play页面点击返回，app启动失败
21078: scan页面点击返回，app启动
21079: scan页面点击返回，app启动失败`;

		const prompt = `
# 数据表信息

数据库: ${schema.database}
表名: ${schema.tableName}

字段列表:
${columnsInfo}

# Event Code 事件代码定义

这是 PWA 和 APP 安装追踪的埋点事件代码，每个代码对应一个具体的用户行为：
${eventCodesInfo}

# 用户需求

${naturalLanguage}

# 典型查询场景说明

用户通常会描述一个业务场景，这个场景对应一个或多个 event_code。例如：
- "查看安装转化情况" → 可能需要 event_code IN (21008, 21003, 21018) （弹起安装窗口、允许安装、拒绝安装）
- "分析订阅通知效果" → 可能需要 event_code IN (21024, 21025, 21026) （弹起订阅、允许、拒绝）
- "Chrome 内安装流程" → 可能需要 event_code IN (21001, 21009, 21008, 21003) （访问、点击安装、调起窗口、确认安装）

查询一般包含：
1. **场景对应的 event_code 筛选** - 使用 WHERE event_code IN (...)
2. **时间范围** - 使用 msg_event_time 字段
3. **时间聚合** - 按日期/小时分组，使用 toDate() 或 toHour()
4. **统计指标** - COUNT(*) 事件数、COUNT(DISTINCT uuid) 用户数

# 要求

1. **只使用表中存在的字段**
2. **event_code 必须从上面的定义中选择**，不要使用未定义的事件代码
3. **分析用户意图，选择合适的 event_code**：
   - 如果用户描述了具体场景，找到对应的几个 event_code
   - 如果用户没有明确场景，可以查询所有 event_code 并按事件分组
4. **必须包含时间范围限制**，使用 msg_event_time 字段
5. **不要在 SQL 中包含 project_id 过滤条件**，系统会自动添加
6. **仅返回 SELECT 查询**，不允许 INSERT、UPDATE、DELETE、DROP 等操作
7. **合理使用聚合函数** - COUNT、COUNT(DISTINCT)、SUM、AVG 等
8. **使用 ClickHouse 特有函数** - toDate()、toHour()、formatDateTime() 等
9. **适当添加 GROUP BY、ORDER BY、LIMIT**

# 输出格式

请严格按照以下格式返回：

\`\`\`sql
-- 你生成的 SQL 查询语句
\`\`\`

**查询说明**: 简要说明查询的逻辑和选择这些 event_code 的原因（1-2句话）
`;

		// Call LLM API
		const llmResponse = await fetch(
			"https://new-api.qiliangjia.org/v1/chat/completions",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization:
						"Bearer sk-c6RnsVbb6rtOGVPK2As0aC8ZhtGTP2FMxahCHXKiW076CnYx",
				},
				body: JSON.stringify({
					model: "gpt-4o",
					messages: [
						{
							role: "developer",
							content:
								"你是一个 ClickHouse SQL 专家，负责将用户的自然语言需求转换为准确的 SQL 查询语句。你需要严格遵守 ClickHouse 的语法规则。",
						},
						{
							role: "user",
							content: prompt,
						},
					],
					temperature: 0.1,
				}),
			},
		);

		if (!llmResponse.ok) {
			throw new Error(`LLM API 请求失败: ${llmResponse.statusText}`);
		}

		const llmData: any = await llmResponse.json();
		const content = llmData.choices?.[0]?.message?.content || "";

		// Parse response to extract SQL
		let sql = "";
		const sqlMatch = content.match(/```sql\s*\n([\s\S]*?)\n```/i);

		if (sqlMatch) {
			sql = sqlMatch[1].trim();
			// Remove SQL comments
			sql = sql.replace(/--.*$/gm, "").trim();
		} else {
			// Fallback: try to find SELECT statement
			const selectMatch = content.match(/SELECT[\s\S]*?;/i);
			sql = selectMatch ? selectMatch[0].trim() : content;
		}

		// Extract explanation
		const explanationMatch = content.match(
			/(?:\*\*查询说明\*\*|解释|说明)[：:]\s*(.+?)(?:\n|$)/i,
		);
		const explanation = explanationMatch
			? explanationMatch[1].trim()
			: "根据您的需求生成的查询";

		return c.json({
			sql,
			explanation,
		});
	} catch (error) {
		console.error("Convert to SQL error:", error);
		return c.json(
			{
				error:
					error instanceof Error ? error.message : "转换查询失败，请稍后重试",
			},
			500,
		);
	}
});

/**
 * Execute ClickHouse query
 */
queryAnalyzerRouter.post("/execute-query", async (c) => {
	try {
		const body = await c.req.json<ExecuteQueryRequest>();
		const { sql } = body;

		if (!sql?.trim()) {
			return c.json({ error: "SQL 查询不能为空" }, 400);
		}

		const startTime = performance.now();

		// Execute query against ClickHouse
		const response = await fetch(
			"https://fe-toolkit.qiliangjia.org/clickhouse/query",
			{
				method: "POST",
				headers: {
					"x-access-key": "d561b95f5cda783b50042f9d75e912d3",
					"content-type": "application/json",
				},
				body: JSON.stringify({ query: sql }),
			},
		);

		if (!response.ok) {
			throw new Error(`ClickHouse 查询失败: ${response.statusText}`);
		}

		const data: any = await response.json();
		const executionTime = performance.now() - startTime;

		return c.json({
			data: data.data || [],
			meta: data.meta,
			rows: data.rows || data.data?.length || 0,
			statistics: {
				elapsed: executionTime,
				rows_read: data.statistics?.rows_read || 0,
				bytes_read: data.statistics?.bytes_read || 0,
			},
		});
	} catch (error) {
		console.error("Execute query error:", error);
		return c.json(
			{
				error:
					error instanceof Error ? error.message : "查询执行失败，请稍后重试",
			},
			500,
		);
	}
});

/**
 * Analyze query results with AI insights
 */
queryAnalyzerRouter.post("/analyze-data", async (c) => {
	try {
		const body = await c.req.json<AnalyzeDataRequest>();
		const { data, sql, naturalQuery } = body;

		if (!data || data.length === 0) {
			return c.json({ error: "数据不能为空" }, 400);
		}

		// Prepare data summary for LLM
		const rowCount = data.length;
		const sampleSize = Math.min(5, rowCount);
		const sampleData = data.slice(0, sampleSize);

		// Get column names and types
		const columns = Object.keys(data[0]);
		const columnInfo = columns
			.map((col) => {
				const sampleValue = data[0][col];
				const type = typeof sampleValue;
				return `${col} (${type})`;
			})
			.join(", ");

		// Calculate basic statistics for numeric columns
		const numericStats: Record<string, any> = {};
		columns.forEach((col) => {
			const values = data
				.map((row) => row[col])
				.filter((v) => !Number.isNaN(Number(v)));
			if (values.length > 0) {
				const numbers = values.map(Number);
				const sum = numbers.reduce((a, b) => a + b, 0);
				const avg = sum / numbers.length;
				const max = Math.max(...numbers);
				const min = Math.min(...numbers);
				numericStats[col] = { sum, avg, max, min, count: numbers.length };
			}
		});

		const prompt = `
# 数据分析任务

请基于以下查询结果，提供深入的数据分析和业务洞察。

## 查询背景

${naturalQuery ? `**用户需求**: ${naturalQuery}\n` : ""}**执行的 SQL**:
\`\`\`sql
${sql}
\`\`\`

## 数据概览

- **总行数**: ${rowCount}
- **字段列表**: ${columnInfo}
- **数据样本** (前 ${sampleSize} 行):
\`\`\`json
${JSON.stringify(sampleData, null, 2)}
\`\`\`

${
	Object.keys(numericStats).length > 0
		? `
## 数值字段统计

${Object.entries(numericStats)
	.map(
		([col, stats]) => `
**${col}**:
- 总计: ${stats.sum.toFixed(2)}
- 平均: ${stats.avg.toFixed(2)}
- 最大: ${stats.max}
- 最小: ${stats.min}
- 有效值数量: ${stats.count}`,
	)
	.join("\n")}
`
		: ""
}

## 分析要求

请提供以下维度的分析报告（使用 Markdown 格式）：

### 1. 数据概览 (Data Overview)
- 总体数据规模和分布特征
- 数据质量评估（是否有异常值、缺失值等）

### 2. 关键发现 (Key Findings)
- 3-5 个最重要的数据洞察
- 突出的趋势、模式或异常点
- 用简洁的语言和具体数字说明

### 3. 业务解读 (Business Insights)
- 这些数据对业务意味着什么
- 潜在的机会或风险点
- 可能需要关注的指标

### 4. 行动建议 (Action Items)
- 基于数据的 2-3 条可执行建议
- 进一步分析的方向

## 输出格式

请使用清晰的 Markdown 格式，包含标题、列表和重点标注。重要的数字用 **加粗** 显示。
`;

		// Call LLM API
		const llmResponse = await fetch(
			"https://new-api.qiliangjia.org/v1/chat/completions",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization:
						"Bearer sk-c6RnsVbb6rtOGVPK2As0aC8ZhtGTP2FMxahCHXKiW076CnYx",
				},
				body: JSON.stringify({
					model: "gpt-4o",
					messages: [
						{
							role: "developer",
							content:
								"你是一个专业的数据分析师，擅长从查询结果中提炼关键洞察和业务价值。你需要提供清晰、可执行的分析报告。请使用中文回答。",
						},
						{
							role: "user",
							content: prompt,
						},
					],
					temperature: 0.3,
				}),
			},
		);

		if (!llmResponse.ok) {
			throw new Error(`LLM API 请求失败: ${llmResponse.statusText}`);
		}

		const llmData: any = await llmResponse.json();
		const analysis = llmData.choices?.[0]?.message?.content || "";

		return c.json({
			analysis,
			metadata: {
				rowCount,
				columnCount: columns.length,
				columns,
				numericStats: Object.keys(numericStats).length > 0 ? numericStats : null,
			},
		});
	} catch (error) {
		console.error("Analyze data error:", error);
		return c.json(
			{
				error:
					error instanceof Error ? error.message : "数据分析失败，请稍后重试",
			},
			500,
		);
	}
});

export { queryAnalyzerRouter };
