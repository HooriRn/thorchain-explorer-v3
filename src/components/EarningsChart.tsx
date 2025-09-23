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

    const n = chartData.length;
    const eodSeriesData: any[] = new Array(n).fill(0);

    const lastIdx = Math.max(0, n - 1);

    const topIndexPerDay = chartData.map((row) => {
      const values = [
        row.bondEarning,
        row.lpEarning,
        row.devFundEarning,
        row.systemBurn,
        row.affiliateFee,
        row.tcyStakeReward,
      ];
      for (let s = values.length - 1; s >= 0; s--) {
        if (values[s] > 0) return s;
      }
      return -1;
    });

    const makeSeriesData = (
      getter: (d: EarningsData) => number,
      seriesIdx: number
    ) =>
      chartData.map((row, i) => {
        const value = getter(row);
        const isTop = topIndexPerDay[i] === seriesIdx;
        const radius =
          i === lastIdx ? [0, 0, 0, 0] : isTop ? [8, 8, 0, 0] : [0, 0, 0, 0];
        return {
          value,
          itemStyle: { borderRadius: radius },
        } as any;
      });

    try {
      const intervals = (data as any)?.intervals || [];
      if (Array.isArray(intervals) && intervals.length >= 1) {
        let EODValue =
          ((+intervals[intervals.length - 1]?.EODLiquidityEarnings || 0) *
            +(intervals[intervals.length - 1]?.runePriceUSD || 0)) /
            1e8 || 0;

        if (intervals.length >= 2) {
          const lastTotalEarning =
            +intervals[intervals.length - 2]?.liquidityEarnings || 0;
          const lastDevFundEarning = +(
            intervals[intervals.length - 2]?.pools?.find(
              (p: any) => p.pool === "dev_fund_reward"
            )?.earnings || 0
          );
          if (lastTotalEarning > 0 && lastDevFundEarning >= 0) {
            EODValue -=
              ((lastDevFundEarning / lastTotalEarning) * EODValue) / 1e8;
          }
        }

        eodSeriesData[lastIdx] = {
          value: EODValue > 0 ? EODValue : 0,
          itemStyle: {
            color: "transparent",
            borderColor: "#F3BA2F",
            borderWidth: 1,
            borderRadius: [8, 8, 0, 0],
          },
        };
      }
    } catch {}

    const series = [
      {
        name: "Bond Earning",
        type: "bar",
        stack: "Total",
        data: makeSeriesData((item) => item.bondEarning, 0),
        itemStyle: {
          color: getSeriesColor("bondEarning"),
        },
      },
      {
        name: "LP Earning",
        type: "bar",
        stack: "Total",
        data: makeSeriesData((item) => item.lpEarning, 1),
        itemStyle: {
          color: getSeriesColor("lpEarning"),
        },
      },
      {
        name: "Dev Fund Earning",
        type: "bar",
        stack: "Total",
        data: makeSeriesData((item) => item.devFundEarning, 2),
        itemStyle: {
          color: getSeriesColor("devFundEarning"),
        },
      },
      {
        name: "System Burn",
        type: "bar",
        stack: "Total",
        data: makeSeriesData((item) => item.systemBurn, 3),
        itemStyle: {
          color: getSeriesColor("systemBurn"),
        },
      },
      {
        name: "Affiliate Fee",
        type: "bar",
        stack: "Total",
        data: makeSeriesData((item) => item.affiliateFee, 4),
        itemStyle: {
          color: getSeriesColor("affiliateFee"),
        },
      },
      {
        name: "TCY Stake Reward",
        type: "bar",
        stack: "Total",
        data: makeSeriesData((item) => item.tcyStakeReward, 5),
        itemStyle: {
          color: getSeriesColor("tcyStakeReward"),
        },
      },
    ];

    series.push({
      name: "EOD",
      type: "bar",
      stack: "Total",
      z: 10 as any,
      showSymbol: false as any,
      data: eodSeriesData,
    } as any);

    return {
      labels: chartData.map((item) => item.date),
      series,
    };
  }, [chartData, theme, data]);

  const tooltipHelpers = useMemo(() => {
    const labels = chartData.map((i) => i.date);
    const n = labels.length;
    const eodCoreUSD: number[] = new Array(n).fill(0);
    const affiliateEODArr: number[] = new Array(n).fill(0);

    try {
      const intervals = (data as any)?.intervals || [];
      const volumeUSDData = (data as any)?.volumeUSDData || [];
      if (Array.isArray(intervals) && intervals.length) {
        const lastIdx = intervals.length - 1;
        const chartLastIdx = Math.max(0, n - 1);

        const it = intervals[lastIdx] || {};
        const runePrice = Number.parseFloat(it?.runePriceUSD || 0);
        const eodBond = Number(it?.EODBondEarnings || 0);
        const eodLp = Number(it?.EODLiquidityEarnings || 0);
        const coreUsd = ((eodBond + eodLp) * runePrice) / 1e8;
        eodCoreUSD[chartLastIdx] =
          isFinite(coreUsd) && coreUsd > 0 ? coreUsd : 0;

        let affiliateEOD = 0;
        if (Array.isArray(volumeUSDData) && volumeUSDData.length) {
          affiliateEOD = Number(volumeUSDData[lastIdx] || 0) / 1e2;
          if (!affiliateEOD) {
            const last3 = volumeUSDData.slice(-3);
            if (last3.length) {
              affiliateEOD =
                last3.reduce(
                  (s: number, v: any) => s + Number(v || 0) / 1e2,
                  0
                ) / last3.length;
            }
          }
        }
        affiliateEODArr[chartLastIdx] = Math.max(affiliateEOD, 0);
      }
    } catch {}

    return { eodCoreUSD, affiliateEODArr };
  }, [data, chartData]);

  const chartOptions = useMemo(() => {
    const { eodCoreUSD, affiliateEODArr } = tooltipHelpers;

    const format = (v: number) => {
      if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
      if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
      if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
      return `$${(v || 0).toFixed(0)}`;
    };

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
      tooltip: {
        trigger: "axis",
        formatter: function (params: any[]) {
          if (!params || !params.length) return "";
          const idx = params[0].dataIndex ?? 0;

          const valueOf = (p: any) =>
            typeof p?.value === "object" && p?.value !== null
              ? Number(p.value.value || 0)
              : Number(p?.value || 0);

          const items = params.filter(
            (p: any) =>
              p && p.seriesName !== "EOD Earning" && p.seriesName !== "EOD"
          );
          const sumGross = items.reduce(
            (a: number, p: any) => a + valueOf(p),
            0
          );

          const affSeries = params.find(
            (p: any) => p.seriesName === "Affiliate Fee"
          );
          const affVal = affSeries ? valueOf(affSeries) : 0;

          const eodCore = Number(eodCoreUSD?.[idx] || 0);
          const affiliateEOD = Number(affiliateEODArr?.[idx] || 0);

          const header = `<div class="tooltip-header">${params[0].name}</div>`;
          const bodyLines = items
            .map(
              (p: any) => `
            <span class="tooltip-item space">
              <span class="series-name-color">
                <span class="data-color" style="background-color: ${
                  p.color
                };"></span>
                <span>${p.seriesName}</span>
              </span>
              <span>${format(valueOf(p))}</span>
            </span>`
            )
            .join("");

          const grossLine = `
          <span class="tooltip-item space" style="border-top: 1px solid var(--border); margin-top: 4px; padding-top: 4px;">
            <span>Gross System Income</span>
            <span>${format(sumGross)}</span>
          </span>`;

          const grossEodValue =
            sumGross + eodCore + (affVal ? 0 : affiliateEOD);
          const showEod = eodCore || (!affVal && affiliateEOD);
          const grossEodLine = showEod
            ? `
            <span class="tooltip-item space">
              <span>Gross System Income (EOD)</span>
              <span>${format(grossEodValue)}</span>
            </span>`
            : "";

          const affiliateLine = `
          <span class="tooltip-item space" style="border-top: 1px solid var(--border); margin-top: 4px; padding-top: 4px;">
            <span>Affiliate Fee</span>
            <span>${
              affVal
                ? format(affVal)
                : affiliateEOD
                ? `${format(affiliateEOD)} (EOD)`
                : "-"
            }</span>
          </span>`;

          return `
          ${header}
          <div class="tooltip-body">
            ${bodyLines}
            ${grossLine}
            ${grossEodLine}
            ${affiliateLine}
          </div>`;
        },
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
  }, [theme, chartData, chartDataForECharts, tooltipHelpers]);

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
