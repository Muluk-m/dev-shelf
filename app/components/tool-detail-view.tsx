"use client";

import * as LucideIcons from "lucide-react";
import {
	AlertCircle,
	ArrowLeft,
	CheckCircle,
	Clock,
	Code,
	ExternalLink,
	Heart,
	Share2,
	Tag,
	Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { getToolCategories, getTools } from "~/lib/api";
import type { Tool } from "~/types/tool";

// 动态获取图标组件
const getIconComponent = (iconName: string) => {
	const IconComponent = (LucideIcons as any)[iconName];
	return IconComponent || Code;
};

const statusConfig = {
	active: {
		label: "正常运行",
		variant: "default" as const,
		color: "text-green-600",
		icon: CheckCircle,
		description: "工具运行正常，可以正常使用",
	},
	maintenance: {
		label: "维护中",
		variant: "secondary" as const,
		color: "text-yellow-600",
		icon: Wrench,
		description: "工具正在维护中，可能会影响使用",
	},
	deprecated: {
		label: "已废弃",
		variant: "destructive" as const,
		color: "text-red-600",
		icon: AlertCircle,
		description: "工具已废弃，建议使用替代方案",
	},
};

interface ToolDetailViewProps {
	tool: Tool;
}

export function ToolDetailView({ tool }: ToolDetailViewProps) {
	const navigate = useNavigate();
	const [isFavorited, setIsFavorited] = useState(false);
	const [relatedTools, setRelatedTools] = useState<Tool[]>([]);
	const [toolCategories, setToolCategories] = useState<any[]>([]);

	// Load tool categories and related tools
	useEffect(() => {
		const loadData = async () => {
			try {
				const [tools, categories] = await Promise.all([
					getTools(),
					getToolCategories(),
				]);
				setToolCategories(categories);
				const related = tools
					.filter((t: Tool) => t.category === tool.category && t.id !== tool.id)
					.slice(0, 3);
				setRelatedTools(related);
			} catch (error) {
				console.error("Failed to load related data:", error);
			}
		};
		loadData();
	}, [tool.category, tool.id]);

	const IconComponent = getIconComponent(tool.icon);
	const statusInfo = statusConfig[tool.status];
	const StatusIcon = statusInfo.icon;

	const category = toolCategories.find((c) => c.id === tool.category);

	const mockUsageStats = {
		dailyUsers: Math.floor(Math.random() * 500) + 50,
		monthlyUsers: Math.floor(Math.random() * 2000) + 200,
		uptime: "99.9%",
		avgResponseTime: Math.floor(Math.random() * 200) + 50,
	};

	const mockFeatures = [
		"支持多种编程语言",
		"实时协作功能",
		"自动化工作流",
		"详细的使用统计",
		"API 接口支持",
		"权限管理系统",
	];

	const mockTechStack = ["React", "Node.js", "PostgreSQL", "Redis", "Docker"];

	return (
		<main className="container mx-auto px-4 py-8">
			{/* 面包屑导航 */}
			<div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => navigate(-1)}
					className="gap-2 px-2"
				>
					<ArrowLeft className="h-4 w-4" />
					返回
				</Button>
				<span>/</span>
				<span>工具详情</span>
				<span>/</span>
				<span className="text-foreground">{tool.name}</span>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* 主要内容区域 */}
				<div className="lg:col-span-2 space-y-6">
					{/* 工具头部信息 */}
					<Card>
						<CardHeader>
							<div className="flex items-start justify-between">
								<div className="flex items-center gap-4">
									<div className="p-3 rounded-xl bg-primary/10 text-primary">
										<IconComponent className="h-8 w-8" />
									</div>
									<div>
										<CardTitle className="text-2xl">{tool.name}</CardTitle>
										<CardDescription className="text-base mt-2">
											{tool.description}
										</CardDescription>
									</div>
								</div>
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => setIsFavorited(!isFavorited)}
										className={isFavorited ? "text-red-500" : ""}
									>
										<Heart
											className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`}
										/>
									</Button>
									<Button variant="outline" size="sm">
										<Share2 className="h-4 w-4" />
									</Button>
								</div>
							</div>

							<div className="flex flex-wrap items-center gap-3 mt-4">
								<Badge variant={statusInfo.variant} className="gap-1">
									<StatusIcon className="h-3 w-3" />
									{statusInfo.label}
								</Badge>
								{tool.isInternal && (
									<Badge variant="outline" className="gap-1">
										<Tag className="h-3 w-3" />
										内部工具
									</Badge>
								)}
								{category && (
									<Badge variant="secondary" className="gap-1">
										{category.name}
									</Badge>
								)}
								<div className="flex items-center gap-1 text-sm text-muted-foreground">
									<Clock className="h-3 w-3" />
									<span>更新于 {tool.lastUpdated}</span>
								</div>
							</div>
						</CardHeader>
					</Card>

					{/* 状态提醒 */}
					{tool.status !== "active" && (
						<Alert>
							<StatusIcon className="h-4 w-4" />
							<AlertDescription>{statusInfo.description}</AlertDescription>
						</Alert>
					)}

					{/* 详细信息标签页 */}
					<Tabs defaultValue="overview" className="w-full">
						<TabsList className="grid w-full grid-cols-4">
							<TabsTrigger value="overview">概览</TabsTrigger>
							<TabsTrigger value="features">功能特性</TabsTrigger>
							<TabsTrigger value="usage">使用说明</TabsTrigger>
							<TabsTrigger value="tech">技术栈</TabsTrigger>
						</TabsList>

						<TabsContent value="overview" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">工具概览</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
										<div className="text-center p-4 rounded-lg bg-muted/50">
											<div className="text-2xl font-bold text-primary">
												{mockUsageStats.dailyUsers}
											</div>
											<div className="text-sm text-muted-foreground">
												日活用户
											</div>
										</div>
										<div className="text-center p-4 rounded-lg bg-muted/50">
											<div className="text-2xl font-bold text-primary">
												{mockUsageStats.monthlyUsers}
											</div>
											<div className="text-sm text-muted-foreground">
												月活用户
											</div>
										</div>
										<div className="text-center p-4 rounded-lg bg-muted/50">
											<div className="text-2xl font-bold text-primary">
												{mockUsageStats.uptime}
											</div>
											<div className="text-sm text-muted-foreground">
												可用性
											</div>
										</div>
										<div className="text-center p-4 rounded-lg bg-muted/50">
											<div className="text-2xl font-bold text-primary">
												{mockUsageStats.avgResponseTime}ms
											</div>
											<div className="text-sm text-muted-foreground">
												响应时间
											</div>
										</div>
									</div>

									<Separator />

									<div>
										<h4 className="font-semibold mb-3">标签</h4>
										<div className="flex flex-wrap gap-2">
											{tool.tags.map((tag) => (
												<Badge key={tag} variant="outline">
													{tag}
												</Badge>
											))}
										</div>
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="features" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">主要功能</CardTitle>
								</CardHeader>
								<CardContent>
									<ul className="space-y-3">
										{mockFeatures.map((feature, index) => (
											<li key={index} className="flex items-center gap-3">
												<CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
												<span>{feature}</span>
											</li>
										))}
									</ul>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="usage" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">使用说明</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div>
										<h4 className="font-semibold mb-2">快速开始</h4>
										<p className="text-muted-foreground">
											点击"打开工具"按钮即可访问该工具。首次使用需要进行身份验证，请使用您的企业账号登录。
										</p>
									</div>
									<Separator />
									<div>
										<h4 className="font-semibold mb-2">常见问题</h4>
										<div className="space-y-2 text-sm">
											<p>
												<strong>Q: 如何获取访问权限？</strong>
											</p>
											<p className="text-muted-foreground ml-4">
												A: 请联系系统管理员申请相应的权限。
											</p>
											<p>
												<strong>Q: 工具无法访问怎么办？</strong>
											</p>
											<p className="text-muted-foreground ml-4">
												A: 请检查网络连接，或联系技术支持。
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="tech" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">技术栈</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="flex flex-wrap gap-2">
										{mockTechStack.map((tech) => (
											<Badge key={tech} variant="secondary">
												{tech}
											</Badge>
										))}
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>

				{/* 侧边栏 */}
				<div className="space-y-6">
					{/* 操作按钮 */}
					<Card>
						<CardContent className="pt-6">
							<div className="space-y-3">
								<Button
									className="w-full gap-2"
									size="lg"
									onClick={() => {
										if (tool.environments && tool.environments.length > 0) {
											const url = tool.environments[0].url;
											// 如果是内部路由，直接导航
											if (
												!tool.environments[0].isExternal &&
												url.startsWith("/")
											) {
												navigate(url);
											} else {
												// 外部链接在新窗口打开
												window.open(url, "_blank");
											}
										}
									}}
									disabled={
										!tool.environments || tool.environments.length === 0
									}
								>
									<ExternalLink className="h-4 w-4" />
									打开工具
								</Button>
								<Button variant="outline" className="w-full bg-transparent">
									查看文档
								</Button>
								<Button variant="outline" className="w-full bg-transparent">
									反馈问题
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* 相关工具 */}
					{relatedTools.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">相关工具</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{relatedTools.map((relatedTool) => {
									const RelatedIcon = getIconComponent(relatedTool.icon);
									return (
										<div
											key={relatedTool.id}
											className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
											onClick={() => navigate(`/tools/${relatedTool.id}`)}
										>
											<div className="p-2 rounded-md bg-primary/10 text-primary">
												<RelatedIcon className="h-4 w-4" />
											</div>
											<div className="flex-1 min-w-0">
												<div className="font-medium text-sm truncate">
													{relatedTool.name}
												</div>
												<div className="text-xs text-muted-foreground truncate">
													{relatedTool.description}
												</div>
											</div>
										</div>
									);
								})}
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</main>
	);
}
