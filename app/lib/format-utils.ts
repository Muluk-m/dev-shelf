/**
 * 格式化字节大小
 */
export function formatBytes(bytes: number | null): string {
	if (bytes === null || bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * 格式化时间（毫秒）
 */
export function formatTime(ms: number | null): string {
	if (ms === null) return "N/A";
	if (ms < 1000) return `${ms.toFixed(0)}ms`;
	return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * 格式化应用版本（时间戳）
 */
export function formatAppVersion(timestamp: string): string {
	try {
		const date = new Date(Number(timestamp));
		if (Number.isNaN(date.getTime())) {
			return timestamp;
		}
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		const hours = String(date.getHours()).padStart(2, "0");
		const minutes = String(date.getMinutes()).padStart(2, "0");
		const seconds = String(date.getSeconds()).padStart(2, "0");
		return `${year}-${month}-${day}/${hours}:${minutes}:${seconds}`;
	} catch {
		return timestamp;
	}
}
