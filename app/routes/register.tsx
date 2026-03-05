import { useEffect } from "react";
import { useNavigate } from "react-router";
import { RegisterForm } from "~/components/auth/register-form";
import { LanguageToggle } from "~/components/language-toggle";
import { useDocumentTitle } from "~/hooks/use-document-title";
import { useUserInfoStore } from "~/stores/user-info-store";

export function meta() {
	return [{ title: "Register | DevShelf" }];
}

export default function RegisterPage() {
	const userInfo = useUserInfoStore((s) => s.userInfo);
	const navigate = useNavigate();
	useDocumentTitle("meta.register");

	useEffect(() => {
		if (userInfo) {
			navigate("/", { replace: true });
		}
	}, [userInfo, navigate]);

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4">
			<div className="absolute top-4 right-4">
				<LanguageToggle />
			</div>
			<RegisterForm />
		</div>
	);
}
