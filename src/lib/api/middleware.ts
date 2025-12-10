import { apiClient } from "./client";
import { getNetworkConfig, getCurrentNetwork } from "./config";

export interface DashboardData {
  [key: string]: any;
}

export interface DashboardPlot {
  [key: string]: any;
}

export interface ExtraNodeInfo {
  [key: string]: any;
}

export interface TCY {
  [key: string]: any;
}

export interface SaverInfo {
  [key: string]: any;
}

export interface ChainHeight {
  [key: string]: any;
}

export interface Holder {
  [key: string]: any;
}

export interface PoolHistory {
  [key: string]: any;
}

export interface ServerTx {
  [key: string]: any;
}

export interface RunePoolInfo {
  [key: string]: any;
}

export interface BorrowerInfo {
  [key: string]: any;
}

export interface SwapWeekly {
  [key: string]: any;
}

export interface StatsDaily {
  [key: string]: any;
}

export interface FeesRewardsMonthly {
  [key: string]: any;
}

export interface AffiliateSwap {
  [key: string]: any;
}

export interface NodeOverview {
  [key: string]: any;
}

export interface Action {
  [key: string]: any;
}

export interface CoinMarketInfo {
  [key: string]: any;
}

export interface NodeInfo {
  [key: string]: any;
}

export interface TopSwap {
  [key: string]: any;
}

export interface Earning {
  [key: string]: any;
}

export interface Node {
  [key: string]: any;
}

export interface NetworkAllocation {
  [key: string]: any;
}

export interface ReserveHistory {
  [key: string]: any;
}

export interface Vote {
  [key: string]: any;
}

export interface BurnedBlock {
  [key: string]: any;
}

export interface ExecutionQuality {
  [key: string]: any;
}

export interface AffiliateHistory {
  [key: string]: any;
}

export interface TCYInfo {
  [key: string]: any;
}

export interface Denom {
  [key: string]: any;
}

export interface Contract {
  [key: string]: any;
}

export interface BalanceHistory {
  [key: string]: any;
}

export interface SearchResult {
  [key: string]: any;
}

export interface SwapByThorname {
  [key: string]: any;
}

export interface AffiliateStat {
  [key: string]: any;
}

export class MiddlewareAPI {
  private network: string;
  private config: ReturnType<typeof getNetworkConfig>;
  private fetchDataCancel: AbortController | null = null;

  constructor() {
    this.network = getCurrentNetwork();
    this.config = getNetworkConfig(this.network as any);
  }

  async getDashboardData(): Promise<DashboardData> {
    const response = await apiClient.getExternal<DashboardData>(
      `${this.config.SERVER_URL}api/dashboardData`
    );
    return response.data;
  }

  async getDashboardPlots(): Promise<DashboardPlot[]> {
    const response = await apiClient.getExternal<DashboardPlot[]>(
      `${this.config.SERVER_URL}api/dashboardPlots`
    );
    return response.data;
  }

  async getExtraNodesInfo(): Promise<ExtraNodeInfo[]> {
    const response = await apiClient.getExternal<ExtraNodeInfo[]>(
      `${this.config.SERVER_URL}api/extraNodesInfo`
    );
    return response.data;
  }

  async getNodesInfo(): Promise<NodeInfo[]> {
    const response = await apiClient.getExternal<NodeInfo[]>(
      `${this.config.SERVER_URL}api/nodesInfo`
    );
    return response.data;
  }

  async getNodeOverview(): Promise<NodeOverview> {
    const response = await apiClient.getExternal<NodeOverview>(
      `${this.config.SERVER_URL}api/nodeOverview`
    );
    return response.data;
  }

  async getNodes(): Promise<Node[]> {
    const response = await apiClient.getExternal<Node[]>(
      `${this.config.SERVER_URL}nodes`
    );
    return response.data;
  }

  async getTCY(address: string): Promise<TCY> {
    const response = await apiClient.getExternal<TCY>(
      `${this.config.SERVER_URL}tcy/distribution/${address}`
    );
    return response.data;
  }

  async getTcyInfo(params?: Record<string, any>): Promise<TCYInfo> {
    const response = await apiClient.getExternal<TCYInfo>(
      `${this.config.SERVER_URL}api/tcyInfo`,
      params
    );
    return response.data;
  }

  async getSaversInfo(): Promise<SaverInfo[]> {
    const response = await apiClient.getExternal<SaverInfo[]>(
      `${this.config.SERVER_URL}api/saversInfo`
    );
    return response.data;
  }

