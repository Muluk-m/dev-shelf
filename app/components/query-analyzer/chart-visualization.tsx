import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";

interface ChartVisualizationProps {
	data: any[];
	chartType: "line" | "bar" | "pie" | "area";
	title?: string;
	description?: string;
}

const COLORS = [
	"#3b82f6",
	"#8b5cf6",
	"#ec4899",
	"#f59e0b",
	"#10b981",
	"#06b6d4",
	"#6366f1",
	"#f43f5e",
];

export function ChartVisualization({
	data,
	chartType,
	title,
	description,
}: ChartVisualizationProps) {
	if (!data || data.length === 0) {
		return (
			<Card>
				<CardContent className="py-8 text-center text-muted-foreground">
					暂无数据可视化
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			{(title || description) && (
				<CardHeader>
					{title && <CardTitle>{title}</CardTitle>}
					{description && <CardDescription>{description}</CardDescription>}
				</CardHeader>
			)}
			<CardContent>
				<ResponsiveContainer width="100%" height={400}>
					{renderChart(chartType, data) || <div>暂无图表</div>}
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}

function renderChart(chartType: "line" | "bar" | "pie" | "area", data: any[]) {
	const dataKeys = Object.keys(data[0] || {});
	const xKey = dataKeys[0];
	const yKeys = dataKeys
		.slice(1)
		.filter((key) => typeof data[0][key] === "number");

	switch (chartType) {
		case "line":
			return (
				<LineChart data={data}>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis dataKey={xKey} />
					<YAxis />
					<Tooltip />
					<Legend />
					{yKeys.map((key, index) => (
						<Line
							key={key}
							type="monotone"
							dataKey={key}
							stroke={COLORS[index % COLORS.length]}
							strokeWidth={2}
						/>
					))}
				</LineChart>
			);

		case "bar":
			return (
				<BarChart data={data}>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis dataKey={xKey} />
					<YAxis />
					<Tooltip />
					<Legend />
					{yKeys.map((key, index) => (
						<Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} />
					))}
				</BarChart>
			);

		case "pie": {
			// For pie chart, use first numeric column
			const valueKey = yKeys[0];
			return (
				<PieChart>
					<Pie
						data={data}
						dataKey={valueKey}
						nameKey={xKey}
						cx="50%"
						cy="50%"
						outerRadius={120}
						label
					>
						{data.map((entry, index) => (
							<Cell
								key={`cell-${index}`}
								fill={COLORS[index % COLORS.length]}
							/>
						))}
					</Pie>
					<Tooltip />
					<Legend />
				</PieChart>
			);
		}

		case "area":
			return (
				<AreaChart data={data}>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis dataKey={xKey} />
					<YAxis />
					<Tooltip />
					<Legend />
					{yKeys.map((key, index) => (
						<Area
							key={key}
							type="monotone"
							dataKey={key}
							stroke={COLORS[index % COLORS.length]}
							fill={COLORS[index % COLORS.length]}
							fillOpacity={0.6}
						/>
					))}
				</AreaChart>
			);

		default:
			return null;
	}
}
