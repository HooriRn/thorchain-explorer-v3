"use client";

import React, { useState, useEffect } from "react";
import moment from "moment";
import BaseNormalizedChart from "./BaseNormalizedChart";

interface FeesRewardsData {
  date: string;
  feesPercent: number;
  rewardsPercent: number;
  halfLine?: number;
}

interface FeesRewardsNormalizedChartProps {
  data?: any;
  loading?: boolean;
}

const FeesRewardsNormalizedChart: React.FC<FeesRewardsNormalizedChartProps> = ({
  data,
  loading = false,
}) => {
  const [chartData, setChartData] = useState<FeesRewardsData[]>([]);

  useEffect(() => {
    if (!data) {
      setChartData([]);
      return;
    }

    if (data?.intervals && Array.isArray(data.intervals)) {
      const formattedData = formatFeesRewardsNormalizedData(data);
      setChartData(formattedData);
    } else if (data?.series && Array.isArray(data.series)) {
      const formattedData = formatChartOptionsToData(data);
      setChartData(formattedData);
    } else {
      setChartData([]);
    }
  }, [data]);

  const formatChartOptionsToData = (chartOptions: any): FeesRewardsData[] => {
    const formattedData: FeesRewardsData[] = [];

    if (!chartOptions.series || !Array.isArray(chartOptions.series)) {
      return [];
    }

    const xAxis = chartOptions.xAxis?.data || [];
    const seriesMap = new Map();

    chartOptions.series.forEach((series: any) => {
      if (series.name && series.data) {
        seriesMap.set(series.name, series.data);
      }
    });

    if (xAxis.length > 0) {
      xAxis.forEach((date: string, index: number) => {
        const dataPoint: FeesRewardsData = {
          date,
          feesPercent: 0,
          rewardsPercent: 0,
          halfLine: 0.5,
        };

        const feesSeries = seriesMap.get("Liquidity Fees");
        const rewardsSeries = seriesMap.get("Block Rewards");

        if (feesSeries && feesSeries[index] !== undefined) {
          dataPoint.feesPercent =
            typeof feesSeries[index] === "object"
              ? feesSeries[index].value
              : feesSeries[index];
        }
        if (rewardsSeries && rewardsSeries[index] !== undefined) {
          dataPoint.rewardsPercent =
            typeof rewardsSeries[index] === "object"
              ? rewardsSeries[index].value
              : rewardsSeries[index];
        }

        formattedData.push(dataPoint);
      });
    }

    return formattedData;
  };

  const formatFeesRewardsNormalizedData = (earningData: any): FeesRewardsData[] => {
    const formattedData: FeesRewardsData[] = [];

    if (!earningData?.intervals || !Array.isArray(earningData.intervals)) {
      return [];
    }

    earningData.intervals.forEach((interval: any) => {
      const intervalDate = moment(
        Math.floor((+interval.endTime + +interval.startTime) / 2) * 1e3
      );

      if (intervalDate.isSame(moment(), 'day')) return;

      const date = intervalDate.format("dddd, MMM D");
      
      const fees = (interval.liquidityFees * interval.runePriceUSD) / 1e8;
      const rewards = Math.max((interval.blockRewards * interval.runePriceUSD) / 1e8, 0);
      const total = interval.earnings ? (interval.earnings * interval.runePriceUSD) / 1e8 : fees + rewards;

      const feesPercent = total > 0 ? fees / total : 0;
      const rewardsPercent = total > 0 ? rewards / total : 0;

      const dataPoint: FeesRewardsData = {
        date,
        feesPercent,
        rewardsPercent,
        halfLine: 0.5,
      };

      formattedData.push(dataPoint);
    });

    return formattedData;
  };

  return (
    <BaseNormalizedChart
      data={chartData}
      loading={loading}
      seriesNames={["Liquidity Fees", "Block Rewards"]}
      chartTitle="Fees/Rewards Normalized"
      height="400px"
      isNormalized={true}
    />
  );
};

export default FeesRewardsNormalizedChart;