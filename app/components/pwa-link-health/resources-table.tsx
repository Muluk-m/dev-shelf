import { Eye, FileText } from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { formatBytes, formatTime } from "~/lib/format-utils";
import { RESOURCE_TYPE_COLORS } from "~/lib/pwa-link-health";
import type { ResourceInfo, ResourceType } from "~/types/website-check";

interface ResourcesTableProps {
	resources: ResourceInfo[];
}

export function ResourcesTable({ resources }: ResourcesTableProps) {
	const [sortBy, setSortBy] = useState<keyof ResourceInfo>("startTime");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const [filterType, setFilterType] = useState<ResourceType | "all">("all");
	const [expandedRow, setExpandedRow] = useState<number | null>(null);

	const handleSort = (field: keyof ResourceInfo) => {
		if (sortBy === field) {
			setSortOrder(sortOrder === "asc" ? "desc" : "asc");
		} else {
			setSortBy(field);
			setSortOrder("asc");
		}
	};

	const getSortedAndFilteredResources = () => {
		let filtered = resources;
		if (filterType !== "all") {
			filtered = filtered.filter((r) => r.type === filterType);
		}

		return [...filtered].sort((a, b) => {
			const aVal = a[sortBy];
			const bVal = b[sortBy];

			if (aVal === null || aVal === undefined) return 1;
			if (bVal === null || bVal === undefined) return -1;

			if (typeof aVal === "string" && typeof bVal === "string") {
				return sortOrder === "asc"
					? aVal.localeCompare(bVal)
					: bVal.localeCompare(aVal);
			}

			return sortOrder === "asc"
				? (aVal as number) - (bVal as number)
				: (bVal as number) - (aVal as number);
		});
	};

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-sm flex items-center justify-between">
					<span>Resources</span>
					<div className="flex gap-2">
						<select
							className="text-sm border rounded px-2 py-1"
							value={filterType}
							onChange={(e) =>
								setFilterType(e.target.value as ResourceType | "all")
							}
						>
							<option value="all">All Types</option>
							{Object.keys(RESOURCE_TYPE_COLORS).map((type) => (
								<option key={type} value={type}>
									{type}
								</option>
							))}
						</select>
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b">
								<SortableHeader
									field="type"
									label="Type"
									sortBy={sortBy}
									sortOrder={sortOrder}
									onSort={handleSort}
								/>
								<th className="text-left p-2">URL</th>
								<SortableHeader
									field="method"
									label="Method"
									sortBy={sortBy}
									sortOrder={sortOrder}
									onSort={handleSort}
								/>
								<SortableHeader
									field="status"
									label="Status"
									sortBy={sortBy}
									sortOrder={sortOrder}
									onSort={handleSort}
								/>
								<SortableHeader
									field="size"
									label="Size"
									sortBy={sortBy}
									sortOrder={sortOrder}
									onSort={handleSort}
								/>
								<SortableHeader
									field="time"
									label="Time"
									sortBy={sortBy}
									sortOrder={sortOrder}
									onSort={handleSort}
								/>
								<th className="text-left p-2">Response</th>
							</tr>
						</thead>
						<tbody>
							{getSortedAndFilteredResources().map((resource, index) => (
								<ResourceRow
									key={index}
									resource={resource}
									index={index}
									expanded={expandedRow === index}
									onToggleExpand={() =>
										setExpandedRow(expandedRow === index ? null : index)
									}
								/>
							))}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	);
}

function SortableHeader({
	field,
	label,
	sortBy,
	sortOrder,
	onSort,
}: {
	field: keyof ResourceInfo;
	label: string;
	sortBy: keyof ResourceInfo;
	sortOrder: "asc" | "desc";
	onSort: (field: keyof ResourceInfo) => void;
}) {
	return (
		<th
			className="text-left p-2 cursor-pointer hover:bg-muted"
			onClick={() => onSort(field)}
		>
			{label} {sortBy === field && (sortOrder === "asc" ? "↑" : "↓")}
		</th>
	);
}

