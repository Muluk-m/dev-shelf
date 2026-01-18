/**
 * Cloudflare Workers Cache Management Utilities
 *
 * Uses Cloudflare Workers Cache API for server-side caching.
 * Requires ExecutionContext to be passed for proper cache operations.
 */

export interface CacheContext {
	/**
	 * Cloudflare Workers execution context for cache operations
	 */
	ctx?: ExecutionContext;
	/**
	 * Optional cache instance (defaults to caches.default)
	 */
	cacheApi?: Cache;
	/**
	 * Optional KV namespace for version management
	 */
	kv?: KVNamespace;
}

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

	/**
	 * Get Cache instance for Cloudflare Workers
	 * Uses caches.default which is the Workers cache API
	 */
	private static async getCache(context?: CacheContext): Promise<Cache | null> {
		// Use provided cache instance
		if (context?.cacheApi) {
			return context.cacheApi;
		}

		// Check if caches API is available (Workers or browser)
		if (typeof caches === "undefined") {
			console.warn("Cache API is not available in this environment");
			return null;
		}

		try {
			// In Cloudflare Workers, use caches.default
			// In browser, this would be caches.default too
			// Note: TypeScript doesn't have proper types for Workers Cache API, so we cast
			return (caches as any).default as Cache;
		} catch (error) {
			console.warn("Failed to access cache:", error);
			return null;
		}
	}

	static async getJson<T>(
		cacheName: string,
		key: string,
		resolver: () => Promise<T>,
		options: {
			ttlSeconds?: number;
			shouldCache?: (payload: T) => boolean;
			context?: CacheContext;
		} = {},
	): Promise<T> {
		const cacheStore = await CacheManager.getCache(options.context);
		let request: Request | null = null;

		if (cacheStore) {
			request = CacheManager.toRequest(key);
			try {
				const cachedResponse = await cacheStore.match(request);
				if (cachedResponse) {
					console.log(cacheName, key, "命中缓存");
					return (await cachedResponse.json()) as T;
				}
			} catch (error) {
				console.warn(`Failed to read ${cacheName} cache:`, error);
			}
		}
		
		const payload = await resolver();
		console.log('缓存失效-获取新资源',cacheName, key, payload);

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

			// Use waitUntil if execution context is provided (Workers environment)
			if (options.context?.ctx) {
				options.context.ctx.waitUntil(cacheStore.put(request, response));
			} else {
				await cacheStore.put(request, response);
			}
		} catch (error) {
			console.warn(`Failed to write ${cacheName} cache:`, error);
		}

		return payload;
	}

	/**
	 * 清除指定缓存名称下的缓存项
	 */
	static async clearCache(
		cacheName: string,
		urls: string[],
		context?: CacheContext
	): Promise<void> {
		const cacheStore = await CacheManager.getCache(context);

		if (!cacheStore) {
			console.warn(`Cache not available, skipping clear for ${cacheName}`);
			return;
		}

		console.log("清理缓存", cacheName, urls);

		try {
			const deletePromises = urls.map((url) =>
				cacheStore.delete(CacheManager.toRequest(url))
			);

			// Use waitUntil if execution context is provided
			if (context?.ctx) {
				context.ctx.waitUntil(Promise.all(deletePromises));
			} else {
				await Promise.all(deletePromises);
			}
		} catch (error) {
			console.warn(`Failed to clear ${cacheName} cache:`, error);
		}
	}

	/**
	 * 清除单个缓存项
	 */
	static async clearCacheItem(
		cacheName: string,
		url: string,
		context?: CacheContext
	): Promise<void> {
		await CacheManager.clearCache(cacheName, [url], context);
	}
}
