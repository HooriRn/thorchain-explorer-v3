import { apiClient } from "./client";
import { getNetworkConfig, getCurrentNetwork } from "./config";

export interface Mimir {
  [key: string]: any;
}

export interface Denom {
  [key: string]: any;
}

export interface Staker {
  [key: string]: any;
}

export interface OutboundFee {
  [key: string]: any;
}

export interface Code {
  [key: string]: any;
}

export interface RunePoolProvider {
  [key: string]: any;
}

export interface Balance {
  [key: string]: any;
}

export interface BlockHeight {
  [key: string]: any;
}

export interface ThorNetwork {
  [key: string]: any;
}

export interface InboundAddress {
  [key: string]: any;
}

export interface MimirVote {
  [key: string]: any;
}

export interface LpPosition {
  [key: string]: any;
}

export interface PoolDetail {
  [key: string]: any;
}

export interface Asset {
  [key: string]: any;
}

export interface ThorPool {
  [key: string]: any;
}

export interface Vault {
  [key: string]: any;
}

export interface Address {
  [key: string]: any;
}

export interface Outbound {
  [key: string]: any;
}

export interface Scheduled {
  [key: string]: any;
}

export interface ThorchainTx {
  [key: string]: any;
}

export interface Node {
  [key: string]: any;
}

export interface Saver {
  [key: string]: any;
}

export interface Pol {
  [key: string]: any;
}

export interface RunePool {
  [key: string]: any;
}

export interface Borrower {
  [key: string]: any;
}

export interface Constant {
  [key: string]: any;
}

export interface StreamingSwap {
  [key: string]: any;
}

export interface TxStage {
  [key: string]: any;
}

export interface TxStatus {
  [key: string]: any;
}

export interface Thorname {
  [key: string]: any;
}

export interface TradeAsset {
  [key: string]: any;
}

export interface ThorVersion {
  [key: string]: any;
}

export interface TSSMetric {
  [key: string]: any;
}

export interface SecuredAsset {
  [key: string]: any;
}

export interface TCYStaker {
  [key: string]: any;
}

export class ThornodeAPI {
  private network: string;
  private config: ReturnType<typeof getNetworkConfig>;

  constructor() {
    this.network = getCurrentNetwork();
    this.config = getNetworkConfig(this.network as any);
  }

  async getMimir(): Promise<Mimir> {
    const response = await apiClient.getExternal<Mimir>(
      `${this.config.THORNODE_URL}thorchain/mimir`
    );
    return response.data;
  }

  async getDenom(): Promise<Denom> {
    const response = await apiClient.getExternal<Denom>(
      `${this.config.THORNODE_URL}cosmos/bank/v1beta1/denoms_metadata`
    );
    return response.data;
  }

  async getStakers(): Promise<Staker[]> {
    const response = await apiClient.getExternal<Staker[]>(
      `${this.config.THORNODE_URL}thorchain/tcy_stakers`
    );
    return response.data;
  }

  async getOutboundFees(): Promise<OutboundFee[]> {
    const response = await apiClient.getExternal<OutboundFee[]>(
      `${this.config.THORNODE_URL}thorchain/outbound_fees`
    );
    return response.data;
  }

  async getCodes(): Promise<Code[]> {
    const response = await apiClient.getExternal<Code[]>(
      `${this.config.THORNODE_URL}thorchain/codes`
    );
    return response.data;
  }

  async getRunePoolProviders(): Promise<RunePoolProvider[]> {
    const response = await apiClient.getExternal<RunePoolProvider[]>(
      `${this.config.THORNODE_URL}thorchain/rune_providers`
    );
    return response.data;
  }

  async getBalance(address: string): Promise<Balance> {
    const response = await apiClient.getExternal<Balance>(
      `${this.config.THORNODE_URL}bank/balances/${address}`
    );
    return response.data;
  }

  async getLastBlockHeight(): Promise<BlockHeight> {
    const response = await apiClient.getExternal<BlockHeight>(
      `${this.config.THORNODE_URL}thorchain/lastblock`
    );
    return response.data;
  }

  async getBlockChainVersion(): Promise<any> {
    const response = await apiClient.getExternal(
      `${this.config.THORNODE_URL}thorchain/version`
    );
    return response.data;
  }

  async getRPCLastBlockHeight(): Promise<any> {
    const response = await apiClient.getExternal(
      `${this.config.THORNODE_URL}cosmos/base/tendermint/v1beta1/blocks/latest`
    );
    return response.data;
  }

