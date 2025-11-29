import { CalendarIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";

export interface DatePickerProps {
	/** Selected date value */
	value?: Date;
	/** Callback when date changes */
	onChange?: (date: Date | undefined) => void;
	/** Placeholder text when no date is selected */
	placeholder?: string;
	/** Disabled state */
	disabled?: boolean;
	/** Custom className for the button */
	className?: string;
	/** Format function to display the date */
	formatDate?: (date: Date | undefined) => string;
}

/**
 * DatePicker component with Calendar dropdown
 *
 * @example
 * ```tsx
 * const [date, setDate] = useState<Date>();
 *
 * <DatePicker
 *   value={date}
 *   onChange={setDate}
 *   placeholder="选择日期"
 * />
 * ```
 */
export function DatePicker({
	value,
	onChange,
	placeholder = "选择日期",
	disabled = false,
	className,
	formatDate = defaultFormatDate,
}: DatePickerProps) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					disabled={disabled}
					className={cn(
						"w-full justify-start text-left font-normal",
						!value && "text-muted-foreground",
						className,
					)}
				>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{value ? formatDate(value) : placeholder}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={value}
					onSelect={onChange}
					initialFocus
					captionLayout="dropdown"
				/>
			</PopoverContent>
		</Popover>
	);
}

/**
 * Default date formatter (YYYY-MM-DD)
 */
function defaultFormatDate(date: Date | undefined): string {
	if (!date) return "";
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

/**
 * Alternative formatter with Chinese format (YYYY年MM月DD日)
 */
export function formatDateChinese(date: Date | undefined): string {
	if (!date) return "";
	const year = date.getFullYear();
	const month = date.getMonth() + 1;
	const day = date.getDate();
	return `${year}年${month}月${day}日`;
}

/**
 * Alternative formatter with locale string
 */
export function formatDateLocale(date: Date | undefined): string {
	if (!date) return "";
	return date.toLocaleDateString("zh-CN", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}
