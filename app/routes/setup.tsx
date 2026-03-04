import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { LanguageToggle } from "~/components/language-toggle";
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
import { useI18n } from "~/hooks/use-i18n";
import { useSetupStatus } from "~/hooks/use-setup-status";
import { initializeSetup } from "~/lib/api";
import { useUserInfoStore } from "~/stores/user-info-store";

export function meta() {
	return [{ title: "Setup | DevShelf" }];
}

export default function SetupPage() {
	const { needsSetup, loading: statusLoading } = useSetupStatus();
	const navigate = useNavigate();
	const { t } = useI18n();

	useEffect(() => {
		if (needsSetup === false) {
			navigate("/", { replace: true });
		}
	}, [needsSetup, navigate]);

	if (statusLoading || needsSetup === null) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<p className="text-muted-foreground">{t("setup.loading")}</p>
			</div>
		);
	}

	if (needsSetup === false) {
		return null;
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4">
			<div className="absolute top-4 right-4">
				<LanguageToggle />
			</div>
			<SetupForm />
		</div>
	);
}

function SetupForm() {
	const navigate = useNavigate();
	const setUserInfo = useUserInfoStore((s) => s.setUserInfo);
	const { t } = useI18n();

	const [username, setUsername] = useState("");
	const [displayName, setDisplayName] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError(null);

		if (username.trim().length < 3) {
			setError(t("setup.usernameMinLength"));
			return;
		}
		if (password.length < 8) {
			setError(t("setup.passwordMinLength"));
			return;
		}
		if (password !== confirmPassword) {
			setError(t("setup.passwordNoMatch"));
			return;
		}

		setLoading(true);
		try {
			const { user } = await initializeSetup({
				username: username.trim(),
				password,
				displayName: displayName.trim() || undefined,
			});
			setUserInfo(user);
			toast.success(t("setup.success"));
			navigate("/", { replace: true });
		} catch (err) {
			const message =
				err instanceof Error ? err.message : t("setup.failed");
			setError(message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="w-full max-w-md">
			<CardHeader className="text-center">
				<CardTitle className="text-2xl">{t("setup.title")}</CardTitle>
				<CardDescription>
					{t("setup.subtitle")}
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
						<Label htmlFor="username">{t("setup.username")}</Label>
						<Input
							id="username"
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder={t("setup.usernamePlaceholder")}
							autoComplete="username"
							required
							minLength={3}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="displayName">
							{t("setup.displayName")}{" "}
							<span className="text-muted-foreground">{t("setup.displayNameOptional")}</span>
						</Label>
						<Input
							id="displayName"
							type="text"
							value={displayName}
							onChange={(e) => setDisplayName(e.target.value)}
							placeholder={t("setup.displayNamePlaceholder")}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">{t("setup.password")}</Label>
						<Input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder={t("setup.passwordPlaceholder")}
							autoComplete="new-password"
							required
							minLength={8}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="confirmPassword">{t("setup.confirmPassword")}</Label>
						<Input
							id="confirmPassword"
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							placeholder={t("setup.confirmPasswordPlaceholder")}
							autoComplete="new-password"
							required
						/>
					</div>
					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? t("setup.submitting") : t("setup.submit")}
					</Button>
				</CardContent>
			</form>
		</Card>
	);
}
