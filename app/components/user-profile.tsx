"use client";

import { LogOut, Settings, User } from "lucide-react";
import { useEffect, useState } from "react";
import { getUserInfo } from "~/lib/api";
import type { UserInfo } from "~/types/user-info";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface UserProfileProps {
	showName?: boolean;
}

export function UserProfile({ showName = false }: UserProfileProps) {
	const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchUserInfo = async () => {
			try {
				const response = await getUserInfo();
				setUserInfo(response.data);
			} catch (error) {
				console.error("Failed to fetch user info:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchUserInfo();
	}, []);

	if (loading) {
		return (
			<div className="flex items-center gap-2">
				<div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
			</div>
		);
	}

	if (!userInfo) {
		return (
			<a
				href="/auth/login"
				className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted transition-colors"
			>
				<User className="h-4 w-4" />
				<span className="hidden sm:inline">登录</span>
			</a>
		);
	}

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="flex items-center gap-2 rounded-md p-1 hover:bg-muted transition-colors outline-none">
				<Avatar className="h-8 w-8">
					<AvatarImage src={userInfo.avatar} alt={userInfo.userName} />
					<AvatarFallback>{getInitials(userInfo.userName)}</AvatarFallback>
				</Avatar>
				{showName && (
					<span className="hidden md:inline text-sm font-medium">
						{userInfo.userName}
					</span>
				)}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col space-y-1">
						<p className="text-sm font-medium leading-none">
							{userInfo.userName}
						</p>
						<p className="text-xs leading-none text-muted-foreground">
							{userInfo.platform === "feishu" ? "飞书" : "其他"}
						</p>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem disabled className="cursor-pointer">
					<Settings className="mr-2 h-4 w-4" />
					<span>设置</span>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem disabled className="cursor-pointer text-red-600">
					<LogOut className="mr-2 h-4 w-4" />
					<span>退出登录</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
