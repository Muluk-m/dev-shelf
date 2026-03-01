/**
 * Permissions hook.
 * Stub: grants admin access to all users until auth is rebuilt in Phase 2.
 */
export function usePermissions() {
	const roles = ["admin"];
	const permissions: string[] = [];

	const hasPermission = (_resource: string, _action: string) => true;
	const hasRole = (_role: string) => true;
	const hasAnyRole = (_rolesToCheck: string[]) => true;
	const isAdmin = true;

	return {
		userInfo: null,
		roles,
		permissions,
		loading: false,
		hasPermission,
		hasRole,
		hasAnyRole,
		isAdmin,
	};
}
