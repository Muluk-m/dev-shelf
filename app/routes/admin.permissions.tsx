import {
	Check,
	ChevronRight,
	Key,
	Plus,
	Search,
	Shield,
	ShieldCheck,
	UserCog,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AdminLayout } from "~/components/layout/admin-layout";
import { ProtectedRoute } from "~/components/protected-route";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
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
import { cn } from "~/lib/utils";
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

const roleStyles: Record<string, { bg: string; text: string; border: string }> =
	{
		admin: {
			bg: "bg-rose-50 dark:bg-rose-950/30",
			text: "text-rose-700 dark:text-rose-300",
			border: "border-rose-200 dark:border-rose-800",
		},
		developer: {
			bg: "bg-blue-50 dark:bg-blue-950/30",
			text: "text-blue-700 dark:text-blue-300",
			border: "border-blue-200 dark:border-blue-800",
		},
		user: {
			bg: "bg-emerald-50 dark:bg-emerald-950/30",
			text: "text-emerald-700 dark:text-emerald-300",
			border: "border-emerald-200 dark:border-emerald-800",
		},
		visitor: {
			bg: "bg-slate-50 dark:bg-slate-950/30",
			text: "text-slate-700 dark:text-slate-300",
			border: "border-slate-200 dark:border-slate-800",
		},
	};

