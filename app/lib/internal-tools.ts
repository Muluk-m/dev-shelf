/**
 * 内部工具注册表
 * 仅用于映射工具ID到具体的实现组件
 * 工具的元信息（名称、描述等）通过管理后台的API接口配置
 */

// 内部工具ID列表，用于路由判断
export const INTERNAL_TOOL_IDS = [
	"json-formatter",
] as const;

export type InternalToolId = typeof INTERNAL_TOOL_IDS[number];

/**
 * 检查指定ID是否为内部工具
 */
export function isInternalTool(id: string): id is InternalToolId {
	return INTERNAL_TOOL_IDS.includes(id as InternalToolId);
}
