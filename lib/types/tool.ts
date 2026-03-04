export interface ToolEnvironment {
	name: string;
	label: string;
	url: string;
	isExternal: boolean;
}

export interface Tool {
	id: string;
	name: string;
	description: string;
	category: string;
	icon: string;
	environments: ToolEnvironment[];
	tags: string[];
	isInternal: boolean;
	status: "active" | "maintenance" | "deprecated";
	lastUpdated: string;
	permissionId?: string; // 访问该工具需要的权限 ID (可选)
}

export interface ToolCategory {
	id: string;
	name: string;
	description: string;
	icon: string;
	color: string;
}

export interface BuiltinToolMeta {
	id: string;
	name: string;
	description: string;
	icon: string;
	category: "builtin";
	tags: string[];
}

export interface ToolUsageStat {
	toolId: string;
	name: string;
	category: string;
	usageCount: number;
	lastUsed: string | null;
	status: Tool["status"];
	isInternal: boolean;
}
