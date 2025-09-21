export * from "./config";
export * from "./client";

import { midgardAPI } from "./midgard";
import { thornodeAPI } from "./thornode";
import { middlewareAPI } from "./middleware";
import { infraAPI } from "./infra";
import { tendermintAPI } from "./tendermint";
import { insightsAPI } from "./insights";
import { apiClient } from "./client";

export { midgardAPI } from "./midgard";
export { thornodeAPI } from "./thornode";
export { middlewareAPI } from "./middleware";
export { infraAPI } from "./infra";
export { tendermintAPI } from "./tendermint";
export { insightsAPI } from "./insights";

export {
  getStats,
  getTxs,
  getTx,
  getAddress,
  getPoolStats,
  getPoolTxs,
  volumeHistory,
  swapHistory,
  getTVLHistory,
  earningsHistory,
  earnings,
  getPoolVolume,
  getLastTvl,
  getLatestBlocks,
  getRevThorname,
  getNetwork,
  getPoolDepth,
  getEarningHistory,
  getMemberDetails,
  getSaverDetails,
  earningLastDay,
  getBorrowerDetails,
  getMidgardActions,
  getSwapsHistory,
  getPools,
  getTCYDistribution,
} from "./midgard";

export {
  getMimir,
  getStakers,
  getOutboundFees,
  getCodes,
  getRunePoolProviders,
  getBalance,
  getLastBlockHeight,
  getBlockChainVersion,
  getRPCLastBlockHeight,
  getNativeTx,
  getThorNetwork,
  getInboundAddresses,
  getMimirVotes,
  getLpPositions,
  getPoolDetail,
  getAssets,
  getThorPools,
  getSupplyRune,
  getSupply,
  getYggdrasil,
  getAsgard,
  getAddresses,
  getOutbound,
  getScheduled,
  getThorchainTx,
  getNode as getThornodeNode,
  getSavers,
  getPol,
  getRunePool,
  getBorrowers,
  getConstants,
  getTxStages,
  getTxStatus,
  getStreamingSwaps,
  getThorname,
  getTradeAsset,
  getTradeAssets,
  getThorVersion,
  getTSSMetrics,
  getSecuredAssets,
  getTCYStaker,
  getThornodeDetailTx,
  getThornodeArchiveTx,
  getTxArchiveStatus,
  getUserLpPosition,
  getDerivedPoolDetail,
} from "./thornode";

export {
  getDashboardData,
  getDashboardPlots,
  getExtraNodesInfo,
  getTCY,
  getSaversInfo,
  getChainsHeight,
  getHolders,
  getPoolsHistory,
  getOldPoolsHistory,
  getServerTx,
  getRunePoolsInfo,
  getOldRunePools,
  getOldRunePoolProvidersInfo,
  getRunePoolProvidersInfo,
  getBorrowersInfo,
  getSwapsWeekly,
  getStatsDaily,
  getFeesRewardsMonthly,
  getAffiliateSwapsMonthly,
  getAffiliateSwapsWeekly,
  getNodeOverview,
  getAffiliateDaily,
  getActions,
  getCoinMarketInfo,
  getNodesInfo,
  getTopSwaps,
  getEarnings,
  getNodes as getMiddlewareNodes,
  getNodes,
  getNetworkAllocation,
  getReserveHistory,
  getVotes,
  getTopSwapsWeekly,
  getTopSwapsMonthly,
  getBurnedBlocks,
  getExecutionQuality,
  getAffiliateSwapsDaily,
  getAffiliateHistory,
  getAffiliateStats,
  getInfraRUJIMerge,
  getTcyInfo,
  getDenoms,
  getContracts,
  search,
  getSwapsByThorname,
  getBalanceHistory,
} from "./middleware";

export {
  getInfraEarnings,
  getTHORLastBlock,
  getBlockHeight,
  getQuote,
  getChurn,
} from "./infra";

export { getTendermintLatestBlocks } from "./tendermint";

export {
  getChurnHistory,
  getFlipTVL,
  getRunePrice,
  getDailySwap,
} from "./insights";

export const api = {
  midgard: midgardAPI,
  thornode: thornodeAPI,
  middleware: middlewareAPI,
  infra: infraAPI,
  tendermint: tendermintAPI,
  insights: insightsAPI,
  client: apiClient,
};

export default api;
