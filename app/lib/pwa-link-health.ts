import type { ConfigV3Data } from "~/types/pwa-link-health";
import type { ConsoleLogEntry, ResourceType } from "~/types/website-check";

export const API_ENDPOINT =
	"https://fe-toolkit.qiliangjia.org/website-check/analyze";

export const RESOURCE_TYPE_COLORS: Record<ResourceType, string> = {
	document: "#3b82f6",
	stylesheet: "#8b5cf6",
	image: "#10b981",
	media: "#f59e0b",
	font: "#ef4444",
	script: "#ec4899",
	texttrack: "#14b8a6",
	xhr: "#06b6d4",
	fetch: "#0ea5e9",
	eventsource: "#6366f1",
	websocket: "#a855f7",
	manifest: "#f97316",
	other: "#6b7280",
};

/**
 * 字段翻译映射
 * 将 ConfigV3Data 的字段名映射为中文显示名称
 */
export const fieldTranslations: Record<keyof ConfigV3Data, string> = {
	id: "ID",
	app_name: "APP名称",
	app_icon: "APP图标",
	company_name: "公司名称",
	app_comments: "评论数",
	app_score: "应用评分",
	app_age_limit: "年龄限制",
	app_desc: "应用描述",
	pic_list: "图片列表",
	status: "状态",
	package_name: "包名",
	package_link: "包链接",
	domain: "重定向/安装域名",
	creator: "创建者",
	project_id: "AppID",
	created_at: "创建时间",
	updated_at: "更新时间",
	deleted_at: "删除时间",
	version: "版本",
	notes: "备注",
	remark: "说明",
	operate_remark: "运营备注",
	package_status: "包状态",
	applicable_age: "适用年龄",
	domain_id: "域名ID（domain_id）",
	theme_color: "主题色",
	background_color: "背景色",
	feishu_url: "飞书链接",
	current_language_code: "当前语言代码",
	package_type: "接入类型", // 1=自研, 2=包网
	telegram_url: "Telegram链接",
	screen_way: "屏幕方向",
	all_screen: "全屏",
	pre_load: "预加载是否开启",
	default_menu: "默认菜单",
	hidden: "隐藏",
	all_click: "全点击",
	app_feedback_tpl_id: "反馈模板ID",
	from_put_account_id: "投放账户ID",
	label: "标签",
	label_id: "标签ID",
	language_json: "语言配置",
	linkInfo: "链接配置",
	pixels: "像素事件",
};

/**
 * 嵌套字段翻译映射（linkInfo 中的字段）
 */
export const nestedFieldTranslations: Record<string, string> = {
	"linkInfo.is_pixel_report": "像素上报",
	"linkInfo.rb_pixel_id": "像素ID（rb_pixel_id）",
	"linkInfo.rb_pixel_type": "像素类型",
	"linkInfo.channel_id": "投放渠道",
	"linkInfo.promote_url_id": "推广链接ID（promote_url_id）",
};

/**
 * 包类型映射
 * 1 = 自研, 2 = 包网
 */

export const PACKAGE_TYPE_ENUM = {
	ZIYAN: 1,
	BAOWANG: 2,
} as const;

export const packageTypeMap: Record<number, string> = {
	1: "自研",
	2: "包网",
};

/**
 * 预加载是否开启映射
 * 1 = 已开启, 0 = 未开启
 */
export const preLoadMap: Record<number, string> = {
	1: "已开启",
	0: "未开启",
};

/**
 * 状态映射
 * 0 = 未上传 1 = 部署中 2 = 部署完成 3 = 暂停使用
 */
export const packageStatusMap: Record<number, string> = {
	0: "未上传",
	1: "部署中",
	2: "部署完成",
	3: "暂停使用",
};

/**
 * 像素类型映射
 * 1 = Google GA, 2 = Google GTM
 */
export const pixelTypeMap: Record<number, string> = {
	1: "Google GA",
	2: "Google GTM",
};

/**
 * 投放渠道映射
 * 4 = Facebook, 5 = TikTok, 9 = KWAI, 10 = Google
 */
export const channelMap: Record<number, string> = {
	4: "Facebook",
	5: "TikTok",
	9: "KWAI",
	10: "Google",
};

/**
 * 要显示的字段列表（关键字段）
 * 在链接详情板块中显示这些字段
 */
/**
 * 重要字段列表（需要高亮显示的关键信息）
 */
export const importantFields: string[] = [
	"project_id",
	"app_name",
	"domain",
	"package_status",
	"package_type",
	"linkInfo.channel_id",
	"linkInfo.promote_url_id",
	"linkInfo",
];

export const displayFields: string[] = [
	"project_id",
	"app_name",
	"company_name",
	"domain",
	"domain_id",
	"package_name",
	"package_link",
	"package_status",
	"current_language_code",
	"language_json",
	"created_at",
	"updated_at",
	"notes",
	"package_type",
	"pre_load",
	"linkInfo.is_pixel_report",
	"linkInfo.rb_pixel_id",
	"linkInfo.rb_pixel_type",
	"linkInfo.promote_url_id",
	"linkInfo.channel_id",
	"linkInfo",
];

/**
 * 不影响业务的 console 错误过滤规则
 * 每个规则包含需要同时匹配的关键词数组（所有关键词都必须出现在错误消息中）
 */
export const IGNORED_CONSOLE_ERROR_PATTERNS: string[][] = [
	// Service Worker 注册权限错误
	["registration failed", "permission denied"],
	// Chrome 无痕模式 Push API 不支持错误
	["chrome currently does not support", "push api", "incognito mode"],
];

/**
 * 过滤不影响业务的 console 错误
 */
export function filterBusinessImpactErrors(
	errors: ConsoleLogEntry[],
): ConsoleLogEntry[] {
	return errors.filter((error) => {
		const message = error.message.toLowerCase();
		// 检查是否匹配任何忽略模式
		for (const pattern of IGNORED_CONSOLE_ERROR_PATTERNS) {
			const matches = pattern.every((keyword) => message.includes(keyword));
			if (matches) {
				return false; // 匹配忽略模式，过滤掉
			}
		}
		return true; // 不匹配任何忽略模式，保留
	});
}
