"use client";

import React, { useState, useEffect, useMemo } from "react";
import moment from "moment";
import ChartLoader from "./ChartLoader";
import { getChartColor, getCurrentChartTheme } from "@/utils/global";
import { useTheme } from "@/lib/store";
import EChartsWrapper from "./charts/EChartsWrapper";

interface SwapVolumeData {
  date: string;
  totalVolume: number;
  eodVolume: number;
  count: number;
}

interface SwapVolumeChartProps {
  data?: any;
  loading?: boolean;
}

const SwapVolumeChart: React.FC<SwapVolumeChartProps> = ({
  data,
  loading = false,
}) => {
  const [chartData, setChartData] = useState<SwapVolumeData[]>([]);
  const theme = useTheme();

  const getSeriesColor = (seriesName: string) => {
    const colorMap: Record<string, number> = {
      totalVolume: 0,
      eodVolume: 1,
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

  useEffect(() => {
    if (!data) {
      setChartData([]);
      return;
    }

    if (data?.intervals && Array.isArray(data.intervals)) {
      const formattedData = formatSwapVolumeData(data);
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

  const formatChartOptionsToData = (chartOptions: any): SwapVolumeData[] => {
    const formattedData: SwapVolumeData[] = [];

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
        const dataPoint: SwapVolumeData = {
          date,
          totalVolume: 0,
          eodVolume: 0,
          count: 0,
        };

        const totalVolumeSeries = seriesMap.get("Total Volume");
        const eodVolumeSeries = seriesMap.get("EOD Volume");
        const countSeries = seriesMap.get("Count");

        if (totalVolumeSeries && totalVolumeSeries[index] !== undefined) {
          dataPoint.totalVolume =
            typeof totalVolumeSeries[index] === "object"
              ? totalVolumeSeries[index].value
              : totalVolumeSeries[index];
        }
        if (eodVolumeSeries && eodVolumeSeries[index] !== undefined) {
          dataPoint.eodVolume =
            typeof eodVolumeSeries[index] === "object"
              ? eodVolumeSeries[index].value
              : eodVolumeSeries[index];
        }
        if (countSeries && countSeries[index] !== undefined) {
          dataPoint.count =
            typeof countSeries[index] === "object"
              ? countSeries[index].value
              : countSeries[index];
        }

        formattedData.push(dataPoint);
      });
    }

    return formattedData;
  };

  const formatSwapVolumeData = (swapVolumeData: any): SwapVolumeData[] => {
    const formattedData: SwapVolumeData[] = [];

    if (!swapVolumeData.intervals || !Array.isArray(swapVolumeData.intervals)) {
      return [];
    }

    const intervals: any[] = swapVolumeData.intervals;
    const lastIndex = intervals.length - 1;
    const nowUtcStart = moment().utc().startOf("day");
    const hoursSinceUtcDayStart = moment().utc().diff(nowUtcStart, "hours");

    const toNumber = (val: any): number => {
      if (typeof val === "number") return val;
      if (val === null || val === undefined) return 0;
      const cleaned = String(val).replace(/[,\s]/g, "");
      const n = Number(cleaned);
      return isNaN(n) ? 0 : n;
    };

    intervals.forEach((interval: any, index: number) => {
      const startTime = interval.startTime;
      const endTime = interval.endTime;

      let date: string;
      if (!startTime || !endTime || isNaN(startTime) || isNaN(endTime)) {
        date = moment().format("dddd, MMM D");
      } else {
        const timestamp = Math.floor((~~endTime + ~~startTime) / 2) * 1e3;
        const dateMoment = moment(timestamp);
        date = dateMoment.isValid()
          ? dateMoment.format("dddd, MMM D")
          : moment().format("dddd, MMM D");
      }

      const volumeUsdRaw =
        interval.totalVolumeUSD !== undefined &&
        interval.totalVolumeUSD !== null
          ? interval.totalVolumeUSD
          : interval.volumeUSD !== undefined && interval.volumeUSD !== null
          ? interval.volumeUSD
          : null;

      let totalVolume = 0;
      if (volumeUsdRaw !== null) {
        totalVolume = toNumber(volumeUsdRaw) / 100;
      } else if (interval.totalVolume !== undefined) {
        totalVolume = toNumber(interval.totalVolume);
      }

      let eodVolume = 0;
      if (volumeUsdRaw !== null) {
        eodVolume = toNumber(interval.EODVolume) / 100;
      } else {
        eodVolume = 0;
      }

      let count =
        toNumber(interval.totalCount) ||
        toNumber(interval.count) ||
        toNumber(interval.fromTradeCount) + toNumber(interval.toTradeCount) ||
        toNumber(interval.fromTxCount) + toNumber(interval.toTxCount) ||
        0;

      if (index === lastIndex) {
        if (hoursSinceUtcDayStart < 6) {
          const recent = intervals.slice(-4, -1);
          const recentSum = recent.reduce((sum: number, it: any) => {
            const itUsd =
              it.totalVolumeUSD !== undefined && it.totalVolumeUSD !== null
                ? toNumber(it.totalVolumeUSD) / 100
                : it.volumeUSD !== undefined && it.volumeUSD !== null
                ? toNumber(it.volumeUSD) / 100
                : it.totalVolume !== undefined
                ? toNumber(it.totalVolume)
                : 0;
            return sum + itUsd;
          }, 0);
          const recentAvg = recentSum / 3;
          eodVolume = Math.max(recentAvg - totalVolume, 0);
        } else {
          eodVolume =
            volumeUsdRaw !== null ? toNumber(interval.EODVolume) / 100 : 0;
        }
      }

      const dataPoint: SwapVolumeData = {
        date,
        totalVolume,
        eodVolume,
        count,
      };

      formattedData.push(dataPoint);
    });

    return formattedData;
  };

  const chartDataForChartJs = useMemo(() => {
    if (!chartData || chartData.length === 0)
      return { labels: [], datasets: [] };

    const labels = chartData.map((item) => item.date);
    const totalData = chartData.map((item, idx) => {
      const isLast = idx === chartData.length - 1;
      return isLast
        ? {
            value: item.totalVolume,
            itemStyle: {
              color: "#F3BA2F",
              borderRadius: [0, 0, 0, 0],
            },
          }
        : {
            value: item.totalVolume,
            itemStyle: {
              borderRadius: [8, 8, 0, 0],
            },
          };
    });
    const eodData = chartData.map((item, idx) => {
      const isLast = idx === chartData.length - 1;
      return isLast
        ? {
            value: item.eodVolume,
            itemStyle: {
              color: "transparent",
              borderColor: "#F3BA2F",
              borderWidth: 1,
              borderRadius: [8, 8, 0, 0],
            },
          }
        : 0;
    });

    return {
      labels,
      datasets: [
        {
          label: "Total Volume",
          data: totalData,
          backgroundColor: getSeriesColor("totalVolume"),
          borderColor: getSeriesColor("totalVolume"),
          borderWidth: 1,
          borderRadius: {
            topLeft: 8,
            topRight: 8,
            bottomLeft: 0,
            bottomRight: 0,
          },
          borderSkipped: false,
          stack: "Total",
        },
        {
          label: "EOD Volume",
          data: eodData,
          backgroundColor: getSeriesColor("eodVolume"),
          borderColor: getSeriesColor("eodVolume"),
          borderWidth: 1,
          borderRadius: {
            topLeft: 8,
            topRight: 8,
            bottomLeft: 0,
            bottomRight: 0,
          },
          borderSkipped: false,
          stack: "Total",
        },
      ],
    };
  }, [chartData, theme]);

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
          displayColors: false,
          callbacks: {
            title: function (context: any) {
              const dataIndex = context[0].dataIndex;
              const date = chartData[dataIndex]?.date;
              return date || "";
            },
            afterTitle: function (context: any) {
              return "─────────────";
            },
            label: function (context: any) {
              const dataIndex = context.dataIndex;
              const dataPoint = chartData[dataIndex];
              const value = context.parsed.y;
              const label = context.dataset.label || "";

              if (!dataPoint) return `${label}: ${formatValue(value)}`;

              return `${label}: ${formatValue(value)}`;
            },
            afterBody: function (context: any) {
              const dataIndex = context[0].dataIndex;
              const dataPoint = chartData[dataIndex];

              if (!dataPoint) return [];

              const countValue = dataPoint.count;
              if (countValue !== undefined && countValue !== null) {
                return [`Count: ${Number(countValue).toLocaleString()}`];
              }

              return [];
            },
          },
        },
      },
      scales: {
        x: {
          display: false,
          stacked: false,
        },
        y: {
          display: false,
          stacked: false,
          beginAtZero: true,
        },
      },
    };
  }, [theme, chartData]);

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
        data={chartDataForChartJs}
        options={{
          ...chartOptions,
          countData: chartData.map((item) => item.count),
          tooltip: {
            trigger: "axis",
            axisPointer: { type: "shadow" },
            formatter: (params: any) => {
              if (!params || params.length === 0) return "";
              const dataIndex = params[0].dataIndex;
              const date = chartData[dataIndex]?.date || "";
              const total = params.find(
                (p: any) => p.seriesName === "Total Volume"
              );
              const eod = params.find(
                (p: any) => p.seriesName === "EOD Volume"
              );
              const countVal = chartData[dataIndex]?.count ?? 0;

              const extractVal = (p: any) =>
                p
                  ? typeof p.value === "object"
                    ? p.value?.value
                    : p.value
                  : 0;
              const totalVal = extractVal(total) || 0;
              const eodVal = extractVal(eod) || 0;

              const fmt = (v: number) => {
                if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
                if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
                if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
                return `$${v.toFixed(0)}`;
              };

              return `
                <div class="tooltip-header">
                  <div class="data-color" style="background-color: ${
                    total?.color || "#63fdd9"
                  }"></div>
                  ${date}
                </div>
                <div class="tooltip-body">
                  <span>
                    <span>Volume</span>
                    <b>${fmt(totalVal)}</b>
                  </span>
                  ${
                    eodVal
                      ? `<span><span>Volume (EOD)</span><b>${fmt(
                          totalVal + eodVal
                        )}</b></span>`
                      : ""
                  }
                  <span>
                    <span>Count</span>
                    <b>${Number(countVal).toLocaleString()}</b>
                  </span>
                </div>
              `;
            },
          },
        }}
        height="400px"
      />
    </div>
  );
};

export default SwapVolumeChart;
