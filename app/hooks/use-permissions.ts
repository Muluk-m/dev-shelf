import { useEffect, useState } from "react";

interface UserPermissions {
	userId: string;
	roles: string[];
	permissions: string[];
}

interface AuthMeResponse {
	data?: {
		userId: string;
		roles?: string[];
		permissions?: string[];
	};
}

export function usePermissions() {
	const [userPermissions, setUserPermissions] =
		useState<UserPermissions | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadPermissions();
	}, []);

	async function loadPermissions() {
		try {
			const response = await fetch("/auth/me");
			if (response.ok) {
				const result = (await response.json()) as AuthMeResponse;
				const data = result.data;
				if (!data) throw new Error("缺少用户权限数据");
				setUserPermissions({
					userId: data.userId,
					roles: data.roles ?? [],
					permissions: data.permissions ?? [],
				});
			} else {
				// 未登录用户，默认 visitor 权限
				setUserPermissions({
					userId: "",
					roles: ["visitor"],
					permissions: [],
				});
			}
		} catch (error) {
			console.error("Failed to load permissions:", error);
			setUserPermissions({
				userId: "",
				roles: ["visitor"],
				permissions: [],
			});
		} finally {
			setLoading(false);
		}
	}

	// 检查是否有指定权限
	function hasPermission(resource: string, action: string): boolean {
		if (!userPermissions) return false;
		return userPermissions.permissions.includes(`${resource}:${action}`);
	}

	// 检查是否有指定角色
	function hasRole(role: string): boolean {
		if (!userPermissions) return false;
		return userPermissions.roles.includes(role);
	}

	// 检查是否有任一角色
	function hasAnyRole(roles: string[]): boolean {
		if (!userPermissions) return false;
		return roles.some((role) => userPermissions.roles.includes(role));
	}

	// 检查是否为管理员
	function isAdmin(): boolean {
		return hasRole("admin");
	}

	return {
		userPermissions,
		loading,
		hasPermission,
		hasRole,
		hasAnyRole,
		isAdmin,
	};
}
