import { Lock, User } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
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
import { login } from "~/lib/api";
import { useUserInfoStore } from "~/stores/user-info-store";

export function LoginForm() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const setUserInfo = useUserInfoStore((s) => s.setUserInfo);
	const { t } = useI18n();

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!username.trim()) {
			setError(t("auth.login.usernameRequired"));
			return;
		}
		if (password.length < 8) {
			setError(t("auth.login.passwordMinLength"));
			return;
		}

		setLoading(true);
		try {
			const { user } = await login(username, password);
			setUserInfo(user);
			toast.success(t("auth.login.success"));
			const redirectTo = searchParams.get("redirectTo") || "/";
			navigate(redirectTo);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : t("auth.login.failed");
			setError(message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="w-full max-w-md">
			<CardHeader className="text-center">
				<CardTitle className="text-2xl">{t("auth.login.title")}</CardTitle>
				<CardDescription>
					{t("auth.login.subtitle")}
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
						<Label htmlFor="username">{t("auth.login.username")}</Label>
						<div className="relative">
							<User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								id="username"
								type="text"
								placeholder={t("auth.login.usernamePlaceholder")}
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								className="pl-10"
								autoComplete="username"
								autoFocus
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">{t("auth.login.password")}</Label>
						<div className="relative">
							<Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								id="password"
								type="password"
								placeholder={t("auth.login.passwordPlaceholder")}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="pl-10"
								autoComplete="current-password"
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
						{loading ? t("auth.login.loading") : t("auth.login.submit")}
					</Button>
					<p className="text-sm text-muted-foreground text-center">
						{t("auth.login.noAccount")}{" "}
						<Link
							to="/register"
							className="text-primary underline-offset-4 hover:underline"
						>
							{t("auth.login.register")}
						</Link>
					</p>
				</CardFooter>
			</form>
		</Card>
	);
}
