/**
 * App label detail (score distribution)
 */
export interface AppScoreDetail {
	"1": number;
	"2": number;
	"3": number;
	"4": number;
	"5": number;
}

/**
 * App comment
 */
export interface AppComment {
	name: string;
	avatar: string;
	score: string;
	comment: string;
}

/**
 * Language specific data
 */
export interface LanguageData {
	id: number;
	project_id: string;
	language_code: string;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
	app_name: string;
	app_icon: string;
	company_name: string;
	app_comments: number;
	app_age_limit: number;
	app_desc: string;
	pic_list: string[];
	app_labels: string;
	app_score_detail: AppScoreDetail;
	app_comment_list: AppComment[];
	app_download: number;
	theme_color: string;
	background_color: string;
	app_score: string;
	popup_tip_type: number;
	popup_tip_content: string;
}

/**
 * B-Link data
 */
export interface BLinkData {
	use_b_link: boolean;
	title: string;
	desc: string;
	img: string;
}

/**
 * Template configuration
 */
export interface TplConfig {
	tpl_type: string;
	cus_tpl_data: unknown[];
}

/**
 * Dismissed popup IDs
 */
export interface DismissedPopupIds {
	browser: unknown[];
	ad: unknown[];
}

/**
 * Link information
 */
export interface LinkInfo {
	promote_url_id: string;
	channel_id: string;
	rb_tid: string;
	invite_code: string;
	rb_pixel_id: string;
	rb_pixel_type: number;
	is_pixel_report: string;
	rb_adjust_id: string;
	third_channel_id: string;
	b_link_data: BLinkData;
	tpl_config: TplConfig;
	ios_url_redirect_type: number;
	dismissed_popup_ids: DismissedPopupIds;
	custom_dismissed_popup_ids: unknown[];
}

/**
 * Config V3 Data
 */
export interface ConfigV3Data {
	id: number;
	app_name: string;
	app_icon: string;
	company_name: string;
	app_comments: number;
	app_score: string;
	app_age_limit: number;
	app_desc: string;
	pic_list: string;
	status: number;
	package_name: string;
	package_link: string;
	domain: string;
	creator: number;
	project_id: string;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
	version: number;
	notes: string;
	remark: string;
	operate_remark: string;
	package_status: number;
	applicable_age: number;
	domain_id: number;
	theme_color: string;
	background_color: string;
	feishu_url: string;
	current_language_code: string;
	package_type: number;
	telegram_url: string;
	screen_way: number;
	all_screen: number;
	pre_load: number;
	default_menu: number;
	hidden: number;
	all_click: number;
	app_feedback_tpl_id: number;
	from_put_account_id: number;
	label: string;
	label_id: number;
	language_json: Record<string, LanguageData>;
	linkInfo: LinkInfo;
	pixels: unknown[];
}

/**
 * Config V3 Response
 */
export interface ConfigV3Response {
	code: number;
	msg: string;
	data: ConfigV3Data;
}

/**
 * Pixel event (tracking event)
 */
export interface PixelEvent {
	event_code: string;
	timestamp: number;
	url: string;
	count: number;
}

/**
 * RoiBest analysis result
 */
export interface RoiBestAnalysisResult {
	/** Target URL */
	url: string;
	/** Config V3 data */
	configV3?: ConfigV3Response;
	/** Config V3 fetch error */
	configV3Error?: string;
	/** Pixel events collected */
	pixelEvents: PixelEvent[];
	/** Basic page info */
	pageTitle?: string;
	/** Screenshot */
	screenshot?: string;
	/** Load time */
	loadTime: number;
	/** Analysis timestamp */
	analyzedAt: number;
}

/**
 * RoiBest analysis request
 */
export interface RoiBestAnalysisRequest {
	url: string;
	timeout?: number;
	screenshot?: boolean;
}