const getRoleStyle = (roleName: string) => {
	return (
		roleStyles[roleName] || {
			bg: "bg-slate-50 dark:bg-slate-900",
			text: "text-slate-700 dark:text-slate-300",
			border: "border-slate-200 dark:border-slate-700",
		}
	);
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
	const [searchTerm, setSearchTerm] = useState("");

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

	// 筛选用户
	const filteredUsers = users.filter((user) => {
		if (!searchTerm) return true;
		const search = searchTerm.toLowerCase();
		return (
			user.name.toLowerCase().includes(search) ||
			user.email?.toLowerCase().includes(search) ||
			user.feishuId.toLowerCase().includes(search)
		);
	});

	if (loading) {
		return (
			<ProtectedRoute
				requiredRoles="admin"
				requiredPermissions={[{ resource: "user", action: "write" }]}
			>
				<AdminLayout title="权限管理" description="管理系统用户、角色和权限">
					<div className="flex items-center justify-center h-96">
						<div className="flex flex-col items-center gap-4">
							<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
							<p className="text-slate-500">加载中...</p>
						</div>
					</div>
				</AdminLayout>
			</ProtectedRoute>
		);
	}

	return (
		<ProtectedRoute
			requiredRoles="admin"
			requiredPermissions={[{ resource: "user", action: "write" }]}
		>
			<AdminLayout
				title="权限管理"
				description="管理系统用户、角色和权限"
				actions={
					<Button
						onClick={() => setShowAddPermissionDialog(true)}
						className="gap-2 shadow-lg shadow-primary/25"
					>
						<Plus className="h-4 w-4" />
						添加权限
					</Button>
				}
			>
				<div className="space-y-6">
					{/* 统计卡片 */}
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-slate-900 border-blue-100 dark:border-blue-900/50">
							<CardHeader className="pb-2">
								<div className="flex items-center justify-between">
									<div>
										<CardDescription className="text-slate-600 dark:text-slate-400 font-medium">
											总用户数
										</CardDescription>
										<CardTitle className="text-3xl font-bold tabular-nums">
											{users.length}
										</CardTitle>
									</div>
									<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/25">
										<Users className="h-6 w-6" />
									</div>
								</div>
							</CardHeader>
						</Card>
						<Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/30 dark:to-slate-900 border-purple-100 dark:border-purple-900/50">
							<CardHeader className="pb-2">
								<div className="flex items-center justify-between">
									<div>
										<CardDescription className="text-slate-600 dark:text-slate-400 font-medium">
											角色数
										</CardDescription>
										<CardTitle className="text-3xl font-bold tabular-nums">
											{roles.length}
										</CardTitle>
									</div>
									<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500 text-white shadow-lg shadow-purple-500/25">
										<Shield className="h-6 w-6" />
									</div>
								</div>
							</CardHeader>
						</Card>
						<Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-slate-900 border-emerald-100 dark:border-emerald-900/50">
							<CardHeader className="pb-2">
								<div className="flex items-center justify-between">
									<div>
										<CardDescription className="text-slate-600 dark:text-slate-400 font-medium">
											权限数
										</CardDescription>
										<CardTitle className="text-3xl font-bold tabular-nums">
											{permissions.length}
										</CardTitle>
									</div>
									<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
										<Key className="h-6 w-6" />
									</div>
								</div>
							</CardHeader>
						</Card>
					</div>

					<Tabs defaultValue="users" className="space-y-6">
						<TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 h-auto">
							<TabsTrigger
								value="users"
								className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm px-4 py-2"
							>
								<Users className="h-4 w-4 mr-2" />
								用户管理
							</TabsTrigger>
							<TabsTrigger
								value="roles"
								className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm px-4 py-2"
							>
								<Shield className="h-4 w-4 mr-2" />
								角色管理
							</TabsTrigger>
							<TabsTrigger
								value="permissions"
								className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm px-4 py-2"
							>
								<Key className="h-4 w-4 mr-2" />
								权限列表
							</TabsTrigger>
						</TabsList>

						{/* 用户管理标签 */}
						<TabsContent value="users" className="mt-6">
							<Card className="border-slate-200 dark:border-slate-800">
								<CardHeader className="border-b border-slate-200 dark:border-slate-800">
									<div className="flex items-center justify-between">
										<div>
											<CardTitle className="flex items-center gap-2">
												<UserCog className="h-5 w-5 text-primary" />
												用户列表
											</CardTitle>
											<CardDescription>
												共 {users.length} 位用户
											</CardDescription>
										</div>
										<div className="relative w-64">
											<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
											<Input
												placeholder="搜索用户..."
												value={searchTerm}
												onChange={(e) => setSearchTerm(e.target.value)}
												className="pl-10 bg-slate-50 dark:bg-slate-900"
											/>
										</div>
									</div>
								</CardHeader>
								<CardContent className="p-0">
									<Table>
										<TableHeader>
											<TableRow className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/50">
												<TableHead className="font-semibold">用户</TableHead>
												<TableHead className="font-semibold">邮箱</TableHead>
												<TableHead className="font-semibold">
													当前角色
												</TableHead>
												<TableHead className="font-semibold">
													注册时间
												</TableHead>
												<TableHead className="font-semibold">操作</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{filteredUsers.map((user) => (
												<TableRow
													key={user.id}
													className="hover:bg-slate-50 dark:hover:bg-slate-900/50"
												>
													<TableCell>
														<div className="flex items-center gap-3">
															<Avatar className="h-9 w-9 border-2 border-white dark:border-slate-800 shadow-sm">
																<AvatarImage
																	src={user.avatar}
																	alt={user.name}
																/>
																<AvatarFallback className="bg-primary/10 text-primary font-medium">
																	{user.name.charAt(0)}
																</AvatarFallback>
															</Avatar>
															<div>
																<p className="font-medium">{user.name}</p>
																<p className="text-xs text-slate-500">
																	{user.feishuId}
																</p>
															</div>
														</div>
													</TableCell>
													<TableCell className="text-slate-600 dark:text-slate-400">
														{user.email || (
															<span className="text-slate-400">-</span>
														)}
													</TableCell>
													<TableCell>
														<div className="flex flex-wrap gap-1">
															{user.roles.map((role) => {
																const style = getRoleStyle(role.name);
																return (
																	<Badge
																		key={role.id}
																		variant="outline"
																		className={cn(
																			style.bg,
																			style.text,
																			style.border,
																			"font-medium",
																		)}
																	>
																		{role.name}
																	</Badge>
																);
															})}
														</div>
													</TableCell>
													<TableCell className="text-slate-600 dark:text-slate-400">
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
															<SelectTrigger className="w-32 h-8 text-sm">
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
						<TabsContent value="roles" className="mt-6">
							<div className="grid gap-4 md:grid-cols-2">
								{roles.map((role) => {
									const style = getRoleStyle(role.name);
									return (
										<Card
											key={role.id}
											className={cn(
												"transition-all duration-200 hover:shadow-lg",
												"border-slate-200 dark:border-slate-800",
											)}
										>
											<CardHeader className="pb-3">
												<div className="flex items-start justify-between">
													<div className="flex items-center gap-3">
														<div
															className={cn(
																"flex h-10 w-10 items-center justify-center rounded-xl",
																style.bg,
															)}
														>
															<ShieldCheck
																className={cn("h-5 w-5", style.text)}
															/>
														</div>
														<div>
															<CardTitle className="text-lg flex items-center gap-2">
																{role.name}
																<Badge
																	variant="secondary"
																	className="text-xs font-normal"
																>
																	{role.userCount || 0} 用户
																</Badge>
															</CardTitle>
															<CardDescription className="mt-1">
																{role.description}
															</CardDescription>
														</div>
													</div>
													<Button
														size="sm"
														variant="outline"
														onClick={() => handleEditRole(role)}
														className="gap-1"
													>
														编辑权限
														<ChevronRight className="h-4 w-4" />
													</Button>
												</div>
											</CardHeader>
											<CardContent>
												<div className="space-y-2">
													<p className="text-sm font-medium text-slate-700 dark:text-slate-300">
														权限列表
													</p>
													<div className="flex flex-wrap gap-1.5">
														{role.permissions && role.permissions.length > 0 ? (
															role.permissions.map((perm) => (
																<Badge
																	key={perm.id}
																	variant="secondary"
																	className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
																>
																	{perm.resource}:{perm.action}
																</Badge>
															))
														) : (
															<p className="text-sm text-slate-500">
																无特殊权限
															</p>
														)}
													</div>
												</div>
											</CardContent>
										</Card>
									);
								})}
							</div>
						</TabsContent>

						{/* 权限列表标签 */}
						<TabsContent value="permissions" className="mt-6">
							<Card className="border-slate-200 dark:border-slate-800">
								<CardHeader className="border-b border-slate-200 dark:border-slate-800">
									<div className="flex items-center justify-between">
										<div>
											<CardTitle className="flex items-center gap-2">
												<Key className="h-5 w-5 text-primary" />
												系统权限
											</CardTitle>
											<CardDescription>
												共 {permissions.length} 项权限
											</CardDescription>
										</div>
									</div>
								</CardHeader>
								<CardContent className="p-0">
									<Table>
										<TableHeader>
											<TableRow className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/50">
												<TableHead className="font-semibold">权限ID</TableHead>
												<TableHead className="font-semibold">资源</TableHead>
												<TableHead className="font-semibold">操作</TableHead>
												<TableHead className="font-semibold">描述</TableHead>
												<TableHead className="w-24 font-semibold">
													操作
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{permissions.map((perm) => (
												<TableRow
													key={perm.id}
													className="hover:bg-slate-50 dark:hover:bg-slate-900/50"
												>
													<TableCell className="font-mono text-xs text-slate-500">
														{perm.id}
													</TableCell>
													<TableCell>
														<Badge
															variant="outline"
															className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
														>
															{perm.resource}
														</Badge>
													</TableCell>
													<TableCell>
														<Badge
															variant="secondary"
															className="bg-slate-100 dark:bg-slate-800"
														>
															{perm.action}
														</Badge>
													</TableCell>
													<TableCell className="text-slate-600 dark:text-slate-400">
														{perm.description || "-"}
													</TableCell>
													<TableCell>
														<Button
															size="sm"
															variant="ghost"
															onClick={() => handleEditPermission(perm)}
															className="text-primary hover:text-primary hover:bg-primary/10"
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
				</div>

				{/* 添加权限对话框 */}
				<Dialog
					open={showAddPermissionDialog}
					onOpenChange={setShowAddPermissionDialog}
				>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<Plus className="h-5 w-5 text-primary" />
								添加新权限
							</DialogTitle>
							<DialogDescription>创建一个新的系统权限</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
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
									className="bg-slate-50 dark:bg-slate-900"
								/>
								<p className="text-xs text-slate-500">权限控制的资源类型</p>
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
									className="bg-slate-50 dark:bg-slate-900"
								/>
								<p className="text-xs text-slate-500">允许的操作类型</p>
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
									className="bg-slate-50 dark:bg-slate-900 min-h-[80px]"
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
							<Button
								onClick={handleAddPermission}
								className="gap-2 shadow-lg shadow-primary/25"
							>
								<Check className="h-4 w-4" />
								添加
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* 编辑权限对话框 */}
				<Dialog
					open={showEditPermissionDialog}
					onOpenChange={setShowEditPermissionDialog}
				>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<Key className="h-5 w-5 text-primary" />
								编辑权限
							</DialogTitle>
							<DialogDescription>修改权限的描述信息</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label>资源类型</Label>
								<Input
									value={selectedPermission?.resource || ""}
									disabled
									className="bg-slate-100 dark:bg-slate-800"
								/>
							</div>
							<div className="space-y-2">
								<Label>操作</Label>
								<Input
									value={selectedPermission?.action || ""}
									disabled
									className="bg-slate-100 dark:bg-slate-800"
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
									className="bg-slate-50 dark:bg-slate-900 min-h-[80px]"
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
							<Button
								onClick={handleUpdatePermission}
								className="gap-2 shadow-lg shadow-primary/25"
							>
								<Check className="h-4 w-4" />
								保存
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* 编辑角色权限对话框 */}
				<Dialog open={showEditRoleDialog} onOpenChange={setShowEditRoleDialog}>
					<DialogContent className="sm:max-w-2xl">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<Shield className="h-5 w-5 text-primary" />
								编辑角色权限: {selectedRole?.name}
							</DialogTitle>
							<DialogDescription>选择或取消该角色的权限</DialogDescription>
						</DialogHeader>
						<div className="max-h-[400px] overflow-y-auto space-y-2 py-4">
							{permissions.map((permission) => {
								const hasPermission = selectedRole?.permissions?.some(
									(p) => p.id === permission.id,
								);
								return (
									<div
										key={permission.id}
										className={cn(
											"flex items-start space-x-3 p-3 rounded-xl border transition-all duration-200",
											hasPermission
												? "bg-primary/5 border-primary/20"
												: "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
										)}
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
											className="mt-0.5"
										/>
										<div className="flex-1 space-y-1">
											<Label
												htmlFor={permission.id}
												className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
											>
												<Badge
													variant="outline"
													className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
												>
													{permission.resource}
												</Badge>
												<Badge
													variant="secondary"
													className="bg-slate-100 dark:bg-slate-800"
												>
													{permission.action}
												</Badge>
											</Label>
											{permission.description && (
												<p className="text-sm text-slate-500">
													{permission.description}
												</p>
											)}
										</div>
									</div>
								);
							})}
						</div>
						<DialogFooter>
							<Button
								onClick={() => setShowEditRoleDialog(false)}
								className="gap-2"
							>
								<Check className="h-4 w-4" />
								完成
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</AdminLayout>
		</ProtectedRoute>
	);
}
