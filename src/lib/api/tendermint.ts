import { apiClient } from "./client";
import { getNetworkConfig, getCurrentNetwork } from "./config";

export interface TendermintBlock {
  [key: string]: any;
}

export class TendermintAPI {
  private network: string;
  private config: ReturnType<typeof getNetworkConfig>;

  constructor() {
    this.network = getCurrentNetwork();
    this.config = getNetworkConfig(this.network as any);
  }

  async getTendermintLatestBlocks(): Promise<TendermintBlock[]> {
    const response = await apiClient.getExternal<TendermintBlock[]>(
      `${this.config.TENDERMINT_URL}latest_blocks`
    );
    return response.data;
  }
}

export const tendermintAPI = new TendermintAPI();

export const getTendermintLatestBlocks = () =>
  tendermintAPI.getTendermintLatestBlocks();
