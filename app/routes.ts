import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("admin", "routes/admin.tsx"),

	// 内部工具路由 - 直接展示工具功能
	route("tools", "routes/tools/_layout.tsx", [
		route("json-formatter", "routes/tools/json-formatter.tsx"),
		route("base64-converter", "routes/tools/base64-converter.tsx"),
		route("url-parser", "routes/tools/url-parser.tsx"),
		route("url-encoder", "routes/tools/url-encoder.tsx"),
		route("qr-generator", "routes/tools/qr-generator.tsx"),
		route("time-formatter", "routes/tools/time-formatter.tsx"),
		route("tiktok-pixel-tool", "routes/tools/tiktok-pixel-tool.tsx"),
		route("file-uploader", "routes/tools/file-uploader.tsx"),
		route("json-diff", "routes/tools/json-diff.tsx"),
		route("cf-log-analyzer", "routes/tools/cf-log-analyzer.tsx"),
		route("jwt-decoder", "routes/tools/jwt-decoder.tsx"),
	]),

	// 外部工具路由 - 展示详情页
	route("tools/:id", "routes/tools.$id.tsx"),
] satisfies RouteConfig;
