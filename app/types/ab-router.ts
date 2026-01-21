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
 * 链接统计数据
 */
export interface LinkStats {
	/** 审核链接总次数 */
	reviewCount: number;
	/** 真实链接总次数 */
	realCount: number;
	/** 今日审核链接次数 */
	todayReviewCount: number;
	/** 今日真实链接次数 */
	todayRealCount: number;
}

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
	/** 统计数据 */
	stats?: LinkStats;
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
 * 设备类型
 */
export type DeviceType = "Mobile" | "PC" | "Tablet";

/**
 * 路由方向
 */
export type Direction = "real" | "review";

/**
 * 访问日志记录 (原始 API 格式)
 */
export interface AccessLogRaw {
	/** 日志 ID */
	id?: string;
	/** 链路 ID */
	linkId: string;
	/** 访问者 IP */
	ip: string;
	/** IP 信息 (新格式) */
	ipInfo?: {
		countryCode?: string;
		countryName?: string;
		region?: string;
		city?: string;
	};
	/** IP 详情 (旧格式) */
	ipDetails?: {
		country?: string;
		region?: string;
		city?: string;
		isp?: string;
	};
	/** 时间信息 (新格式: 对象) */
	time?:
		| string
		| {
				utc?: string;
				beijing?: string;
				local?: string;
				timestamp?: number;
		  };
	/** 网络信息 (新格式) */
	network?: {
		isp?: string;
		isProxy?: boolean;
		isHosting?: boolean;
		isVpn?: boolean;
		isTor?: boolean;
	};
	/** 方向信息 (新格式: 对象) */
	direction?:
		| Direction
		| {
				result?: Direction;
				label?: string;
				finalUrl?: string;
		  };
	/** 语言信息 (新格式) */
	language?: {
		primary?: string;
		primaryName?: string;
	};
	/** 设备信息 (新格式) */
	device?:
		| string
		| {
				type?: string;
				display?: string;
		  };
	/** 浏览器信息 (新格式) */
	browser?:
		| string
		| {
				name?: string;
				display?: string;
		  };
	/** 决策信息 */
	decision?: {
		result?: Direction;
		reasons?: string[];
	};
	/** 蜘蛛信息 (新格式) */
	spider?: {
		isSpider?: boolean;
	};
	/** 旧格式兼容字段 */
	clientLanguage?: string;
	isProxy?: boolean;
	isSpider?: boolean;
	userAgent?: string;
	/** 原始数据 */
	raw?: {
		userAgent?: string;
	};
}

/**
 * 访问日志记录 (标准化格式)
 */
export interface AccessLog {
	/** 日志 ID */
	id: string;
	/** 链路 ID */
	linkId: string;
	/** 访问者 IP */
	ip: string;
	/** IP 信息 */
	ipInfo: {
		countryCode: string;
		countryName: string;
		region: string;
		city: string;
		isp: string;
	};
	/** 时间信息 */
	timeInfo: {
		beijing: string;
		local: string;
	};
	/** 网络信息 */
	network: {
		isp: string;
		isProxy: boolean;
		isVpn: boolean;
		isSpider: boolean;
	};
	/** 方向信息 */
	directionInfo: {
		result: Direction;
		label: string;
		finalUrl: string;
		reasons: string[];
	};
	/** 设备显示 */
	deviceDisplay: string;
	/** 浏览器显示 */
	browserDisplay: string;
	/** 语言显示 */
	languageDisplay: string;
	/** User-Agent */
	userAgent: string;
}

/**
 * 日志查询参数
 */
export interface LogQueryParams {
	/** 链路 ID */
	linkId?: string;
	/** 开始日期 (YYYY-MM-DD) */
	startDate?: string;
	/** 结束日期 (YYYY-MM-DD) */
	endDate?: string;
	/** 去向过滤 */
	direction?: Direction;
	/** IP地址过滤（支持通配符: 192.168.*.*, 192.168.1.*, 192.168） */
	ip?: string;
	/** 国家代码 */
	country?: string;
	/** 设备类型 */
	device?: DeviceType;
	/** 是否代理 */
	isProxy?: boolean;
	/** 是否蜘蛛 */
	isSpider?: boolean;
	/** 页码（从1开始） */
	page?: number;
	/** 每页数量（1-100，默认50） */
	limit?: number;
	/** KV游标（深度分页） */
	cursor?: string;
}

/**
 * 分页信息
 */
