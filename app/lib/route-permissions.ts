/**
 * 路由权限配置
 * 定义每个路由需要的权限或角色
 */

export interface RoutePermission {
	path: string;
	requiredRoles?: string[]; // 需要的角色，满足任一即可
	requiredPermissions?: Array<{ resource: string; action: string }>; // 需要的权限，必须全部满足
	description?: string;
}

export const ROUTE_PERMISSIONS: RoutePermission[] = [
	// 管理后台
	{
		path: "/admin",
		requiredRoles: ["admin"],
		description: "工具管理后台",
	},
	{
		path: "/admin/permissions",
		requiredRoles: ["admin"],
		requiredPermissions: [{ resource: "user", action: "write" }],
		description: "权限管理",
	},

	// 内部工具 - 示例：需要 developer 或 admin 角色
	{
		path: "/tools/query-analyzer",
		requiredRoles: ["developer", "admin"],
		description: "查询分析工具",
	},
	{
		path: "/tools/cf-log-analyzer",
		requiredRoles: ["developer", "admin"],
		description: "CloudFlare 日志分析",
	},
	{
		path: "/tools/whitelist-token",
		requiredRoles: ["admin"],
		description: "白名单令牌管理",
	},

	// 可以根据具体权限控制
	// {
	//   path: "/tools/sensitive-tool",
	//   requiredPermissions: [
	//     { resource: "tool", action: "use_sensitive" }
	//   ],
	//   description: "敏感工具"
	// }
];

/**
 * 获取路由权限配置
 */
export function getRoutePermission(path: string): RoutePermission | undefined {
	return ROUTE_PERMISSIONS.find((route) => {
		// 精确匹配或前缀匹配
		return path === route.path || path.startsWith(`${route.path}/`);
	});
}

/**
 * 检查用户是否有访问路由的权限
 */
export function checkRouteAccess(
	path: string,
	userRoles: string[],
	userPermissions: string[],
): { allowed: boolean; reason?: string } {
	const routePermission = getRoutePermission(path);

	// 如果路由没有配置权限要求，默认允许访问
	if (!routePermission) {
		return { allowed: true };
	}

	// 检查角色要求
	if (routePermission.requiredRoles && routePermission.requiredRoles.length > 0) {
		const hasRequiredRole = routePermission.requiredRoles.some((role) =>
			userRoles.includes(role),
		);
		if (!hasRequiredRole) {
			return {
				allowed: false,
				reason: `需要以下角色之一: ${routePermission.requiredRoles.join(", ")}`,
			};
		}
	}

	// 检查权限要求
	if (
		routePermission.requiredPermissions &&
		routePermission.requiredPermissions.length > 0
	) {
		const hasAllPermissions = routePermission.requiredPermissions.every((perm) =>
			userPermissions.includes(`${perm.resource}:${perm.action}`),
		);
		if (!hasAllPermissions) {
			return {
				allowed: false,
				reason: "缺少必要的权限",
			};
		}
	}

	return { allowed: true };
}
