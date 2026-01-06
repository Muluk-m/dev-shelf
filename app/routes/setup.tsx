import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
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
import { useSetupStatus } from "~/hooks/use-setup-status";
import { initializeSetup } from "~/lib/api";
import { useUserInfoStore } from "~/stores/user-info-store";

export function meta() {
	return [{ title: "Setup | DevHub" }];
}

export default function SetupPage() {
	const { needsSetup, loading: statusLoading } = useSetupStatus();
	const navigate = useNavigate();

	useEffect(() => {
		if (needsSetup === false) {
			navigate("/", { replace: true });
		}
	}, [needsSetup, navigate]);

	if (statusLoading || needsSetup === null) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<p className="text-muted-foreground">Loading...</p>
			</div>
		);
	}

	if (needsSetup === false) {
		return null;
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4">
			<SetupForm />
		</div>
	);
}

function SetupForm() {
	const navigate = useNavigate();
	const setUserInfo = useUserInfoStore((s) => s.setUserInfo);

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
			setError("Username must be at least 3 characters");
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
			const { user } = await initializeSetup({
				username: username.trim(),
				password,
				displayName: displayName.trim() || undefined,
			});
			setUserInfo(user);
			toast.success("Admin account created successfully");
			navigate("/", { replace: true });
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Setup initialization failed";
			setError(message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="w-full max-w-md">
			<CardHeader className="text-center">
				<CardTitle className="text-2xl">Welcome to DevHub</CardTitle>
				<CardDescription>
					Create your admin account to get started
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
						<Input
							id="username"
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="At least 3 characters"
							autoComplete="username"
							required
							minLength={3}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="displayName">
							Display Name{" "}
							<span className="text-muted-foreground">(optional)</span>
						</Label>
						<Input
							id="displayName"
							type="text"
							value={displayName}
							onChange={(e) => setDisplayName(e.target.value)}
							placeholder="How you want to be called"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="At least 8 characters"
							autoComplete="new-password"
							required
							minLength={8}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="confirmPassword">Confirm Password</Label>
						<Input
							id="confirmPassword"
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							placeholder="Repeat your password"
							autoComplete="new-password"
							required
						/>
					</div>
					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? "Creating account..." : "Create Admin Account"}
					</Button>
				</CardContent>
			</form>
		</Card>
	);
}
