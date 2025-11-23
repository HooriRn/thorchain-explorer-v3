import { getCurrentNetwork, getNetworkConfig } from "./config";

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

export interface ApiError {
  message: string;
  status?: number;
  statusText?: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  promise?: Promise<ApiResponse<T>>;
}

class ApiClient {
  private baseURL: string;
  private network: string;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private pendingRequests: Map<string, Promise<ApiResponse<any>>> = new Map();
  private readonly CACHE_TTL = 30000;

  constructor() {
    this.network = getCurrentNetwork();
    this.baseURL = getNetworkConfig(this.network).MIDGARD_BASE_URL;
  }

  private getCacheKey(url: string, options?: RequestInit): string {
    const method = options?.method || "GET";
    const body = options?.body ? JSON.stringify(options.body) : "";
    return `${method}:${url}:${body}`;
  }

  private isCacheValid(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp < this.CACHE_TTL;
  }

  private async request<T>(
    url: string,
    options: RequestInit = {},
    retries = 3
  ): Promise<ApiResponse<T>> {
    const fullUrl = url.startsWith("http") ? url : `${this.baseURL}${url}`;
    const cacheKey = this.getCacheKey(url, options);

    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      return {
        data: cached.data,
        status: 200,
        statusText: "OK (cached)",
      };
    }

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!;
    }

    const defaultHeaders: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.network === "mainnet") {
      defaultHeaders["X-Client-ID"] = "thorchain.net";
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    const requestPromise = this.executeRequest<T>(fullUrl, config, retries);

    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const response = await requestPromise;

      if (response.status === 200) {
        this.cache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now(),
        });
      }

      return response;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  private async executeRequest<T>(
    fullUrl: string,
    config: RequestInit,
    retries: number
  ): Promise<ApiResponse<T>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(fullUrl, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error: ApiError = {
          message: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          statusText: response.statusText,
        };

        switch (response.status) {
          case 400:
            break;
          case 401:
            break;
          case 429:
            break;
          case 501:
            break;
          case 503:
            break;
          default:
        }

        throw error;
      }

      const data = await response.json();

      return {
        data,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      if (retries > 0 && this.shouldRetry(error as ApiError)) {
        const delay = Math.pow(2, 3 - retries) * 1000 + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.executeRequest<T>(fullUrl, config, retries - 1);
      }

      throw error;
    }
  }

  private shouldRetry(error: ApiError): boolean {
    if (error.message === "Network Error") return true;
    if (error.message.includes("AbortError")) return true;
    if (error.status === 504 || error.status === 429) return true;
    return false;
  }

  async get<T>(
    url: string,
    params?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const searchParams = params ? new URLSearchParams(params).toString() : "";
    const fullUrl = searchParams ? `${url}?${searchParams}` : url;

    return this.request<T>(fullUrl, {
      method: "GET",
    });
  }

  async getExternal<T>(
    url: string,
    params?: Record<string, any>,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const searchParams = params ? new URLSearchParams(params).toString() : "";
    const fullUrl = searchParams ? `${url}?${searchParams}` : url;

    return this.request<T>(fullUrl, {
      method: "GET",
      ...options,
    });
  }

  async batchGet<T>(
    requests: Array<{ url: string; params?: Record<string, any> }>
  ): Promise<ApiResponse<T | null>[]> {
    const promises = requests.map((req) => this.get<T>(req.url, req.params));
    return Promise.allSettled(promises).then((results) =>
      results.map((result) =>
        result.status === "fulfilled"
          ? result.value
          : { data: null, status: 500, statusText: "Failed" }
      )
    );
  }

  clearCache(url?: string): void {
    if (url) {
      const cacheKey = this.getCacheKey(url);
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }

  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0,
    };
  }
}

export const apiClient = new ApiClient();

export default apiClient;
