import { useEffect, useState } from "react";

/**
 * 检测客户端 hydration 是否完成
 *
 * 在 SSR 环境下，首次渲染时返回 false，hydration 完成后返回 true
 * 用于避免 SSR 和客户端状态不一致导致的 hydration mismatch
 *
 * @example
 * ```tsx
 * const hasHydrated = useHydration();
 *
 * if (!hasHydrated) {
 *   return <LoadingSpinner />;
 * }
 *
 * return <UserProfile />;
 * ```
 */
export function useHydration() {
	const [hasHydrated, setHasHydrated] = useState(false);

	useEffect(() => {
		setHasHydrated(true);
	}, []);

	return hasHydrated;
}
