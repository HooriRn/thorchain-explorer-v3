"use client";

import React, { useState, useEffect } from "react";
import { useRunePrice } from "@/lib/store";
import {
  formatNumberToString,
  formatPercentToString,
  number,
  formatPercent,
} from "@/utils/format";
import UnknownIcon from "@/assets/images/unknown.svg";
import { Skeleton } from "@/components/ui/Skeleton";
import styles from "./PooledView.module.css";

interface PeriodData {
  volume: number;
  earnings: number;
  earningsAPR: number;
  swapCount: number;
  avgFee: number;
  liquidityFees: number;
}

interface TotalInfo {
  pooled: number;
  day: PeriodData;
  week: PeriodData;
  month: PeriodData;
  year: PeriodData;
}

type PeriodKey = "day" | "week" | "month" | "year";

const PooledView: React.FC = () => {
  const runePrice = useRunePrice();
  const [loading, setLoading] = useState(true);
  const [totalInfo, setTotalInfo] = useState<TotalInfo>({
    pooled: 0,
    day: {
      volume: 0,
      earnings: 0,
      earningsAPR: 0,
      swapCount: 0,
      avgFee: 0,
      liquidityFees: 0,
    },
    week: {
      volume: 0,
      earnings: 0,
      earningsAPR: 0,
      swapCount: 0,
      avgFee: 0,
      liquidityFees: 0,
    },
    month: {
      volume: 0,
      earnings: 0,
      earningsAPR: 0,
      swapCount: 0,
      avgFee: 0,
      liquidityFees: 0,
    },
    year: {
      volume: 0,
      earnings: 0,
      earningsAPR: 0,
      swapCount: 0,
      avgFee: 0,
      liquidityFees: 0,
    },
  });

  const getDVEs = async () => {
    try {
      const poolsDataDay = await fetch("/api/pools-history").then((res) =>
        res.json()
      );
      const poolsDataWeek = await fetch("/api/pools-history?period=Week").then(
        (res) => res.json()
      );
      const poolsDataMonth = await fetch(
        "/api/pools-history?period=Month"
      ).then((res) => res.json());
      const poolsDataYear = await fetch("/api/pools-history?period=Year").then(
        (res) => res.json()
      );

      return {
        day: poolsDataDay.success ? poolsDataDay.data : poolsDataDay,
        week: poolsDataWeek.success ? poolsDataWeek.data : poolsDataWeek,
        month: poolsDataMonth.success ? poolsDataMonth.data : poolsDataMonth,
        year: poolsDataYear.success ? poolsDataYear.data : poolsDataYear,
      };
    } catch (error) {
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  const getTotalInfo = (poolDatum: any) => {
    const newTotalInfo: TotalInfo = {
      pooled: 0,
      day: {
        volume: 0,
        earnings: 0,
        earningsAPR: 0,
        swapCount: 0,
        avgFee: 0,
        liquidityFees: 0,
      },
      week: {
        volume: 0,
        earnings: 0,
        earningsAPR: 0,
        swapCount: 0,
        avgFee: 0,
        liquidityFees: 0,
      },
      month: {
        volume: 0,
        earnings: 0,
        earningsAPR: 0,
        swapCount: 0,
        avgFee: 0,
        liquidityFees: 0,
      },
      year: {
        volume: 0,
        earnings: 0,
        earningsAPR: 0,
        swapCount: 0,
        avgFee: 0,
        liquidityFees: 0,
      },
    };

    const updatePeriod = (period: keyof TotalInfo, ppy: number) => {
      if (!poolDatum) {
        return;
      }

      if (!poolDatum[period]?.pools) {
        return;
      }

      poolDatum[period].pools.forEach((p: any) => {
        if (period === "day") {
          newTotalInfo.pooled += (+p.endRuneDepth * 2 * runePrice) / 1e8;
        }

        if (p.earnings === undefined) {
          p.earnings = 0;
        }

        (newTotalInfo[period] as PeriodData).volume +=
          (+p.swapVolume * runePrice) / 1e8;
        (newTotalInfo[period] as PeriodData).earnings +=
          (+p.earnings * runePrice) / 1e8;
        (newTotalInfo[period] as PeriodData).swapCount += +p.swapCount;
        (newTotalInfo[period] as PeriodData).liquidityFees +=
          +p.totalLiquidityFeesRune / 1e8;
      });

      const currentPeriod = newTotalInfo[period] as PeriodData;
      const ve = currentPeriod.liquidityFees / currentPeriod.volume;
      const ep = currentPeriod.earnings / newTotalInfo.pooled;

      currentPeriod.earningsAPR = ep * ppy;
      currentPeriod.avgFee = ve * 1e4;
    };

    updatePeriod("day", 365);
    updatePeriod("week", 52.1429);
    updatePeriod("month", 12);
    updatePeriod("year", 1);

    setTotalInfo(newTotalInfo);
  };

  useEffect(() => {
    const fetchData = async () => {
      const pd = await getDVEs();
      getTotalInfo(pd);
    };

    fetchData();
  }, [runePrice]);

  const StatItem: React.FC<{
    title: string;
    value: string | number;
    loading?: boolean;
    tooltip?: string;
  }> = ({ title, value, loading = false, tooltip }) => (
    <div className={styles["stat-item"]}>
      <span className={styles["title"]}>
        {title}
        {tooltip && (
          <UnknownIcon className={styles["header-icon"]} title={tooltip} />
        )}
      </span>
      <span className={`${styles["value"]} ${styles["mono"]}`}>
        {loading ? (
          <Skeleton variant="text" width="80px" height="10px" />
        ) : (
          value
        )}
      </span>
    </div>
  );

  return (
    <div className={`${styles["pool-stats"]} ${styles["base-container"]}`}>
      <div className={styles["stat-group"]}>
        <StatItem
          title="Total Pooled:"
          value={`$${number(totalInfo.pooled, "0a")}`}
          loading={loading}
        />
        <div className={styles.divider} />
        <StatItem
          title="24hr Volume:"
          value={`$${number(totalInfo.day.volume, "0a")}`}
          loading={loading}
        />
        <StatItem
          title="24hr Earnings:"
          value={`$${number(totalInfo.day.earnings, "0a")}`}
          loading={loading}
        />
        <StatItem
          title="24hr Earnings APR:"
          value={formatPercent(totalInfo.day.earningsAPR, 2)}
          loading={loading}
          tooltip="(Earnings / Pooled) * Period Per Year"
        />
        <StatItem
          title="24hr Swap Count:"
          value={number(totalInfo.day.swapCount, "0,0")}
          loading={loading}
        />
        <StatItem
          title="24hr Fee Ratio:"
          value={`${
            isNaN(totalInfo.day.avgFee)
              ? "NaN"
              : number(totalInfo.day.avgFee, "0.00")
          } BP`}
          loading={loading}
          tooltip="Average Fee in basis point (Fees / Volume)"
        />
      </div>
      <div className={styles.divider} />
      <div className={styles["stat-group"]}>
        <StatItem
          title="7D Volume:"
          value={`$${number(totalInfo.week.volume, "0a")}`}
          loading={loading}
        />
        <StatItem
          title="7D Earnings:"
          value={`$${number(totalInfo.week.earnings, "0a")}`}
          loading={loading}
        />
        <StatItem
          title="7D Earnings APR:"
          value={formatPercent(totalInfo.week.earningsAPR, 2)}
          loading={loading}
        />
        <StatItem
          title="7D Swap Count:"
          value={number(totalInfo.week.swapCount, "0,0")}
          loading={loading}
        />
        <StatItem
          title="7D Fee Ratio:"
          value={`${
            isNaN(totalInfo.week.avgFee)
              ? "NaN"
              : number(totalInfo.week.avgFee, "0.00")
          } BP`}
          loading={loading}
        />
      </div>
      <div className={styles.divider} />
      <div className={styles["stat-group"]}>
        <StatItem
          title="30D Volume:"
          value={`$${number(totalInfo.month.volume, "0a")}`}
          loading={loading}
        />
        <StatItem
          title="30D Earnings:"
          value={`$${number(totalInfo.month.earnings, "0a")}`}
          loading={loading}
        />
        <StatItem
          title="30D Earnings APR:"
          value={formatPercent(totalInfo.month.earningsAPR, 2)}
          loading={loading}
        />
        <StatItem
          title="30D Swap Count:"
          value={number(totalInfo.month.swapCount, "0,0")}
          loading={loading}
        />
        <StatItem
          title="30D Fee Ratio:"
          value={`${
            isNaN(totalInfo.month.avgFee)
              ? "NaN"
              : number(totalInfo.month.avgFee, "0.00")
          } BP`}
          loading={loading}
        />
      </div>
      <div className={styles.divider} />
      <div className={styles["stat-group"]}>
        <StatItem
          title="Year Volume:"
          value={`$${number(totalInfo.year.volume, "0a")}`}
          loading={loading}
        />
        <StatItem
          title="Year Earnings:"
          value={`$${number(totalInfo.year.earnings, "0a")}`}
          loading={loading}
        />
        <StatItem
          title="Year Earnings APR:"
          value={formatPercent(totalInfo.year.earningsAPR, 2)}
          loading={loading}
        />
        <StatItem
          title="Year Swap Count:"
          value={number(totalInfo.year.swapCount, "0,0")}
          loading={loading}
        />
        <StatItem
          title="Year Fee Ratio:"
          value={`${
            isNaN(totalInfo.year.avgFee)
              ? "NaN"
              : number(totalInfo.year.avgFee, "0.00")
          } BP`}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default PooledView;
