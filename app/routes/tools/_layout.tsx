"use client";

import { ArrowLeft } from "lucide-react";
import { Link, Outlet } from "react-router";
import { Button } from "~/components/ui/button";

export default function ToolsLayout() {
	return (
		<div className="min-h-screen bg-background">
			<div className="border-b">
				<div className="container mx-auto px-4 py-4">
					<Link to="/">
						<Button variant="ghost" className="gap-2">
							<ArrowLeft className="h-4 w-4" />
							返回首页
						</Button>
					</Link>
				</div>
			</div>

			<main className="container mx-auto px-4 py-8">
				<Outlet />
			</main>
		</div>
	);
}
