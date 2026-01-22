import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("admin", "routes/admin.tsx"),
	route("admin/permissions", "routes/admin.permissions.tsx"),

	// 内部工具路由 - 直接展示工具功能
	route("tools", "routes/tools/_layout.tsx", [
		route("json-formatter", "routes/tools/json-formatter.tsx"),
		route("base64-converter", "routes/tools/base64-converter.tsx"),
		route("url-parser", "routes/tools/url-parser.tsx"),
		route("url-encoder", "routes/tools/url-encoder.tsx"),
		route("qr-generator", "routes/tools/qr-generator.tsx"),
		route("time-formatter", "routes/tools/time-formatter.tsx"),
		route("pixel-activation-tool", "routes/tools/pixel-activation-tool.tsx"),
		route("file-uploader", "routes/tools/file-uploader.tsx"),
		route("json-diff", "routes/tools/json-diff.tsx"),
		route("cf-log-analyzer", "routes/tools/cf-log-analyzer.tsx"),
		route("jwt-decoder", "routes/tools/jwt-decoder.tsx"),
		route("query-analyzer", "routes/tools/query-analyzer.tsx"),
		route("ua-parser", "routes/tools/ua-parser.tsx"),
		route("whitelist-token", "routes/tools/whitelist-token.tsx"),
		route("website-check", "routes/tools/website-check.tsx"),
		route("roibest-analyzer", "routes/tools/roibest-analyzer.tsx"),
		route("rb-domain-check", "routes/tools/rb-domain-check.tsx"),
		route("pwa-link-health", "routes/tools/pwa-link-health.tsx"),
		route("quick-login", "routes/tools/quick-login.tsx"),
		route("ab-router", "routes/tools/ab-router.tsx"),
	]),

	// 外部工具路由 - 展示详情页
	route("tools/:id", "routes/tools.$id.tsx"),
] satisfies RouteConfig;
