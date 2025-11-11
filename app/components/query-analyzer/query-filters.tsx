import { Calendar, FilterX, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import { EVENT_CODES } from "~/lib/query-templates";

interface QueryFilters {
	eventCodes: number[];
	dateRange: {
		type: "custom" | "today" | "yesterday" | "last7days" | "last30days";
		startDate?: Date;
		endDate?: Date;
	};
}

interface QueryFiltersProps {
	value: QueryFilters;
	onChange: (filters: QueryFilters) => void;
}

// Group event codes by category
const EVENT_CODE_GROUPS = {
	"RB 埋点": Object.entries(EVENT_CODES)
		.filter(
			([code]) =>
				(Number(code) >= 11000 && Number(code) < 12000) ||
				(Number(code) >= 21000 && Number(code) < 22000),
		)
		.map(([code, name]) => ({ code: Number(code), name })),
};

export function QueryFiltersComponent({ value, onChange }: QueryFiltersProps) {
	const [searchText, setSearchText] = useState("");

	// Date range shortcuts
	const dateShortcuts = [
		{ label: "今天", value: "today" as const },
		{ label: "昨天", value: "yesterday" as const },
		{ label: "最近7天", value: "last7days" as const },
		{ label: "最近30天", value: "last30days" as const },
	];

	const handleDateRangeChange = (type: QueryFilters["dateRange"]["type"]) => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		let startDate: Date | undefined;
		let endDate: Date | undefined;

		switch (type) {
			case "today":
				startDate = new Date(today);
				endDate = new Date(today);
				endDate.setHours(23, 59, 59, 999);
				break;
			case "yesterday":
				startDate = new Date(today);
				startDate.setDate(startDate.getDate() - 1);
				endDate = new Date(startDate);
				endDate.setHours(23, 59, 59, 999);
				break;
			case "last7days":
				startDate = new Date(today);
				startDate.setDate(startDate.getDate() - 6);
				endDate = new Date(today);
				endDate.setHours(23, 59, 59, 999);
				break;
			case "last30days":
				startDate = new Date(today);
				startDate.setDate(startDate.getDate() - 29);
				endDate = new Date(today);
				endDate.setHours(23, 59, 59, 999);
				break;
		}

		onChange({
			...value,
			dateRange: { type, startDate, endDate },
		});
	};

	const toggleEventCode = (code: number) => {
		const newEventCodes = value.eventCodes.includes(code)
			? value.eventCodes.filter((c) => c !== code)
			: [...value.eventCodes, code];

		onChange({
			...value,
			eventCodes: newEventCodes,
		});
	};

	const selectAllInGroup = (groupName: string) => {
		const group =
			EVENT_CODE_GROUPS[groupName as keyof typeof EVENT_CODE_GROUPS];
		const groupCodes = group.map((item) => item.code);
		const allSelected = groupCodes.every((code) =>
			value.eventCodes.includes(code),
		);

		let newEventCodes: number[];
		if (allSelected) {
			// Deselect all in group
			newEventCodes = value.eventCodes.filter((c) => !groupCodes.includes(c));
		} else {
			// Select all in group
			newEventCodes = Array.from(new Set([...value.eventCodes, ...groupCodes]));
		}

		onChange({
			...value,
			eventCodes: newEventCodes,
		});
	};

	const clearAllFilters = () => {
		onChange({
			eventCodes: [],
			dateRange: { type: "last7days" },
		});
	};

	const hasActiveFilters =
		value.eventCodes.length > 0 || value.dateRange.type !== "last7days";

	// Filter event codes by search text
	const getFilteredEventCodes = () => {
		if (!searchText) return EVENT_CODE_GROUPS;

		const filtered: typeof EVENT_CODE_GROUPS = {
			"RB 埋点": [],
		};

		const searchLower = searchText.toLowerCase();

		for (const [groupName, items] of Object.entries(EVENT_CODE_GROUPS)) {
			filtered[groupName as keyof typeof EVENT_CODE_GROUPS] = items.filter(
				(item) =>
					item.code.toString().includes(searchLower) ||
					item.name.toLowerCase().includes(searchLower),
			);
		}

		return filtered;
	};

	const filteredGroups = getFilteredEventCodes();

	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="text-base">快捷筛选</CardTitle>
						<CardDescription className="text-xs mt-1">
							设置常用筛选条件，应用到所有查询
						</CardDescription>
					</div>
					{hasActiveFilters && (
						<Button
							variant="ghost"
							size="sm"
							onClick={clearAllFilters}
							className="h-7 text-xs"
						>
							<FilterX className="w-3 h-3 mr-1" />
							清空筛选
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Date Range Quick Selection */}
				<div className="space-y-2">
					<Label className="text-sm flex items-center gap-2">
						<Calendar className="w-4 h-4" />
						日期范围
					</Label>
					<div className="flex flex-wrap gap-2">
						{dateShortcuts.map((shortcut) => (
							<Button
								key={shortcut.value}
								variant={
									value.dateRange.type === shortcut.value
										? "default"
										: "outline"
								}
								size="sm"
								onClick={() => handleDateRangeChange(shortcut.value)}
								className="h-7 text-xs"
							>
								{shortcut.label}
							</Button>
						))}
					</div>
					{value.dateRange.startDate && value.dateRange.endDate && (
						<p className="text-xs text-muted-foreground">
							{value.dateRange.startDate.toLocaleDateString("zh-CN")} -{" "}
							{value.dateRange.endDate.toLocaleDateString("zh-CN")}
						</p>
					)}
				</div>

				<Separator />

				{/* Event Code Selection */}
				<div className="space-y-2">
					<Label className="text-sm">事件代码 (Event Code)</Label>
					{value.eventCodes.length > 0 && (
						<div className="flex flex-wrap gap-1 mb-2">
							{value.eventCodes.map((code) => (
								<Badge
									key={code}
									variant="secondary"
									className="text-xs cursor-pointer hover:bg-secondary/80"
									onClick={() => toggleEventCode(code)}
								>
									{code} - {EVENT_CODES[code as keyof typeof EVENT_CODES]}
									<X className="w-3 h-3 ml-1" />
								</Badge>
							))}
						</div>
					)}

					<Popover>
						<PopoverTrigger asChild>
							<Button variant="outline" size="sm" className="w-full">
								{value.eventCodes.length === 0
									? "选择事件代码"
									: `已选择 ${value.eventCodes.length} 个事件`}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-96 p-0" align="start">
							<div className="p-3 border-b">
								<input
									type="text"
									placeholder="搜索事件代码或名称..."
									value={searchText}
									onChange={(e) => setSearchText(e.target.value)}
									className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
								/>
							</div>

							<ScrollArea className="h-96">
								<div className="p-3 space-y-4">
									{Object.entries(filteredGroups).map(([groupName, items]) => {
										if (items.length === 0) return null;

										const groupCodes = items.map((item) => item.code);
										const allSelected = groupCodes.every((code) =>
											value.eventCodes.includes(code),
										);
										const someSelected = groupCodes.some((code) =>
											value.eventCodes.includes(code),
										);

										return (
											<div key={groupName} className="space-y-2">
												<div className="flex items-center justify-between">
													<h4 className="font-semibold text-sm">{groupName}</h4>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => selectAllInGroup(groupName)}
														className="h-6 text-xs"
													>
														{allSelected
															? "取消全选"
															: someSelected
																? "全选"
																: "全选"}
													</Button>
												</div>
												<div className="space-y-1">
													{items.map((item) => (
														<label
															key={item.code}
															className="flex items-start gap-2 p-2 rounded hover:bg-muted cursor-pointer text-sm"
														>
															<input
																type="checkbox"
																checked={value.eventCodes.includes(item.code)}
																onChange={() => toggleEventCode(item.code)}
																className="mt-0.5 cursor-pointer"
															/>
															<div className="flex-1 min-w-0">
																<div className="flex items-center gap-2">
																	<code className="text-xs bg-muted px-1.5 py-0.5 rounded">
																		{item.code}
																	</code>
																</div>
																<p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
																	{item.name}
																</p>
															</div>
														</label>
													))}
												</div>
											</div>
										);
									})}

									{Object.values(filteredGroups).every(
										(items) => items.length === 0,
									) && (
										<p className="text-sm text-muted-foreground text-center py-8">
											没有找到匹配的事件代码
										</p>
									)}
								</div>
							</ScrollArea>
						</PopoverContent>
					</Popover>
				</div>
			</CardContent>
		</Card>
	);
}
