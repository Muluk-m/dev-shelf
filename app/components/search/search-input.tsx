import { Clock, Search, TrendingUp, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
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
			<div className="relative">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					ref={inputRef}
					value={value}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					onFocus={() => setIsOpen(true)}
					placeholder={placeholder}
					className="pl-10 pr-10"
				/>
				{value && (
					<Button
						variant="ghost"
						size="sm"
						onClick={handleClear}
						className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0 hover:bg-transparent"
					>
						<X className="h-4 w-4" />
					</Button>
				)}
			</div>

			{showSuggestions && (
				<Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto">
					<CardContent className="p-2">
						{suggestions.length > 0 && (
							<div className="space-y-1">
								<div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
									<TrendingUp className="h-3 w-3" />
									搜索建议
								</div>
								{suggestions.map((suggestion, index) => (
									<button
										key={`suggestion-${index}`}
										onClick={() => handleSuggestionClick(suggestion)}
										className={cn(
											"w-full text-left px-2 py-2 rounded-md text-sm hover:bg-muted transition-colors",
											selectedIndex === index && "bg-muted",
										)}
									>
										<div className="flex items-center gap-2">
											<Search className="h-3 w-3 text-muted-foreground" />
											<span>{suggestion}</span>
										</div>
									</button>
								))}
							</div>
						)}

						{suggestions.length > 0 && searchHistory.length > 0 && (
							<Separator className="my-2" />
						)}

						{searchHistory.length > 0 && (
							<div className="space-y-1">
								<div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
									<Clock className="h-3 w-3" />
									搜索历史
								</div>
								{searchHistory.slice(0, 5).map((item, index) => (
									<button
										key={`history-${index}`}
										onClick={() => handleSuggestionClick(item)}
										className={cn(
											"w-full text-left px-2 py-2 rounded-md text-sm hover:bg-muted transition-colors",
											selectedIndex === suggestions.length + index &&
												"bg-muted",
										)}
									>
										<div className="flex items-center gap-2">
											<Clock className="h-3 w-3 text-muted-foreground" />
											<span>{item}</span>
										</div>
									</button>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
