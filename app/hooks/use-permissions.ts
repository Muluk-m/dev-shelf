import { useUserInfoStore } from "~/stores/user-info-store";

const ROLE_HIERARCHY: Record<string, number> = {
	user: 10,
	admin: 100,
};

/**
 * Permissions hook for role-based access control.
 * Uses a simple admin/user role model with hierarchy: admin > user.
 */
export function usePermissions() {
	const { userInfo, loading } = useUserInfoStore();

	const role = userInfo?.role ?? null;
	const isAdmin = role === "admin";
	const roles = role ? [role] : [];

	const hasRole = (requiredRole: string): boolean => {
		if (!role) return false;
		const userLevel = ROLE_HIERARCHY[role] ?? 0;
		const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0;
		return userLevel >= requiredLevel;
	};

	const hasAnyRole = (requiredRoles: string[]): boolean => {
		return requiredRoles.some((r) => hasRole(r));
	};

	const hasPermission = (resource: string, _action: string): boolean => {
		if (!role) return false;
		// Admin has all permissions
		if (isAdmin) return true;
		// Regular users have read-only access
		return _action === "read";
	};

	return {
		userInfo,
		roles,
		permissions: [] as string[],
		loading,
		isAdmin,
		hasRole,
		hasAnyRole,
		hasPermission,
	};
}
