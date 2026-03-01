import { LogOut, Settings, User } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useUserInfoStore } from "~/stores/user-info-store";

interface UserProfileProps {
	showName?: boolean;
}

export function UserProfile({ showName = false }: UserProfileProps) {
	const { userInfo, logout } = useUserInfoStore();
	const navigate = useNavigate();

	if (!userInfo) {
		return (
			<Button variant="ghost" size="sm" asChild>
				<Link to="/login">
					<User className="mr-2 h-4 w-4" />
					Login
				</Link>
			</Button>
		);
	}

	const initials = getInitials(userInfo.displayName || userInfo.username);
	const roleLabel = userInfo.role === "admin" ? "Admin" : "User";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="gap-2 rounded-full px-2"
				>
					<Avatar className="h-7 w-7">
						<AvatarFallback className="text-xs">
							{initials}
						</AvatarFallback>
					</Avatar>
					{showName && (
						<span className="hidden sm:inline text-sm">
							{userInfo.displayName || userInfo.username}
						</span>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col space-y-1">
						<p className="text-sm font-medium leading-none">
							{userInfo.displayName || userInfo.username}
						</p>
						<p className="text-xs leading-none text-muted-foreground">
							@{userInfo.username} &middot; {roleLabel}
						</p>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem onClick={() => navigate("/settings")}>
						<Settings className="mr-2 h-4 w-4" />
						Settings
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					variant="destructive"
					onClick={() => logout()}
				>
					<LogOut className="mr-2 h-4 w-4" />
					Log out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/);
	if (parts.length >= 2) {
		return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
	}
	return name.slice(0, 2).toUpperCase();
}
