import { Lock, Sparkles, User } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
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
	const { t } = useTranslation();

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
			const raw = searchParams.get("redirectTo") || "/";
			// Only allow relative paths to prevent open redirect
			const redirectTo =
				raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
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
				<CardDescription>{t("auth.login.subtitle")}</CardDescription>
			</CardHeader>
			<form onSubmit={handleSubmit}>
				<CardContent className="space-y-4">
					{/* Demo account hint */}
					<button
						type="button"
						onClick={() => {
							setUsername("admin@test.com");
							setPassword("admin123456");
						}}
						className="w-full flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20 hover:from-amber-500/15 hover:to-orange-500/10 transition-all cursor-pointer group"
					>
						<Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0" />
						<div className="flex-1 text-left text-xs">
							<div className="font-medium text-foreground">{t("auth.login.demoHint")}</div>
							<div className="text-muted-foreground mt-0.5">
								admin@test.com / admin123456
							</div>
						</div>
						<span className="text-[10px] text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
							{t("auth.login.demoFill")}
						</span>
					</button>
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
				<CardFooter className="flex flex-col gap-4 pt-2">
					<Button type="submit" className="w-full" disabled={loading}>
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
