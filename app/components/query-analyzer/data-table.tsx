import { Badge } from "~/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";

interface DataTableProps {
	data: any[];
	columns?: string[];
	title?: string;
	description?: string;
}

export function DataTable({
	data,
	columns,
	title,
	description,
}: DataTableProps) {
	if (!data || data.length === 0) {
		return (
			<Card>
				<CardContent className="py-8 text-center text-muted-foreground">
					暂无数据
				</CardContent>
			</Card>
		);
	}

	// Auto-detect columns from first row if not provided
	const tableColumns = columns || (data[0] ? Object.keys(data[0]) : []);

	return (
		<Card>
			{(title || description) && (
				<CardHeader>
					{title && <CardTitle>{title}</CardTitle>}
					{description && <CardDescription>{description}</CardDescription>}
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Badge variant="outline">{data.length} 行</Badge>
						<Badge variant="outline">{tableColumns.length} 列</Badge>
					</div>
				</CardHeader>
			)}
			<CardContent>
				<div className="rounded-md border">
					<div className="max-h-[600px] overflow-auto">
						<Table>
							<TableHeader>
								<TableRow>
									{tableColumns.map((column) => (
										<TableHead key={column} className="whitespace-nowrap">
											{column}
										</TableHead>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.map((row, rowIndex) => (
									<TableRow key={rowIndex}>
										{tableColumns.map((column) => (
											<TableCell key={column} className="whitespace-nowrap">
												{formatCellValue(row[column])}
											</TableCell>
										))}
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function formatCellValue(value: any): string {
	if (value === null || value === undefined) {
		return "-";
	}

	if (typeof value === "object") {
		return JSON.stringify(value);
	}

	if (typeof value === "number") {
		// Format large numbers with commas
		return value.toLocaleString();
	}

	return String(value);
}
