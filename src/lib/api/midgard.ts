import { apiClient } from "./client";
import { getNetworkConfig, getCurrentNetwork } from "./config";

export interface Stats {
  [key: string]: any;
}

export interface Transaction {
  [key: string]: any;
}

export interface Pool {
  [key: string]: any;
}

export interface PoolStats {
  [key: string]: any;
}

export interface TVLHistory {
  [key: string]: any;
}

export interface EarningsHistory {
  [key: string]: any;
}

export interface Network {
  [key: string]: any;
}

export interface MemberDetails {
  [key: string]: any;
}

export interface SaverDetails {
  [key: string]: any;
}

export interface BorrowerDetails {
  [key: string]: any;
}

export interface TCYDistribution {
  [key: string]: any;
}

export class MidgardAPI {
  private network: string;
  private config: ReturnType<typeof getNetworkConfig>;

  constructor() {
    this.network = getCurrentNetwork();
    this.config = getNetworkConfig(this.network as any);
  }

  async getStats(): Promise<Stats> {
    const response = await apiClient.get<Stats>("stats");
    return response.data;
  }

  async getMidgardActions(params?: Record<string, any>): Promise<any> {
    const response = await apiClient.get("actions", params);
    return response.data;
  }

  async getTxs(
    offset = 0,
    limit = 10,
    otherParams?: Record<string, any>
  ): Promise<any> {
    const params = {
      offset,
      limit,
      ...otherParams,
    };
    const response = await apiClient.get("actions", params);
    return response.data;
  }

  async getTx(txid: string, limit = 10): Promise<any> {
    const params = {
      offset: 0,
      limit,
      txid,
    };
    const response = await apiClient.get("actions", params);
    return response.data;
  }

  async getAddress(address: string, offset = 0, limit = 10): Promise<any> {
    const params = {
      offset,
      limit,
      address,
    };
    const response = await apiClient.get("actions", params);
    return response.data;
  }

  async getPoolTxs(poolName: string, offset = 0, limit = 10): Promise<any> {
    const params = {
      offset,
      limit,
      asset: poolName,
    };
    const response = await apiClient.get("actions", params);
    return response.data;
  }

  async getPools(period?: string): Promise<Pool[]> {
    const periodParam = period ?? "180d";
    const response = await apiClient.getExternal<Pool[]>(
      `${this.config.SERVER_URL}pools?period=${periodParam}`
    );
    return response.data;
  }

  async getPoolStats(poolName: string): Promise<PoolStats> {
    const response = await apiClient.getExternal<PoolStats>(
      `${this.config.SERVER_URL}pool/${poolName}/stats?period=all`
    );
    return response.data;
  }

