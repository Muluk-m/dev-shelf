export interface QueryTemplate {
	id: string;
	name: string;
	description: string;
	category: string;
	sqlTemplate: string;
	chartType: "table" | "line" | "bar" | "pie" | "area";
	dimension?: string; // 图表维度字段
	parameters?: {
		[key: string]: {
			type: "date" | "string" | "number" | "multiselect";
			label: string;
			default: string | number | string[];
			required?: boolean;
			options?: Array<{ label: string; value: string | number }>;
		};
	};
}

// Event Code 枚举定义
export const EVENT_CODES = {
	// rb 埋点
	11002: "安装install点击-fb内",
	11003: "返回拦截跳转Chrome-fb内",
	11004: "自动跳-fb内",
	11005: "返回弹窗显示-fb内",
	11006: "返回弹窗点击-fb内",
	11053: "已安装用户再次访问广告-fb内",
	21030: "返回弹窗显示-Chrome内",
	21031: "返回弹窗点击-Chrome内",
	21001: "落地页访问量-Chrome内",
	21002: "rapid install点击-Chrome内",
	21006: "返回拦截调起安装install-Chrome内",
	21009: "安装install点击-Chrome内总的",
	21015: "rapid install点击没成功调起",
	21011: "点击install now",
	21016: "点击install now没成功调起",
	21012: "点击fake-alert上的install",
	21017: "点击fake-alert上的install没成功调起",
	21023: "原生安装事件准备好了",
	21008: "调起原生安装窗口-Chrome内",
	21003: "install点击",
	21018: "取消安装",
	21004: "商店页play点击-chrome内",
	21007: "返回拦截调起Play-Chrome内",
	21010: "商店页play点击-Chrome内总的",
	21019: "商店页play启动失败",
	21013: "检测页面浏览",
	21014: "检测页面open点击",
	21020: "检测页面open启动失败",
	21005: "app启动量",
	21022: "手动点击play-app启动",
	21021: "点击open-成功启动app",
	21024: "Chrome弹起订阅通知",
	21025: "允许订阅",
	21026: "拒绝订阅",
	21027: "订阅授权无操作",
	21028: "推送通知显示",
	21029: "推送通知点击",
	21032: "app卸载",
	21034: "浏览器启动",
	11007: "EVENT_CODE_11007",
	11008: "点击举报当前开发者不当内容和行为",
	11009: "在举报页面点击提交",
	21033: "EVENT_CODE_21033",
	21036: "NORMAL_LINK_BROWSE",
	21035: "NORMAL_LINK_CLICK",
	21040: "广告平台进入分享页面",
	21041: "广告平台点击分享按钮",
	21042: "广告平台输入分享弹窗邮箱",
	21043: "广告平台内成功调起起分享API",
	21044: "chrome进入分享页面",
	21045: "chrome点击分享按钮",
	21046: "chrome输入分享弹窗邮箱",
	21047: "chrome内成功调起起分享API",
	21048: "三星成功安装点击次数",
	21049: "三星失败安装点击次数",
	21050: "SAMSUNG_SUCCESS_TO_CHROME",
	21051: "复制分享裂变弹窗显示",
	21052: "复制分享裂变弹窗点击",
	21053: "已安装用户再次访问广告-Chrome内",
	21054: "chrome点击举报当前开发者不当内容和行为",
	21055: "在举报页面点击提交",
	21068: "举报组件显示",
	21069: "举报页面显示",
	21065: "在非chrome环境由deepclick来源访问",
	21066: "chrome环境由deepclick来源访问",
	21067: "由deepclick来源安装",
	21056: "抽奖弹窗显示",
	21057: "点击go按钮",
	21058: "点击安装按钮",
	21059: "抽奖弹窗显示-Chrome内",
	21060: "点击go按钮-Chrome内",
	21061: "点击安装按钮-Chrome内",
	21062: "三星抽奖弹窗显示",
	21063: "点击go按钮-三星",
	21064: "点击安装按钮-三星",
	21070: "轮询结束",
	11010: "ADV_INSTALL_PIXEL_REPORT",
	21073: "CHROME_INSTALL_PIXEL_REPORT",
	21071: "调起原生安装窗口失败",
	21072: "轮询开始",
	11080: "广告环境页面隐藏",
	11081: "广告环境页面显示",
	21080: "Chrome环境页面隐藏",
	21081: "Chrome环境页面显示",
	11011: "play页面返回拦截-fb内",
	21074: "play页面返回拦截-Chrome内",
	21075: "scan页面返回拦截-Chrome内",
	21076: "play页面点击返回，app启动",
	21077: "play页面点击返回，app启动失败",
	21078: "scan页面点击返回，app启动",
	21079: "scan页面点击返回，app启动失败",
} as const;

