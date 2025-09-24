/**
 * Cloudflare Workers Cache Management Utilities
 */

// biome-ignore lint/complexity/noStaticOnlyClass: -
export class CacheManager {
	private static readonly defaultHeaders = {
		"Content-Type": "application/json; charset=utf-8",
	};

	private static readonly baseUrl = "https://cache.devhub";

	private static toRequest(key: string): Request {
		const absoluteUrl = key.startsWith("http")
			? key
			: `${CacheManager.baseUrl}${key.startsWith("/") ? "" : "/"}${key}`;
		return new Request(absoluteUrl);
	}

	private static async openCache(cacheName: string): Promise<Cache | null> {
		if (typeof caches === "undefined") {
			return null;
		}
		try {
			return await caches.open(cacheName);
		} catch (error) {
			console.warn(`Failed to open ${cacheName} cache:`, error);
			return null;
		}
	}

	static async getJson<T>(
		cacheName: string,
		key: string,
		resolver: () => Promise<T>,
		options: { ttlSeconds?: number; shouldCache?: (payload: T) => boolean } = {},
	): Promise<T> {
		const cacheStore = await CacheManager.openCache(cacheName);
		let request: Request | null = null;
		if (cacheStore) {
			request = CacheManager.toRequest(key);
			try {
				const cachedResponse = await cacheStore.match(request);
				if (cachedResponse) {
					console.log(cacheName,key,'命中缓存');
					return (await cachedResponse.json()) as T;
				}
			} catch (error) {
				console.warn(`Failed to read ${cacheName} cache:`, error);
			}
		}

		const payload = await resolver();
		const shouldCache = options.shouldCache?.(payload) ?? true;
		if (!cacheStore || !shouldCache) {
			return payload;
		}
		try {
			request ??= CacheManager.toRequest(key);
			const ttlSeconds = options.ttlSeconds ?? 0;
			const headers = new Headers(CacheManager.defaultHeaders);
			if (ttlSeconds > 0) {
				headers.set(
					"Cache-Control",
					`public, max-age=${ttlSeconds}, s-maxage=${ttlSeconds}`,
				);
			}
			const response = new Response(JSON.stringify(payload), {
				headers,
			});
			await cacheStore.put(request, response);
		} catch (error) {
			console.warn(`Failed to write ${cacheName} cache:`, error);
		}
		return payload;
	}

	/**
	 * 清除指定缓存名称下的缓存项
	 */
	static async clearCache(cacheName: string, urls: string[]): Promise<void> {
		const cacheStore = await CacheManager.openCache(cacheName);
		if (!cacheStore) {
			return;
		}
		console.log('清理缓存', cacheName, urls);
		try {
			await Promise.all(
				urls.map((url) => cacheStore.delete(CacheManager.toRequest(url))),
			);
		} catch (error) {
			console.warn(`Failed to clear ${cacheName} cache:`, error);
		}
	}

	/**
	 * 清除单个缓存项
	 */
	static async clearCacheItem(cacheName: string, url: string): Promise<void> {
		await CacheManager.clearCache(cacheName, [url]);
	}

}
