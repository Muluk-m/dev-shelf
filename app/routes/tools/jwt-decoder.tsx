import { BadgeCheck, Clipboard, KeyRound, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { ToolPageHeader } from "~/components/tool-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import type { Route } from "./+types/jwt-decoder";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "JWT Parser | DevTools Platform" },
		{
			name: "description",
			content:
				"Parse and decode your JSON Web Token (jwt) and display its content.",
		},
	];
}

type JwtParts = {
	header?: Record<string, unknown>;
	payload?: Record<string, unknown>;
	signature?: string;
};

function base64UrlDecode(input: string): string {
	const pad =
		input.length % 4 === 2
			? "=="
			: input.length % 4 === 3
				? "="
				: input.length % 4 === 1
					? "==="
					: "";
	const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
	try {
		return decodeURIComponent(
			Array.prototype.map
				.call(
					atob(b64),
					(c: string) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`,
				)
				.join(""),
		);
	} catch {
		// 如果失败，回退到直接 atob
		return atob(b64);
	}
}

function parseJwt(token: string): {
	data: JwtParts | null;
	error: string | null;
} {
	if (!token.trim()) return { data: null, error: null };
	const parts = token.split(".");
	if (parts.length !== 3) {
		return {
			data: null,
			error: "JWT 必须包含三段（header.payload.signature）",
		};
	}
	try {
		const header = JSON.parse(base64UrlDecode(parts[0]));
		const payload = JSON.parse(base64UrlDecode(parts[1]));
		const signature = parts[2];
		return { data: { header, payload, signature }, error: null };
	} catch (_e) {
		return { data: null, error: "无效的 JWT：解析失败或 Base64URL 非法" };
	}
}

export default function JwtDecoderPage() {
	const [jwt, setJwt] = useState(
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
	);

	const { data, error } = useMemo(() => parseJwt(jwt), [jwt]);

	const renderObjectRows = (obj?: Record<string, unknown>) => {
		if (!obj) return null;
		return Object.entries(obj).map(([key, value]) => (
			<TableRow key={key}>
				<TableCell className="font-medium">{key}</TableCell>
				<TableCell className="font-mono text-xs break-all">
					{typeof value === "object"
						? JSON.stringify(value, null, 2)
						: String(value)}
				</TableCell>
			</TableRow>
		));
	};

	return (
		<div className="bg-background flex flex-col min-h-[60vh]">
			<div className="w-full flex-1 flex">
				<div className="mx-auto w-full px-4 py-6">
					<div className="mx-auto w-full max-w-[680px] sm:max-w-[720px] md:max-w-[860px] lg:max-w-[920px] xl:max-w-[980px] 2xl:max-w-[1100px]">
						<ToolPageHeader
							icon={<KeyRound className="h-5 w-5" />}
							title="JWT Parser"
							description="Parse and decode your JSON Web Token (JWT) and display its content"
						/>

						<Card className="mb-4">
							<CardContent className="pt-4">
								<div className="mb-2 text-sm text-muted-foreground">
									JWT to decode
								</div>
								<Textarea
									value={jwt}
									onChange={(e) => setJwt(e.target.value)}
									placeholder="在此粘贴你的 JWT (header.payload.signature)"
									className={`font-mono text-sm min-h-28 ${
										error ? "border-destructive bg-destructive/10" : ""
									}`}
								/>
								{error && (
									<div className="flex items-center gap-2 text-destructive mt-2 text-sm">
										<ShieldAlert className="h-4 w-4" />
										Invalid JWT
									</div>
								)}
							</CardContent>
						</Card>

						{data && !error && (
							<div className="space-y-4">
								<Card>
									<CardHeader className="py-3">
										<CardTitle className="text-base">Header</CardTitle>
									</CardHeader>
									<CardContent className="pt-0">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Key</TableHead>
													<TableHead>Value</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>{renderObjectRows(data.header)}</TableBody>
										</Table>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="py-3">
										<CardTitle className="text-base">Payload</CardTitle>
									</CardHeader>
									<CardContent className="pt-0">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Key</TableHead>
													<TableHead>Value</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>{renderObjectRows(data.payload)}</TableBody>
										</Table>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="py-3">
										<CardTitle className="text-base flex items-center gap-2">
											<BadgeCheck className="h-4 w-4" /> Signature
										</CardTitle>
									</CardHeader>
									<CardContent className="pt-0">
										<div className="font-mono text-xs break-all p-2 border rounded bg-muted/30">
											{data.signature}
										</div>
										<div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
											<Clipboard className="h-3 w-3" />
											签名仅用于展示，未进行校验
										</div>
									</CardContent>
								</Card>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
