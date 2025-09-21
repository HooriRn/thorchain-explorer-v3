import React, { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import Chart from "@/assets/images/chart.svg";
import Exchange from "@/assets/images/exchange.svg";
import LockIcon from "@/assets/images/lock.svg";
import Piggy from "@/assets/images/piggy.svg";
import Burn from "@/assets/images/burn.svg";
import StackDollar from "@/assets/images/sack-dollar.svg";
import ArrowRightIcon from "@/assets/images/arrowup.svg";
import styles from "./NetworkStats.module.css";
import {
  formatTrendNumber,
  formatTrendCurrency,
  formatPercent,
} from "@/utils/format";
import Link from "next/link";

const NetworkStats = () => {
  const [loading, setLoading] = useState(true);
  const [totalSwap24USD, setTotalSwap24USD] = useState(0);
  const [stats, setStats] = useState({
    swapCount24h: 0,
    swapVolume: 0,
    withdrawVolume: 0,
    addLiquidityVolume: 0,
    earnings24: 0,
    runePriceUSD: 0,
  });
  const [network, setNetwork] = useState({
    bondMetrics: {
      totalActiveBond: 0,
      totalStandbyBond: 0,
    },
    totalPooledRune: 0,
    totalReserve: 0,
    bondingAPY: 0,
    liquidityAPY: 0,
  });
  const [totalBurnedRune, setTotalBurnedRune] = useState(0);
  const [runeSupply, setRuneSupply] = useState(0);

  const tvl = () => {
    if (!network?.bondMetrics || !network?.totalPooledRune) return 0;
    return (
      ((+network.totalPooledRune * 2 + +network.bondMetrics.totalActiveBond) *
        stats.runePriceUSD) /
      1e8
    );
  };

  const circulating = () => {
    return +runeSupply - (+network?.totalReserve || 0) / 1e8;
  };

  const runeVolume = () => {
    return (
      (+stats.swapVolume + +stats.withdrawVolume + +stats.addLiquidityVolume) /
      10 ** 8
    );
  };

  const totalEarning24 = () => {
    return (stats.earnings24 / 1e8) * stats.runePriceUSD;
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      const dashboardResponse = await fetch("/api/dashboard");
      if (!dashboardResponse.ok) {
        throw new Error(`Dashboard API error: ${dashboardResponse.status}`);
      }
      const dashboardData = await dashboardResponse.json();

      if (dashboardData.success && dashboardData) {
        setStats(dashboardData.stats || {});
        setRuneSupply(+dashboardData.runeSupply?.amount?.amount / 1e8 || 0);
        setNetwork(dashboardData.networkData || {});
        setTotalSwap24USD(+dashboardData.stats?.volume24USD || 0);
      }

      const earningsResponse = await fetch("/api/earnings");
      if (!earningsResponse.ok) {
        throw new Error(`Earnings API error: ${earningsResponse.status}`);
      }
      const earningsData = await earningsResponse.json();

      if (earningsData.success && earningsData) {
        if (
          earningsData.meta?.meta?.pools &&
          Array.isArray(earningsData.meta.meta.pools)
        ) {
          const burnedPool = earningsData.meta.meta.pools.find(
            (p: any) => p.pool === "income_burn"
          );

          if (burnedPool && burnedPool.earnings) {
            const burnedAmount = +burnedPool.earnings / 1e8;
            setTotalBurnedRune(burnedAmount);
          } else {
            setTotalBurnedRune(0);
          }
        } else if (
          earningsData.meta?.intervals &&
          Array.isArray(earningsData.meta.intervals) &&
          earningsData.meta.intervals.length > 0
        ) {
          const latestInterval = earningsData.meta.intervals[0];

          if (latestInterval?.pools && Array.isArray(latestInterval.pools)) {
            const burnedPool = latestInterval.pools.find(
              (p: any) => p.pool === "income_burn"
            );

            if (burnedPool && burnedPool.earnings) {
              const burnedAmount = +burnedPool.earnings / 1e8;
              setTotalBurnedRune(burnedAmount);
            } else {
              setTotalBurnedRune(0);
            }
          }
        } else {
          setTotalBurnedRune(0);
        }
      }
    } catch (error) {
      console.error("Error fetching network stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className={styles["network-stats"]}>
      <div className={styles["stat-group"]}>
        <Link
          href="/swaps"
          className={`${styles["stat-item"]} ${styles["stat-item-link"]}`}
        >
          <Chart className={styles["stat-image"]} />
          <div className={styles["item-detail"]}>
            <div className={styles["header"]}>Volume (24hr)</div>
            {loading || totalSwap24USD === null ? (
              <Skeleton className={`${styles["value"]} h-6 w-20`} />
            ) : (
              <div className={styles["value"]}>
                {formatTrendCurrency(totalSwap24USD / 100)}
              </div>
            )}
          </div>
          <ArrowRightIcon className={styles["arrow-icon"]} />
        </Link>
        <hr className={styles["stat-group-hr"]} />
        <Link
          href="/insights"
          className={`${styles["stat-item"]} ${styles["stat-item-link"]}`}
        >
          <Exchange className={styles["stat-image"]} />
          <div className={styles["item-detail"]}>
            <div className={styles["header"]}>Swaps (24hr)</div>
            {loading ? (
              <Skeleton className={`${styles["value"]} h-6 w-20`} />
            ) : (
              <div className={styles["value"]}>
                {formatTrendNumber(stats.swapCount24h, { decimals: 0 })}
              </div>
            )}
          </div>
          <ArrowRightIcon className={styles["arrow-icon"]} />
        </Link>
        <hr className={styles["stat-group-hr"]} />
      </div>
      <div className={styles["stat-group"]}>
        <Link
          href="/pools/tvl"
          className={`${styles["stat-item"]} ${styles["stat-item-link"]}`}
        >
          <LockIcon className={styles["stat-image"]} />
          <div className={styles["item-detail"]}>
            <div className={styles["header"]}>TVL (Pool + Bond)</div>
            {loading ? (
              <Skeleton className={`${styles["value"]} h-6 w-20`} />
            ) : (
              <div className={styles["value"]}>
                {formatTrendCurrency(tvl())}
              </div>
            )}
          </div>
          <ArrowRightIcon className={styles["arrow-icon"]} />
        </Link>
        <hr className={styles["stat-group-hr"]} />
        <Link
          href="/pools"
          className={`${styles["stat-item"]} ${styles["stat-item-link"]}`}
        >
          <Piggy className={styles["stat-image"]} />
          <div className={styles["item-detail"]}>
            <div className={styles["header"]}>Bond | Pool APY</div>
            {loading ? (
              <Skeleton className={`${styles["value"]} h-6 w-32`} />
            ) : (
              <div className={styles["value"]}>
                {formatPercent(network.bondingAPY, 2)} |{" "}
                {formatPercent(network.liquidityAPY, 2)}
              </div>
            )}
          </div>
          <ArrowRightIcon className={styles["arrow-icon"]} />
        </Link>
        <hr className={styles["stat-group-hr"]} />
      </div>
      <div className={styles["stat-group"]}>
        <div className={styles["stat-item"]}>
          <Burn className={styles["stat-image"]} />
          <div className={styles["item-detail"]}>
            <div className={styles["header"]}>Total | Circulating | Burned</div>
            {loading ? (
              <Skeleton className={`${styles["value"]} h-6 w-48`} />
            ) : (
              <div className={styles["value"]}>
                {formatTrendNumber(runeSupply, { decimals: 1 })} |{" "}
                {formatTrendNumber(circulating(), { decimals: 1 })} |{" "}
                {formatTrendNumber(totalBurnedRune)}
              </div>
            )}
          </div>
        </div>
        <hr className={styles["stat-group-hr"]} />
        <div className={styles["stat-item"]}>
          <StackDollar className={styles["stat-image"]} />
          <div className={styles["item-detail"]}>
            <div className={styles["header"]}>Earnings (24hr)</div>
            {loading ? (
              <Skeleton className={`${styles["value"]} h-6 w-20`} />
            ) : (
              <div className={styles["value"]}>
                {formatTrendCurrency(totalEarning24())}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkStats;
