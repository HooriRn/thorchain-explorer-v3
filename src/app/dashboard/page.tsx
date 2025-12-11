"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import moment from "moment";
import { range, orderBy } from "lodash";
import {
  formatNumberToString,
  formatPercentToString,
  number,
  formatTrendNumber,
  formatTrendCurrency,
  formatTrendPercentage,
} from "@/utils/format";
import { formatRune } from "@/utils/global";
import { getChartColor, getCurrentChartTheme } from "@/utils/global";
import Page from "@/components/PageContainer";
import Card from "@/components/ui/Card";
import NetworkStats from "@/app/dashboard/NetworkStats";
import LatestTransactions from "@/app/dashboard/LatestTransactions";
import LatestBlocks from "@/app/dashboard/LatestBlocks";
import InfoCard from "@/components/InfoCard";
import AffiliateTables from "@/app/insights/leaderboard/component/affiliateTables";
import Outbounds from "@/components/Outbounds";
import Streaming from "@/components/Streaming";
import SwapVolumeChart from "@/components/SwapVolumeChart";
import PoolsVolumeChart from "@/components/PoolsVolumeChart";
import EarningsChart from "@/components/EarningsChart";
import LPEarningsChart from "@/components/LPEarningsChart";
import AffiliateFeeChart from "@/components/AffiliateFeeChart";
import styles from "./page.module.css";

import ArrowRightIcon from "@/assets/images/arrow-right.svg";
import {
  useRunePrice,
  usePools,
  useTheme,
  useSetRunePrice,
} from "@/lib/store";

import {
  isMainnet,
} from "@/utils/global";
import { assetFromString } from "@/utils/index";
import { blockTime } from "@/lib/utils";

