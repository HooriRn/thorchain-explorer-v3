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

    swapVolumeData.intervals.forEach((interval: any, index: number) => {
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

      const totalVolume = (interval.totalVolumeUSD || 0) / 100; 
      const eodVolume = (interval.EODVolume || 0) / 100; 
      const count =
        interval.totalCount ||
        interval.fromTradeCount ||
        interval.toTradeCount ||
        0;

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

    return {
      labels: chartData.map((item) => item.date),
      datasets: [
        {
          label: "Total Volume",
          data: chartData.map((item) => item.totalVolume),
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
        },
        {
          label: "EOD Volume",
          data: chartData.map((item) => item.eodVolume),
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
        }}
        height="400px"
      />
    </div>
  );
};

export default SwapVolumeChart;
