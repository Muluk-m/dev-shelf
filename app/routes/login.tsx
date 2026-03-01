import { useEffect } from "react";
import { useNavigate } from "react-router";
import { LoginForm } from "~/components/auth/login-form";
import { useUserInfoStore } from "~/stores/user-info-store";

export function meta() {
	return [{ title: "Login - DevTools" }];
}

export default function LoginPage() {
	const userInfo = useUserInfoStore((s) => s.userInfo);
	const navigate = useNavigate();

	useEffect(() => {
		if (userInfo) {
			navigate("/", { replace: true });
		}
	}, [userInfo, navigate]);

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4">
			<LoginForm />
		</div>
	);
}
