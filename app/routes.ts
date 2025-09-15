import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("admin", "routes/admin.tsx"),
	route("tools/:id", "routes/tools.$id.tsx"),
] satisfies RouteConfig;