export const PWA_EVENT_TABLE_SCHEMA = {
	database: "roi_ods",
	tableName: "pwa_event_point_log",
	columns: [
		{ name: "id", type: "String", comment: "事件ID" },
		{ name: "project_id", type: "String", comment: "项目ID (必填)" },
		{ name: "channel_id", type: "Int32", comment: "渠道ID" },
		{ name: "event_code", type: "Int32", comment: "事件代码" },
		{ name: "package", type: "String", comment: "包名" },
		{ name: "version", type: "Int32", comment: "版本" },
		{ name: "promoter", type: "String", comment: "推广者" },
		{ name: "link_id", type: "String", comment: "链接ID" },
		{ name: "uuid", type: "String", comment: "用户唯一标识" },
		{ name: "ip", type: "String", comment: "IP地址" },
		{ name: "ua_browser", type: "String", comment: "浏览器" },
		{ name: "ua_browser_ver", type: "String", comment: "浏览器版本" },
		{ name: "ua_os", type: "String", comment: "操作系统" },
		{ name: "ua_os_ver", type: "String", comment: "操作系统版本" },
		{ name: "ua_device_brand", type: "String", comment: "设备品牌" },
		{ name: "ua_device_model", type: "String", comment: "设备型号" },
		{ name: "ua_app", type: "String", comment: "应用" },
		{ name: "ua_app_ver", type: "String", comment: "应用版本" },
		{ name: "ua_browser_major_ver", type: "String", comment: "浏览器主版本" },
		{ name: "report_url", type: "String", comment: "上报URL" },
		{ name: "language", type: "String", comment: "语言" },
		{ name: "timezone", type: "String", comment: "时区" },
		{ name: "invite_code", type: "String", comment: "邀请码" },
		{ name: "promote_url_id", type: "String", comment: "推广URL ID" },
		{ name: "local_time", type: "String", comment: "本地时间" },
		{ name: "pvid", type: "String", comment: "页面访问ID" },
		{ name: "base64_params", type: "String", comment: "Base64参数" },
		{ name: "source", type: "String", comment: "来源" },
		{ name: "user_agent", type: "String", comment: "User Agent" },
		{ name: "extend", type: "String", comment: "扩展信息(JSON)" },
		{ name: "extend_id", type: "String", comment: "扩展ID" },
		{ name: "data_mark", type: "String", comment: "数据标记" },
		{ name: "ts_time", type: "String", comment: "时间戳时间" },
		{ name: "ts", type: "Int64", comment: "时间戳" },
		{ name: "created_at", type: "DateTime", comment: "创建时间" },
		{ name: "updated_at", type: "DateTime", comment: "更新时间" },
		{ name: "deleted_at", type: "Nullable(DateTime)", comment: "删除时间" },
		{
			name: "msg_event_time",
			type: "DateTime",
			comment: "消息事件时间 (查询必填)",
		},
	],
};

// 常用 project_id 列表（可根据实际情况调整）
export const COMMON_PROJECTS = [{ label: "7732354485", value: "7732354485" }];

