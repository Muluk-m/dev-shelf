import { KeyRound, Shield, Users } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminLayout } from "~/components/layout/admin-layout";
import { ProtectedRoute } from "~/components/protected-route";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
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
import {
	getAdminUsers,
	resetUserPassword,
	updateUserRole,
} from "~/lib/api";
import { useUserInfoStore } from "~/stores/user-info-store";

export function meta() {
	return [{ title: "User Management | DevHub" }];
}

interface AdminUser {
	id: string;
	username: string;
	displayName: string;
	role: string;
	createdAt: string;
}

export default function AdminUsersPage() {
	return (
		<ProtectedRoute requiredRoles="admin">
			<AdminUsersContent />
		</ProtectedRoute>
	);
}

function AdminUsersContent() {
	const currentUser = useUserInfoStore((s) => s.userInfo);
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Password reset dialog state
	const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);

	const fetchUsers = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await getAdminUsers();
			setUsers(data.users);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to fetch users";
			setError(message);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchUsers();
	}, [fetchUsers]);

	const handleRoleChange = async (userId: string, newRole: "admin" | "user") => {
		try {
			await updateUserRole(userId, newRole);
			setUsers((prev) =>
				prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
			);
			toast.success("User role updated");
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to update role";
			toast.error(message);
		}
	};

	const adminCount = users.filter((u) => u.role === "admin").length;
	const userCount = users.filter((u) => u.role === "user").length;

	return (
		<AdminLayout
			title="User Management"
			description="Manage user accounts, roles, and passwords"
		>
			{/* Stats cards */}
			<div className="grid gap-4 md:grid-cols-3 mb-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium">Total Users</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{users.length}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium">Admins</CardTitle>
						<Shield className="h-4 w-4 text-rose-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{adminCount}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium">Regular Users</CardTitle>
						<Users className="h-4 w-4 text-emerald-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{userCount}</div>
					</CardContent>
				</Card>
			</div>

			{/* Error state */}
			{error && (
				<div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive mb-4">
					{error}
				</div>
			)}

			{/* Users table */}
			<Card>
				<CardHeader>
					<CardTitle>All Users</CardTitle>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="flex items-center justify-center py-8">
							<p className="text-muted-foreground">Loading users...</p>
						</div>
					) : users.length === 0 ? (
						<div className="flex items-center justify-center py-8">
							<p className="text-muted-foreground">No users found</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Username</TableHead>
									<TableHead>Display Name</TableHead>
									<TableHead>Role</TableHead>
									<TableHead>Created At</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{users.map((user) => {
									const isSelf = user.id === currentUser?.id;
									return (
										<TableRow key={user.id}>
											<TableCell className="font-medium">
												{user.username}
												{isSelf && (
													<span className="ml-2 text-xs text-muted-foreground">
														(you)
													</span>
												)}
											</TableCell>
											<TableCell>{user.displayName || "-"}</TableCell>
											<TableCell>
												<Badge
													variant={user.role === "admin" ? "destructive" : "secondary"}
													className={
														user.role === "admin"
															? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950"
															: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950"
													}
												>
													{user.role === "admin" ? "Admin" : "User"}
												</Badge>
											</TableCell>
											<TableCell className="text-muted-foreground">
												{new Date(user.createdAt).toLocaleDateString()}
											</TableCell>
											<TableCell className="text-right">
												<div className="flex items-center justify-end gap-2">
													<Select
														value={user.role}
														onValueChange={(value) =>
															handleRoleChange(
																user.id,
																value as "admin" | "user",
															)
														}
														disabled={isSelf}
													>
														<SelectTrigger className="w-[100px] h-8 text-xs">
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="admin">Admin</SelectItem>
															<SelectItem value="user">User</SelectItem>
														</SelectContent>
													</Select>
													<Button
														variant="outline"
														size="sm"
														onClick={() => setResetTarget(user)}
													>
														<KeyRound className="h-3.5 w-3.5 mr-1" />
														Reset Password
													</Button>
												</div>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{/* Password Reset Dialog */}
			{resetTarget && (
				<PasswordResetDialog
					user={resetTarget}
					open={!!resetTarget}
					onClose={() => setResetTarget(null)}
				/>
			)}
		</AdminLayout>
	);
}

function PasswordResetDialog({
	user,
	open,
	onClose,
}: {
	user: AdminUser;
	open: boolean;
	onClose: () => void;
}) {
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError(null);

		if (newPassword.length < 8) {
			setError("Password must be at least 8 characters");
			return;
		}
		if (newPassword !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		setLoading(true);
		try {
			await resetUserPassword(user.id, newPassword);
			toast.success(`Password reset for ${user.username}`);
			onClose();
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to reset password";
			setError(message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Reset Password for {user.username}</DialogTitle>
					<DialogDescription>
						Set a new password for this user. They will need to use the new
						password to log in.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						{error && (
							<div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
								{error}
							</div>
						)}
						<div className="space-y-2">
							<Label htmlFor="newPassword">New Password</Label>
							<Input
								id="newPassword"
								type="password"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								placeholder="At least 8 characters"
								autoComplete="new-password"
								required
								minLength={8}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirmNewPassword">Confirm Password</Label>
							<Input
								id="confirmNewPassword"
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="Repeat the new password"
								autoComplete="new-password"
								required
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={loading}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={loading}>
							{loading ? "Resetting..." : "Reset Password"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
