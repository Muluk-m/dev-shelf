import { Plus, Shield, User, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "~/components/protected-route";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { useToast } from "~/hooks/use-toast";
import type { Route } from "./+types/admin.permissions";

interface UserWithRoles {
	id: string;
	feishuId: string;
	name: string;
	email?: string;
	avatar?: string;
	createdAt: string;
	updatedAt: string;
	roles: Role[];
}

interface Role {
	id: string;
	name: string;
	description?: string;
	createdAt: string;
	userCount?: number;
	permissions?: Permission[];
}

interface Permission {
	id: string;
	resource: string;
	action: string;
	description?: string;
	createdAt: string;
}

interface ApiResponse<T> {
	code: number;
	data?: T;
	error?: string;
	message?: string;
}

const roleColors: Record<string, string> = {
	admin: "bg-red-100 text-red-800 border-red-200",
	developer: "bg-blue-100 text-blue-800 border-blue-200",
	user: "bg-green-100 text-green-800 border-green-200",
	visitor: "bg-gray-100 text-gray-800 border-gray-200",
};

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "权限管理 - DevHub" },
		{ name: "description", content: "管理用户角色和权限" },
	];
}

export default function PermissionsPage() {
	const { toast } = useToast();
	const [users, setUsers] = useState<UserWithRoles[]>([]);
	const [roles, setRoles] = useState<Role[]>([]);
	const [permissions, setPermissions] = useState<Permission[]>([]);
	const [loading, setLoading] = useState(true);

	// 对话框状态
	const [showAddPermissionDialog, setShowAddPermissionDialog] = useState(false);
	const [showEditPermissionDialog, setShowEditPermissionDialog] =
		useState(false);
	const [showEditRoleDialog, setShowEditRoleDialog] = useState(false);
	const [selectedRole, setSelectedRole] = useState<Role | null>(null);
	const [selectedPermission, setSelectedPermission] =
		useState<Permission | null>(null);

	// 表单状态
	const [newPermission, setNewPermission] = useState({
		resource: "",
		action: "",
		description: "",
	});

	useEffect(() => {
		loadData();
	}, []);

	async function loadData() {
		try {
			setLoading(true);
			const [usersRes, rolesRes, permsRes] = await Promise.all([
				fetch("/api/permissions/users"),
				fetch("/api/permissions/roles"),
				fetch("/api/permissions/permissions"),
			]);

			const usersData = (await usersRes.json()) as ApiResponse<UserWithRoles[]>;
			const rolesData = (await rolesRes.json()) as ApiResponse<Role[]>;
			const permsData = (await permsRes.json()) as ApiResponse<Permission[]>;

			setUsers(usersData.data ?? []);
			setRoles(rolesData.data ?? []);
			setPermissions(permsData.data ?? []);
		} catch (error) {
			console.error("Failed to load permissions data:", error);
			toast({
				title: "加载失败",
				description: "无法加载权限数据",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	}

	async function handleRoleChange(userId: string, newRoleId: string) {
		try {
			const user = users.find((u) => u.id === userId);
			if (!user) return;

			// 移除旧角色
			for (const role of user.roles) {
				await fetch(`/api/permissions/users/${userId}/roles/${role.id}`, {
					method: "DELETE",
				});
			}

			// 添加新角色
			await fetch(`/api/permissions/users/${userId}/roles`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ roleId: newRoleId }),
			});

			toast({
				title: "更新成功",
				description: "用户角色已更新",
			});

			await loadData();
		} catch (error) {
			console.error("Failed to update role:", error);
			toast({
				title: "更新失败",
				description: "无法更新用户角色",
				variant: "destructive",
			});
		}
	}

	// 添加新权限
	async function handleAddPermission() {
		if (!newPermission.resource || !newPermission.action) {
			toast({
				title: "请填写完整",
				description: "资源和操作不能为空",
				variant: "destructive",
			});
			return;
		}

		try {
			const response = await fetch("/api/permissions/permissions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(newPermission),
			});

			const result = (await response.json()) as ApiResponse<Permission>;

			if (result.code === 0) {
				toast({
					title: "添加成功",
					description: "新权限已添加",
				});
				setShowAddPermissionDialog(false);
				setNewPermission({ resource: "", action: "", description: "" });
				await loadData();
			} else {
				throw new Error(result.error ?? "添加权限失败");
			}
		} catch (error) {
			console.error("Failed to add permission:", error);
			toast({
				title: "添加失败",
				description: (error as Error).message,
				variant: "destructive",
			});
		}
	}

	// 打开编辑角色对话框
	function handleEditRole(role: Role) {
		setSelectedRole(role);
		setShowEditRoleDialog(true);
	}

	// 打开编辑权限对话框
	function handleEditPermission(permission: Permission) {
		setSelectedPermission(permission);
		setNewPermission({
			resource: permission.resource,
			action: permission.action,
			description: permission.description || "",
		});
		setShowEditPermissionDialog(true);
	}

	// 更新权限
	async function handleUpdatePermission() {
		if (!selectedPermission || !newPermission.description) {
			toast({
				title: "请填写描述",
				description: "权限描述不能为空",
				variant: "destructive",
			});
			return;
		}

		try {
			const response = await fetch(
				`/api/permissions/permissions/${selectedPermission.id}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ description: newPermission.description }),
				},
			);

			const result = (await response.json()) as ApiResponse<Permission>;

			if (result.code === 0) {
				toast({
					title: "更新成功",
					description: "权限描述已更新",
				});
				setShowEditPermissionDialog(false);
				setSelectedPermission(null);
				setNewPermission({ resource: "", action: "", description: "" });
				await loadData();
			} else {
				throw new Error(result.error ?? "更新权限失败");
			}
		} catch (error) {
			console.error("Failed to update permission:", error);
			toast({
				title: "更新失败",
				description: (error as Error).message,
				variant: "destructive",
			});
		}
	}

	// 切换角色权限
	async function handleToggleRolePermission(
		roleId: string,
		permissionId: string,
		hasPermission: boolean,
	) {
		try {
			if (hasPermission) {
				// 移除权限
				await fetch(
					`/api/permissions/roles/${roleId}/permissions/${permissionId}`,
					{
						method: "DELETE",
					},
				);
				toast({
					title: "权限已移除",
				});
			} else {
				// 添加权限
				await fetch(`/api/permissions/roles/${roleId}/permissions`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ permissionId }),
				});
				toast({
					title: "权限已添加",
				});
			}

			await loadData();
		} catch (error) {
			console.error("Failed to toggle permission:", error);
			toast({
				title: "操作失败",
				description: "无法更新角色权限",
				variant: "destructive",
			});
		}
	}

	if (loading) {
		return (
			<div className="container mx-auto p-6">
				<div className="flex items-center justify-center h-96">
					<p className="text-muted-foreground">加载中...</p>
				</div>
			</div>
		);
	}

	return (
		<ProtectedRoute
			requiredRoles="admin"
			requiredPermissions={[{ resource: "user", action: "write" }]}
		>
			<div className="min-h-screen bg-background">
				<div className="container mx-auto p-6">
					<div className="mb-8">
						<h1 className="text-3xl font-bold mb-2">权限管理</h1>
						<p className="text-muted-foreground">管理系统用户、角色和权限</p>
					</div>

					<Tabs defaultValue="users" className="space-y-6">
						<TabsList>
							<TabsTrigger value="users">
								<Users className="h-4 w-4 mr-2" />
								用户管理
							</TabsTrigger>
							<TabsTrigger value="roles">
								<Shield className="h-4 w-4 mr-2" />
								角色管理
							</TabsTrigger>
							<TabsTrigger value="permissions">
								<User className="h-4 w-4 mr-2" />
								权限列表
							</TabsTrigger>
						</TabsList>

						{/* 用户管理标签 */}
						<TabsContent value="users">
							<Card>
								<CardHeader>
									<CardTitle>用户列表</CardTitle>
									<CardDescription>共 {users.length} 位用户</CardDescription>
								</CardHeader>
								<CardContent>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>用户</TableHead>
												<TableHead>邮箱</TableHead>
												<TableHead>当前角色</TableHead>
												<TableHead>注册时间</TableHead>
												<TableHead>操作</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{users.map((user) => (
												<TableRow key={user.id}>
													<TableCell>
														<div className="flex items-center gap-3">
															{user.avatar && (
																<img
																	src={user.avatar}
																	alt={user.name}
																	className="h-8 w-8 rounded-full"
																/>
															)}
															<div>
																<p className="font-medium">{user.name}</p>
																<p className="text-xs text-muted-foreground">
																	{user.feishuId}
																</p>
															</div>
														</div>
													</TableCell>
													<TableCell>
														{user.email || (
															<span className="text-muted-foreground">-</span>
														)}
													</TableCell>
													<TableCell>
														{user.roles.map((role) => (
															<Badge
																key={role.id}
																variant="outline"
																className={roleColors[role.name] || ""}
															>
																{role.name}
															</Badge>
														))}
													</TableCell>
													<TableCell>
														{new Date(user.createdAt).toLocaleDateString(
															"zh-CN",
														)}
													</TableCell>
													<TableCell>
														<Select
															defaultValue={user.roles[0]?.id}
															onValueChange={(value) =>
																handleRoleChange(user.id, value)
															}
														>
															<SelectTrigger className="w-32">
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																{roles.map((role) => (
																	<SelectItem key={role.id} value={role.id}>
																		{role.name}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</CardContent>
							</Card>
						</TabsContent>

						{/* 角色管理标签 */}
						<TabsContent value="roles">
							<div className="grid gap-6 md:grid-cols-2">
								{roles.map((role) => (
									<Card key={role.id}>
										<CardHeader>
											<div className="flex items-start justify-between">
												<div>
													<CardTitle className="flex items-center gap-2">
														<Badge
															variant="outline"
															className={roleColors[role.name] || ""}
														>
															{role.name}
														</Badge>
													</CardTitle>
													<CardDescription className="mt-2">
														{role.description}
													</CardDescription>
												</div>
												<div className="flex items-center gap-2">
													<Badge variant="secondary">
														{role.userCount || 0} 位用户
													</Badge>
													<Button
														size="sm"
														variant="outline"
														onClick={() => handleEditRole(role)}
													>
														编辑权限
													</Button>
												</div>
											</div>
										</CardHeader>
										<CardContent>
											<div className="space-y-2">
												<p className="text-sm font-medium">权限列表:</p>
												<div className="flex flex-wrap gap-2">
													{role.permissions && role.permissions.length > 0 ? (
														role.permissions.map((perm) => (
															<Badge
																key={perm.id}
																variant="secondary"
																className="text-xs"
															>
																{perm.resource}:{perm.action}
															</Badge>
														))
													) : (
														<p className="text-sm text-muted-foreground">
															无特殊权限
														</p>
													)}
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</TabsContent>

						{/* 权限列表标签 */}
						<TabsContent value="permissions">
							<Card>
								<CardHeader className="flex flex-row items-center justify-between">
									<div>
										<CardTitle>系统权限</CardTitle>
										<CardDescription>
											共 {permissions.length} 项权限
										</CardDescription>
									</div>
									<Button onClick={() => setShowAddPermissionDialog(true)}>
										<Plus className="h-4 w-4 mr-2" />
										添加权限
									</Button>
								</CardHeader>
								<CardContent>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>权限ID</TableHead>
												<TableHead>资源</TableHead>
												<TableHead>操作</TableHead>
												<TableHead>描述</TableHead>
												<TableHead className="w-24">操作</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{permissions.map((perm) => (
												<TableRow key={perm.id}>
													<TableCell className="font-mono text-xs">
														{perm.id}
													</TableCell>
													<TableCell>
														<Badge variant="outline">{perm.resource}</Badge>
													</TableCell>
													<TableCell>
														<Badge variant="secondary">{perm.action}</Badge>
													</TableCell>
													<TableCell>{perm.description}</TableCell>
													<TableCell>
														<Button
															size="sm"
															variant="ghost"
															onClick={() => handleEditPermission(perm)}
														>
															编辑
														</Button>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>

					{/* 添加权限对话框 */}
					<Dialog
						open={showAddPermissionDialog}
						onOpenChange={setShowAddPermissionDialog}
					>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>添加新权限</DialogTitle>
								<DialogDescription>创建一个新的系统权限</DialogDescription>
							</DialogHeader>
							<div className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="resource">资源类型 *</Label>
									<Input
										id="resource"
										placeholder="例如: tool, category, user"
										value={newPermission.resource}
										onChange={(e) =>
											setNewPermission({
												...newPermission,
												resource: e.target.value,
											})
										}
									/>
									<p className="text-xs text-muted-foreground">
										权限控制的资源类型
									</p>
								</div>
								<div className="space-y-2">
									<Label htmlFor="action">操作 *</Label>
									<Input
										id="action"
										placeholder="例如: read, write, delete"
										value={newPermission.action}
										onChange={(e) =>
											setNewPermission({
												...newPermission,
												action: e.target.value,
											})
										}
									/>
									<p className="text-xs text-muted-foreground">
										允许的操作类型
									</p>
								</div>
								<div className="space-y-2">
									<Label htmlFor="description">描述</Label>
									<Textarea
										id="description"
										placeholder="权限的详细描述..."
										value={newPermission.description}
										onChange={(e) =>
											setNewPermission({
												...newPermission,
												description: e.target.value,
											})
										}
									/>
								</div>
							</div>
							<DialogFooter>
								<Button
									variant="outline"
									onClick={() => setShowAddPermissionDialog(false)}
								>
									取消
								</Button>
								<Button onClick={handleAddPermission}>添加</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>

					{/* 编辑权限对话框 */}
					<Dialog
						open={showEditPermissionDialog}
						onOpenChange={setShowEditPermissionDialog}
					>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>编辑权限</DialogTitle>
								<DialogDescription>修改权限的描述信息</DialogDescription>
							</DialogHeader>
							<div className="space-y-4">
								<div className="space-y-2">
									<Label>资源类型</Label>
									<Input
										value={selectedPermission?.resource || ""}
										disabled
										className="bg-muted"
									/>
								</div>
								<div className="space-y-2">
									<Label>操作</Label>
									<Input
										value={selectedPermission?.action || ""}
										disabled
										className="bg-muted"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="edit-description">描述 *</Label>
									<Textarea
										id="edit-description"
										placeholder="权限的详细描述..."
										value={newPermission.description}
										onChange={(e) =>
											setNewPermission({
												...newPermission,
												description: e.target.value,
											})
										}
									/>
								</div>
							</div>
							<DialogFooter>
								<Button
									variant="outline"
									onClick={() => {
										setShowEditPermissionDialog(false);
										setSelectedPermission(null);
										setNewPermission({
											resource: "",
											action: "",
											description: "",
										});
									}}
								>
									取消
								</Button>
								<Button onClick={handleUpdatePermission}>保存</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>

					{/* 编辑角色权限对话框 */}
					<Dialog
						open={showEditRoleDialog}
						onOpenChange={setShowEditRoleDialog}
					>
						<DialogContent className="max-w-2xl">
							<DialogHeader>
								<DialogTitle>编辑角色权限: {selectedRole?.name}</DialogTitle>
								<DialogDescription>选择或取消该角色的权限</DialogDescription>
							</DialogHeader>
							<div className="max-h-96 overflow-y-auto space-y-2">
								{permissions.map((permission) => {
									const hasPermission = selectedRole?.permissions?.some(
										(p) => p.id === permission.id,
									);
									return (
										<div
											key={permission.id}
											className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
										>
											<Checkbox
												id={permission.id}
												checked={hasPermission}
												onCheckedChange={() =>
													selectedRole &&
													handleToggleRolePermission(
														selectedRole.id,
														permission.id,
														hasPermission || false,
													)
												}
											/>
											<div className="flex-1 space-y-1">
												<Label
													htmlFor={permission.id}
													className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
												>
													<Badge variant="outline" className="mr-2">
														{permission.resource}
													</Badge>
													<Badge variant="secondary">{permission.action}</Badge>
												</Label>
												{permission.description && (
													<p className="text-sm text-muted-foreground">
														{permission.description}
													</p>
												)}
											</div>
										</div>
									);
								})}
							</div>
							<DialogFooter>
								<Button onClick={() => setShowEditRoleDialog(false)}>
									完成
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>
		</ProtectedRoute>
	);
}
