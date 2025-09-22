"use client";

import * as LucideIcons from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import type { ToolCategory } from "~/types/tool";

interface CategoryFormProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (category: Omit<ToolCategory, "id">) => void;
	initialData?: ToolCategory | null;
	title: string;
	loading?: boolean;
}

// 常用图标列表，可以扩展
const popularIcons = [
	"Code",
	"Rocket",
	"TestTube",
	"Users",
	"BarChart3",
	"Wrench",
	"Database",
	"Settings",
	"Zap",
	"Shield",
	"Globe",
	"Cpu",
	"Server",
	"Monitor",
	"Smartphone",
	"Palette",
	"FileText",
	"Image",
	"Music",
	"Video",
	"Mail",
	"Calendar",
	"Clock",
	"Heart",
	"Star",
	"Flag",
	"Tag",
	"Bookmark",
	"Search",
	"Filter",
	"Layout",
	"Grid3X3",
	"Box",
	"Package",
	"Truck",
	"MapPin",
	"Compass",
	"Target",
	"TrendingUp",
	"PieChart",
	"Activity",
	"CloudDownload",
	"HardDrive",
	"Wifi",
	"Link",
	"Lock",
	"Key",
	"Eye",
	"Camera",
	"Headphones",
	"MessageCircle",
	"Phone",
	"Gamepad2",
];

const colorOptions = [
	{ value: "#3c6df0", label: "蓝色", name: "blue" },
	{ value: "#22bfa5", label: "绿色", name: "green" },
	{ value: "#f59f45", label: "橙色", name: "orange" },
	{ value: "#c084fc", label: "紫色", name: "purple" },
	{ value: "#f9739a", label: "粉色", name: "pink" },
	{ value: "#ef4444", label: "红色", name: "red" },
	{ value: "#10b981", label: "翠绿", name: "emerald" },
	{ value: "#f59e0b", label: "黄色", name: "amber" },
	{ value: "#8b5cf6", label: "靛蓝", name: "violet" },
	{ value: "#06b6d4", label: "青色", name: "cyan" },
];

// 动态获取图标组件
const getIconComponent = (iconName: string) => {
	const IconComponent = (LucideIcons as any)[iconName];
	return IconComponent || LucideIcons.Code;
};

export function CategoryForm({
	isOpen,
	onClose,
	onSubmit,
	initialData,
	title,
	loading = false,
}: CategoryFormProps) {
	const initializeFormData = (): Omit<ToolCategory, "id"> => ({
		name: "",
		description: "",
		icon: "Code",
		color: "#3c6df0", // 默认蓝色
	});

	const [formData, setFormData] = useState<Omit<ToolCategory, "id">>(() =>
		initializeFormData(),
	);
	const [iconSearch, setIconSearch] = useState("");

	useEffect(() => {
		if (initialData) {
			setFormData({
				name: initialData.name,
				description: initialData.description,
				icon: initialData.icon,
				color: initialData.color,
			});
		} else {
			setFormData(initializeFormData());
		}
		setIconSearch("");
	}, [initialData, isOpen]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name.trim()) return;

		onSubmit(formData);
	};

	const handleClose = () => {
		setFormData(initializeFormData());
		setIconSearch("");
		onClose();
	};

	// 获取当前选中的图标组件
	const SelectedIconComponent = getIconComponent(formData.icon);

	// 获取当前选中的颜色信息
	const selectedColorOption = colorOptions.find((opt) => opt.value === formData.color);

	// 过滤图标列表
	const filteredIcons = popularIcons.filter((iconName) =>
		iconName.toLowerCase().includes(iconSearch.toLowerCase())
	);

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-6">
					{/* 预览区域 */}
					<div className="flex items-center justify-center p-6 bg-muted/50 rounded-lg">
						<div className="flex items-center gap-3">
							<div
								className="p-3 rounded-lg"
								style={{ backgroundColor: `${formData.color}20` }}
							>
								<SelectedIconComponent
									className="h-8 w-8"
									style={{ color: formData.color }}
								/>
							</div>
							<div>
								<h3 className="font-semibold">
									{formData.name || "分类名称"}
								</h3>
								<p className="text-sm text-muted-foreground">
									{formData.description || "分类描述"}
								</p>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="name">分类名称 *</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, name: e.target.value }))
								}
								placeholder="输入分类名称"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="icon">图标</Label>
							<div className="space-y-2">
								<Input
									placeholder="搜索图标..."
									value={iconSearch}
									onChange={(e) => setIconSearch(e.target.value)}
									className="h-9"
								/>
								<Select
									value={formData.icon}
									onValueChange={(value) =>
										setFormData((prev) => ({ ...prev, icon: value }))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="选择图标">
											<div className="flex items-center gap-2">
												<SelectedIconComponent className="h-4 w-4" />
												{formData.icon}
											</div>
										</SelectValue>
									</SelectTrigger>
									<SelectContent className="max-h-60">
										{filteredIcons.map((iconName) => {
											const IconComponent = getIconComponent(iconName);
											return (
												<SelectItem key={iconName} value={iconName}>
													<div className="flex items-center gap-2">
														<IconComponent className="h-4 w-4" />
														{iconName}
													</div>
												</SelectItem>
											);
										})}
										{filteredIcons.length === 0 && (
											<div className="p-2 text-sm text-muted-foreground text-center">
												未找到匹配的图标
											</div>
										)}
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">描述</Label>
						<Textarea
							id="description"
							value={formData.description}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									description: e.target.value,
								}))
							}
							placeholder="输入分类描述"
							rows={3}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="color">颜色</Label>
						<Select
							value={formData.color}
							onValueChange={(value) =>
								setFormData((prev) => ({ ...prev, color: value }))
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="选择颜色">
									{selectedColorOption && (
										<div className="flex items-center gap-2">
											<div
												className="w-4 h-4 rounded border"
												style={{ backgroundColor: selectedColorOption.value }}
											/>
											{selectedColorOption.label}
										</div>
									)}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								{colorOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										<div className="flex items-center gap-2">
											<div
												className="w-4 h-4 rounded border"
												style={{ backgroundColor: option.value }}
											/>
											{option.label}
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="flex justify-end gap-3">
						<Button type="button" variant="outline" onClick={handleClose}>
							取消
						</Button>
						<Button type="submit" disabled={loading}>
							{loading ? "保存中..." : "保存"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}