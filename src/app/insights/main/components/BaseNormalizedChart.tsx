"use client";

import React, { useMemo } from "react";
import { getChartColor, getCurrentChartTheme } from "@/utils/global";
import { useTheme } from "@/lib/store";
import EChartsWrapper from "@/components/charts/EChartsWrapper";
import ChartLoader from "@/components/ChartLoader";

interface DataPoint {
  date: string;
  [key: string]: number | string;
}

interface ChartSeries {
  name: string;
  type: "bar" | "line";
  data: any[];
  stack?: string;
  itemStyle?: any;
}

interface BaseNormalizedChartProps {
  data: DataPoint[];
  loading?: boolean;
  seriesNames: string[];
  chartTitle?: string;
  height?: string;
  isNormalized?: boolean;
  formatValue?: (value: number) => string;
  customColors?: string[];
}

const BaseNormalizedChart: React.FC<BaseNormalizedChartProps> = ({
  data,
  loading = false,
  seriesNames,
  chartTitle = "",
  height = "450px",
  isNormalized = true,
  formatValue,
  customColors,
}) => {
  const theme = useTheme();

  const getSeriesColor = (index: number) => {
    if (customColors && customColors[index]) {
      return customColors[index];
    }
    return getChartColor(index, getCurrentChartTheme(theme));
  };

  const defaultFormatValue = (value: number) => {
    if (isNormalized) {
      return `${(value * 100).toFixed(1)}%`;
    }
    return `$${value.toFixed(2)}`;
  };

  const formatFunc = formatValue || defaultFormatValue;

  const chartDataForECharts = useMemo(() => {
    if (!data || data.length === 0) return { labels: [], series: [] };

    const n = data.length;
    const lastIdx = Math.max(0, n - 1);

    const topIndexPerDay = data.map((row) => {
      const values = seriesNames.map(name => row[name] as number || 0);
      for (let s = values.length - 1; s >= 0; s--) {
        if (values[s] > 0) return s;
      }
      return -1;
    });

    const makeSeriesData = (seriesIndex: number) =>
      data.map((row, i) => {
        const value = row[seriesNames[seriesIndex]] as number || 0;
        const isTop = topIndexPerDay[i] === seriesIndex;
        const radius =
          i === lastIdx ? [0, 0, 0, 0] : isTop ? [8, 8, 0, 0] : [0, 0, 0, 0];
        
        return {
          value,
          itemStyle: { 
            borderRadius: radius,
            color: getSeriesColor(seriesIndex)
          },
        };
      });

    const series: ChartSeries[] = seriesNames.map((name, index) => ({
      name,
      type: "bar",
      stack: "Total",
      data: makeSeriesData(index),
    }));

    return {
      labels: data.map(item => item.date),
      series,
    };
  }, [data, seriesNames, theme]);

  const chartOptions = useMemo(() => {
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
        data: seriesNames,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: chartDataForECharts.labels,
        axisLabel: {
          color: 'var(--sec-font-color)',
          fontSize: 11,
          rotate: 45,
          margin: 10
        },
        axisLine: {
          lineStyle: {
            color: 'var(--border-color)'
          }
        },
        axisTick: {
          show: false
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: 'var(--sec-font-color)',
          fontSize: 11,
          formatter: isNormalized ? '{value}%' : '${value}'
        },
        splitLine: {
          lineStyle: {
            color: 'var(--border-color)',
            type: 'dashed'
          }
        }
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
          const dataPoint = data[idx];

          if (!dataPoint) return "";

          const header = `<div class="tooltip-header">${dataPoint.date}</div>`;
          
          const bodyLines = seriesNames.map((name, index) => {
            const value = dataPoint[name] as number || 0;
            const showValue = Math.abs(value) > 0.0001;
            const valueText = showValue ? formatFunc(value) : "-";

            return `
              <span class="tooltip-item space">
                <span class="series-name-color">
                  <span class="data-color" style="background-color: ${getSeriesColor(index)};"></span>
                  <span>${name}</span>
                </span>
                <span>${valueText}</span>
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
  }, [theme, data, seriesNames, chartDataForECharts, formatFunc, isNormalized]);

  if (loading) {
    return <ChartLoader />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">
            No data available for {chartTitle}
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
        height={height}
      />
    </div>
  );
};

export default BaseNormalizedChart;