  async getNativeTx(txID: string): Promise<any> {
    const response = await apiClient.getExternal(
      `${this.config.THORNODE_URL}cosmos/tx/v1beta1/txs/${txID}`
    );
    return response.data;
  }

  async getThornodeDetailTx(txID: string): Promise<any> {
    const response = await apiClient.getExternal(
      `${this.config.THORNODE_URL}thorchain/tx/details/${txID}`
    );
    return response.data;
  }

  async getThornodeArchiveTx(txID: string): Promise<any> {
    if (this.network === "mainnet") {
      const response = await apiClient.getExternal(
        `${this.config.ARCHIVE_THORNODE}thorchain/tx/details/${txID}`
      );
      return response.data;
    }

    const response = await apiClient.getExternal(
      `${this.config.THORNODE_URL}thorchain/tx/details/${txID}`
    );
    return response.data;
  }

  async getTxArchiveStatus(txID: string): Promise<any> {
    if (this.network === "mainnet") {
      const response = await apiClient.getExternal(
        `${this.config.ARCHIVE_THORNODE}thorchain/tx/status/${txID}`
      );
      return response.data;
    }

    const response = await apiClient.getExternal(
      `${this.config.THORNODE_URL}thorchain/tx/status/${txID}`
    );
    return response.data;
  }

  async getThorNetwork(): Promise<ThorNetwork> {
    const response = await apiClient.getExternal<ThorNetwork>(
      `${this.config.THORNODE_URL}thorchain/network`
    );
    return response.data;
  }

  async getInboundAddresses(): Promise<InboundAddress[]> {
    const response = await apiClient.getExternal<InboundAddress[]>(
      `${this.config.THORNODE_URL}thorchain/inbound_addresses`
    );
    return response.data;
  }

  async getMimirVotes(): Promise<MimirVote[]> {
    const response = await apiClient.getExternal<MimirVote[]>(
      `${this.config.THORNODE_URL}thorchain/mimir/nodes_all`
    );
    return response.data;
  }

  async getLpPositions(poolName: string): Promise<LpPosition[]> {
    const response = await apiClient.getExternal<LpPosition[]>(
      `${this.config.THORNODE_URL}thorchain/pool/${poolName}/liquidity_providers`
    );
    return response.data;
  }

  async getUserLpPosition(
    poolName: string,
    address: string
  ): Promise<LpPosition> {
    const response = await apiClient.getExternal<LpPosition>(
      `${this.config.THORNODE_URL}thorchain/pool/${poolName}/liquidity_provider/${address}`
    );
    return response.data;
  }

  async getPoolDetail(poolName: string): Promise<PoolDetail> {
    const response = await apiClient.getExternal<PoolDetail>(
      `${this.config.THORNODE_URL}thorchain/pool/${poolName}`
    );
    return response.data;
  }

  async getDerivedPoolDetail(poolName: string): Promise<PoolDetail> {
    const response = await apiClient.getExternal<PoolDetail>(
      `${this.config.THORNODE_URL}thorchain/dpool/${poolName}`
    );
    return response.data;
  }

  async getAssets(): Promise<Asset[]> {
    const response = await apiClient.getExternal<Asset[]>(
      `${this.config.THORNODE_URL}cosmos/bank/v1beta1/supply`
    );
    return response.data;
  }

  async getSupplyRune(): Promise<any> {
    const response = await apiClient.getExternal(
      `${this.config.THORNODE_URL}cosmos/bank/v1beta1/supply/rune`
    );
    return response.data;
  }

  async getSupply(): Promise<any> {
    const response = await apiClient.getExternal(
      `${this.config.THORNODE_URL}cosmos/bank/v1beta1/supply/by_denom?denom=rune`
    );
    return response.data;
  }

  async getThorPools(): Promise<ThorPool[]> {
    const response = await apiClient.getExternal<ThorPool[]>(
      `${this.config.THORNODE_URL}thorchain/pools`
    );
    return response.data;
  }

  async getYggdrasil(): Promise<Vault[]> {
    const response = await apiClient.getExternal<Vault[]>(
      `${this.config.THORNODE_URL}thorchain/vaults/yggdrasil`
    );
    return response.data;
  }

  async getAsgard(): Promise<Vault[]> {
    const response = await apiClient.getExternal<Vault[]>(
      `${this.config.THORNODE_URL}thorchain/vaults/asgard`
    );
    return response.data;
  }

