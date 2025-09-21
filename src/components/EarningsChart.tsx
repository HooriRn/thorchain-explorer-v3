"use client";

import React, { useState, useEffect, useMemo } from "react";
import moment from "moment";
import ChartLoader from "./ChartLoader";
import { getChartColor, getCurrentChartTheme } from "@/utils/global";
import { useTheme } from "@/lib/store";
import EChartsWrapper from "./charts/EChartsWrapper";

interface EarningsData {
  date: string;
  bondEarning: number;
  lpEarning: number;
  devFundEarning: number;
  systemBurn: number;
  tcyStakeReward: number;
  affiliateFee: number;
  eodEarning: number;
}

interface EarningsChartProps {
  data?: any;
  loading?: boolean;
}

const EarningsChart: React.FC<EarningsChartProps> = ({
  data,
  loading = false,
}) => {
  const [chartData, setChartData] = useState<EarningsData[]>([]);
  const theme = useTheme();

  useEffect(() => {
    if (!data) {
      setChartData([]);
      return;
    }

    if (data?.intervals && Array.isArray(data.intervals)) {
      const formattedData = formatEarningsData(data);
      setChartData(formattedData);
    } else if (data?.series && Array.isArray(data.series)) {
      const formattedData = formatChartOptionsToData(data);
      setChartData(formattedData);
    } else if (data?.xAxis && data?.series) {
      const formattedData = formatChartOptionsToData(data);
      setChartData(formattedData);
    } else {
      setChartData([]);
    }
  }, [data]);

  const formatChartOptionsToData = (chartOptions: any): EarningsData[] => {
    const formattedData: EarningsData[] = [];

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
        const dataPoint: EarningsData = {
          date,
          bondEarning: 0,
          lpEarning: 0,
          devFundEarning: 0,
          systemBurn: 0,
          tcyStakeReward: 0,
          affiliateFee: 0,
          eodEarning: 0,
        };

        const bondSeries = seriesMap.get("Bond Earning");
        const lpSeries = seriesMap.get("LP Earning");
        const devFundSeries = seriesMap.get("Dev Fund Earning");
        const systemBurnSeries = seriesMap.get("System Burn");
        const tcySeries = seriesMap.get("TCY Stake Reward");
        const affiliateSeries = seriesMap.get("Affiliate Fee");
        const eodSeries = seriesMap.get("EOD Earning");

        if (bondSeries && bondSeries[index] !== undefined) {
          dataPoint.bondEarning =
            typeof bondSeries[index] === "object"
              ? bondSeries[index].value
              : bondSeries[index];
        }
        if (lpSeries && lpSeries[index] !== undefined) {
          dataPoint.lpEarning =
            typeof lpSeries[index] === "object"
              ? lpSeries[index].value
              : lpSeries[index];
        }
        if (devFundSeries && devFundSeries[index] !== undefined) {
          dataPoint.devFundEarning =
            typeof devFundSeries[index] === "object"
              ? devFundSeries[index].value
              : devFundSeries[index];
        }
        if (systemBurnSeries && systemBurnSeries[index] !== undefined) {
          dataPoint.systemBurn =
            typeof systemBurnSeries[index] === "object"
              ? systemBurnSeries[index].value
              : systemBurnSeries[index];
        }
        if (tcySeries && tcySeries[index] !== undefined) {
          dataPoint.tcyStakeReward =
            typeof tcySeries[index] === "object"
              ? tcySeries[index].value
              : tcySeries[index];
        }
        if (affiliateSeries && affiliateSeries[index] !== undefined) {
          dataPoint.affiliateFee =
            typeof affiliateSeries[index] === "object"
              ? affiliateSeries[index].value
              : affiliateSeries[index];
        }
        if (eodSeries && eodSeries[index] !== undefined) {
          dataPoint.eodEarning =
            typeof eodSeries[index] === "object"
              ? eodSeries[index].value
              : eodSeries[index];
        }

        formattedData.push(dataPoint);
      });
    }

    return formattedData;
  };

  const formatEarningsData = (earningsData: any): EarningsData[] => {
    const formattedData: EarningsData[] = [];

    if (!earningsData.intervals || !Array.isArray(earningsData.intervals)) {
      return [];
    }

    earningsData.intervals.forEach((interval: any, index: number) => {
      const startTime = interval.startTime;
      const endTime = interval.endTime;

      let date: string;
      if (!startTime || !endTime || isNaN(startTime) || isNaN(endTime)) {
        date = moment().format("dddd, MMM D");
      } else {
        const timestamp = Math.floor((~~endTime + ~~startTime) / 2) * 1e3;
        const dateMoment = moment(timestamp);

        if (dateMoment.isValid()) {
          date = dateMoment.format("dddd, MMM D");
        } else {
          date = moment().format("dddd, MMM D");
        }
      }

      
      const devFund =
        (+interval.pools?.find((p: any) => p.pool === "dev_fund_reward")
          ?.earnings /
          10 ** 8) *
          Number.parseFloat(interval.runePriceUSD) || 0;
      const incomeBurn =
        (+interval.pools?.find((p: any) => p.pool === "income_burn")?.earnings /
          10 ** 8) *
          Number.parseFloat(interval.runePriceUSD) || 0;
      const tcyStakeReward =
        (+interval.pools?.find((p: any) => p.pool === "tcy_stake_reward")
          ?.earnings /
          10 ** 8) *
          Number.parseFloat(interval.runePriceUSD) || 0;

      const bondEarning =
        (+interval.bondingEarnings / 10 ** 8) *
          Number.parseFloat(interval.runePriceUSD) || 0;

      const lpEarning =
        (+interval.liquidityEarnings / 10 ** 8) *
          Number.parseFloat(interval.runePriceUSD) -
          devFund -
          incomeBurn -
          tcyStakeReward || 0;

      const volumeUSDData = earningsData.volumeUSDData;
      const affiliateFee =
        volumeUSDData && volumeUSDData[index] ? volumeUSDData[index] / 1e2 : 0;

      const dataPoint: EarningsData = {
        date,
        bondEarning,
        lpEarning,
        devFundEarning: devFund,
        systemBurn: incomeBurn,
        tcyStakeReward,
        affiliateFee,
        eodEarning: 0,
      };

  

      formattedData.push(dataPoint);
    });

    return formattedData;
  };

  const getSeriesColor = (seriesName: string) => {
    const colorMap: Record<string, number> = {
      bondEarning: 0,
      lpEarning: 1,
      devFundEarning: 2,
      systemBurn: 3,
      affiliateFee: 4,
      tcyStakeReward: 5,
    };
    return getChartColor(
      colorMap[seriesName] || 0,
      getCurrentChartTheme(theme)
    );
  };

  const formatValue = (value: any) => {
    const numValue = typeof value === "number" ? value : parseFloat(value) || 0;

    if (numValue >= 1e9) {
      return `$${(numValue / 1e9).toFixed(1)}B`;
    } else if (numValue >= 1e6) {
      return `$${(numValue / 1e6).toFixed(1)}M`;
    } else if (numValue >= 1e3) {
      return `$${(numValue / 1e3).toFixed(1)}K`;
    }
    return `$${numValue.toFixed(0)}`;
  };

  const chartDataForECharts = useMemo(() => {
    if (!chartData || chartData.length === 0) return { labels: [], series: [] };

    const series = [
      {
        name: "Bond Earning",
        type: "bar",
        stack: "Total",
        data: chartData.map((item) => item.bondEarning),
        itemStyle: {
          color: getSeriesColor("bondEarning"),
          borderRadius: [0, 0, 0, 0],
        },
      },
      {
        name: "LP Earning",
        type: "bar",
        stack: "Total",
        data: chartData.map((item) => item.lpEarning),
        itemStyle: {
          color: getSeriesColor("lpEarning"),
          borderRadius: [0, 0, 0, 0],
        },
      },
      {
        name: "Dev Fund Earning",
        type: "bar",
        stack: "Total",
        data: chartData.map((item) => item.devFundEarning),
        itemStyle: {
          color: getSeriesColor("devFundEarning"),
          borderRadius: [0, 0, 0, 0],
        },
      },
      {
        name: "System Burn",
        type: "bar",
        stack: "Total",
        data: chartData.map((item) => item.systemBurn),
        itemStyle: {
          color: getSeriesColor("systemBurn"),
          borderRadius: [0, 0, 0, 0],
        },
      },
      {
        name: "Affiliate Fee",
        type: "bar",
        stack: "Total",
        data: chartData.map((item) => item.affiliateFee),
        itemStyle: {
          color: getSeriesColor("affiliateFee"),
          borderRadius: [0, 0, 0, 0],
        },
      },
      {
        name: "TCY Stake Reward",
        type: "bar",
        stack: "Total",
        data: chartData.map((item) => item.tcyStakeReward),
        itemStyle: {
          color: getSeriesColor("tcyStakeReward"),
          borderRadius: [8, 8, 0, 0],
        },
      },
    ];

    return {
      labels: chartData.map((item) => item.date),
      series,
    };
  }, [chartData, theme]);

  const chartOptions = useMemo(() => {
    return {
      legend: {
        show: true,
        top: "top",
        left: "center",
        icon: "circle",
        itemWidth: 12,
        itemHeight: 12,
        textStyle: {
          fontSize: 12,
          color:
            theme === "dark" || theme === "BlueElectra" ? "#e6e6e6" : "#333333",
        },
        data: [
          "Bond Earning",
          "LP Earning",
          "Dev Fund Earning",
          "Affiliate Fee",
          "TCY Stake Reward",
        ],
      },
      xAxis: {
        type: "category",
        data: chartData.map((item) => item.date),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
      },
      series: chartDataForECharts.series,
    };
  }, [theme, chartData, chartDataForECharts]);

  if (loading) {
    return <ChartLoader />;
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <EChartsWrapper
        type="bar"
        data={chartDataForECharts}
        options={chartOptions}
        height="400px"
      />
    </div>
  );
};

export default EarningsChart;
