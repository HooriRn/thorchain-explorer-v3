"use client";

import React, { useState, useEffect, useMemo } from "react";
import moment from "moment";
import { orderBy, range } from "lodash";
import ChartLoader from "./ChartLoader";
import {
  assetColorPalette,
  showAsset,
  getChartColor,
  getCurrentChartTheme,
} from "@/utils/global";
import { useTheme } from "@/lib/store";
import { formatNumberToString } from "@/utils/format";
import EChartsWrapper from "./charts/EChartsWrapper";

interface LPEarningsData {
  date: string;
  [key: string]: string | number;
}

interface LPEarningsChartProps {
  data?: any;
  loading?: boolean;
}

const LPEarningsChart: React.FC<LPEarningsChartProps> = ({
  data,
  loading = false,
}) => {
  const [chartData, setChartData] = useState<LPEarningsData[]>([]);
  const [poolNames, setPoolNames] = useState<string[]>([]);
  const theme = useTheme();

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

  useEffect(() => {
    if (!data) {
      setChartData([]);
      setPoolNames([]);
      return;
    }

    if (data?.intervals && Array.isArray(data.intervals)) {
      const { formattedData, pools } = formatLPEarningsData(data);
      setChartData(formattedData);
      setPoolNames(pools);
    } else if (data?.series && Array.isArray(data.series)) {
      const { formattedData, pools } = formatChartOptionsToData(data);
      setChartData(formattedData);
      setPoolNames(pools);
    } else if (data?.xAxis && data?.series) {
      const { formattedData, pools } = formatChartOptionsToData(data);
      setChartData(formattedData);
      setPoolNames(pools);
    } else {
      setChartData([]);
      setPoolNames([]);
    }
  }, [data]);

  const formatChartOptionsToData = (
    chartOptions: any
  ): { formattedData: LPEarningsData[]; pools: string[] } => {
    const formattedData: LPEarningsData[] = [];
    const pools: string[] = [];

    if (!chartOptions.series || !Array.isArray(chartOptions.series)) {
      return { formattedData, pools };
    }

    const xAxis = chartOptions.xAxis?.data || [];
    const seriesMap = new Map();

    chartOptions.series.forEach((series: any) => {
      if (series.name && series.data) {
        seriesMap.set(series.name, series.data);
        if (!pools.includes(series.name)) {
          pools.push(series.name);
        }
      }
    });

    if (xAxis.length > 0) {
      xAxis.forEach((date: string, index: number) => {
        const dataPoint: LPEarningsData = {
          date,
        };

        pools.forEach((poolName) => {
          const series = seriesMap.get(poolName);
          if (series && series[index] !== undefined) {
            dataPoint[poolName] =
              typeof series[index] === "object"
                ? series[index].value
                : series[index];
          } else {
            dataPoint[poolName] = 0;
          }
        });

        formattedData.push(dataPoint);
      });
    }

    return { formattedData, pools };
  };

  const formatLPEarningsData = (
    lpEarningsData: any
  ): { formattedData: LPEarningsData[]; pools: string[] } => {
    const formattedData: LPEarningsData[] = [];
    let topPools: string[] = [];

    if (!lpEarningsData.intervals || !Array.isArray(lpEarningsData.intervals)) {
      return { formattedData, pools: [] };
    }

    const secondToLastInterval =
      lpEarningsData.intervals[lpEarningsData.intervals.length - 2];
    if (secondToLastInterval && secondToLastInterval.pools) {
      const poolEarnings = orderBy(
        secondToLastInterval.pools,
        [(o: any) => +o.earnings],
        ["desc"]
      )
        .filter(
          (p: any) =>
            p.pool !== "dev_fund_reward" &&
            p.pool !== "income_burn" &&
            p.pool !== "tcy_stake_reward"
        )
        .map((p: any) => p.pool);

      const totalPools = lpEarningsData.intervals[0]?.pools?.length || 0;
      const topPoolCount = totalPools > 8 ? 8 : totalPools;

      topPools = poolEarnings.slice(0, topPoolCount);
    }

    lpEarningsData.intervals.forEach((interval: any, index: number) => {
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

      const dataPoint: LPEarningsData = {
        date,
      };

      let otherEarnings = 0;
      if (interval.pools && Array.isArray(interval.pools)) {
        const otherPools = interval.pools.filter(
          (p: any) =>
            !topPools.includes(p.pool) &&
            p.pool !== "income_burn" &&
            p.pool !== "dev_fund_reward" &&
            p.pool !== "tcy_stake_reward"
        );

        otherEarnings = otherPools.reduce(
          (sum: number, pool: any) =>
            sum + (+pool.earnings * +interval.runePriceUSD) / 1e8,
          0
        );
      }

      dataPoint["Other Pools"] = otherEarnings;

      topPools.forEach((poolName) => {
        const pool = interval.pools?.find((p: any) => p.pool === poolName);
        const earnings = pool
          ? (+pool.earnings / 10 ** 8) *
            Number.parseFloat(interval.runePriceUSD)
          : 0;
        dataPoint[poolName] = earnings;
      });

      if (index === lpEarningsData.intervals.length - 1) {
        let eodValue = 0;
        if (interval.EODLiquidityEarnings) {
          eodValue =
            (+interval.EODLiquidityEarnings * +interval.runePriceUSD) / 1e8;

          const lastTotalEarning =
            lpEarningsData.intervals[lpEarningsData.intervals.length - 2]
              ?.liquidityEarnings;
          const lastDevFundEarning =
            +lpEarningsData.intervals[
              lpEarningsData.intervals.length - 2
            ]?.pools?.find((p: any) => p.pool === "dev_fund_reward")
              ?.earnings || 0;
          if (lastTotalEarning && lastDevFundEarning > 0) {
            eodValue -=
              ((lastDevFundEarning / lastTotalEarning) * eodValue) / 1e8;
          }
        }

        dataPoint["EOD"] = Math.max(eodValue, 0);
      } else {
        dataPoint["EOD"] = 0;
      }

      formattedData.push(dataPoint);
    });

    const allPools = [...topPools, "Other Pools", "EOD"];

    return { formattedData, pools: allPools };
  };

  const getPoolColor = (poolName: string, index: number) => {
    const color = assetColorPalette(poolName);
    if (color) {
      return color;
    }
    return getChartColor(index, getCurrentChartTheme(theme));
  };

  const chartDataForECharts = useMemo(() => {
    if (!chartData || chartData.length === 0 || poolNames.length === 0) {
      return { labels: [], series: [] };
    }

    const lastIdx = Math.max(0, chartData.length - 1);

    const series = poolNames.map((poolName, index) => {
      const isEOD = poolName === "EOD";
      const isOtherPools = poolName === "Other Pools";

      return {
        name: isOtherPools
          ? "Other Pools"
          : isEOD
          ? "EOD"
          : showAsset(poolName),
        type: "bar",
        stack: "Total",
        z: isEOD ? (10 as any) : undefined,
        data: chartData.map((item, i) => {
          const value = (item[poolName] as number) || 0;
          if (!isEOD) {
            return value;
          }
          if (i === lastIdx) {
            return {
              value,
              itemStyle: {
                color: "transparent",
                borderColor: "#F3BA2F",
                borderWidth: 1,
                borderRadius: [8, 8, 0, 0],
              },
            } as any;
          }
          return 0;
        }),
        itemStyle: !isEOD
          ? {
              color: getPoolColor(poolName, index),
              borderRadius: [0, 0, 0, 0],
            }
          : undefined,
      };
    });

    return {
      labels: chartData.map((item) => item.date),
      series,
    };
  }, [chartData, poolNames, theme]);

  const chartOptions = useMemo(() => {
    return {
      legend: {
        show: false,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            afterTitle: function (context: any) {
              return "─────────────";
            },
            label: function (context: any) {
              return "";
            },
            afterBody: function (context: any) {
              const dataIndex = context[0].dataIndex;

              const chartDataForTooltip = chartDataForECharts;
              if (
                !chartDataForTooltip ||
                !chartDataForTooltip.series ||
                dataIndex >= chartDataForTooltip.labels.length
              ) {
                return [];
              }

              const dataPoint = chartData[dataIndex];
              if (!dataPoint) return [];

              const formatValueLocal = (value: any) => {
                const numValue =
                  typeof value === "number" ? value : parseFloat(value) || 0;
                if (numValue >= 1e9) {
                  return `$${(numValue / 1e9).toFixed(1)}B`;
                } else if (numValue >= 1e6) {
                  return `$${(numValue / 1e6).toFixed(1)}M`;
                } else if (numValue >= 1e3) {
                  return `$${(numValue / 1e3).toFixed(1)}K`;
                }
                return `$${numValue.toFixed(0)}`;
              };

              const lines: string[] = [];

              const poolsWithEarnings = poolNames
                .map((poolName) => ({
                  name: poolName,
                  value: (dataPoint[poolName] as number) || 0,
                }))
                .filter((pool) => pool.value > 0)
                .sort((a, b) => {
                  if (a.name === "Other Pools") return 1;
                  if (b.name === "Other Pools") return -1;
                  if (a.name === "EOD") return 1;
                  if (b.name === "EOD") return -1;
                  return b.value - a.value;
                });

              poolsWithEarnings.forEach((pool) => {
                const displayName =
                  pool.name === "Other Pools"
                    ? "Other Pools"
                    : pool.name === "EOD"
                    ? "EOD"
                    : showAsset(pool.name);
                lines.push(`${displayName}: ${formatValueLocal(pool.value)}`);
              });

              lines.push("─────────────");

              const totalEarnings = poolsWithEarnings.reduce((sum, pool) => {
                return sum + pool.value;
              }, 0);

              lines.push(`Total Earnings: ${formatValueLocal(totalEarnings)}`);

              return lines;
            },
          },
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
      tooltip: {
        trigger: "axis",
        formatter: function (params: any[]) {
          if (!params || !params.length) return "";
          const valueOf = (p: any) =>
            typeof p?.value === "object" && p?.value !== null
              ? Number(p.value.value || 0)
              : Number(p?.value || 0);

          const header = `<div class=\"tooltip-header\">${params[0].name}</div>`;

          const items = params.filter((p: any) => p && p.seriesName !== "EOD");
          const bodyLines = items
            .filter((p: any) => valueOf(p) > 0)
            .map(
              (p: any) => `
            <span class=\"tooltip-item space\">\n              <span class=\"series-name-color\">\n                <span class=\"data-color\" style=\"background-color: ${
              p.color
            };\"></span>\n                <span>${
                p.seriesName
              }</span>\n              </span>\n              <span>${formatValue(
                valueOf(p)
              )}</span>\n            </span>`
            )
            .join("");

          const eodItem = params.find((p: any) => p.seriesName === "EOD");
          const eodVal = eodItem ? valueOf(eodItem) : 0;
          const sumBase = items.reduce(
            (acc: number, p: any) => acc + valueOf(p),
            0
          );
          const idx = params[0].dataIndex ?? 0;
          const lastIdx = Math.max(0, chartData.length - 1);

          const totalsLine =
            idx !== lastIdx
              ? `
            <span class=\"tooltip-item space\" style=\"border-top: 1px solid var(--border); margin-top: 4px; padding-top: 4px;\">\n              <span>Total Earnings</span>\n              <span>${formatValue(
              sumBase
            )}</span>\n            </span>`
              : "";

          const eodSection =
            idx === lastIdx && eodVal
              ? `
            <span class=\"tooltip-item space\" style=\"border-top: 1px solid var(--border); margin-top: 4px; padding-top: 4px;\">\n              <span>Total Earnings (EOD)</span>\n              <span>${formatValue(
              sumBase + eodVal
            )}</span>\n            </span>\n            <span class=\"tooltip-item space\">\n              <span>EOD</span>\n              <span>${formatValue(
                  eodVal
                )}</span>\n            </span>`
              : "";

          return `
            ${header}
            <div class=\"tooltip-body\">\n              ${bodyLines}\n              ${totalsLine}\n              ${eodSection}\n            </div>
          `;
        },
      },
    };
  }, [theme, chartData, poolNames]);

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

export default LPEarningsChart;
