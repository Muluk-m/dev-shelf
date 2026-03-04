import { Shield } from "lucide-react";
import { AdminLayout } from "~/components/layout/admin-layout";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import type { Route } from "./+types/admin_.permissions";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "User Management | DevShelf" },
		{ name: "description", content: "User and permission management" },
	];
}

export default function PermissionsPage() {
	return (
		<AdminLayout
			title="User Management"
			description="Manage users, roles, and permissions"
		>
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<Shield className="h-6 w-6 text-muted-foreground" />
						<CardTitle>Coming Soon</CardTitle>
					</div>
					<CardDescription>
						User management will be available after the authentication system is
						rebuilt.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						This page will provide user, role, and permission management once
						local authentication is implemented in Phase 2.
					</p>
				</CardContent>
			</Card>
		</AdminLayout>
	);
}
