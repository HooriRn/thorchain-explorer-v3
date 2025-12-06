"use client";

import React, { useState, useEffect, useMemo } from "react";
import moment from "moment";
import { orderBy } from "lodash";
import BaseNormalizedChart from "./BaseNormalizedChart";

interface PoolRewardData {
  date: string;
  [poolName: string]: number | string;
  "Other Pools": number;
}

interface RewardsByPoolChartProps {
  data?: any;
  loading?: boolean;
  topPools?: number;
}

const RewardsByPoolChart: React.FC<RewardsByPoolChartProps> = ({
  data,
  loading = false,
  topPools = 6,
}) => {
  const [chartData, setChartData] = useState<PoolRewardData[]>([]);
  const [poolNames, setPoolNames] = useState<string[]>(["Other Pools"]);

  useEffect(() => {
    if (!data) {
      setChartData([]);
      setPoolNames(["Other Pools"]);
      return;
    }

    if (data?.intervals && Array.isArray(data.intervals)) {
      const { formattedData, pools } = formatRewardsData(data, topPools);
      setChartData(formattedData);
      setPoolNames(["Other Pools", ...pools]);
    } else if (data?.series && Array.isArray(data.series)) {
      const { formattedData, pools } = formatChartOptionsToData(data);
      setChartData(formattedData);
      setPoolNames(["Other Pools", ...pools]);
    } else {
      setChartData([]);
      setPoolNames(["Other Pools"]);
    }
  }, [data, topPools]);

  const formatChartOptionsToData = (chartOptions: any): { 
    formattedData: PoolRewardData[], 
    pools: string[] 
  } => {
    const formattedData: PoolRewardData[] = [];
    const pools: string[] = [];

    if (!chartOptions.series || !Array.isArray(chartOptions.series)) {
      return { formattedData, pools };
    }

    const xAxis = chartOptions.xAxis?.data || [];
    const seriesMap = new Map();

    // استخراج نام pool ها از series
    chartOptions.series.forEach((series: any) => {
      if (series.name && series.data && series.name !== "Other Pools" && series.name !== "Total Income") {
        seriesMap.set(series.name, series.data);
        if (!pools.includes(series.name)) {
          pools.push(series.name);
        }
      }
    });

    if (xAxis.length > 0) {
      xAxis.forEach((date: string, index: number) => {
        const dataPoint: PoolRewardData = {
          date,
          "Other Pools": 0,
        };

        pools.forEach(poolName => {
          const poolSeries = seriesMap.get(poolName);
          if (poolSeries && poolSeries[index] !== undefined) {
            const value = typeof poolSeries[index] === "object"
              ? poolSeries[index].value
              : poolSeries[index];
            dataPoint[poolName] = value;
          } else {
            dataPoint[poolName] = 0;
          }
        });

        formattedData.push(dataPoint);
      });
    }

    return { formattedData, pools };
  };

  const formatRewardsData = (earningData: any, topCount: number): { 
    formattedData: PoolRewardData[], 
    pools: string[] 
  } => {
    const formattedData: PoolRewardData[] = [];
    const pools: string[] = [];

    if (!earningData?.intervals) {
      return { formattedData, pools };
    }

    const lastInterval = earningData.intervals[earningData.intervals.length - 2];
    if (!lastInterval?.pools) {
      return { formattedData, pools };
    }

    // پیدا کردن top pools
    const poolEarnings = orderBy(
      lastInterval.pools.filter((p: any) => 
        p.pool !== 'income_burn' && 
        p.pool !== 'dev_fund_reward' && 
        p.pool !== 'tcy_stake_reward'
      ),
      [(o) => Math.abs(+o.rewards || 0)],
      ['desc']
    )
      .slice(0, topCount)
      .map((p: any) => p.pool);

    pools.push(...poolEarnings);

    const seriesData: Record<string, number[]> = {};
    poolEarnings.forEach(poolName => {
      seriesData[poolName] = [];
    });

    earningData.intervals.forEach((interval: any, index: number) => {
      if (index === earningData.intervals.length - 1) return;

      const date = moment(
        Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
      ).format('dddd, MMM D');

      const dataPoint: PoolRewardData = {
        date,
        "Other Pools": 0,
      };

      // محاسبه other pools
      const otherEarnings = interval.pools
        ?.filter((p: any) => 
          !poolEarnings.includes(p.pool) &&
          p.pool !== 'income_burn' &&
          p.pool !== 'dev_fund_reward' &&
          p.pool !== 'tcy_stake_reward'
        )
        .reduce((sum: number, p: any) => sum + (-1 * (+p.rewards || 0) * (+interval.runePriceUSD || 0)) / 1e8, 0) || 0;

      dataPoint["Other Pools"] = otherEarnings;

      // محاسبه earnings برای هر pool
      poolEarnings.forEach((poolName) => {
        const pool = interval.pools?.find((p: any) => p.pool === poolName);
        const value = pool ? (+pool.rewards * -1 * +interval.runePriceUSD) / 1e8 : 0;
        
        if (!seriesData[poolName]) {
          seriesData[poolName] = [];
        }
        seriesData[poolName].push(value);
        dataPoint[poolName] = value;
      });

      formattedData.push(dataPoint);
    });

    return { formattedData, pools };
  };

  const customColors = useMemo(() => {
    // رنگ مخصوص برای Other Pools
    const baseColors = ["#888888", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"];
    return poolNames.map((_, index) => baseColors[index % baseColors.length]);
  }, [poolNames]);

  return (
    <BaseNormalizedChart
      data={chartData}
      loading={loading}
      seriesNames={poolNames}
      chartTitle="Rewards by Pool"
      height="400px"
      isNormalized={false}
      formatValue={(value) => `$${(value / 1e6).toFixed(2)}M`}
      customColors={customColors}
    />
  );
};

export default RewardsByPoolChart;