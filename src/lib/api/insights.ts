import { apiClient } from "./client";
import { getNetworkConfig, getCurrentNetwork } from "./config";

export interface ChurnHistory {
  [key: string]: any;
}

export interface FlipTVL {
  [key: string]: any;
}

export interface RunePrice {
  [key: string]: any;
}

export interface DailySwap {
  [key: string]: any;
}

export class InsightsAPI {
  private network: string;
  private config: ReturnType<typeof getNetworkConfig>;

  constructor() {
    this.network = getCurrentNetwork();
    this.config = getNetworkConfig(this.network as any);
  }

  async getChurnHistory(): Promise<ChurnHistory[]> {
    const response = await apiClient.getExternal<ChurnHistory[]>(
      `${this.config.SERVER_URL}api/churnHistory`
    );
    return response.data;
  }

  async getFlipTVL(): Promise<FlipTVL[]> {
    const response = await apiClient.getExternal<FlipTVL[]>(
      `${this.config.SERVER_URL}api/flipTVL`
    );
    return response.data;
  }

  async getRunePrice(): Promise<RunePrice[]> {
    const response = await apiClient.getExternal<RunePrice[]>(
      `${this.config.SERVER_URL}api/runePrice`
    );
    return response.data;
  }

  async getDailySwap(): Promise<DailySwap[]> {
    const response = await apiClient.getExternal<DailySwap[]>(
      `${this.config.SERVER_URL}api/dailySwap`
    );
    return response.data;
  }
}

export const insightsAPI = new InsightsAPI();

export const getChurnHistory = () => insightsAPI.getChurnHistory();
export const getFlipTVL = () => insightsAPI.getFlipTVL();
export const getRunePrice = () => insightsAPI.getRunePrice();
export const getDailySwap = () => insightsAPI.getDailySwap();
