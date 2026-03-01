import { AlertCircle, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { useHydration } from "~/hooks/use-hydration";
import { usePermissions } from "~/hooks/use-permissions";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface ProtectedRouteProps {
	children: ReactNode;
	requiredRoles?: "visitor" | "user" | "developer" | "admin" | ({} & string);
	requiredPermissions?: Array<{ resource: string; action: string }>;
	fallback?: ReactNode;
}

/**
 * 权限保护组件
 * 用于包裹需要权限控制的页面或组件
 */
export function ProtectedRoute({
	children,
	requiredRoles,
	requiredPermissions,
	fallback,
}: ProtectedRouteProps) {
	const { roles, loading, hasRole } = usePermissions();
	const hasHydrated = useHydration();

	if (loading) {
		return (
			<div className="container mx-auto p-6">
				<div className="flex items-center justify-center h-96">
					<p className="text-muted-foreground">加载中...</p>
				</div>
			</div>
		);
	}

	// 检查角色
	if (requiredRoles && requiredRoles.length > 0 && hasHydrated) {
		if (!hasRole(requiredRoles)) {
			if (fallback) return <>{fallback}</>;
			return (
				<AccessDenied
					reason={`需要以下角色: ${requiredRoles}`}
					currentRoles={roles}
				/>
			);
		}
	}

	// Permission-based checks removed (simple admin/user role model)
	// Will be reintroduced in Phase 3 if granular RBAC is needed

	return <>{children}</>;
}

/**
 * 访问被拒绝页面
 */
function AccessDenied({
	reason,
	currentRoles,
}: {
	reason?: string;
	currentRoles: string[];
}) {
	const navigate = useNavigate();

	return (
		<div className="container mx-auto p-6">
			<div className="flex items-center justify-center min-h-[60vh]">
				<Card className="max-w-md w-full">
					<CardHeader>
						<div className="flex items-center gap-2">
							<Lock className="h-6 w-6 text-destructive" />
							<CardTitle>访问受限</CardTitle>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>权限不足</AlertTitle>
							<AlertDescription>
								{reason || "你没有权限访问此页面"}
							</AlertDescription>
						</Alert>

						<div className="space-y-2">
							<p className="text-sm text-muted-foreground">
								当前角色: {currentRoles.join(", ")}
							</p>
							<p className="text-sm text-muted-foreground">
								如需访问此页面，请联系管理员申请相应权限。
							</p>
						</div>

						<div className="flex gap-2">
							<Button variant="outline" onClick={() => window.history.back()}>
								返回上一页
							</Button>
							<Button onClick={() => navigate("/")}>返回首页</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