export const QUERY_TEMPLATES: QueryTemplate[] = [
	{
		id: "event-trend-by-project",
		name: "项目事件趋势",
		description: "按项目查看事件数量变化趋势（按日期维度）",
		category: "趋势分析",
		chartType: "line",
		dimension: "date",
		sqlTemplate: `SELECT
  toDate(msg_event_time) as date,
  project_id,
  COUNT(*) as count
FROM roi_ods.pwa_event_point_log
WHERE msg_event_time >= '{{startDate}} 00:00:00'
  AND msg_event_time <= '{{endDate}} 23:59:59'
GROUP BY date, project_id
ORDER BY date DESC`,
		parameters: {
			startDate: {
				type: "date",
				label: "开始日期",
				default: getRelativeDate(-7),
				required: true,
			},
			endDate: {
				type: "date",
				label: "结束日期",
				default: getRelativeDate(0),
				required: true,
			},
		},
	},
	{
		id: "event-code-analysis",
		name: "事件类型分析",
		description: "按事件类型统计（按 event_code 维度）",
		category: "事件分析",
		chartType: "bar",
		dimension: "event_code",
		sqlTemplate: `SELECT
  event_code,
  COUNT(*) as count,
  COUNT(DISTINCT uuid) as unique_users
FROM roi_ods.pwa_event_point_log
WHERE msg_event_time >= '{{startDate}} 00:00:00'
  AND msg_event_time <= '{{endDate}} 23:59:59'
GROUP BY event_code
ORDER BY count DESC
LIMIT 20`,
		parameters: {
			startDate: {
				type: "date",
				label: "开始日期",
				default: getRelativeDate(-7),
				required: true,
			},
			endDate: {
				type: "date",
				label: "结束日期",
				default: getRelativeDate(0),
				required: true,
			},
		},
	},
	{
		id: "os-distribution",
		name: "操作系统分布",
		description: "按操作系统统计用户分布（按 ua_os 维度）",
		category: "用户分析",
		chartType: "pie",
		dimension: "ua_os",
		sqlTemplate: `SELECT
  ua_os,
  COUNT(DISTINCT uuid) as users,
  COUNT(*) as events
FROM roi_ods.pwa_event_point_log
WHERE msg_event_time >= '{{startDate}} 00:00:00'
  AND msg_event_time <= '{{endDate}} 23:59:59'
  AND ua_os != ''
GROUP BY ua_os
ORDER BY users DESC
LIMIT 10`,
		parameters: {
			startDate: {
				type: "date",
				label: "开始日期",
				default: getRelativeDate(-7),
			},
			endDate: {
				type: "date",
				label: "结束日期",
				default: getRelativeDate(0),
			},
		},
	},
	{
		id: "channel-performance",
		name: "渠道效果分析",
		description: "按渠道统计转化效果（按 channel_id 维度）",
		category: "流量分析",
		chartType: "bar",
		dimension: "channel_id",
		sqlTemplate: `SELECT
  channel_id,
  COUNT(DISTINCT uuid) as users,
  COUNT(*) as events,
  COUNT(DISTINCT link_id) as links
FROM roi_ods.pwa_event_point_log
WHERE msg_event_time >= '{{startDate}} 00:00:00'
  AND msg_event_time <= '{{endDate}} 23:59:59'
GROUP BY channel_id
ORDER BY users DESC`,
		parameters: {
			startDate: {
				type: "date",
				label: "开始日期",
				default: getRelativeDate(-7),
			},
			endDate: {
				type: "date",
				label: "结束日期",
				default: getRelativeDate(0),
			},
		},
	},
	{
		id: "hourly-activity",
		name: "小时活跃度",
		description: "一天中各小时的活跃情况（按 hour 维度）",
		category: "时间分析",
		chartType: "area",
		dimension: "hour",
		sqlTemplate: `SELECT
  toHour(msg_event_time) as hour,
  COUNT(*) as events,
  COUNT(DISTINCT uuid) as users
FROM roi_ods.pwa_event_point_log
WHERE msg_event_time >= '{{startDate}} 00:00:00'
  AND msg_event_time <= '{{endDate}} 23:59:59'
GROUP BY hour
ORDER BY hour`,
		parameters: {
			startDate: {
				type: "date",
				label: "开始日期",
				default: getRelativeDate(-7),
			},
			endDate: {
				type: "date",
				label: "结束日期",
				default: getRelativeDate(0),
			},
		},
	},
	{
		id: "device-details",
		name: "设备详情分析",
		description: "详细的设备型号和品牌统计",
		category: "设备分析",
		chartType: "table",
		dimension: "ua_device_brand",
		sqlTemplate: `SELECT
  ua_device_brand,
  ua_device_model,
  ua_os,
  ua_os_ver,
  COUNT(DISTINCT uuid) as users,
  COUNT(*) as events
FROM roi_ods.pwa_event_point_log
WHERE msg_event_time >= '{{startDate}} 00:00:00'
  AND msg_event_time <= '{{endDate}} 23:59:59'
  AND ua_device_brand != ''
GROUP BY ua_device_brand, ua_device_model, ua_os, ua_os_ver
ORDER BY users DESC
LIMIT 30`,
		parameters: {
			startDate: {
				type: "date",
				label: "开始日期",
				default: getRelativeDate(-7),
			},
			endDate: {
				type: "date",
				label: "结束日期",
				default: getRelativeDate(0),
			},
		},
	},
];

/**
 * Get date string relative to today
 * @param days - Number of days relative to today (negative for past, positive for future)
 */
function getRelativeDate(days: number): string {
	const date = new Date();
	date.setDate(date.getDate() + days);
	return date.toISOString().split("T")[0];
}

/**
 * Validate date range (max 3 months)
 */
export function validateDateRange(
	startDate: string,
	endDate: string,
): {
	valid: boolean;
	error?: string;
} {
	const start = new Date(startDate);
	const end = new Date(endDate);
	const diffTime = Math.abs(end.getTime() - start.getTime());
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

	if (diffDays > 90) {
		return {
			valid: false,
			error: "查询时间范围不能超过 3 个月（90天）",
		};
	}

	if (start > end) {
		return {
			valid: false,
			error: "开始日期不能晚于结束日期",
		};
	}

	return { valid: true };
}

/**
 * Get event code name
 */
export function getEventCodeName(code: number): string {
	return EVENT_CODES[code as keyof typeof EVENT_CODES] || `未知事件(${code})`;
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): QueryTemplate | undefined {
	return QUERY_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): QueryTemplate[] {
	return QUERY_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get all unique categories
 */
export function getCategories(): string[] {
	return Array.from(new Set(QUERY_TEMPLATES.map((t) => t.category)));
}
