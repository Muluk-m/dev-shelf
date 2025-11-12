import { useMemo } from "react";

import { useUserInfoStore } from "~/stores/user-info-store";

/**
 * 角色层级定义
 * 数字越大权限越高，高级角色自动拥有低级角色的权限
 */
const ROLE_HIERARCHY: Record<string, number> = {
	visitor: 0,
	user: 10,
	developer: 20,
	admin: 100,
};

/**
 * 权限管理 Hook
 *
 * 从 user-info-store 消费用户权限数据，提供权限检查方法
 *
 * @example
 * ```tsx
 * const { hasPermission, hasRole, isAdmin } = usePermissions();
 *
 * if (hasPermission('tools', 'create')) {
 *   // 显示创建工具按钮
 * }
 *
 * if (hasRole('developer')) {
 *   // admin 用户也会通过这个检查
 * }
 * ```
 */
export function usePermissions() {
	const { userInfo, loading } = useUserInfoStore();

	const roles = useMemo(() => userInfo?.roles ?? ["visitor"], [userInfo]);
	const permissions = useMemo(() => userInfo?.permissions ?? [], [userInfo]);

	// 获取用户最高角色等级
	const userMaxRoleLevel = useMemo(() => {
		return Math.max(...roles.map((role) => ROLE_HIERARCHY[role] ?? 0));
	}, [roles]);

	// 检查是否有指定权限
	const hasPermission = useMemo(
		() => (resource: string, action: string) => {
			return permissions.includes(`${resource}:${action}`);
		},
		[permissions],
	);

	// 检查是否有指定角色（支持角色继承）
	const hasRole = useMemo(
		() => (role: string) => {
			const requiredLevel = ROLE_HIERARCHY[role] ?? 0;
			return userMaxRoleLevel >= requiredLevel;
		},
		[userMaxRoleLevel],
	);

	// 检查是否有任一角色（支持角色继承）
	const hasAnyRole = useMemo(
		() => (rolesToCheck: string[]) => {
			return rolesToCheck.some((role) => {
				const requiredLevel = ROLE_HIERARCHY[role] ?? 0;
				return userMaxRoleLevel >= requiredLevel;
			});
		},
		[userMaxRoleLevel],
	);

	// 检查是否为管理员
	const isAdmin = useMemo(() => roles.includes("admin"), [roles]);

	return {
		userInfo,
		roles,
		permissions,
		loading,
		hasPermission,
		hasRole,
		hasAnyRole,
		isAdmin,
	};
}