  async getChainsHeight(): Promise<ChainHeight[]> {
    const response = await apiClient.getExternal<ChainHeight[]>(
      `${this.config.SERVER_URL}api/chainsHeight`
    );
    return response.data;
  }

  async getHolders(asset = "THOR.RUNE"): Promise<Holder[]> {
    const response = await apiClient.getExternal<Holder[]>(
      `${this.config.SERVER_URL}holders`,
      { asset }
    );
    return response.data;
  }

  async getPoolsHistory(period = ""): Promise<PoolHistory[]> {
    if (period === "day") {
      period = "";
    }
    const response = await apiClient.getExternal<PoolHistory[]>(
      `${this.config.SERVER_URL}api/historyPools${period}`
    );
    return response.data;
  }

  async getOldPoolsHistory(period = ""): Promise<PoolHistory[]> {
    if (period === "day") {
      period = "";
    }
    const response = await apiClient.getExternal<PoolHistory[]>(
      `${this.config.SERVER_URL}api/oldHistoryPools${period}`
    );
    return response.data;
  }

  async getServerTx(txid: string): Promise<ServerTx> {
    const response = await apiClient.getExternal<ServerTx>(
      `${this.config.SERVER_URL}tx/${txid}`
    );
    return response.data;
  }

  async getRunePoolsInfo(): Promise<RunePoolInfo[]> {
    const response = await apiClient.getExternal<RunePoolInfo[]>(
      `${this.config.SERVER_URL}api/runePools`
    );
    return response.data;
  }

  async getOldRunePools(): Promise<RunePoolInfo[]> {
    const response = await apiClient.getExternal<RunePoolInfo[]>(
      `${this.config.SERVER_URL}api/oldRunePool`
    );
    return response.data;
  }

  async getOldRunePoolProvidersInfo(): Promise<RunePoolInfo[]> {
    const response = await apiClient.getExternal<RunePoolInfo[]>(
      `${this.config.SERVER_URL}api/oldRunePoolProviders`
    );
    return response.data;
  }

  async getRunePoolProvidersInfo(): Promise<RunePoolInfo[]> {
    const response = await apiClient.getExternal<RunePoolInfo[]>(
      `${this.config.SERVER_URL}api/runePoolProviders`
    );
    return response.data;
  }

  async getBorrowersInfo(): Promise<BorrowerInfo[]> {
    const response = await apiClient.getExternal<BorrowerInfo[]>(
      `${this.config.SERVER_URL}api/borrowers`
    );
    return response.data;
  }

  async getSwapsWeekly(): Promise<SwapWeekly[]> {
    const response = await apiClient.getExternal<SwapWeekly[]>(
      `${this.config.SERVER_URL}api/swapsWeekly`
    );
    return response.data;
  }

  async getTopSwaps(): Promise<TopSwap[]> {
    const response = await apiClient.getExternal<TopSwap[]>(
      `${this.config.SERVER_URL}api/swaps`
    );
    return response.data;
  }

  async getTopSwapsWeekly(): Promise<TopSwap[]> {
    const response = await apiClient.getExternal<TopSwap[]>(
      `${this.config.SERVER_URL}api/swapsTopWeekly`
    );
    return response.data;
  }

  async getTopSwapsMonthly(): Promise<TopSwap[]> {
    const response = await apiClient.getExternal<TopSwap[]>(
      `${this.config.SERVER_URL}api/swapsTopMonthly`
    );
    return response.data;
  }

  async getStatsDaily(): Promise<StatsDaily[]> {
    const response = await apiClient.getExternal<StatsDaily[]>(
      `${this.config.SERVER_URL}api/statsDaily`
    );
    return response.data;
  }

  async getFeesRewardsMonthly(): Promise<FeesRewardsMonthly[]> {
    const response = await apiClient.getExternal<FeesRewardsMonthly[]>(
      `${this.config.SERVER_URL}api/feesRewardsMonthly`
    );
    return response.data;
  }

  async getAffiliateSwapsMonthly(): Promise<AffiliateSwap[]> {
    const response = await apiClient.getExternal<AffiliateSwap[]>(
      `${this.config.SERVER_URL}api/monthlyLeaderboard`
    );
    return response.data;
  }

  async getAffiliateSwapsWeekly(): Promise<AffiliateSwap[]> {
    const response = await apiClient.getExternal<AffiliateSwap[]>(
      `${this.config.SERVER_URL}api/weeklyLeaderboard`
    );
    return response.data;
  }

  async getAffiliateSwapsDaily(): Promise<AffiliateSwap[]> {
    const response = await apiClient.getExternal<AffiliateSwap[]>(
      `${this.config.SERVER_URL}api/dailyLeaderboard`
    );
    return response.data;
  }

