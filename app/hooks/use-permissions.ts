import { useUserInfoStore } from "~/stores/user-info-store";

/**
 * Permissions hook for role-based access control.
 * Uses a simple admin/user role model with hierarchy: admin > user.
 */
export function usePermissions() {
	const { userInfo, loading } = useUserInfoStore();

	const role = userInfo?.role ?? null;
	const isAdmin = role === "admin";

	const hasRole = (requiredRole: string): boolean => {
		if (!role) return false;
		// Admin has access to everything
		if (isAdmin) return true;
		return role === requiredRole;
	};

	return {
		userInfo,
		roles: role ? [role] : [],
		loading,
		isAdmin,
		hasRole,
	};
}
