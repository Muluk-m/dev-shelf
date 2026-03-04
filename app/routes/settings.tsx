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
import { useI18n } from "~/hooks/use-i18n";
import { changePassword, updateProfile } from "~/lib/api";
import { useUserInfoStore } from "~/stores/user-info-store";

export function meta() {
	return [{ title: "Settings | DevShelf" }];
}

export default function SettingsPage() {
	const { userInfo, setUserInfo } = useUserInfoStore();
	const navigate = useNavigate();
	const { t } = useI18n();

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
						{t("settings.title")}
					</h1>
					<p className="text-muted-foreground mt-1">
						{t("settings.subtitle")}
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
	const { t } = useI18n();

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!displayName.trim()) {
			setError(t("settings.profile.displayNameRequired"));
			return;
		}

		setLoading(true);
		try {
			const { user } = await updateProfile(displayName.trim());
			onProfileUpdated(user);
			toast.success(t("settings.profile.success"));
		} catch (err) {
			const message =
				err instanceof Error ? err.message : t("settings.profile.failed");
			setError(message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("settings.profile.title")}</CardTitle>
				<CardDescription>
					{t("settings.profile.subtitle")}
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
						<Label>{t("settings.profile.username")}</Label>
						<p className="text-sm text-muted-foreground">
							{userInfo.username}
						</p>
					</div>
					<div className="space-y-2">
						<Label>{t("settings.profile.role")}</Label>
						<div>
							<Badge variant={userInfo.role === "admin" ? "default" : "secondary"}>
								{userInfo.role === "admin"
									? t("settings.profile.roleAdmin")
									: t("settings.profile.roleUser")}
							</Badge>
						</div>
					</div>
					<Separator />
					<div className="space-y-2">
						<Label htmlFor="displayName">{t("settings.profile.displayName")}</Label>
						<Input
							id="displayName"
							type="text"
							value={displayName}
							onChange={(e) => setDisplayName(e.target.value)}
							placeholder={t("settings.profile.displayNamePlaceholder")}
						/>
					</div>
					<Button type="submit" disabled={loading}>
						{loading ? t("settings.profile.saving") : t("settings.profile.save")}
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
	const { t } = useI18n();

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!currentPassword) {
			setError(t("settings.password.currentRequired"));
			return;
		}
		if (newPassword.length < 8) {
			setError(t("settings.password.newMinLength"));
			return;
		}
		if (newPassword !== confirmNewPassword) {
			setError(t("settings.password.noMatch"));
			return;
		}

		setLoading(true);
		try {
			await changePassword(currentPassword, newPassword);
			toast.success(t("settings.password.success"));
			setCurrentPassword("");
			setNewPassword("");
			setConfirmNewPassword("");
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: t("settings.password.failed");
			setError(message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("settings.password.title")}</CardTitle>
				<CardDescription>
					{t("settings.password.subtitle")}
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
							{t("settings.password.current")}
						</Label>
						<Input
							id="currentPassword"
							type="password"
							value={currentPassword}
							onChange={(e) => setCurrentPassword(e.target.value)}
							placeholder={t("settings.password.currentPlaceholder")}
							autoComplete="current-password"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="newPassword">{t("settings.password.new")}</Label>
						<Input
							id="newPassword"
							type="password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							placeholder={t("settings.password.newPlaceholder")}
							autoComplete="new-password"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="confirmNewPassword">
							{t("settings.password.confirm")}
						</Label>
						<Input
							id="confirmNewPassword"
							type="password"
							value={confirmNewPassword}
							onChange={(e) => setConfirmNewPassword(e.target.value)}
							placeholder={t("settings.password.confirmPlaceholder")}
							autoComplete="new-password"
						/>
					</div>
					<Button type="submit" disabled={loading}>
						{loading ? t("settings.password.loading") : t("settings.password.submit")}
					</Button>
				</CardContent>
			</form>
		</Card>
	);
}
