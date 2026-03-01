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

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError(null);

		// Client-side validation
		if (!username.trim()) {
			setError("Username is required");
			return;
		}
		if (username.length < 3 || username.length > 50) {
			setError("Username must be between 3 and 50 characters");
			return;
		}
		if (!/^[a-zA-Z0-9_]+$/.test(username)) {
			setError(
				"Username can only contain letters, numbers, and underscores",
			);
			return;
		}
		if (password.length < 8) {
			setError("Password must be at least 8 characters");
			return;
		}
		if (password !== confirmPassword) {
			setError("Passwords do not match");
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
			toast.success("Account created successfully");
			navigate("/");
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Registration failed";
			setError(message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="w-full max-w-md">
			<CardHeader className="text-center">
				<CardTitle className="text-2xl">Create an account</CardTitle>
				<CardDescription>
					Enter your details to get started
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
						<Label htmlFor="username">Username</Label>
						<div className="relative">
							<User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								id="username"
								type="text"
								placeholder="Choose a username"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								className="pl-10"
								autoComplete="username"
								autoFocus
							/>
						</div>
						<p className="text-xs text-muted-foreground">
							3-50 characters, letters, numbers, and underscores
							only
						</p>
					</div>
					<div className="space-y-2">
						<Label htmlFor="displayName">
							Display Name{" "}
							<span className="text-muted-foreground font-normal">
								(optional)
							</span>
						</Label>
						<Input
							id="displayName"
							type="text"
							placeholder="How you want to be called"
							value={displayName}
							onChange={(e) => setDisplayName(e.target.value)}
							autoComplete="name"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<div className="relative">
							<Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								id="password"
								type="password"
								placeholder="At least 8 characters"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="pl-10"
								autoComplete="new-password"
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="confirmPassword">
							Confirm Password
						</Label>
						<div className="relative">
							<Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								id="confirmPassword"
								type="password"
								placeholder="Repeat your password"
								value={confirmPassword}
								onChange={(e) =>
									setConfirmPassword(e.target.value)
								}
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
						{loading ? "Creating account..." : "Create account"}
					</Button>
					<p className="text-sm text-muted-foreground text-center">
						Already have an account?{" "}
						<Link
							to="/login"
							className="text-primary underline-offset-4 hover:underline"
						>
							Sign in
						</Link>
					</p>
				</CardFooter>
			</form>
		</Card>
	);
}
