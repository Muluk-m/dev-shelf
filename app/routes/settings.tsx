import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Header } from "~/components/layout/header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { changePassword, updateProfile } from "~/lib/api";
import { useUserInfoStore } from "~/stores/user-info-store";

export function meta() {
	return [{ title: "Settings - DevTools" }];
}

export default function SettingsPage() {
	const { userInfo, setUserInfo } = useUserInfoStore();
	const navigate = useNavigate();

	useEffect(() => {
		if (!userInfo) {
			navigate("/login", { replace: true });
		}
	}, [userInfo, navigate]);

	if (!userInfo) {
		return null;
	}

	return (
		<div className="min-h-screen bg-background">
			<Header showSearch={false} />
			<main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Personal Settings
					</h1>
					<p className="text-muted-foreground mt-1">
						Manage your account information and security
					</p>
				</div>

				<ProfileSection
					userInfo={userInfo}
					onProfileUpdated={setUserInfo}
				/>
				<ChangePasswordSection />
			</main>
		</div>
	);
}

function ProfileSection({
	userInfo,
	onProfileUpdated,
}: {
	userInfo: { id: string; username: string; displayName: string; role: "admin" | "user" };
	onProfileUpdated: (user: { id: string; username: string; displayName: string; role: "admin" | "user" }) => void;
}) {
	const [displayName, setDisplayName] = useState(userInfo.displayName);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!displayName.trim()) {
			setError("Display name cannot be empty");
			return;
		}

		setLoading(true);
		try {
			const { user } = await updateProfile(displayName.trim());
			onProfileUpdated(user);
			toast.success("Profile updated successfully");
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to update profile";
			setError(message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Profile Information</CardTitle>
				<CardDescription>
					Update your display name and view your account details
				</CardDescription>
			</CardHeader>
			<form onSubmit={handleSubmit}>
				<CardContent className="space-y-4">
					{error && (
						<div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
							{error}
						</div>
					)}
					<div className="space-y-2">
						<Label>Username</Label>
						<p className="text-sm text-muted-foreground">
							{userInfo.username}
						</p>
					</div>
					<div className="space-y-2">
						<Label>Role</Label>
						<div>
							<Badge variant={userInfo.role === "admin" ? "default" : "secondary"}>
								{userInfo.role === "admin" ? "Admin" : "User"}
							</Badge>
						</div>
					</div>
					<Separator />
					<div className="space-y-2">
						<Label htmlFor="displayName">Display Name</Label>
						<Input
							id="displayName"
							type="text"
							value={displayName}
							onChange={(e) => setDisplayName(e.target.value)}
							placeholder="Enter your display name"
						/>
					</div>
					<Button type="submit" disabled={loading}>
						{loading ? "Saving..." : "Save Changes"}
					</Button>
				</CardContent>
			</form>
		</Card>
	);
}

function ChangePasswordSection() {
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmNewPassword, setConfirmNewPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!currentPassword) {
			setError("Current password is required");
			return;
		}
		if (newPassword.length < 8) {
			setError("New password must be at least 8 characters");
			return;
		}
		if (newPassword !== confirmNewPassword) {
			setError("New passwords do not match");
			return;
		}

		setLoading(true);
		try {
			await changePassword(currentPassword, newPassword);
			toast.success("Password changed successfully");
			setCurrentPassword("");
			setNewPassword("");
			setConfirmNewPassword("");
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "Failed to change password";
			setError(message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Change Password</CardTitle>
				<CardDescription>
					Update your password to keep your account secure
				</CardDescription>
			</CardHeader>
			<form onSubmit={handleSubmit}>
				<CardContent className="space-y-4">
					{error && (
						<div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
							{error}
						</div>
					)}
					<div className="space-y-2">
						<Label htmlFor="currentPassword">
							Current Password
						</Label>
						<Input
							id="currentPassword"
							type="password"
							value={currentPassword}
							onChange={(e) =>
								setCurrentPassword(e.target.value)
							}
							placeholder="Enter your current password"
							autoComplete="current-password"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="newPassword">New Password</Label>
						<Input
							id="newPassword"
							type="password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							placeholder="At least 8 characters"
							autoComplete="new-password"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="confirmNewPassword">
							Confirm New Password
						</Label>
						<Input
							id="confirmNewPassword"
							type="password"
							value={confirmNewPassword}
							onChange={(e) =>
								setConfirmNewPassword(e.target.value)
							}
							placeholder="Repeat your new password"
							autoComplete="new-password"
						/>
					</div>
					<Button type="submit" disabled={loading}>
						{loading ? "Changing password..." : "Change Password"}
					</Button>
				</CardContent>
			</form>
		</Card>
	);
}
