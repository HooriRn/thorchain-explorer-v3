"use client";

import React, { useState, useEffect, useMemo } from "react";
import moment from "moment";
import ChartLoader from "@/components/ChartLoader";
import { getChartColor, getCurrentChartTheme } from "@/utils/global";
import { useTheme } from "@/lib/store";
import EChartsWrapper from "@/components/charts/EChartsWrapper";

interface SwapData {
  date: string;
  nativePercent: number;
  tradePercent: number;
  synthPercent: number;
  securedPercent: number;
}

interface SwapChartNormalizedProps {
  data?: any;
  loading?: boolean;
}

const SwapChartNormalized: React.FC<SwapChartNormalizedProps> = ({
  data,
  loading = false,
}) => {
  const [chartData, setChartData] = useState<SwapData[]>([]);
  const theme = useTheme();

  useEffect(() => {
    if (!data) {
      setChartData([]);
      return;
    }

    if (data?.intervals && Array.isArray(data.intervals)) {
      const formattedData = formatSwapsNormalizedData(data);
      setChartData(formattedData);
    } else if (data?.series && Array.isArray(data.series)) {
      const formattedData = formatChartOptionsToData(data);
      setChartData(formattedData);
    } else {
      setChartData([]);
    }
  }, [data]);

  const formatChartOptionsToData = (chartOptions: any): SwapData[] => {
    const formattedData: SwapData[] = [];

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
        const dataPoint: SwapData = {
          date,
          nativePercent: 0,
          tradePercent: 0,
          synthPercent: 0,
          securedPercent: 0,
        };

        const nativeSeries = seriesMap.get("Native Swap Volume");
        const tradeSeries = seriesMap.get("Trade Swaps");
        const synthSeries = seriesMap.get("Synth Swaps");
        const securedSeries = seriesMap.get("Secured Swaps");

        if (nativeSeries && nativeSeries[index] !== undefined) {
          dataPoint.nativePercent =
            typeof nativeSeries[index] === "object"
              ? nativeSeries[index].value
              : nativeSeries[index];
        }
        if (tradeSeries && tradeSeries[index] !== undefined) {
          dataPoint.tradePercent =
            typeof tradeSeries[index] === "object"
              ? tradeSeries[index].value
              : tradeSeries[index];
        }
        if (synthSeries && synthSeries[index] !== undefined) {
          dataPoint.synthPercent =
            typeof synthSeries[index] === "object"
              ? synthSeries[index].value
              : synthSeries[index];
        }
        if (securedSeries && securedSeries[index] !== undefined) {
          dataPoint.securedPercent =
            typeof securedSeries[index] === "object"
              ? securedSeries[index].value
              : securedSeries[index];
        }

        formattedData.push(dataPoint);
      });
    }

    return formattedData;
  };

  const formatSwapsNormalizedData = (swapsData: any): SwapData[] => {
    const formattedData: SwapData[] = [];

    if (!swapsData?.intervals || !Array.isArray(swapsData.intervals)) {
      return [];
    }

    swapsData.intervals.forEach((interval: any, index: number) => {
      if (index === swapsData.intervals.length - 1) {
        return;
      }

      const date = moment(
        Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
      ).format("dddd, MMM D");

      // محاسبه volume اصلی برای محاسبه درصد
      const nativeVolume = ((+interval.toRuneVolumeUSD || 0) + (+interval.toAssetVolumeUSD || 0)) / 100;
      const tradeVolume = ((+interval.fromTradeVolumeUSD || 0) + (+interval.toTradeVolumeUSD || 0)) / 100;
      const synthVolume = ((+interval.synthRedeemVolumeUSD || 0) + (+interval.synthMintVolumeUSD || 0)) / 100;
      const securedVolume = ((+interval.fromSecuredVolumeUSD || 0) + (+interval.toSecuredVolumeUSD || 0)) / 100;
      
      const totalVolume = nativeVolume + tradeVolume + synthVolume + securedVolume;

      // محاسبه درصد نرمالایز شده
      const nativePercent = totalVolume > 0 ? nativeVolume / totalVolume : 0;
      const tradePercent = totalVolume > 0 ? tradeVolume / totalVolume : 0;
      const synthPercent = totalVolume > 0 ? synthVolume / totalVolume : 0;
      const securedPercent = totalVolume > 0 ? securedVolume / totalVolume : 0;

      const dataPoint: SwapData = {
        date,
        nativePercent,
        tradePercent,
        synthPercent,
        securedPercent,
      };

      formattedData.push(dataPoint);
    });

    return formattedData;
  };

  const getSeriesColor = (seriesName: string) => {
    const colorMap: Record<string, number> = {
      "Native Swap Volume": 0,
      "Trade Swaps": 1,
      "Synth Swaps": 2,
      "Secured Swaps": 3,
    };
    return getChartColor(
      colorMap[seriesName] || 0,
      getCurrentChartTheme(theme)
    );
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const chartDataForECharts = useMemo(() => {
    if (!chartData || chartData.length === 0) return { labels: [], series: [] };

    const n = chartData.length;
    const lastIdx = Math.max(0, n - 1);

    const topIndexPerDay = chartData.map((row) => {
      const values = [
        row.nativePercent,
        row.tradePercent,
        row.synthPercent,
        row.securedPercent,
      ];
      for (let s = values.length - 1; s >= 0; s--) {
        if (values[s] > 0) return s;
      }
      return -1;
    });

    const makeSeriesData = (
      getter: (d: SwapData) => number,
      seriesIdx: number
    ) =>
      chartData.map((row, i) => {
        const percent = getter(row);
        const isTop = topIndexPerDay[i] === seriesIdx;
        const radius =
          i === lastIdx ? [0, 0, 0, 0] : isTop ? [8, 8, 0, 0] : [0, 0, 0, 0];
        return {
          value: percent,
          itemStyle: { 
            borderRadius: radius,
            color: getSeriesColor(
              ["Native Swap Volume", "Trade Swaps", "Synth Swaps", "Secured Swaps"][seriesIdx]
            )
          },
        } as any;
      });

    const series = [
      {
        name: "Native Swap Volume",
        type: "bar",
        stack: "Total",
        data: makeSeriesData((item) => item.nativePercent, 0),
      },
      {
        name: "Trade Swaps",
        type: "bar",
        stack: "Total",
        data: makeSeriesData((item) => item.tradePercent, 1),
      },
      {
        name: "Synth Swaps",
        type: "bar",
        stack: "Total",
        data: makeSeriesData((item) => item.synthPercent, 2),
      },
      {
        name: "Secured Swaps",
        type: "bar",
        stack: "Total",
        data: makeSeriesData((item) => item.securedPercent, 3),
      },
    ];

    return {
      labels: chartData.map((item) => item.date),
      series,
    };
  }, [chartData, theme]);

  const chartOptions = useMemo(() => {
    const formatPercentValue = (v: number) => {
      return `${(v * 100).toFixed(1)}%`;
    };

    return {
      animation: true,
      animationDuration: 500,
      animationEasing: 'cubicOut',
      legend: {
        show: true,
        top: "top",
        left: "center",
        icon: "circle",
        itemWidth: 12,
        itemHeight: 12,
        textStyle: {
          fontSize: 12,
          color: theme === "dark" || theme === "BlueElectra" ? "#e6e6e6" : "#333333",
        },
        data: [
          "Native Swap Volume",
          "Trade Swaps",
          "Synth Swaps",
          "Secured Swaps",
        ],
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
          shadowStyle: {
            color: "rgba(0, 0, 0, 0.05)",
          },
        },
        backgroundColor: "var(--tooltip-bg)",
        borderColor: "var(--border-color)",
        borderWidth: 1,
        textStyle: {
          color: "var(--font-color)",
        },
        formatter: function (params: any[]) {
          if (!params || !params.length) return "";
          const idx = params[0].dataIndex ?? 0;
          const dataPoint = chartData[idx];

          if (!dataPoint) return "";

          const header = `<div class="tooltip-header">${dataPoint.date}</div>`;
          
          // ساخت آیتم‌های tooltip با استفاده مستقیم از dataPoint
          const swapTypes = [
            { 
              name: "Native Swap Volume", 
              percent: dataPoint.nativePercent, 
              color: getSeriesColor("Native Swap Volume")
            },
            { 
              name: "Trade Swaps", 
              percent: dataPoint.tradePercent, 
              color: getSeriesColor("Trade Swaps")
            },
            { 
              name: "Synth Swaps", 
              percent: dataPoint.synthPercent, 
              color: getSeriesColor("Synth Swaps")
            },
            { 
              name: "Secured Swaps", 
              percent: dataPoint.securedPercent, 
              color: getSeriesColor("Secured Swaps")
            },
          ];

          const bodyLines = swapTypes.map((swapType) => {
            // نمایش - فقط اگر مقدار دقیقاً 0 باشد (نه نزدیک به صفر)
            const showPercent = Math.abs(swapType.percent) > 0.0001;
            const percentText = showPercent ? formatPercentValue(swapType.percent) : "-";

            return `
              <span class="tooltip-item space">
                <span class="series-name-color">
                  <span class="data-color" style="background-color: ${swapType.color};"></span>
                  <span>${swapType.name}</span>
                </span>
                <span>${percentText}</span>
              </span>
            `;
          }).join("");

          return `
          ${header}
          <div class="tooltip-body">
            ${bodyLines}
          </div>`;
        },
      },
      series: chartDataForECharts.series.map(series => ({
        ...series,
        barWidth: '85%',
      })),
    };
  }, [theme, chartData, chartDataForECharts]);

  if (loading) {
    return <ChartLoader />;
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">
            No normalized swap data available
          </p>
          <p className="text-sm text-muted-foreground">
            {chartData.length === 0
              ? "No data points found"
              : "No swap types found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <EChartsWrapper
        type="bar"
        data={chartDataForECharts}
        options={chartOptions}
        height="450px"
      />
    </div>
  );
};

export default SwapChartNormalized;