  async getAddresses(): Promise<Address[]> {
    const response = await apiClient.getExternal<Address[]>(
      `${this.config.THORNODE_URL}cosmos/auth/v1beta1/accounts`
    );
    return response.data;
  }

  async getOutbound(): Promise<Outbound[]> {
    const response = await apiClient.getExternal<Outbound[]>(
      `${this.config.THORNODE_URL}thorchain/queue/outbound`
    );
    return response.data;
  }

  async getScheduled(): Promise<Scheduled[]> {
    const response = await apiClient.getExternal<Scheduled[]>(
      `${this.config.THORNODE_URL}thorchain/queue/scheduled`
    );
    return response.data;
  }

  async getThorchainTx(txID: string): Promise<ThorchainTx> {
    const response = await apiClient.getExternal<ThorchainTx>(
      `${this.config.THORNODE_URL}thorchain/tx/${txID}`
    );
    return response.data;
  }

  async getNodes(): Promise<Node[]> {
    const response = await apiClient.getExternal<Node[]>(
      `${this.config.THORNODE_URL}thorchain/nodes`
    );
    return response.data;
  }

  async getNode(addr: string): Promise<Node> {
    const response = await apiClient.getExternal<Node>(
      `${this.config.THORNODE_URL}thorchain/node/${addr}`
    );
    return response.data;
  }

  async getSavers(poolName?: string): Promise<Saver[]> {
    const url = poolName
      ? `${this.config.THORNODE_URL}thorchain/savers/${poolName}`
      : `${this.config.THORNODE_URL}thorchain/savers`;
    const response = await apiClient.getExternal<Saver[]>(url);
    return response.data;
  }

  async getPol(): Promise<Pol> {
    const response = await apiClient.getExternal<Pol>(
      `${this.config.THORNODE_URL}thorchain/pol`
    );
    return response.data;
  }

  async getRunePool(): Promise<RunePool> {
    const response = await apiClient.getExternal<RunePool>(
      `${this.config.THORNODE_URL}thorchain/runepool`
    );
    return response.data;
  }

  async getBorrowers(pool?: string): Promise<Borrower[]> {
    const url = pool
      ? `${this.config.THORNODE_URL}thorchain/borrowers/${pool}`
      : `${this.config.THORNODE_URL}thorchain/borrowers`;
    const response = await apiClient.getExternal<Borrower[]>(url);
    return response.data;
  }

  async getConstants(): Promise<Constant> {
    const response = await apiClient.getExternal<Constant>(
      `${this.config.THORNODE_URL}thorchain/constants`
    );
    return response.data;
  }

  async getStreamingSwaps(): Promise<StreamingSwap[]> {
    const response = await apiClient.getExternal<StreamingSwap[]>(
      `${this.config.THORNODE_URL}thorchain/swaps/streaming`
    );
    return response.data;
  }

  async getTxStages(txid: string): Promise<TxStage[]> {
    const response = await apiClient.getExternal<TxStage[]>(
      `${this.config.THORNODE_URL}thorchain/tx/stages/${txid}`
    );
    return response.data;
  }

  async getTxStatus(txid: string): Promise<TxStatus> {
    const response = await apiClient.getExternal<TxStatus>(
      `${this.config.THORNODE_URL}thorchain/tx/status/${txid}`
    );
    return response.data;
  }

  async getThorname(name: string): Promise<Thorname> {
    const response = await apiClient.getExternal<Thorname>(
      `${this.config.THORNODE_URL}thorchain/thorname/${name}`
    );
    return response.data;
  }

  async getTradeAsset(address: string): Promise<TradeAsset> {
    const response = await apiClient.getExternal<TradeAsset>(
      `${this.config.THORNODE_URL}thorchain/trade_asset/${address}`
    );
    return response.data;
  }

  async getTradeAssets(): Promise<TradeAsset[]> {
    const response = await apiClient.getExternal<TradeAsset[]>(
      `${this.config.THORNODE_URL}thorchain/trade_assets`
    );
    return response.data;
  }

  async getThorVersion(): Promise<ThorVersion> {
    const response = await apiClient.getExternal<ThorVersion>(
      `${this.config.THORNODE_URL}thorchain/version`
    );
    return response.data;
  }

  async getTSSMetrics(): Promise<TSSMetric[]> {
    const response = await apiClient.getExternal<TSSMetric | any>(
      `${this.config.THORNODE_URL}thorchain/metrics`
    );
    return response.data;
  }

