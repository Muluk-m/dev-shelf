import type { TFunction } from "i18next";
import type { Tool, ToolCategory } from "~/types/tool";

/**
 * Mapping from built-in tool IDs to their i18n key prefixes.
 * These correspond to the `tools.<prefix>.title` and `tools.<prefix>.description` keys.
 */
const BUILTIN_I18N_MAP: Record<string, string> = {
	"base64-converter": "tools.base64",
	"file-uploader": "tools.fileUploader",
	"json-diff": "tools.jsonDiff",
	"json-formatter": "tools.jsonFormatter",
	"jwt-decoder": "tools.jwtDecoder",
	"qr-generator": "tools.qrGenerator",
	"time-formatter": "tools.timeFormatter",
	"ua-parser": "tools.uaParser",
	"url-encoder": "tools.urlEncoder",
	"url-parser": "tools.urlParser",
};

const CATEGORY_I18N_MAP: Record<string, string> = {
	builtin: "home.category.builtin",
};

export function getToolName(tool: Tool, t: TFunction): string {
	const prefix = BUILTIN_I18N_MAP[tool.id];
	if (prefix) {
		return t(`${prefix}.title`);
	}
	return tool.name;
}

export function getToolDescription(tool: Tool, t: TFunction): string {
	const prefix = BUILTIN_I18N_MAP[tool.id];
	if (prefix) {
		return t(`${prefix}.description`);
	}
	return tool.description;
}

export function getCategoryName(category: ToolCategory, t: TFunction): string {
	const key = CATEGORY_I18N_MAP[category.id];
	if (key) {
		return t(key);
	}
	return category.name;
}