function ResourceRow({
	resource,
	expanded,
	onToggleExpand,
}: {
	resource: ResourceInfo;
	expanded: boolean;
	onToggleExpand: () => void;
}) {
	return (
		<>
			<tr className="border-b hover:bg-muted/50">
				<td className="p-2">
					<Badge
						style={{
							backgroundColor:
								RESOURCE_TYPE_COLORS[
									resource.type as keyof typeof RESOURCE_TYPE_COLORS
								],
						}}
					>
						{resource.type}
					</Badge>
				</td>
				<td className="p-2 max-w-md truncate" title={resource.url}>
					{resource.url}
				</td>
				<td className="p-2">{resource.method}</td>
				<td className="p-2">
					<Badge
						variant={
							resource.status && resource.status >= 200 && resource.status < 300
								? "default"
								: "destructive"
						}
					>
						{resource.status || "N/A"}
					</Badge>
				</td>
				<td className="p-2">{formatBytes(resource.size)}</td>
				<td className="p-2">{formatTime(resource.time)}</td>
				<td className="p-2">
					{resource.response ? (
						<Button variant="ghost" size="sm" onClick={onToggleExpand}>
							<Eye className="w-4 h-4" />
						</Button>
					) : (
						<span className="text-muted-foreground">-</span>
					)}
				</td>
			</tr>
			{expanded && resource.response && (
				<ResourceDetailRow response={resource.response as any} />
			)}
		</>
	);
}

function ResourceDetailRow({ response }: { response: any }) {
	return (
		<tr className="bg-muted/30">
			<td colSpan={7} className="p-4">
				<div className="space-y-3">
					<div className="font-semibold text-sm flex items-center gap-2">
						<FileText className="w-4 h-4" />
						Response Details
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						{/* Headers */}
						{response.headers && Object.keys(response.headers).length > 0 && (
							<div className="space-y-2">
								<div className="flex items-center gap-1.5">
									<Badge variant="outline" className="text-xs">
										Headers
									</Badge>
									<span className="text-xs text-muted-foreground">
										({Object.keys(response.headers).length})
									</span>
								</div>
								<div className="bg-background p-3 rounded-md border space-y-1.5">
									{Object.entries(response.headers)
										.slice(0, 5)
										.map(([key, value]) => (
											<div key={key} className="text-xs">
												<span className="font-mono text-blue-600 dark:text-blue-400">
													{key}:
												</span>{" "}
												<span className="font-mono text-muted-foreground break-all">
													{String(value)}
												</span>
											</div>
										))}
									{Object.keys(response.headers).length > 5 && (
										<div className="text-xs text-muted-foreground italic">
											... and {Object.keys(response.headers).length - 5} more
										</div>
									)}
								</div>
							</div>
						)}

						{/* Body */}
						{response.body && (
							<div className="space-y-2">
								<div className="flex items-center gap-1.5">
									<Badge variant="outline" className="text-xs">
										Body
									</Badge>
									<span className="text-xs text-muted-foreground">
										(
										{typeof response.body === "string"
											? `${response.body.length} chars`
											: "JSON object"}
										)
									</span>
								</div>
								<div className="bg-background p-3 rounded-md border max-h-48 overflow-y-auto">
									<pre className="text-xs font-mono whitespace-pre-wrap break-all">
										{typeof response.body === "string"
											? response.body.slice(0, 500) +
												(response.body.length > 500 ? "..." : "")
											: JSON.stringify(response.body, null, 2)}
									</pre>
								</div>
							</div>
						)}

						{/* Status & Type Info */}
						<div className="space-y-2">
							<div className="flex items-center gap-1.5">
								<Badge variant="outline" className="text-xs">
									Info
								</Badge>
							</div>
							<div className="bg-background p-3 rounded-md border space-y-2">
								{response.status && (
									<InfoRow label="Status">
										<Badge
											variant={
												response.status >= 200 && response.status < 300
													? "default"
													: "destructive"
											}
										>
											{response.status}
										</Badge>
									</InfoRow>
								)}
								{response.statusText && (
									<InfoRow label="Status Text">
										<span className="font-mono">{response.statusText}</span>
									</InfoRow>
								)}
								{response.mimeType && (
									<InfoRow label="MIME Type">
										<Badge variant="secondary" className="text-xs">
											{response.mimeType}
										</Badge>
									</InfoRow>
								)}
								{response.contentLength !== undefined && (
									<InfoRow label="Content Length">
										<span className="font-mono">
											{formatBytes(response.contentLength)}
										</span>
									</InfoRow>
								)}
							</div>
						</div>

						{/* Full JSON (collapsible) */}
						<div className="md:col-span-2 space-y-2">
							<details className="group">
								<summary className="cursor-pointer flex items-center gap-1.5">
									<Badge variant="outline" className="text-xs">
										Full Response JSON
									</Badge>
									<span className="text-xs text-muted-foreground group-open:rotate-90 transition-transform">
										▶
									</span>
								</summary>
								<div className="mt-2">
									<pre className="bg-background p-3 rounded-md text-xs overflow-x-auto max-h-96 border font-mono">
										{JSON.stringify(response, null, 2)}
									</pre>
								</div>
							</details>
						</div>
					</div>
				</div>
			</td>
		</tr>
	);
}

function InfoRow({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex items-center justify-between text-xs">
			<span className="text-muted-foreground">{label}:</span>
			{children}
		</div>
	);
}
