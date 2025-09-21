import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("admin", "routes/admin.tsx"),

	// 内部工具路由 - 直接展示工具功能
	route("tools", "routes/tools/_layout.tsx", [
		route("json-formatter", "routes/tools/json-formatter.tsx"),
		route("base64-converter", "routes/tools/base64-converter.tsx"),
		// 后续可以添加更多内部工具：
		// route("qr-generator", "routes/tools/qr-generator.tsx"),
		// route("url-encoder", "routes/tools/url-encoder.tsx"),
	]),

	// 外部工具路由 - 展示详情页
	route("tools/:id", "routes/tools.$id.tsx"),
] satisfies RouteConfig;
