import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("admin", "routes/admin.tsx"),
	route("admin/permissions", "routes/admin.permissions.tsx"),

	route("tools", "routes/tools/_layout.tsx", [
		route("json-formatter", "routes/tools/json-formatter.tsx"),
		route("base64-converter", "routes/tools/base64-converter.tsx"),
		route("url-parser", "routes/tools/url-parser.tsx"),
		route("url-encoder", "routes/tools/url-encoder.tsx"),
		route("qr-generator", "routes/tools/qr-generator.tsx"),
		route("time-formatter", "routes/tools/time-formatter.tsx"),
		route("file-uploader", "routes/tools/file-uploader.tsx"),
		route("json-diff", "routes/tools/json-diff.tsx"),
		route("jwt-decoder", "routes/tools/jwt-decoder.tsx"),
		route("ua-parser", "routes/tools/ua-parser.tsx"),
	]),

	route("tools/:id", "routes/tools.$id.tsx"),
] satisfies RouteConfig;
