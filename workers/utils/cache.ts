/**
 * Cloudflare Workers Cache Management Utilities
 */

export class CacheManager {
  /**
   * 清除指定缓存名称下的缓存项
   */
  static async clearCache(cacheName: string, urls: string[]): Promise<void> {
    try {
      const cache = await caches.open(cacheName);
      await Promise.all(urls.map(url => cache.delete(new Request(url))));
    } catch (error) {
      console.warn(`Failed to clear ${cacheName} cache:`, error);
    }
  }

  /**
   * 清除单个缓存项
   */
  static async clearCacheItem(cacheName: string, url: string): Promise<void> {
    await this.clearCache(cacheName, [url]);
  }

  /**
   * 根据请求URL清除相关的缓存项
   */
  static async clearRelatedCache(
    cacheName: string,
    currentUrl: string,
    options: {
      clearList?: boolean;  // 是否清除列表页缓存
      clearItem?: boolean;  // 是否清除详情页缓存
    } = {}
  ): Promise<void> {
    const urlsToDelete: string[] = [];

    // 清除列表页缓存 (移除路径中的ID部分)
    if (options.clearList) {
      const listUrl = currentUrl.replace(/\/[^\/]*$/, "");
      urlsToDelete.push(listUrl);
    }

    // 清除详情页缓存
    if (options.clearItem) {
      urlsToDelete.push(currentUrl);
    }

    if (urlsToDelete.length > 0) {
      await this.clearCache(cacheName, urlsToDelete);
    }
  }
}