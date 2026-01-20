/**
 * AB Router 链接配置规则
 */
export interface LinkRules {
	/** 投放国家 ISO 代码列表 ["CN", "JP", "KR"] */
	countries?: string[];
	/** 禁止空语言 */
	blockEmptyLanguage?: boolean;
	/** 屏蔽 PC 设备 */
	blockPC?: boolean;
	/** 禁止代理访问 */
	blockProxy?: boolean;
	/** 蜘蛛白名单 (User-Agent 关键词) */
	spiderWhitelist?: string[];
}

/**
 * AB Router 链接配置模式
 * - all_open: 所有流量走真实链接
 * - review: 根据规则决定走审核链接还是真实链接
 * - final_link: 所有流量走审核链接
 */
export type LinkMode = "all_open" | "review" | "final_link";

/**
 * AB Router 链接配置
 */
export interface LinkConfig {
	/** 链路 ID */
	id: string;
	/** 配置名称 */
	name: string;
	/** 真实链接 */
	realLink: string;
	/** 审核链接 */
	reviewLink: string;
	/** 跳转短链 (可选) */
	shortLink?: string;
	/** 备注信息 (可选) */
	note?: string;
	/** 路由模式 */
	mode: LinkMode;
	/** 规则配置 */
	rules: LinkRules;
	/** 创建时间 */
	createdAt?: string;
	/** 更新时间 */
	updatedAt?: string;
}

/**
 * 预览请求参数
 */
export interface PreviewRequest {
	/** 模拟的 User-Agent */
	userAgent?: string;
	/** 模拟的国家代码 */
	country?: string;
	/** 模拟的语言 */
	language?: string;
	/** 是否为代理 */
	isProxy?: boolean;
}

/**
 * 预览结果
 */
export interface PreviewResult {
	/** 决策结果: 跳转到真实链接还是审核链接 */
	decision: "real" | "review";
	/** 目标链接 */
	targetUrl: string;
	/** 决策原因列表 */
	reasons: string[];
	/** 匹配的规则详情 */
	matchedRules?: {
		country?: boolean;
		emptyLanguage?: boolean;
		pcDevice?: boolean;
		proxy?: boolean;
		spider?: boolean;
	};
}

/**
 * 访问日志记录
 */
export interface AccessLog {
	/** 日志 ID */
	id: string;
	/** 链路 ID */
	linkId: string;
	/** 访问时间 */
	time: string;
	/** 访问者 IP */
	ip: string;
	/** 国家代码 */
	country: string;
	/** 设备类型 */
	device: "mobile" | "pc";
	/** 路由去向 */
	destination: "real" | "review";
	/** 决策原因 */
	reason: string;
	/** User-Agent */
	userAgent?: string;
	/** 语言 */
	language?: string;
}

/**
 * 日志查询参数
 */
export interface LogQueryParams {
	/** 链路 ID */
	linkId?: string;
	/** 日期 (YYYY-MM-DD) */
	date?: string;
	/** 国家代码 */
	country?: string;
	/** 设备类型 */
	device?: "mobile" | "pc";
	/** 路由去向 */
	destination?: "real" | "review";
	/** 分页: 每页条数 */
	limit?: number;
	/** 分页: 游标 */
	cursor?: string;
}

/**
 * 日志查询响应
 */
export interface LogQueryResponse {
	/** 总数 */
	total: number;
	/** 日志数据 */
	data: AccessLog[];
	/** 下一页游标 */
	nextCursor?: string;
}

/**
 * 常用国家代码列表
 */
export const COMMON_COUNTRIES = [
	{ code: "CN", name: "中国" },
	{ code: "JP", name: "日本" },
	{ code: "KR", name: "韩国" },
	{ code: "US", name: "美国" },
	{ code: "GB", name: "英国" },
	{ code: "DE", name: "德国" },
	{ code: "FR", name: "法国" },
	{ code: "SG", name: "新加坡" },
	{ code: "HK", name: "香港" },
	{ code: "TW", name: "台湾" },
	{ code: "AU", name: "澳大利亚" },
	{ code: "CA", name: "加拿大" },
	{ code: "IN", name: "印度" },
	{ code: "BR", name: "巴西" },
	{ code: "RU", name: "俄罗斯" },
	{ code: "ID", name: "印度尼西亚" },
	{ code: "TH", name: "泰国" },
	{ code: "VN", name: "越南" },
	{ code: "MY", name: "马来西亚" },
	{ code: "PH", name: "菲律宾" },
] as const;

/**
 * 链接模式选项
 */
export const LINK_MODE_OPTIONS = [
	{
		value: "all_open" as LinkMode,
		label: "全开放",
		description: "所有流量走真实链接",
	},
	{
		value: "review" as LinkMode,
		label: "审核模式",
		description: "根据规则决定走哪个链接",
	},
	{
		value: "final_link" as LinkMode,
		label: "全审核",
		description: "所有流量走审核链接",
	},
] as const;