const OverviewPage = () => {
  const router = useRouter();
  const theme = useTheme();
  const [burnedBlocks, setBurnedBlocks] = useState<
    Array<{
      blockHeight: number;
      timestamp: number;
      burnedAmount: number;
      devAmount: number;
      poolAmount: number;
      bondAmount: number;
    }>
  >([]);
  const [affiliateData, setAffiliateData] = useState<
    {
      affiliate: string;
      affiliate_fees_usd: number;
      total_swaps: number;
      total_volume_usd: number;
      vc: number;
      avg_bps: number;
      multi?: boolean;
    }[]
  >([]);

  const [polOverview, setPolOverview] = useState<any>({});
  const [lastblock, setLastblock] = useState<any>(null);
  const [stats, setStats] = useState<any>({});
  const [totalAddresses, setTotalAddresses] = useState<number | null>(null);
  const [swapHistory, setSwapHistory] = useState<any>(null);
  const [earningsHistory, setEarningsHistory] = useState<any>(null);
  const [poolEarnings, setPoolEarnings] = useState<any>(null);
  const [affiliateChart, setAffiliateChart] = useState<any>(null);
  const [thornameData, setThornameData] = useState<any>(null);
  const [runeSupply, setRuneSupply] = useState<number | null>(null);
  const [lastHeight, setLastHeight] = useState<number | null>(null);
  const [txs, setTxs] = useState<any>(null);
  const [totalSwapVolume, setTotalSwapVolume] = useState<number | null>(null);
  const [totalSwap24USD, setTotalSwap24USD] = useState<number | null>(null);
  const [affiliateEarning, setAffiliateEarning] = useState(0);
  const [earnings24USD, setEarnings24USD] = useState<number | null>(null);
  const [totalSwapVolumeUSD, setTotalSwapVolumeUSD] = useState<number | null>(
    null
  );
  const [network, setNetwork] = useState<any>(undefined);
  const [chainsHeight, setChainsHeight] = useState(undefined);

  const [poolsOption, setPoolsOption] = useState<any>(null);
  const [poolsData, setPoolsData] = useState<any[]>([]);
  const [totalValuePooled, setTotalValuePooled] = useState<number | null>(null);

  const [totalBurnedRune, setTotalBurnedRune] = useState<number | null>(null);

  const [poolMode, setPoolMode] = useState("total-earnings");
  const [swapMode, setSwapMode] = useState("swap-vol");
  const [mimirInfo, setMimirInfo] = useState<any>(null);
  const [volumeUSDData, setVolumeUSDData] = useState<any>(null);
  const [tcyInfo, setTcyInfo] = useState<any>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  const runePrice = useRunePrice();
  const setRunePrice = useSetRunePrice();
  const pools = usePools();

  useEffect(() => {
    fetchData();
    getBurnData();
    const updateChainsHeight = async () => {
      try {
        const response = await fetch("/api/chains-height");
        const data = await response.json();
        if (data.success) {
          setChainsHeight(data.data);
        }
      } catch (error) {}
    };
    updateChainsHeight();

    const interval = setInterval(() => {
      getNetworkStatus();
      getBurnData();
      updateChainsHeight();
      updateRunePool();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchDashboardData(),
        fetchTCYInfo(),
        fetchPoolsData(),
        fetchEarningsData(),
        fetchAffiliateData(),
        fetchNetworkData(),
        fetchAlternativeData(),
      ]);

      await fetchAffiliateChartData();

      await updateRunePool();
    } catch (error) {}
  };

  const fetchDashboardData = async () => {
    try {
      const dashboardResponse = await fetch("/api/dashboard");
      if (!dashboardResponse.ok) {
        return;
      }

      const dashboardData = await dashboardResponse.json();

      if (dashboardData.success && dashboardData) {
        setStats(dashboardData.stats);
        setRuneSupply(+dashboardData.runeSupply?.amount?.amount / 10 ** 8);
        setLastblock(dashboardData.lastBlockHeight);

        const latestTransactions =
          dashboardData.txs?.actions?.slice(0, 10) || [];
        setTxs(latestTransactions);

        setTotalSwap24USD(+dashboardData.stats?.volume24USD);

        if (dashboardData.networkData) {
          setNetwork(dashboardData.networkData);
        }

        setEarnings24USD(
          (dashboardData.stats.earnings24 / 1e8) *
            +dashboardData.stats.runePriceUSD
        );

        if (dashboardData.stats.runePriceUSD) {
          setRunePrice(Number.parseFloat(dashboardData.stats.runePriceUSD));
        }
      }
    } catch (error) {}
  };

  const fetchTCYInfo = async () => {
    try {
      const tcyResponse = await fetch("/api/tcy-info");
      if (tcyResponse.ok) {
        const tcyData = await tcyResponse.json();
        if (tcyData.success) {
          setTcyInfo(tcyData.data);
        }
      }
    } catch (error) {}
  };

  const fetchPoolsData = async () => {
    try {
      const poolsResponse = await fetch("/api/pools");

      if (poolsResponse.ok) {
        const poolsResponseData = await poolsResponse.json();

        if (
          poolsResponseData.success &&
          Array.isArray(poolsResponseData.data)
        ) {
          formatPoolsData(poolsResponseData.data);
        } else {
        }
      } else {
      }
    } catch (error) {}
  };

  const fetchEarningsData = async () => {
    try {
      const plotsResponse = await fetch("/api/dashboard-plots");
      if (plotsResponse.ok) {
        const plotsData = await plotsResponse.json();
        if (plotsData.success) {
          if (plotsData.earning) {
            try {
              setPoolEarnings(plotsData.earning);
              setEarningsHistory(plotsData.earning);
            } catch (error) {}
          }
          if (plotsData.swaps) {
            setSwapHistory(plotsData.swaps);
            if (plotsData.swaps?.meta) {
              setTotalSwapVolumeUSD(plotsData.swaps.meta.totalVolumeUSD);
              setTotalSwapVolume(plotsData.swaps.meta.totalVolume);
            }
          }
        }
      }

      const earningsResponse = await fetch("/api/earnings");
      if (earningsResponse.ok) {
        const earningsData = await earningsResponse.json();
        if (earningsData.success) {
          const burnedPool = earningsData?.meta?.pools?.find(
            (p: any) => p.pool === "income_burn"
          );
          setTotalBurnedRune(burnedPool ? burnedPool.earnings / 1e8 : 0);
        }
      }
    } catch (error) {}
  };

  const fetchAffiliateData = async () => {
    try {
      const affiliateSwapsResponse = await fetch(
        "/api/affiliate-swaps-by-wallet"
      );

      if (affiliateSwapsResponse.ok) {
        const affiliateSwapsData = await affiliateSwapsResponse.json();

        if (affiliateSwapsData.success && affiliateSwapsData.data?.length > 0) {
          const formattedData = affiliateSwapsData.data
            .map((item: any) => ({
              affiliate: item.affiliate,
              affiliate_fees_usd: +(item.earnings ?? 0),
              total_swaps: +(item.count ?? 0),
              total_volume_usd: +(item.volume ?? 0),
              vc: +(item.volume ?? 0) / +(item.count ?? 1),
              avg_bps: +(item.earnings ?? 0) / +(item.volume ?? 1),
              multi: item.multi,
            }))
            .filter((item: any) => item.affiliate !== "");
          setAffiliateData(formattedData);
        } else {
          setAffiliateData([]);
        }
      } else {
        setAffiliateData([]);
      }

      const affiliateDailyResponse = await fetch("/api/affiliate-daily");
      if (affiliateDailyResponse.ok) {
        const affiliateDailyData = await affiliateDailyResponse.json();
        setAffiliateEarning(
          affiliateDailyData[affiliateDailyData.length - 1]
            ?.daily_affiliate_fees_usd ?? 0
        );
      }
    } catch (error) {
      setAffiliateData([]);
      setAffiliateEarning(0);
    }
  };

  const fetchNetworkData = async () => {
    try {
      const heightResponse = await fetch("/api/rpc-last-block-height");
      const heightData = await heightResponse.json();
      setLastHeight(+heightData?.block?.header?.height);

      const mimirResponse = await fetch("/api/mimir");
      const mimirData = await mimirResponse.json();
      setMimirInfo(mimirData);

      try {
        const churnResponse = await fetch("/api/churn");
        const churnData = await churnResponse.json();
        if (churnData.success && churnData.data) {
          setNetwork((prevNetwork: any) => ({
            ...prevNetwork,
            nextChurnHeight: churnData.data.nextChurnHeight,
            poolActivationCountdown: churnData.data.poolActivationCountdown,
          }));
        }
      } catch (churnError) {}
      await updateRunePool();
    } catch (error) {}
  };

  const fetchAffiliateChartData = async () => {
    try {
      const affiliateHistoryResponse = await fetch("/api/affiliate-history");

      if (affiliateHistoryResponse.ok) {
        const affiliateHistoryData = await affiliateHistoryResponse.json();

        if (affiliateHistoryData.success && affiliateHistoryData.data) {
          setThornameData(affiliateHistoryData.data);

          setAffiliateChart(affiliateHistoryData.data);

          const volumeData = affiliateHistoryData.data.intervals.map(
            (interval: any) => {
              return (
                (interval.thornames || []).reduce((sum: number, item: any) => {
                  return sum + (Number(item.volumeUSD) || 0);
                }, 0) / 100
              );
            }
          );
          setVolumeUSDData(volumeData);
          return;
        }
      }

      const affiliateResponse = await fetch("/api/affiliate-daily");

      if (affiliateResponse.ok) {
        const affiliateData = await affiliateResponse.json();
        if (affiliateData.success && affiliateData.data) {
          const volumeData = affiliateData.data.map((item: any) => {
            return (item.daily_affiliate_fees_usd || 0) / 100;
          });
          setVolumeUSDData(volumeData);

          const simpleAffiliateChart = {
            xAxis: [
              {
                data: affiliateData.data.map(
                  (_: any, i: number) => `Day ${i + 1}`
                ),
              },
            ],
            series: [
              {
                name: "Affiliate Fee",
                type: "bar",
                data: volumeData,
                stack: "Total",
              },
            ],
          };
          setAffiliateChart(simpleAffiliateChart);
        }
      }
    } catch (error) {
      setVolumeUSDData([]);
      setAffiliateChart(null);
    }
  };

  const getBurnData = async () => {
    try {
      const response = await fetch("/api/burned-blocks");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const responseData = await response.json();
      const data = responseData.success ? responseData.data : null;

      if (data && data.burnedBlocks && Array.isArray(data.burnedBlocks)) {
        const transformedBlocks = data.burnedBlocks.map((block: any) => ({
          blockHeight: block.blockHeight || 0,
          timestamp: block.timestamp || new Date().toISOString(),
          burnedAmount: parseFloat(block.burnedAmount) || 0,
          devAmount: parseFloat(block.devAmount) || 0,
          poolAmount: parseFloat(block.poolAmount) || 0,
          bondAmount: parseFloat(block.bondAmount) || 0,
        }));

        transformedBlocks.sort((a: any, b: any) => {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return timeB - timeA;
        });

        const totalBurned = transformedBlocks.reduce(
          (total: number, block: any) => {
            return total + (block.burnedAmount || 0);
          },
          0
        );

        const totalDev = transformedBlocks.reduce(
          (total: number, block: any) => total + (block.devAmount || 0),
          0
        );
        const totalPool = transformedBlocks.reduce(
          (total: number, block: any) => total + (block.poolAmount || 0),
          0
        );
        const totalBond = transformedBlocks.reduce(
          (total: number, block: any) => total + (block.bondAmount || 0),
          0
        );

        setTotalBurnedRune(500_000_000 - totalBurned / 1e8);

        setBurnedBlocks(transformedBlocks.slice(0, 10));

        setLastUpdateTime(new Date());
      } else {
        setBurnedBlocks([]);
      }
    } catch (error) {
      setBurnedBlocks([]);
    }
  };
  const fetchAlternativeData = async () => {
    try {
      const addressesResponse = await fetch("/api/addresses");

      if (addressesResponse.ok) {
        const addressesData = await addressesResponse.json();

        let total = 0;

        if (addressesData.success) {
          if (addressesData.data?.pagination?.total) {
            total = +addressesData.data.pagination.total;
          } else if (addressesData.data?.addresses?.pagination?.total) {
            total = +addressesData.data.addresses.pagination.total;
          } else if (addressesData.data?.pagination) {
            const pagination = addressesData.data.pagination;
            if (pagination.total) {
              total = +pagination.total;
            }
          } else if (addressesData.data?.accounts?.length) {
            total = addressesData.data.accounts.length;
          } else {
            total = 143997;
          }
        }

        setTotalAddresses(total);
      } else {
        setTotalAddresses(0);
      }
    } catch (error) {
      setTotalAddresses(0);
    }
  };
  const updateRunePool = async () => {
    try {
      const response = await fetch("/api/rune-pool");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const processedPolData: any = {};
      if (data.pol) {
        Object.keys(data.pol).forEach((key) => {
          processedPolData[key] = Number(data.pol[key]) || 0;
        });
      }

      setPolOverview(processedPolData);
    } catch (error) {}
  };

  const getNetworkStatus = async () => {
    try {
      const response = await fetch("/api/mimir");
      const data = await response.json();
      setMimirInfo(data);
    } catch (error) {}
  };

  const calculatedAPY = () => {
    if (!tcyInfo || !runePrice) return 0;

    const lastWeekEarnings = tcyInfo.last_week_earnings;
    const tcySupply = tcyInfo.TCYSupply;
    const price = tcyInfo.price;

    return ((lastWeekEarnings / 1e8) * runePrice * 52) / tcySupply / price;
  };

  const isChurnHalted = () => {
    if (mimirInfo && mimirInfo.HALTCHURNING) {
      return true;
    }
    if (+network?.nextChurnHeight === -1) {
      return true;
    }

    return false;
  };
  const getNextChurn = () => {
    if (chainsHeight === undefined || network === undefined) {
      return "-";
    }

    if (isChurnHalted()) {
      return "Churn Halted";
    }

    if (
      !chainsHeight ||
      network?.nextChurnHeight === undefined ||
      network?.nextChurnHeight === null
    ) {
      return "-";
    }

    const nextChurnHeight = Number(network.nextChurnHeight);
    const currentThorHeight = Number(chainsHeight.THOR);

    if (isNaN(nextChurnHeight) || isNaN(currentThorHeight)) {
      return "-";
    }

    const blocksRemaining = nextChurnHeight - currentThorHeight;

    if (blocksRemaining < 0) {
      return "Churn Completed";
    }

    if (blocksRemaining > 500) {
      return blockTime(blocksRemaining, true);
    }

    return `${blocksRemaining} Blocks`;
  };

  const networkSettings = [
    {
      title: "Nodes",
      rowStart: 1,
      colSpan: 1,
      link: "/nodes",
      items: [
        {
          name: "Active Bond",
          value: +network?.bondMetrics?.totalActiveBond / 10 ** 8,
          filter: (v: number) =>
            formatTrendNumber(v, { decimals: 1 }) + " RUNE",
          usdValue: true,
        },
        {
          name: "Standby Bond",
          value: +network?.bondMetrics?.totalStandbyBond / 10 ** 8,
          filter: (v: number) =>
            formatTrendNumber(v, { decimals: 1 }) + " RUNE",
          usdValue: true,
        },
        {
          name: "Active Nodes",
          value: network?.activeNodeCount,
          filter: (v: number) => formatTrendNumber(v, { decimals: 0 }),
        },
        {
          name: "Standby Nodes",
          value: network?.standbyNodeCount,
          filter: (v: number) => formatTrendNumber(v, { decimals: 0 }),
        },
      ],
    },
    {
      title: "Churning",
      rowStart: 3,
      colSpan: 1,
      link: "/network/churn",
      items: [
        {
          name: "Next Churn",
          value: getNextChurn(),
        },
        {
          name: "Next Pool",
          value:
            network?.poolActivationCountdown > 500
              ? blockTime(network?.poolActivationCountdown, true)
              : `${network?.poolActivationCountdown} Blocks`,
        },
      ],
    },
    {
      title: "TCY ",
      rowStart: 5,
      colSpan: 1,
      link: "/thorfi/tcy",
      items: [
        {
          name: "Claimed",
          value: tcyInfo?.claimed_info?.total || 0,
          filter: (v: number) => {
            const tcyValue = v / 1e8;
            const totalSupply = 206606541.28874864;
            const percentage = (tcyValue / totalSupply) * 100;
            return formatTrendPercentage(percentage, { decimals: 2 });
          },
        },
        {
          name: "Total Stakers",
          value: tcyInfo?.staker_info?.total || 0,
          filter: (v: number) => {
            return `${formatTrendNumber(v / 1e8, { decimals: 2 })} TCY`;
          },
          extraText: `$${formatTrendCurrency(
            ((tcyInfo?.staker_info?.total ?? 0) / 1e8) * (tcyInfo?.price ?? 0),
            { decimals: 2 }
          )}`,
        },
        {
          name: "APR",
          value: calculatedAPY() || 0,
          filter: (v: number) => {
            const percentageValue = v * 100;
            return formatTrendPercentage(percentageValue, { decimals: 2 });
          },
        },
      ],
    },
  ];

  const statsSettings = React.useMemo(
    () => [
      {
        title: "Swap",
        rowStart: 1,
        colSpan: 1,
        link: "/txs",
        items: [
          {
            name: "Swap Count (30D)",
            value: stats.swapCount30d ?? 0,
            filter: (v: number) => formatTrendNumber(v, { decimals: 0 }),
          },
          {
            name: "Total Swap Count",
            value: stats.swapCount ?? 0,
            filter: (v: number) => formatTrendNumber(v, { decimals: 0 }),
          },
          {
            name: "Total Addresses",
            value: totalAddresses ?? 0,
            filter: (v: number) => formatTrendNumber(v, { decimals: 0 }),
          },
        ],
      },
      {
        title: "Value Locked",
        rowStart: 2,
        colSpan: 1,
        link: "/network",
        items: [
          {
            name: "Reserve",
            value: (network?.totalReserve ?? 0) / 10 ** 8,
            filter: (v: number) => formatTrendCurrency(v, { decimals: 1 }),
            usdValue: true,
          },
          {
            name: "Pools",
            value: (network?.totalPooledRune * 2 ?? 0) / 10 ** 8,
            filter: (v: number) => formatTrendCurrency(v, { decimals: 1 }),
            usdValue: true,
          },
          {
            name: "Pool Share Factor",
            value: (network?.poolShareFactor || 0) * 100,
            filter: (v: number) => formatTrendPercentage(v, { decimals: 2 }),
          },
          {
            name: "RUNEPool",
            value: (polOverview?.current_deposit || 0) / 1e8,
            filter: (v: number) => formatTrendCurrency(v, { decimals: 1 }),
            usdValue: true,
          },
          {
            name: "RUNEPool Share of Pools",
            value: network?.totalPooledRune
              ? (polOverview?.value || 0) / (network.totalPooledRune * 2)
              : 0,
            filter: (v: number) =>
              formatTrendPercentage(v * 100, { decimals: 2 }),
          },
        ],
      },
    ],
    [stats, totalAddresses, network, polOverview]
  );

  const fillArrayWithZero = (array: any[], length: number) => {
    while (array.length < length) {
      array.push(0);
    }
    return array;
  };

  const formatPoolsData = (d) => {
    if (!d || !Array.isArray(d) || d.length === 0) {
      return;
    }

    const poolData = [];
    const effectiveRunePrice = runePrice || stats.runePriceUSD || 1;

    let totalValuePooled = 0;
    let otherPoolsVolume = 0;
    let otherValuePooled = 0;

    const sortedPools = d.sort((a, b) => {
      const aDepth = Number(a.runeDepth) || 0;
      const bDepth = Number(b.runeDepth) || 0;
      return bDepth - aDepth;
    });

    sortedPools.forEach((p, i) => {
      const runeInPools = Number(p.runeDepth) || 0;
      const assetsInRune =
        (Number(p.assetDepth) || 0) * (Number(p.assetPrice) || 0);
      const poolValue =
        ((runeInPools + assetsInRune) * effectiveRunePrice) / 1e8;

      totalValuePooled += poolValue;

      if (i < 6) {
        let assetName = "Unknown";
        try {
          if (p.asset) {
            const asset = assetFromString(p.asset);
            assetName = `${asset.chain}.${asset.ticker}`;
          } else {
            assetName = `Pool-${i + 1}`;
          }
        } catch (error) {
          assetName = `Pool-${i + 1}`;
        }

        poolData.push({
          value: poolValue,
          name: assetName,
          vol: ((Number(p.volume24h) || 0) * effectiveRunePrice) / 1e8,
          color: getChartColor(i, getCurrentChartTheme(theme)),
        });
      } else if (i >= 6) {
        otherPoolsVolume +=
          ((Number(p.volume24h) || 0) * effectiveRunePrice) / 1e8;
        otherValuePooled += poolValue;

        if (i === sortedPools.length - 1) {
          poolData.push({
            value: otherValuePooled,
            name: "Other pools",
            vol: otherPoolsVolume,
            color: getChartColor(6, getCurrentChartTheme(theme)),
          });
        }
      }
    });

    setPoolsData(poolData);
    setTotalValuePooled(totalValuePooled);

    const poolsOptionData = {
      rawData: d,
      processedData: poolData,
      totalValue: totalValuePooled,
    };

    setPoolsOption(poolsOptionData);
  };

  const openChartEarnings = () => {
    try {
      if (poolMode === "pool-earnings") {
        router.push("/charts/earnings");
      } else if (poolMode === "affiliates-fees") {
        router.push("/charts/affiliates");
      } else {
        router.push("/charts/earnings");
      }
    } catch (error) {
      console.error("Navigation error:", error);
      router.push("/charts/earnings");
    }
  };

  return (
    <Page>
      <div className={styles["dashboard-page-container"]}>
        <div className={`chart-container ${styles["network-stats-container"]}`}>
          <NetworkStats />
        </div>

        <div className={styles["chart-inner-container"]}>
          <Card
            navs={[
              { title: "Swap Volume", value: "swap-vol" },
              { title: "Pool Volume", value: "pools-vol" },
            ]}
            actNav={swapMode}
            onActNavChange={setSwapMode}
            className={styles["chart-card"]}
          >
            {swapMode === "swap-vol" && (
              <>
                <SwapVolumeChart data={swapHistory} loading={!swapHistory} />
              </>
            )}

            {swapMode === "pools-vol" && (
              <div className="pool-depth-container">
                <div className="pool-depth-chart">
                  <PoolsVolumeChart data={poolsOption} loading={!poolsOption} />
                </div>
              </div>
            )}
          </Card>

          <Card
            navs={[
              { title: "Earnings & Fees", value: "total-earnings" },
              { title: "LP Earnings", value: "pool-earnings" },
              ...(isMainnet()
                ? [{ title: "Affiliate Fees", value: "affiliates-fees" }]
                : []),
            ]}
            actNav={poolMode}
            onActNavChange={setPoolMode}
            className={styles["chart-card"]}
          >
            <div>
              {poolMode === "total-earnings" && (
                <EarningsChart
                  data={{
                    ...earningsHistory,
                    volumeUSDData: volumeUSDData,
                  }}
                  loading={!earningsHistory}
                />
              )}
            </div>

            {poolMode === "pool-earnings" && (
              <div className={styles["chart-with-button"]}>
                <button
                  className={styles["button-charts"]}
                  onClick={openChartEarnings}
                >
                  Open Chart
                </button>
                <LPEarningsChart data={poolEarnings} loading={!poolEarnings} />
              </div>
            )}

            {poolMode === "affiliates-fees" && (
              <div className={styles["chart-with-button"]}>
                <button
                  className={styles["button-charts"]}
                  onClick={openChartEarnings}
                >
                  Open Chart
                </button>
                <AffiliateFeeChart
                  data={affiliateChart}
                  loading={!affiliateChart}
                  thornameData={thornameData}
                />
              </div>
            )}
          </Card>
        </div>

        <div
          className={`${styles["cards-container"]} ${styles["chart-inner-container"]}`}
        >
          <div className={styles["chart-card"]}>
            <Outbounds />
          </div>
          <div className={styles["chart-card"]}>
            <Streaming />
          </div>
        </div>

        <div
          className={`${styles["cards-container"]} ${styles["chart-inner-container"]}`}
        >
          <div className={styles["chart-card"]}>
            <InfoCard options={statsSettings} />
          </div>
          <div className={styles["chart-card"]}>
            <InfoCard options={networkSettings} />
          </div>
        </div>

        <div>
          <h4 className={styles["affiliate-title"]}>Affiliate (30D)</h4>
          <AffiliateTables
            affiliateData={affiliateData}
            isOverview={true}
            limit={5}
          />
        </div>

        <div className="cards-container">
          <div className={styles["latest-data-container"]}>
            <LatestBlocks burnedBlocks={burnedBlocks} />
            <LatestTransactions transactions={txs} />
          </div>
        </div>
      </div>
    </Page>
  );
};

export default OverviewPage;
