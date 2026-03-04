import { Lock, User } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useI18n } from "~/hooks/use-i18n";
import { register } from "~/lib/api";
import { useUserInfoStore } from "~/stores/user-info-store";

export function RegisterForm() {
	const [username, setUsername] = useState("");
	const [displayName, setDisplayName] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const setUserInfo = useUserInfoStore((s) => s.setUserInfo);
	const { t } = useI18n();

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!username.trim()) {
			setError(t("auth.register.usernameRequired"));
			return;
		}
		if (username.length < 3 || username.length > 50) {
			setError(t("auth.register.usernameLength"));
			return;
		}
		if (!/^[a-zA-Z0-9_]+$/.test(username)) {
			setError(t("auth.register.usernameFormat"));
			return;
		}
		if (password.length < 8) {
			setError(t("auth.register.passwordMinLength"));
			return;
		}
		if (password !== confirmPassword) {
			setError(t("auth.register.passwordNoMatch"));
			return;
		}

		setLoading(true);
		try {
			const { user } = await register(
				username,
				password,
				displayName.trim() || undefined,
			);
			setUserInfo(user);
			toast.success(t("auth.register.success"));
			navigate("/");
		} catch (err) {
			const message =
				err instanceof Error ? err.message : t("auth.register.failed");
			setError(message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="w-full max-w-md">
			<CardHeader className="text-center">
				<CardTitle className="text-2xl">{t("auth.register.title")}</CardTitle>
				<CardDescription>
					{t("auth.register.subtitle")}
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
						<Label htmlFor="username">{t("auth.register.username")}</Label>
						<div className="relative">
							<User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								id="username"
								type="text"
								placeholder={t("auth.register.usernamePlaceholder")}
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								className="pl-10"
								autoComplete="username"
								autoFocus
							/>
						</div>
						<p className="text-xs text-muted-foreground">
							{t("auth.register.usernameHint")}
						</p>
					</div>
					<div className="space-y-2">
						<Label htmlFor="displayName">
							{t("auth.register.displayName")}{" "}
							<span className="text-muted-foreground font-normal">
								{t("auth.register.displayNameOptional")}
							</span>
						</Label>
						<Input
							id="displayName"
							type="text"
							placeholder={t("auth.register.displayNamePlaceholder")}
							value={displayName}
							onChange={(e) => setDisplayName(e.target.value)}
							autoComplete="name"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">{t("auth.register.password")}</Label>
						<div className="relative">
							<Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								id="password"
								type="password"
								placeholder={t("auth.register.passwordPlaceholder")}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="pl-10"
								autoComplete="new-password"
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="confirmPassword">
							{t("auth.register.confirmPassword")}
						</Label>
						<div className="relative">
							<Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								id="confirmPassword"
								type="password"
								placeholder={t("auth.register.confirmPasswordPlaceholder")}
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								className="pl-10"
								autoComplete="new-password"
							/>
						</div>
					</div>
				</CardContent>
				<CardFooter className="flex flex-col gap-4">
					<Button
						type="submit"
						className="w-full"
						disabled={loading}
					>
						{loading ? t("auth.register.loading") : t("auth.register.submit")}
					</Button>
					<p className="text-sm text-muted-foreground text-center">
						{t("auth.register.hasAccount")}{" "}
						<Link
							to="/login"
							className="text-primary underline-offset-4 hover:underline"
						>
							{t("auth.register.signIn")}
						</Link>
					</p>
				</CardFooter>
			</form>
		</Card>
	);
}
