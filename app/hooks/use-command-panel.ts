"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { recordToolUsage } from "~/lib/api";
import type { Tool } from "~/types/tool";

export interface CommandAction {
	id: string;
	title: string;
	description?: string;
	icon?: string;
	iconUrl?: string;
	shortcut?: string[];
	category: "navigation" | "tools" | "actions" | "settings";
	action: () => void;
}

export function useCommandPanel(tools: Tool[]) {
	const navigate = useNavigate();
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);

	// 基础命令
	const baseCommands: CommandAction[] = useMemo(() => [], [navigate]);

	// 工具命令
	const toolCommands: CommandAction[] = useMemo(
		() =>
			tools.map((tool) => ({
				id: `tool-${tool.id}`,
				title: `打开 ${tool.name}`,
				description: tool.description,
				iconUrl: tool.icon,
				category: "tools" as const,
				action: () => {
					void recordToolUsage(tool.id);
					setIsOpen(false);
					const environment = tool.environments?.[0];
					if (environment) {
						if (environment.isExternal) {
							window.open(environment.url, "_blank");
						} else {
							window.location.href = environment.url;
						}
					} else {
						// 如果没有环境配置，跳转到工具详情页
						navigate(`/tools/${tool.id}`);
					}
				},
			})),
		[tools, navigate],
	);

	// 工具详情命令
	const toolDetailCommands: CommandAction[] = useMemo(
		() =>
			tools.map((tool) => ({
				id: `detail-${tool.id}`,
				title: `查看 ${tool.name} 详情`,
				description: `查看 ${tool.name} 的详细信息`,
				icon: "Info",
				iconUrl: tool.icon,
				category: "navigation" as const,
				action: () => {
					setIsOpen(false);
					window.open(`/tools/${tool.id}`, "_blank");
				},
			})),
		[tools],
	);

	// 所有命令
	const allCommands = useMemo(
		() => [...baseCommands, ...toolCommands, ...toolDetailCommands],
		[baseCommands, toolCommands, toolDetailCommands],
	);

	// 过滤命令
	const filteredCommands = useMemo(() => {
		if (!query.trim()) {
			return allCommands.slice(0, 10); // 默认显示前10个
		}

		const searchTerm = query.toLowerCase().trim();
		return allCommands
			.filter(
				(command) =>
					command.title.toLowerCase().includes(searchTerm) ||
					command.description?.toLowerCase().includes(searchTerm),
			)
			.slice(0, 20); // 搜索结果最多显示20个
	}, [allCommands, query]);

	// 按分类分组
	const groupedCommands = useMemo(() => {
		const groups: Record<string, CommandAction[]> = {};
		filteredCommands.forEach((command) => {
			if (!groups[command.category]) {
				groups[command.category] = [];
			}
			groups[command.category].push(command);
		});
		return groups;
	}, [filteredCommands]);

	// 键盘事件处理
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// 打开/关闭命令面板
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				setIsOpen((prev) => !prev);
				return;
			}

			// ESC 关闭面板
			if (e.key === "Escape" && isOpen) {
				setIsOpen(false);
				setQuery("");
				setSelectedIndex(0);
				return;
			}

			if (!isOpen) return;

			// 导航键
			switch (e.key) {
				case "ArrowDown":
					e.preventDefault();
					setSelectedIndex((prev) =>
						prev < filteredCommands.length - 1 ? prev + 1 : prev,
					);
					break;
				case "ArrowUp":
					e.preventDefault();
					setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
					break;
				case "Enter":
					e.preventDefault();
					if (filteredCommands[selectedIndex]) {
						filteredCommands[selectedIndex].action();
					}
					break;
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, filteredCommands, selectedIndex]);

	// 重置选中索引当过滤结果改变时
	useEffect(() => {
		setSelectedIndex(0);
	}, [filteredCommands]);

	const openPanel = useCallback(() => {
		setIsOpen(true);
	}, []);

	const closePanel = useCallback(() => {
		setIsOpen(false);
		setQuery("");
		setSelectedIndex(0);
	}, []);

	const executeCommand = useCallback((command: CommandAction) => {
		command.action();
	}, []);

	return {
		isOpen,
		query,
		setQuery,
		selectedIndex,
		setSelectedIndex,
		filteredCommands,
		groupedCommands,
		openPanel,
		closePanel,
		executeCommand,
	};
}