  async getSecuredAssets(): Promise<SecuredAsset[]> {
    const response = await apiClient.getExternal<SecuredAsset[]>(
      `${this.config.THORNODE_URL}thorchain/secured_assets`
    );
    return response.data;
  }

  async getTCYStaker(address: string): Promise<TCYStaker> {
    const response = await apiClient.getExternal<TCYStaker>(
      `${this.config.THORNODE_URL}thorchain/tcy_staker/${address}`
    );
    return response.data;
  }
}

export const thornodeAPI = new ThornodeAPI();

export const getMimir = () => thornodeAPI.getMimir();
export const getDenom = () => thornodeAPI.getDenom();
export const getStakers = () => thornodeAPI.getStakers();
export const getOutboundFees = () => thornodeAPI.getOutboundFees();
export const getCodes = () => thornodeAPI.getCodes();
export const getRunePoolProviders = () => thornodeAPI.getRunePoolProviders();
export const getBalance = (address: string) => thornodeAPI.getBalance(address);
export const getLastBlockHeight = () => thornodeAPI.getLastBlockHeight();
export const getBlockChainVersion = () => thornodeAPI.getBlockChainVersion();
export const getRPCLastBlockHeight = () => thornodeAPI.getRPCLastBlockHeight();
export const getNativeTx = (txID: string) => thornodeAPI.getNativeTx(txID);
export const getThornodeDetailTx = (txID: string) =>
  thornodeAPI.getThornodeDetailTx(txID);
export const getThornodeArchiveTx = (txID: string) =>
  thornodeAPI.getThornodeArchiveTx(txID);
export const getTxArchiveStatus = (txID: string) =>
  thornodeAPI.getTxArchiveStatus(txID);
export const getThorNetwork = () => thornodeAPI.getThorNetwork();
export const getInboundAddresses = () => thornodeAPI.getInboundAddresses();
export const getMimirVotes = () => thornodeAPI.getMimirVotes();
export const getLpPositions = (poolName: string) =>
  thornodeAPI.getLpPositions(poolName);
export const getUserLpPosition = (poolName: string, address: string) =>
  thornodeAPI.getUserLpPosition(poolName, address);
export const getPoolDetail = (poolName: string) =>
  thornodeAPI.getPoolDetail(poolName);
export const getDerivedPoolDetail = (poolName: string) =>
  thornodeAPI.getDerivedPoolDetail(poolName);
export const getAssets = () => thornodeAPI.getAssets();
export const getSupplyRune = () => thornodeAPI.getSupplyRune();
export const getSupply = () => thornodeAPI.getSupply();
export const getThorPools = () => thornodeAPI.getThorPools();
export const getYggdrasil = () => thornodeAPI.getYggdrasil();
export const getAsgard = () => thornodeAPI.getAsgard();
export const getAddresses = () => thornodeAPI.getAddresses();
export const getOutbound = () => thornodeAPI.getOutbound();
export const getScheduled = () => thornodeAPI.getScheduled();
export const getThorchainTx = (txID: string) =>
  thornodeAPI.getThorchainTx(txID);
export const getNodes = () => thornodeAPI.getNodes();
export const getNode = (addr: string) => thornodeAPI.getNode(addr);
export const getSavers = (poolName?: string) => thornodeAPI.getSavers(poolName);
export const getPol = () => thornodeAPI.getPol();
export const getRunePool = () => thornodeAPI.getRunePool();
export const getBorrowers = (pool?: string) => thornodeAPI.getBorrowers(pool);
export const getConstants = () => thornodeAPI.getConstants();
export const getStreamingSwaps = () => thornodeAPI.getStreamingSwaps();
export const getTxStages = (txid: string) => thornodeAPI.getTxStages(txid);
export const getTxStatus = (txid: string) => thornodeAPI.getTxStatus(txid);
export const getThorname = (name: string) => thornodeAPI.getThorname(name);
export const getTradeAsset = (address: string) =>
  thornodeAPI.getTradeAsset(address);
export const getTradeAssets = () => thornodeAPI.getTradeAssets();
export const getThorVersion = () => thornodeAPI.getThorVersion();
export const getTSSMetrics = () => thornodeAPI.getTSSMetrics();
export const getSecuredAssets = () => thornodeAPI.getSecuredAssets();
export const getTCYStaker = (address: string) =>
  thornodeAPI.getTCYStaker(address);
