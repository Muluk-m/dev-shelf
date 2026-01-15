import { Clock, Search, Sparkles, TrendingUp, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface SearchInputProps {
	value: string;
	onChange: (value: string) => void;
	onSearch: (query: string) => void;
	suggestions?: string[];
	searchHistory?: string[];
	placeholder?: string;
	className?: string;
}

export function SearchInput({
	value,
	onChange,
	onSearch,
	suggestions = [],
	searchHistory = [],
	placeholder = "搜索工具...",
	className,
}: SearchInputProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isFocused, setIsFocused] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const inputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const allSuggestions = [
		...suggestions.map((item) => ({ type: "suggestion" as const, text: item })),
		...searchHistory.map((item) => ({ type: "history" as const, text: item })),
	];

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
				setSelectedIndex(-1);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!isOpen) return;

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setSelectedIndex((prev) =>
					prev < allSuggestions.length - 1 ? prev + 1 : prev,
				);
				break;
			case "ArrowUp":
				e.preventDefault();
				setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
				break;
			case "Enter":
				e.preventDefault();
				if (selectedIndex >= 0 && allSuggestions[selectedIndex]) {
					const selectedItem = allSuggestions[selectedIndex];
					onChange(selectedItem.text);
					onSearch(selectedItem.text);
					setIsOpen(false);
					setSelectedIndex(-1);
				} else if (value.trim()) {
					onSearch(value.trim());
					setIsOpen(false);
					setSelectedIndex(-1);
				}
				break;
			case "Escape":
				setIsOpen(false);
				setSelectedIndex(-1);
				inputRef.current?.blur();
				break;
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		onChange(newValue);
		setIsOpen(true);
		setSelectedIndex(-1);
	};

	const handleSuggestionClick = (suggestion: string) => {
		onChange(suggestion);
		onSearch(suggestion);
		setIsOpen(false);
		setSelectedIndex(-1);
	};

	const handleClear = () => {
		onChange("");
		inputRef.current?.focus();
	};

	const showSuggestions =
		isOpen && (suggestions.length > 0 || searchHistory.length > 0);

	return (
		<div ref={containerRef} className={cn("relative", className)}>
			{/* Search Input Container */}
			<div
				className={cn(
					"relative flex items-center rounded-xl transition-all duration-200",
					"bg-secondary/50 border border-transparent",
					isFocused &&
						"bg-background border-primary/30 shadow-sm ring-2 ring-primary/10",
				)}
			>
				<Search
					className={cn(
						"absolute left-3 h-4 w-4 transition-colors",
						isFocused ? "text-primary" : "text-muted-foreground",
					)}
				/>
				<input
					ref={inputRef}
					value={value}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					onFocus={() => {
						setIsOpen(true);
						setIsFocused(true);
					}}
					onBlur={() => setIsFocused(false)}
					placeholder={placeholder}
					className={cn(
						"w-full bg-transparent py-2 pl-10 pr-10 text-sm",
						"placeholder:text-muted-foreground focus:outline-none",
					)}
				/>
				{value && (
					<Button
						variant="ghost"
						size="sm"
						onClick={handleClear}
						className="absolute right-1 h-7 w-7 p-0 hover:bg-muted rounded-lg"
					>
						<X className="h-4 w-4" />
					</Button>
				)}
			</div>

			{/* Suggestions Dropdown */}
			{showSuggestions && (
				<div
					className={cn(
						"absolute top-full left-0 right-0 z-50 mt-2",
						"bg-popover border border-border rounded-xl shadow-xl shadow-black/10",
						"overflow-hidden animate-scale-in",
					)}
				>
					<div className="p-2 max-h-80 overflow-y-auto">
						{suggestions.length > 0 && (
							<div className="space-y-1">
								<div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground">
									<Sparkles className="h-3 w-3" />
									搜索建议
								</div>
								{suggestions.map((suggestion, index) => (
									<button
										key={`suggestion-${suggestion}-${index}`}
										type="button"
										onClick={() => handleSuggestionClick(suggestion)}
										className={cn(
											"w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer",
											"hover:bg-accent",
											selectedIndex === index && "bg-accent",
										)}
									>
										<div className="flex items-center gap-2">
											<Search className="h-3.5 w-3.5 text-muted-foreground" />
											<span>{suggestion}</span>
										</div>
									</button>
								))}
							</div>
						)}

						{suggestions.length > 0 && searchHistory.length > 0 && (
							<div className="h-px bg-border my-2" />
						)}

						{searchHistory.length > 0 && (
							<div className="space-y-1">
								<div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground">
									<Clock className="h-3 w-3" />
									最近搜索
								</div>
								{searchHistory.slice(0, 5).map((item, index) => (
									<button
										key={`history-${item}-${index}`}
										type="button"
										onClick={() => handleSuggestionClick(item)}
										className={cn(
											"w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer",
											"hover:bg-accent",
											selectedIndex === suggestions.length + index &&
												"bg-accent",
										)}
									>
										<div className="flex items-center gap-2">
											<Clock className="h-3.5 w-3.5 text-muted-foreground" />
											<span>{item}</span>
										</div>
									</button>
								))}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