  async getPoolDepth(
    poolName: string,
    count = 30,
    from?: string
  ): Promise<any> {
    let url = `history/depths/${poolName}?interval=day&count=${count}`;
    if (from) {
      url += `&from=${from}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  }

  async getVolumeHistory(): Promise<any> {
    const response = await apiClient.get(
      "history/liquidity_changes?interval=day&count=30"
    );
    return response.data;
  }

  async getSwapHistory(count = 30): Promise<any> {
    const response = await apiClient.get(
      `history/swaps?interval=day&count=${count}`
    );
    return response.data;
  }

  async getSwapsHistory(params?: Record<string, any>): Promise<any> {
    const response = await apiClient.get("history/swaps", params);
    return response.data;
  }

  async getTVLHistory(count = 90): Promise<TVLHistory[]> {
    const response = await apiClient.get<TVLHistory[]>(
      `history/tvl?interval=day&count=${count}`
    );
    return response.data;
  }

  async getLastTvl(): Promise<any> {
    const response = await apiClient.get("history/tvl");
    return response.data;
  }

  async getEarningsHistory(): Promise<EarningsHistory[]> {
    const response = await apiClient.get<EarningsHistory[]>(
      "history/earnings?interval=day&count=30"
    );
    return response.data;
  }

  async getEarnings(
    interval: string,
    count: number
  ): Promise<EarningsHistory[]> {
    const response = await apiClient.get<EarningsHistory[]>(
      `history/earnings?interval=${interval}&count=${count}`
    );
    return response.data;
  }

  async getEarningHistory(count = 30): Promise<EarningsHistory[]> {
    if (this.network === "mainnet") {
      const { getInfraEarnings } = await import("./infra");
      return getInfraEarnings({
        interval: "day",
        count,
      });
    }
    const response = await apiClient.get<EarningsHistory[]>(
      `history/earnings?interval=day&count=${count || 60}`
    );
    return response.data;
  }

  async getEarningLastDay(): Promise<any> {
    const response = await apiClient.get(
      "history/earnings?interval=day&count=2"
    );
    return response.data;
  }

  async getPoolVolume(poolName: string): Promise<any> {
    const response = await apiClient.get(
      `history/liquidity_changes?pool=${poolName}&interval=day&count=30`
    );
    return response.data;
  }

  async getNetwork(): Promise<Network> {
    const response = await apiClient.get<Network>("network");
    return response.data;
  }

  async getLatestBlocks(latestBlock: number, count = 10): Promise<any[]> {
    if (!latestBlock) {
      return [];
    }

    const blockNumbers = Array.from(
      { length: count },
      (_, i) => latestBlock - count + i + 1
    );

    const promises = blockNumbers.map((blockNum) => {
      return apiClient.get(`debug/block/${blockNum}`);
    });

    const responses = await Promise.all(promises);

    const blocks = responses.map((response, index) => {
      return response.data;
    });

    return blocks;
  }

  async getRevThorname(address: string): Promise<any> {
    const response = await apiClient.get(`thorname/rlookup/${address}`);
    return response.data;
  }

  async getMemberDetails(address: string): Promise<MemberDetails> {
    const response = await apiClient.get<MemberDetails>(`member/${address}`);
    return response.data;
  }

  async getSaverDetails(address: string): Promise<SaverDetails> {
    const response = await apiClient.get<SaverDetails>(`saver/${address}`);
    return response.data;
  }

  async getBorrowerDetails(address: string): Promise<BorrowerDetails> {
    const response = await apiClient.get<BorrowerDetails>(
      `borrower/${address}`
    );
    return response.data;
  }

  async getTCYDistribution(address: string): Promise<TCYDistribution> {
    const response = await apiClient.get<TCYDistribution>(
      `tcy/distribution/${address}`
    );
    return response.data;
  }
}

export const midgardAPI = new MidgardAPI();

export const getStats = () => midgardAPI.getStats();
export const getMidgardActions = (params?: Record<string, any>) =>
  midgardAPI.getMidgardActions(params);
export const getTxs = (
  offset = 0,
  limit = 10,
  otherParams?: Record<string, any>
) => midgardAPI.getTxs(offset, limit, otherParams);
export const getTx = (txid: string, limit = 10) =>
  midgardAPI.getTx(txid, limit);
export const getAddress = (address: string, offset = 0, limit = 10) =>
  midgardAPI.getAddress(address, offset, limit);
export const getPoolTxs = (poolName: string, offset = 0, limit = 10) =>
  midgardAPI.getPoolTxs(poolName, offset, limit);
export const getPools = (period?: string) => midgardAPI.getPools(period);
export const getPoolStats = (poolName: string) =>
  midgardAPI.getPoolStats(poolName);
export const getPoolDepth = (poolName: string, count = 30, from?: string) =>
  midgardAPI.getPoolDepth(poolName, count, from);
export const volumeHistory = () => midgardAPI.getVolumeHistory();
export const swapHistory = (count = 30) => midgardAPI.getSwapHistory(count);
export const getSwapsHistory = (params?: Record<string, any>) =>
  midgardAPI.getSwapsHistory(params);
export const getTVLHistory = (count = 90) => midgardAPI.getTVLHistory(count);
export const getLastTvl = () => midgardAPI.getLastTvl();
export const earningsHistory = () => midgardAPI.getEarningsHistory();
export const earnings = (interval: string, count: number) =>
  midgardAPI.getEarnings(interval, count);
export const getEarningHistory = (count = 30) =>
  midgardAPI.getEarningHistory(count);
export const earningLastDay = () => midgardAPI.getEarningLastDay();
export const getPoolVolume = (poolName: string) =>
  midgardAPI.getPoolVolume(poolName);
export const getNetwork = () => midgardAPI.getNetwork();
export const getLatestBlocks = (latestBlock: number, count = 10) =>
  midgardAPI.getLatestBlocks(latestBlock, count);
export const getRevThorname = (address: string) =>
  midgardAPI.getRevThorname(address);
export const getMemberDetails = (address: string) =>
  midgardAPI.getMemberDetails(address);
export const getSaverDetails = (address: string) =>
  midgardAPI.getSaverDetails(address);
export const getBorrowerDetails = (address: string) =>
  midgardAPI.getBorrowerDetails(address);
export const getTCYDistribution = (address: string) =>
  midgardAPI.getTCYDistribution(address);