  async getAffiliateDaily(): Promise<AffiliateSwap[]> {
    const response = await apiClient.getExternal<AffiliateSwap[]>(
      `${this.config.SERVER_URL}api/affiliateDaily`
    );
    return response.data;
  }

  async getAffiliateHistory(
    params: Record<string, any>
  ): Promise<AffiliateHistory[]> {
    try {
      const response = await apiClient.get(
        `history/affiliate?interval=${params.interval}&count=${params.count}`
      );
      return response.data;
    } catch (error) {
      try {
        const externalResponse = await apiClient.getExternal<
          AffiliateHistory[]
        >(`${this.config.SERVER_URL}affiliate`, { params });
        return externalResponse.data;
      } catch (externalError) {
        console.error(
          "❌ Both Midgard and external API failed for affiliate history:",
          externalError
        );
        return [];
      }
    }
  }

  async getAffiliateStats(
    params?: Record<string, any>
  ): Promise<AffiliateStat[]> {
    const response = await apiClient.getExternal<AffiliateStat[]>(
      `${this.config.SERVER_URL}affiliate/stats`,
      params
    );
    return response.data;
  }

  async getActions(params?: Record<string, any>): Promise<Action[]> {
    if (this.fetchDataCancel) {
      this.fetchDataCancel.abort();
    }

    this.fetchDataCancel = new AbortController();

    const response = await apiClient.getExternal<Action[]>(
      `${this.config.SERVER_URL}actions`,
      params,
      { signal: this.fetchDataCancel.signal }
    );
    return response.data;
  }

  async getCoinMarketInfo(): Promise<CoinMarketInfo[]> {
    const response = await apiClient.getExternal<CoinMarketInfo[]>(
      `${this.config.SERVER_URL}api/coinmarketCap`
    );
    return response.data;
  }

  async getEarnings(): Promise<Earning[]> {
    const response = await apiClient.getExternal<Earning[]>(
      `${this.config.SERVER_URL}api/rawEarnings`
    );
    return response.data;
  }

  async getNetworkAllocation(): Promise<NetworkAllocation> {
    const response = await apiClient.getExternal<NetworkAllocation>(
      `${this.config.SERVER_URL}api/networkAllocation`
    );
    return response.data;
  }

  async getReserveHistory(): Promise<ReserveHistory[]> {
    const response = await apiClient.getExternal<ReserveHistory[]>(
      `${this.config.SERVER_URL}api/reserve`
    );
    return response.data;
  }

  async getVotes(period = "30d"): Promise<Vote[]> {
    const response = await apiClient.getExternal<Vote[]>(
      `${this.config.SERVER_URL}votes`,
      { period }
    );
    return response.data;
  }

  async getBurnedBlocks(): Promise<any> {
    const response = await apiClient.getExternal(
      `${this.config.SERVER_URL}api/burned`
    );
    return response.data;
  }

  async getExecutionQuality(): Promise<ExecutionQuality[]> {
    const response = await apiClient.getExternal<ExecutionQuality[]>(
      `${this.config.SERVER_URL}api/executionQuality`
    );
    return response.data;
  }

  async getInfraRUJIMerge(): Promise<any> {
    const response = await apiClient.getExternal(
      `${this.config.SERVER_URL}api/rujiMerge`
    );
    return response.data;
  }

  async getRUJIStats(): Promise<any> {
    const response = await apiClient.getExternal(
      `${this.config.SERVER_URL}api/rujiStats`
    );
    return response.data;
  }

  async getDenoms(): Promise<Denom[]> {
    const response = await apiClient.getExternal<Denom[]>(
      `${this.config.SERVER_URL}api/denoms`
    );
    return response.data;
  }

  async getContracts(): Promise<Contract[]> {
    const response = await apiClient.getExternal<Contract[]>(
      `${this.config.SERVER_URL}api/contracts`
    );
    return response.data;
  }

  async getBalanceHistory(
    address: string,
    interval = "day",
    count = 30
  ): Promise<BalanceHistory[]> {
    const response = await apiClient.getExternal<BalanceHistory[]>(
      `${this.config.SERVER_URL}api/balanceHistory`,
      { address, interval, count }
    );
    return response.data;
  }

  async search(query: string): Promise<SearchResult[]> {
    const response = await apiClient.getExternal<SearchResult[]>(
      `${this.config.SERVER_URL}search?filter=${query}`,
      { q: query }
    );
    return response.data;
  }