export interface PaginationInfo {
	/** 当前页码 */
	page: number;
	/** 每页数量 */
	limit: number;
	/** 是否有更多数据 */
	hasMore: boolean;
	/** 下一页游标（深度分页用） */
	nextCursor?: string;
}

/**
 * 日志查询响应 (原始 API 格式)
 */
export interface LogQueryResponseRaw {
	/** 总数 */
	total?: number;
	/** 日志数据 (logs 或 data 字段) */
	logs?: AccessLogRaw[];
	data?: AccessLogRaw[];
	/** 分页信息 */
	pagination?: {
		page?: number;
		limit?: number;
		hasMore?: boolean;
		nextCursor?: string;
	};
	/** 兼容旧格式 */
	nextCursor?: string;
	cursor?: string;
}

/**
 * 日志查询响应 (标准化格式)
 */
export interface LogQueryResponse {
	/** 总数 */
	total: number;
	/** 日志数据 */
	data: AccessLog[];
	/** 分页信息 */
	pagination: PaginationInfo;
}

/**
 * 标准化日志数据
 */
export function normalizeAccessLog(
	raw: AccessLogRaw,
	index: number,
): AccessLog {
	// 处理时间
	const timeInfo = normalizeTime(raw.time);

	// 处理 IP 信息
	const ipInfo = normalizeIpInfo(raw);

	// 处理网络信息
	const network = normalizeNetwork(raw);

	// 处理方向信息
	const directionInfo = normalizeDirection(raw);

	// 处理设备
	const deviceDisplay = normalizeDevice(raw.device);

	// 处理浏览器
	const browserDisplay = normalizeBrowser(raw.browser);

	// 处理语言
	const languageDisplay = normalizeLanguage(raw);

	// 处理 User-Agent
	const userAgent = raw.raw?.userAgent || raw.userAgent || "-";

	return {
		id: raw.id || `log-${index}-${timeInfo.beijing}`,
		linkId: raw.linkId,
		ip: raw.ip,
		ipInfo,
		timeInfo,
		network,
		directionInfo,
		deviceDisplay,
		browserDisplay,
		languageDisplay,
		userAgent,
	};
}

/**
 * 标准化 IP 信息
 */
function normalizeIpInfo(raw: AccessLogRaw): AccessLog["ipInfo"] {
	// 新格式: ipInfo
	if (raw.ipInfo) {
		return {
			countryCode: raw.ipInfo.countryCode || "-",
			countryName: raw.ipInfo.countryName || "-",
			region: raw.ipInfo.region || "-",
			city: raw.ipInfo.city || "-",
			isp: raw.network?.isp || "-",
		};
	}
	// 旧格式: ipDetails
	if (raw.ipDetails) {
		return {
			countryCode: raw.ipDetails.country || "-",
			countryName: raw.ipDetails.country || "-",
			region: raw.ipDetails.region || "-",
			city: raw.ipDetails.city || "-",
			isp: raw.ipDetails.isp || "-",
		};
	}
	return {
		countryCode: "-",
		countryName: "-",
		region: "-",
		city: "-",
		isp: "-",
	};
}

/**
 * 标准化时间
 */
