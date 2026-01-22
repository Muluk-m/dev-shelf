import {
	AlertCircle,
	Check,
	Globe2,
	Leaf,
	Link2,
	RefreshCcw,
	Shield,
	ShieldAlert,
	X,
	Zap,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import {
	COMMON_BLOCK_ISPS,
	COMMON_COUNTRIES,
	GREEN_MODE_COUNTRIES,
	LINK_MODE_OPTIONS,
	type LinkConfig,
	type LinkMode,
	REVIEW_LINK_TEMPLATES,
} from "~/types/ab-router";

export interface LinkFormData extends Omit<LinkConfig, "id"> {
	id: string;
}

interface LinkFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editingLink: LinkConfig | null;
	formData: LinkFormData;
	setFormData: (data: LinkFormData) => void;
	formError: string | null;
	saving: boolean;
	onSave: () => void;
}

// 模式图标映射
const modeIcons = {
	all_open: Zap,
	review: Shield,
	final_link: ShieldAlert,
	green: Leaf,
};

export function LinkFormDialog({
	open,
	onOpenChange,
	editingLink,
	formData,
	setFormData,
	formError,
	saving,
	onSave,
}: LinkFormDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden">
				{/* 头部 */}
				<div className="px-6 py-4 border-b border-border/50 bg-muted/30">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
							<Link2 className="h-5 w-5 text-primary" />
						</div>
						<div>
							<DialogTitle className="text-lg font-semibold">
								{editingLink ? "编辑链接配置" : "新建链接配置"}
							</DialogTitle>
							<DialogDescription className="text-sm">
								配置路由规则，智能决定访问者的跳转目标
							</DialogDescription>
						</div>
					</div>
				</div>

				{/* 表单内容 */}
				<div className="px-6 py-5 max-h-[65vh] overflow-y-auto">
					{formError && (
						<div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-5">
							<AlertCircle className="h-4 w-4 text-destructive shrink-0" />
							<p className="text-sm text-destructive">{formError}</p>
						</div>
					)}

					<div className="space-y-6">
						{/* 基础信息 */}
						<section>
							<SectionHeader title="基础信息" color="primary" />
							<div className="grid grid-cols-2 gap-4 mt-3">
								<div className="space-y-1.5">
									<Label htmlFor="link-id" className="text-sm font-medium">
										链路 ID <span className="text-destructive">*</span>
									</Label>
									<Input
										id="link-id"
										value={formData.id}
										onChange={(e) =>
											setFormData({ ...formData, id: e.target.value })
										}
										placeholder="如: link001"
										disabled={!!editingLink}
										className="h-10"
									/>
									<p className="text-xs text-muted-foreground">
										用于生成跳转链接的唯一标识
									</p>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="link-name" className="text-sm font-medium">
										配置名称 <span className="text-destructive">*</span>
									</Label>
									<Input
										id="link-name"
										value={formData.name}
										onChange={(e) =>
											setFormData({ ...formData, name: e.target.value })
										}
										placeholder="如: 产品落地页"
										className="h-10"
									/>
									<p className="text-xs text-muted-foreground">
										便于识别的配置名称
									</p>
								</div>
							</div>
						</section>

						{/* 链接配置 */}
						<section>
							<SectionHeader title="链接配置" color="emerald" />
							<div className="space-y-3 mt-3">
								{/* 真实链接 */}
								<div className="space-y-1.5">
									<Label
										htmlFor="real-link"
										className="text-sm font-medium flex items-center gap-2"
									>
										<span className="w-2 h-2 rounded-full bg-emerald-500" />
										真实链接 <span className="text-destructive">*</span>
									</Label>
									<Input
										id="real-link"
										value={formData.realLink}
										onChange={(e) =>
											setFormData({ ...formData, realLink: e.target.value })
										}
										placeholder="https://example.com/real"
										className="h-10 border-emerald-200 dark:border-emerald-500/30 focus-visible:ring-emerald-500/20"
									/>
									<p className="text-xs text-muted-foreground">
										符合规则的用户将跳转到此链接
									</p>
								</div>

								{/* 审核链接 */}
								<div className="space-y-1.5">
									<Label className="text-sm font-medium flex items-center gap-2">
										<span className="w-2 h-2 rounded-full bg-amber-500" />
										审核链接 <span className="text-destructive">*</span>
									</Label>
									<div className="flex items-center gap-2">
										<Select
											value={
												REVIEW_LINK_TEMPLATES.find(
													(t) => t.url === formData.reviewLink,
												)?.id.toString() || "99"
											}
											onValueChange={(value) => {
												const template = REVIEW_LINK_TEMPLATES.find(
													(t) => t.id.toString() === value,
												);
												if (template?.url) {
													setFormData({
														...formData,
														reviewLink: template.url,
													});
												}
											}}
										>
											<SelectTrigger className="w-32 h-10 shrink-0">
												<SelectValue placeholder="选择模板" />
											</SelectTrigger>
											<SelectContent>
												{REVIEW_LINK_TEMPLATES.map((template) => (
													<SelectItem
														key={template.id}
														value={template.id.toString()}
														className="cursor-pointer"
													>
														{template.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<Input
											id="review-link"
											value={formData.reviewLink}
											onChange={(e) =>
												setFormData({
													...formData,
													reviewLink: e.target.value,
												})
											}
											placeholder="https://example.com/review"
											className="h-10 flex-1 border-amber-200 dark:border-amber-500/30 focus-visible:ring-amber-500/20"
										/>
									</div>
									<p className="text-xs text-muted-foreground">
										不符合规则或审核期间跳转到此链接
									</p>
								</div>

								{/* 短链 */}
								<div className="space-y-1.5">
									<Label
										htmlFor="short-link"
										className="text-sm font-medium text-muted-foreground"
									>
										短链 (可选)
									</Label>
									<Input
										id="short-link"
										value={formData.shortLink}
										onChange={(e) =>
											setFormData({ ...formData, shortLink: e.target.value })
										}
										placeholder="https://short.link/abc"
										className="h-10"
									/>
								</div>
							</div>
						</section>

						{/* 路由模式 */}
						<section>
							<SectionHeader title="路由模式" color="blue" />
							<div className="grid grid-cols-3 gap-2 mt-3">
								{LINK_MODE_OPTIONS.map((option) => {
									const Icon = modeIcons[option.value];
									const isSelected = formData.mode === option.value;
									return (
										<label
											key={option.value}
											htmlFor={`mode-${option.value}`}
											className={`relative flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
												isSelected
													? "border-primary bg-primary/5 ring-1 ring-primary/20"
													: "border-border hover:border-primary/40 hover:bg-muted/30"
											}`}
										>
											<input
												type="radio"
												id={`mode-${option.value}`}
												name="mode"
												value={option.value}
												checked={isSelected}
												onChange={(e) => {
													const newMode = e.target.value as LinkMode;
													const newFormData = {
														...formData,
														mode: newMode,
													};
													// 切换到绿色模式时自动填充默认国家列表
													if (
														newMode === "green" &&
														(!formData.rules.countries ||
															formData.rules.countries.length === 0)
													) {
														newFormData.rules = {
															...formData.rules,
															countries: [...GREEN_MODE_COUNTRIES],
														};
													}
													setFormData(newFormData);
												}}
												className="sr-only"
											/>
											<Icon
												className={`h-4 w-4 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
											/>
											<div className="min-w-0">
												<span
													className={`text-sm font-medium block ${isSelected ? "text-foreground" : "text-foreground/80"}`}
												>
													{option.label}
												</span>
												<span className="text-[11px] text-muted-foreground line-clamp-1">
													{option.description}
												</span>
											</div>
											{isSelected && (
												<Check className="h-4 w-4 text-primary absolute top-2 right-2" />
											)}
										</label>
									);
								})}
							</div>
						</section>

						{/* 规则配置 - 在 review 和 green 模式显示 */}
						{(formData.mode === "review" || formData.mode === "green") && (
							<section>
								<SectionHeader title="规则配置" color="violet" />
								<div className="space-y-4 mt-3">
									{/* 投放国家 */}
									<div className="space-y-2">
										<Label className="text-sm font-medium flex items-center gap-2">
											<Globe2 className="h-4 w-4 text-muted-foreground" />
											{formData.mode === "green" ? "审核链接国家" : "投放国家"}
										</Label>
										{/* 模式说明 */}
										<p className="text-xs text-muted-foreground pb-1">
											{formData.mode === "green"
												? "以下国家访问审核链接，其他国家访问真实链接"
												: "以下国家访问真实链接，其他国家访问审核链接"}
										</p>
										<Select
											value=""
											onValueChange={(value) => {
												if (
													value &&
													!formData.rules.countries?.includes(value)
												) {
													setFormData({
														...formData,
														rules: {
															...formData.rules,
															countries: [
																...(formData.rules.countries || []),
																value,
															],
														},
													});
												}
											}}
										>
											<SelectTrigger className="h-10">
												<SelectValue placeholder="点击添加国家" />
											</SelectTrigger>
											<SelectContent>
												{COMMON_COUNTRIES.filter(
													(c) => !formData.rules.countries?.includes(c.code),
												).map((country) => (
													<SelectItem
														key={country.code}
														value={country.code}
														className="cursor-pointer"
													>
														{country.name} ({country.code})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{formData.rules.countries &&
											formData.rules.countries.length > 0 && (
												<div className="flex flex-wrap gap-1.5">
													{formData.rules.countries.map((code) => {
														const country = COMMON_COUNTRIES.find(
															(c) => c.code === code,
														);
														return (
															<Badge
																key={code}
																variant="secondary"
																className="h-7 gap-1.5 pl-2.5 pr-1.5 text-xs"
															>
																{country?.name || code}
																<button
																	type="button"
																	className="w-4 h-4 rounded-full hover:bg-destructive/20 hover:text-destructive flex items-center justify-center transition-colors"
																	onClick={() =>
																		setFormData({
																			...formData,
																			rules: {
																				...formData.rules,
																				countries:
																					formData.rules.countries?.filter(
																						(c) => c !== code,
																					) || [],
																			},
																		})
																	}
																>
																	<X className="h-3 w-3" />
																</button>
															</Badge>
														);
													})}
												</div>
											)}
									</div>

									{/* 开关选项 - 改为更紧凑的复选框形式 */}
									<div className="grid grid-cols-3 gap-3">
										<CompactCheckbox
											id="block-empty-lang"
											checked={formData.rules.blockEmptyLanguage || false}
											onCheckedChange={(checked) =>
												setFormData({
													...formData,
													rules: {
														...formData.rules,
														blockEmptyLanguage: checked === true,
													},
												})
											}
											label="禁止空语言"
											description="屏蔽无语言标识"
										/>
										<CompactCheckbox
											id="block-pc"
											checked={formData.rules.blockPC || false}
											onCheckedChange={(checked) =>
												setFormData({
													...formData,
													rules: {
														...formData.rules,
														blockPC: checked === true,
													},
												})
											}
											label="屏蔽 PC"
											description="仅允许移动端"
										/>
										<CompactCheckbox
											id="block-proxy"
											checked={formData.rules.blockProxy || false}
											onCheckedChange={(checked) =>
												setFormData({
													...formData,
													rules: {
														...formData.rules,
														blockProxy: checked === true,
													},
												})
											}
											label="禁止代理"
											description="屏蔽 VPN/代理"
										/>
									</div>

									{/* 蜘蛛白名单 */}
									<div className="space-y-1.5">
										<Label
											htmlFor="spider-whitelist"
											className="text-sm font-medium flex items-center gap-2"
										>
											<Shield className="h-4 w-4 text-muted-foreground" />
											蜘蛛白名单
										</Label>
										<Textarea
											id="spider-whitelist"
											value={formData.rules.spiderWhitelist?.join("\n") || ""}
											onChange={(e) =>
												setFormData({
													...formData,
													rules: {
														...formData.rules,
														spiderWhitelist: e.target.value
															.split("\n")
															.filter(Boolean),
													},
												})
											}
											placeholder="Googlebot&#10;Bingbot&#10;Applebot"
											rows={2}
											className="font-mono text-sm resize-none"
										/>
										<p className="text-xs text-muted-foreground">
											每行一个爬虫标识，匹配的将直接放行
										</p>
									</div>

									{/* ISP 黑名单 */}
									<div className="space-y-2">
										<Label className="text-sm font-medium flex items-center gap-2">
											<ShieldAlert className="h-4 w-4 text-muted-foreground" />
											ISP 黑名单
										</Label>
										<p className="text-xs text-muted-foreground pb-1">
											屏蔽指定平台的爬虫和预览服务（支持部分匹配）
										</p>

										{/* 预设选择器 */}
										<Select
											value=""
											onValueChange={(value) => {
												if (
													value &&
													!formData.rules.blockIspList?.includes(value)
												) {
													setFormData({
														...formData,
														rules: {
															...formData.rules,
															blockIspList: [
																...(formData.rules.blockIspList || []),
																value,
															],
														},
													});
												}
											}}
										>
											<SelectTrigger className="h-10">
												<SelectValue placeholder="选择预设 ISP" />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													<SelectLabel>Meta/Facebook</SelectLabel>
													{COMMON_BLOCK_ISPS.filter(
														(isp) => isp.category === "Meta",
													).map((isp) => (
														<SelectItem
															key={isp.id}
															value={isp.name}
															className="cursor-pointer"
														>
															{isp.name}
														</SelectItem>
													))}
												</SelectGroup>
												<SelectGroup>
													<SelectLabel>TikTok/ByteDance</SelectLabel>
													{COMMON_BLOCK_ISPS.filter(
														(isp) => isp.category === "TikTok",
													).map((isp) => (
														<SelectItem
															key={isp.id}
															value={isp.name}
															className="cursor-pointer"
														>
															{isp.name}
														</SelectItem>
													))}
												</SelectGroup>
												<SelectGroup>
													<SelectLabel>Google</SelectLabel>
													{COMMON_BLOCK_ISPS.filter(
														(isp) => isp.category === "Google",
													).map((isp) => (
														<SelectItem
															key={isp.id}
															value={isp.name}
															className="cursor-pointer"
														>
															{isp.name}
														</SelectItem>
													))}
												</SelectGroup>
											</SelectContent>
										</Select>

										{/* 自定义输入 */}
										<Input
											placeholder="或输入自定义 ISP 名称（按 Enter 添加）"
											className="h-10"
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													const value = e.currentTarget.value.trim();
													if (
														value &&
														!formData.rules.blockIspList?.includes(value)
													) {
														setFormData({
															...formData,
															rules: {
																...formData.rules,
																blockIspList: [
																	...(formData.rules.blockIspList || []),
																	value,
																],
															},
														});
														e.currentTarget.value = "";
													}
												}
											}}
										/>

										{/* 已选择的 ISP 徽章 */}
										{formData.rules.blockIspList &&
											formData.rules.blockIspList.length > 0 && (
												<div className="flex flex-wrap gap-1.5">
													{formData.rules.blockIspList.map((isp) => (
														<Badge
															key={isp}
															variant="secondary"
															className="h-7 gap-1.5 pl-2.5 pr-1.5 text-xs"
														>
															{isp}
															<button
																type="button"
																className="w-4 h-4 rounded-full hover:bg-destructive/20 hover:text-destructive flex items-center justify-center transition-colors"
																onClick={() =>
																	setFormData({
																		...formData,
																		rules: {
																			...formData.rules,
																			blockIspList:
																				formData.rules.blockIspList?.filter(
																					(i) => i !== isp,
																				) || [],
																		},
																	})
																}
															>
																<X className="h-3 w-3" />
															</button>
														</Badge>
													))}
												</div>
											)}
									</div>
								</div>
							</section>
						)}

						{/* 备注 */}
						<section>
							<div className="space-y-1.5">
								<Label
									htmlFor="note"
									className="text-sm font-medium text-muted-foreground"
								>
									备注 (可选)
								</Label>
								<Textarea
									id="note"
									value={formData.note}
									onChange={(e) =>
										setFormData({ ...formData, note: e.target.value })
									}
									placeholder="添加备注信息，方便后续管理..."
									rows={2}
									className="resize-none"
								/>
							</div>
						</section>
					</div>
				</div>

				{/* 底部操作栏 */}
				<div className="px-6 py-4 border-t border-border/50 bg-muted/30 flex items-center justify-end gap-3">
					<Button
						variant="ghost"
						onClick={() => onOpenChange(false)}
						className="h-9 px-4"
					>
						取消
					</Button>
					<Button onClick={onSave} disabled={saving} className="h-9 px-5 gap-2">
						{saving ? (
							<>
								<RefreshCcw className="h-4 w-4 animate-spin" />
								保存中...
							</>
						) : (
							<>
								<Check className="h-4 w-4" />
								保存配置
							</>
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// 分区标题组件
function SectionHeader({
	title,
	color,
}: {
	title: string;
	color: "primary" | "emerald" | "blue" | "violet";
}) {
	const colors = {
		primary: "bg-primary",
		emerald: "bg-emerald-500",
		blue: "bg-blue-500",
		violet: "bg-violet-500",
	};

	return (
		<div className="flex items-center gap-2">
			<div className={`w-1 h-4 rounded-full ${colors[color]}`} />
			<h4 className="text-sm font-semibold text-foreground">{title}</h4>
		</div>
	);
}

// 紧凑复选框组件
function CompactCheckbox({
	id,
	checked,
	onCheckedChange,
	label,
	description,
}: {
	id: string;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	label: string;
	description: string;
}) {
	return (
		<label
			htmlFor={id}
			className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
				checked
					? "border-primary bg-primary/5"
					: "border-border hover:border-primary/40"
			}`}
		>
			<Checkbox
				id={id}
				checked={checked}
				onCheckedChange={onCheckedChange}
				className="mt-0.5"
			/>
			<div className="min-w-0">
				<span className="text-sm font-medium block text-foreground">
					{label}
				</span>
				<span className="text-[11px] text-muted-foreground">{description}</span>
			</div>
		</label>
	);
}
