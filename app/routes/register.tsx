import { useEffect } from "react";
import { useNavigate } from "react-router";
import { RegisterForm } from "~/components/auth/register-form";
import { useUserInfoStore } from "~/stores/user-info-store";

export function meta() {
	return [{ title: "Register - DevTools" }];
}

export default function RegisterPage() {
	const userInfo = useUserInfoStore((s) => s.userInfo);
	const navigate = useNavigate();

	useEffect(() => {
		if (userInfo) {
			navigate("/", { replace: true });
		}
	}, [userInfo, navigate]);

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4">
			<RegisterForm />
		</div>
	);
}