function normalizeTime(
	time?: string | { utc?: string; beijing?: string; local?: string },
): { beijing: string; local: string } {
	if (!time) {
		return { beijing: "-", local: "-" };
	}
	// 新格式: 对象
	if (typeof time === "object") {
		return {
			beijing: time.beijing || "-",
			local: time.local || "-",
		};
	}
	// 旧格式: ISO 字符串
	try {
		const date = new Date(time);
		if (Number.isNaN(date.getTime())) {
			return { beijing: "-", local: "-" };
		}
		const beijingTime = date.toLocaleString("zh-CN", {
			timeZone: "Asia/Shanghai",
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
		return {
			beijing: beijingTime,
			local: beijingTime,
		};
	} catch {
		return { beijing: "-", local: "-" };
	}
}

/**
 * 标准化网络信息
 */
function normalizeNetwork(raw: AccessLogRaw): AccessLog["network"] {
	const isSpider = raw.spider?.isSpider ?? raw.isSpider ?? false;
	if (raw.network) {
		return {
			isp: raw.network.isp || "-",
			isProxy: raw.network.isProxy ?? false,
			isVpn: raw.network.isVpn ?? false,
			isSpider,
		};
	}
	return {
		isp: "-",
		isProxy: raw.isProxy ?? false,
		isVpn: false,
		isSpider,
	};
}

/**
 * 标准化方向信息
 */
function normalizeDirection(raw: AccessLogRaw): AccessLog["directionInfo"] {
	const reasons = raw.decision?.reasons || [];
	const decisionResult = raw.decision?.result;

	// 新格式: direction 是对象
	if (raw.direction && typeof raw.direction === "object") {
		return {
			result: raw.direction.result || decisionResult || "review",
			label: raw.direction.label || "",
			finalUrl: raw.direction.finalUrl || "-",
			reasons,
		};
	}
	// 旧格式: direction 是字符串
	const result =
		(typeof raw.direction === "string" ? raw.direction : null) ||
		decisionResult ||
		"review";
	return {
		result,
		label: result === "real" ? "真实链接" : "审核链接",
		finalUrl: "-",
		reasons,
	};
}

/**
 * 标准化设备
 */
function normalizeDevice(
	device?: string | { type?: string; display?: string },
): string {
	if (!device) return "-";
	if (typeof device === "string") return device;
	return device.display || device.type || "-";
}

/**
 * 标准化浏览器
 */
function normalizeBrowser(
	browser?: string | { name?: string; display?: string },
): string {
	if (!browser) return "-";
	if (typeof browser === "string") return browser;
	return browser.display || browser.name || "-";
}

/**
 * 标准化语言
 */
function normalizeLanguage(raw: AccessLogRaw): string {
	if (raw.language?.primaryName) {
		return raw.language.primaryName;
	}
	if (raw.language?.primary) {
		return raw.language.primary;
	}
	return raw.clientLanguage || "-";
}

/**
 * 标准化日志响应
 */
export function normalizeLogResponse(
	raw: LogQueryResponseRaw,
	requestParams?: { page?: number; limit?: number },
): LogQueryResponse {
	const rawLogs = raw.logs || raw.data || [];
	const total = raw.total ?? rawLogs.length;

	// 提取分页信息
	const pagination: PaginationInfo = {
		page: raw.pagination?.page ?? requestParams?.page ?? 1,
		limit: raw.pagination?.limit ?? requestParams?.limit ?? 50,
		hasMore:
			raw.pagination?.hasMore ??
			rawLogs.length === (requestParams?.limit ?? 50),
		nextCursor: raw.pagination?.nextCursor ?? raw.nextCursor ?? raw.cursor,
	};

	return {
		total,
		data: rawLogs.map((log, i) => normalizeAccessLog(log, i)),
		pagination,
	};
}

/**
 * 链路统计信息
 */
export interface LinkStats {
	/** 总访问数 */
	total: number;
	/** 按路由方向统计 */
	byDirection: Record<Direction, number>;
	/** 按国家统计 */
	byCountry: Record<string, number>;
	/** 按设备统计 */
	byDevice: Record<DeviceType, number>;
	/** 按日期统计 */
	byDate: Record<string, number>;
}

/**
 * 删除日志参数
 */
export interface DeleteLogsParams {
	/** 删除此日期之前的日志 */
	beforeDate?: string;
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

/**
 * 预设审核链接模板
 */
export interface ReviewLinkTemplate {
	id: number;
	name: string;
	nameEnglish: string;
	url: string;
}

/**
 * 预设审核链接模板列表
 */
export const REVIEW_LINK_TEMPLATES: ReviewLinkTemplate[] = [
	{
		id: 1,
		name: "默认",
		nameEnglish: "default",
		url: "https://www.amazon.com/",
	},
	{
		id: 2,
		name: "游戏站",
		nameEnglish: "game site",
		url: "https://www.gog.com/en/",
	},
	{
		id: 3,
		name: "活动营销",
		nameEnglish: "marketing site",
		url: "https://www.ottogroup.com/",
	},
	{
		id: 4,
		name: "商城",
		nameEnglish: "shopping site",
		url: "https://www.shopify.com/",
	},
	{
		id: 5,
		name: "企业宣传",
		nameEnglish: "enterprise propaganda",
		url: "https://www.linkedin.com/",
	},
	{
		id: 6,
		name: "摄影类展示",
		nameEnglish: "photograph showcase",
		url: "https://www.kyotographie.jp/",
	},
	{
		id: 7,
		name: "在线小游戏",
		nameEnglish: "online mini-games",
		url: "https://www.crazygames.com/",
	},
	{
		id: 8,
		name: "金融",
		nameEnglish: "financial",
		url: "https://www.paypal.com/",
	},
	{
		id: 9,
		name: "工具",
		nameEnglish: "tool",
		url: "https://discord.com/",
	},
	{
		id: 99,
		name: "自定义",
		nameEnglish: "customize",
		url: "",
	},
];
