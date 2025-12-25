/**
 * Resource type from network request
 */
export type ResourceType =
	| "document"
	| "stylesheet"
	| "image"
	| "media"
	| "font"
	| "script"
	| "texttrack"
	| "xhr"
	| "fetch"
	| "eventsource"
	| "websocket"
	| "manifest"
	| "other";

/**
 * Single resource/request information
 */
export interface ResourceInfo {
	/** Request URL */
	url: string;
	/** HTTP method */
	method: string;
	/** Resource type */
	type: ResourceType;
	/** HTTP status code */
	status: number | null;
	/** Response size in bytes */
	size: number | null;
	/** Request duration in milliseconds */
	time: number | null;
	/** Response body (for API requests) */
	response?: unknown;
	/** Request start timestamp */
	startTime: number;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
	/** First Contentful Paint in milliseconds */
	fcp?: number;
	/** Largest Contentful Paint in milliseconds */
	lcp?: number;
	/** DOM Content Loaded in milliseconds */
	domContentLoaded?: number;
	/** Load event in milliseconds */
	loadEvent?: number;
}

/**
 * Resource statistics by type
 */
export interface ResourceStats {
	/** Resource type */
	type: ResourceType;
	/** Number of requests */
	count: number;
	/** Total size in bytes */
	totalSize: number;
	/** Failed requests count */
	failedCount: number;
}

/**
 * PWA Manifest information
 */
export interface PwaManifest {
	/** App name */
	name?: string;
	/** Short app name */
	short_name?: string;
	/** App description */
	description?: string;
	/** Start URL */
	start_url?: string;
	/** Display mode */
	display?: string;
	/** Theme color */
	theme_color?: string;
	/** Background color */
	background_color?: string;
	/** App icons */
	icons?: Array<{
		src: string;
		sizes: string;
		type: string;
		purpose?: string;
	}>;
	/** App scope */
	scope?: string;
	/** Default language */
	default_lang?: string;
}

/**
 * Service Worker information
 */
export interface ServiceWorkerInfo {
	/** Whether service worker is registered */
	registered: boolean;
	/** Service worker scope */
	scope?: string;
	/** Service worker status */
	status?: string;
}

/**
 * PWA information (only present if site is installable)
 */
export interface PwaInfo {
	/** Whether the site is installable as PWA */
	isInstallable: boolean;
	/** Manifest information */
	manifest?: PwaManifest;
	/** Full manifest content (all fields from manifest) */
	manifestRaw?: Record<string, unknown>;
	/** Service Worker information */
	serviceWorker?: ServiceWorkerInfo;
	/** Reasons why not installable */
	installabilityErrors?: string[];
}

/**
 * Open Graph meta tags
 */
export interface OpenGraphMeta {
	title?: string;
	description?: string;
	image?: string;
	url?: string;
	type?: string;
	site_name?: string;
}

/**
 * Twitter Card meta tags
 */
export interface TwitterMeta {
	card?: string;
	site?: string;
	creator?: string;
	title?: string;
	description?: string;
	image?: string;
}

/**
 * Meta tags information
 */
export interface MetaInfo {
	/** Page title */
	title?: string;
	/** Meta description */
	description?: string;
	/** Meta keywords */
	keywords?: string;
	/** Meta author */
	author?: string;
	/** Meta robots */
	robots?: string;
	/** Viewport configuration */
	viewport?: string;
	/** Charset encoding */
	charset?: string;
	/** Canonical URL */
	canonical?: string;
	/** Page language */
	language?: string;
	/** App version */
	appVersion?: string;
	/** Open Graph tags */
	og?: OpenGraphMeta;
	/** Twitter Card tags */
	twitter?: TwitterMeta;
}

/**
 * Console error log entry
 */
export interface ConsoleLogEntry {
	/** Log message */
	message: string;
	/** Source file */
	source?: string;
	/** Line number */
	lineNumber?: number;
	/** Timestamp */
	timestamp: number;
}

/**
 * Console logs information
 */
export interface ConsoleInfo {
	/** Error logs */
	errors: ConsoleLogEntry[];
	/** Total error count */
	errorCount: number;
	/** Warning logs */
	warnings: ConsoleLogEntry[];
	/** Total warning count */
	warningCount: number;
}

/**
 * Website check analysis result
 */
export interface WebsiteCheckResult {
	/** Target URL */
	url: string;
	/** Main page status code */
	status: number;
	/** Total page load time in milliseconds */
	loadTime: number;
	/** Total number of requests */
	totalRequests: number;
	/** Failed requests count */
	failedRequests: number;
	/** Page title */
	pageTitle?: string;
	/** Total page size in bytes */
	totalSize: number;
	/** Performance metrics */
	performance?: PerformanceMetrics;
	/** Resource statistics by type */
	resourceStats: ResourceStats[];
	/** All resource requests details */
	resources: ResourceInfo[];
	/** Screenshot of the page (base64 encoded PNG) */
	screenshot?: string;
	/** PWA information (only if installable) */
	pwa?: PwaInfo;
	/** Meta tags information */
	meta: MetaInfo;
	/** Console logs */
	console: ConsoleInfo;
}

/**
 * Website check request DTO
 */
export interface WebsiteCheckRequestDto {
	/** Website URL to analyze */
	url: string;
	/** Optional timeout in milliseconds (default: 30000) */
	timeout?: number;
	/** Whether to capture screenshot (default: true) */
	screenshot?: boolean;
	/** Device type for emulation (default: 'desktop') */
	device?: "desktop" | "mobile";
}