  async getSwapsByThorname(
    thorname: string,
    period = "30d"
  ): Promise<SwapByThorname[]> {
    const params: Record<string, any> = {
      period,
    };

    if (thorname && thorname.trim() !== '') {
      params.thorname = thorname;
    }

    const response = await apiClient.getExternal<SwapByThorname[]>(
      `${this.config.SERVER_URL}swaps`,
      params
    );
    return response.data;
  }
}

export const middlewareAPI = new MiddlewareAPI();

export const getDashboardData = () => middlewareAPI.getDashboardData();
export const getDashboardPlots = () => middlewareAPI.getDashboardPlots();
export const getExtraNodesInfo = () => middlewareAPI.getExtraNodesInfo();
export const getTCY = (address: string) => middlewareAPI.getTCY(address);
export const getSaversInfo = () => middlewareAPI.getSaversInfo();
export const getChainsHeight = () => middlewareAPI.getChainsHeight();
export const getHolders = (asset = "THOR.RUNE") =>
  middlewareAPI.getHolders(asset);
export const getPoolsHistory = (period = "") =>
  middlewareAPI.getPoolsHistory(period);
export const getOldPoolsHistory = (period = "") =>
  middlewareAPI.getOldPoolsHistory(period);
export const getServerTx = (txid: string) => middlewareAPI.getServerTx(txid);
export const getRunePoolsInfo = () => middlewareAPI.getRunePoolsInfo();
export const getOldRunePools = () => middlewareAPI.getOldRunePools();
export const getOldRunePoolProvidersInfo = () =>
  middlewareAPI.getOldRunePoolProvidersInfo();
export const getRunePoolProvidersInfo = () =>
  middlewareAPI.getRunePoolProvidersInfo();
export const getBorrowersInfo = () => middlewareAPI.getBorrowersInfo();
export const getSwapsWeekly = () => middlewareAPI.getSwapsWeekly();
export const getStatsDaily = () => middlewareAPI.getStatsDaily();
export const getFeesRewardsMonthly = () =>
  middlewareAPI.getFeesRewardsMonthly();
export const getAffiliateSwapsMonthly = () =>
  middlewareAPI.getAffiliateSwapsMonthly();
export const getAffiliateSwapsWeekly = () =>
  middlewareAPI.getAffiliateSwapsWeekly();
export const getAffiliateSwapsDaily = () =>
  middlewareAPI.getAffiliateSwapsDaily();
export const getNodeOverview = () => middlewareAPI.getNodeOverview();
export const getAffiliateDaily = () => middlewareAPI.getAffiliateDaily();
export const getActions = (params?: Record<string, any>) =>
  middlewareAPI.getActions(params);
export const getCoinMarketInfo = () => middlewareAPI.getCoinMarketInfo();
export const getNodesInfo = () => middlewareAPI.getNodesInfo();
export const getTopSwaps = () => middlewareAPI.getTopSwaps();
export const getTopSwapsWeekly = () => middlewareAPI.getTopSwapsWeekly();
export const getTopSwapsMonthly = () => middlewareAPI.getTopSwapsMonthly();
export const getEarnings = () => middlewareAPI.getEarnings();
export const getNodes = () => middlewareAPI.getNodes();
export const getNetworkAllocation = () => middlewareAPI.getNetworkAllocation();
export const getReserveHistory = () => middlewareAPI.getReserveHistory();
export const getVotes = (period = "30d") => middlewareAPI.getVotes(period);
export const getBurnedBlocks = () => middlewareAPI.getBurnedBlocks();
export const getInfraRUJIMerge = () => middlewareAPI.getInfraRUJIMerge();
export const getRUJIStats = () => middlewareAPI.getRUJIStats();
export const getExecutionQuality = () => middlewareAPI.getExecutionQuality();
export const getAffiliateHistory = (params?: Record<string, any>) =>
  middlewareAPI.getAffiliateHistory(params);
export const getTcyInfo = (params?: Record<string, any>) =>
  middlewareAPI.getTcyInfo(params);
export const getDenoms = () => middlewareAPI.getDenoms();
export const getContracts = () => middlewareAPI.getContracts();
export const getBalanceHistory = (
  address: string,
  interval = "day",
  count = 30
) => middlewareAPI.getBalanceHistory(address, interval, count);
export const search = (query: string) => middlewareAPI.search(query);
export const getSwapsByThorname = (thorname: string, period = "30d") =>
  middlewareAPI.getSwapsByThorname(thorname, period);
export const getAffiliateStats = (params?: Record<string, any>) =>
  middlewareAPI.getAffiliateStats(params);
