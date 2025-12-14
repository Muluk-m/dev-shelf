import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "~/components/theme-provider";

import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="h-9 w-9 rounded-lg hover:bg-accent"
				>
					<Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-200 dark:-rotate-90 dark:scale-0" />
					<Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-200 dark:rotate-0 dark:scale-100" />
					<span className="sr-only">切换主题</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-36 rounded-xl">
				<DropdownMenuItem
					onClick={() => setTheme("light")}
					className={cn(
						"gap-2 rounded-lg cursor-pointer",
						theme === "light" && "bg-accent",
					)}
				>
					<Sun className="h-4 w-4" />
					浅色
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => setTheme("dark")}
					className={cn(
						"gap-2 rounded-lg cursor-pointer",
						theme === "dark" && "bg-accent",
					)}
				>
					<Moon className="h-4 w-4" />
					深色
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => setTheme("system")}
					className={cn(
						"gap-2 rounded-lg cursor-pointer",
						theme === "system" && "bg-accent",
					)}
				>
					<Laptop className="h-4 w-4" />
					系统
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
