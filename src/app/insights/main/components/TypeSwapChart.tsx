"use client";

import React, { useMemo } from "react";
import { getChartColor, getCurrentChartTheme } from "@/utils/global";
import { useTheme } from "@/lib/store";
import EChartsWrapper from "@/components/charts/EChartsWrapper";
import ChartLoader from "@/components/ChartLoader";

interface SwapTypeData {
  date: string;
  nativeVolume: number;
  tradeVolume: number;
  synthVolume: number;
  securedVolume: number;
  count?: number;
  total?: number;
}

interface TypeSwapChartProps {
  data: SwapTypeData[];
  loading?: boolean;
  height?: string;
}

const TypeSwapChart: React.FC<TypeSwapChartProps> = ({
  data,
  loading = false,
  height = "400px",
}) => {
  const theme = useTheme();

  const getSeriesColor = (index: number) => {
    const colors = [
      getChartColor(0, getCurrentChartTheme(theme)), 
      getChartColor(1, getCurrentChartTheme(theme)), 
      getChartColor(2, getCurrentChartTheme(theme)), 
      getChartColor(3, getCurrentChartTheme(theme)), 
    ];
    return colors[index] || getChartColor(index, getCurrentChartTheme(theme));
  };

  const formatValue = (value: number) => {
    const numValue = Math.abs(value);
    
    if (numValue >= 1e9) {
      return `$${(numValue / 1e9).toFixed(1)}B`;
    } else if (numValue >= 1e6) {
      return `$${(numValue / 1e6).toFixed(1)}M`;
    } else if (numValue >= 1e3) {
      return `$${(numValue / 1e3).toFixed(1)}K`;
    }
    return `$${numValue.toFixed(0)}`;
  };

  const seriesNames = [
    "Native Swap Volume",
    "Trade Swaps", 
    "Synth Swaps",
    "Secured Swaps"
  ];

  const chartDataForECharts = useMemo(() => {
    if (!data || data.length === 0) return { labels: [], series: [] };

    const n = data.length;
    const lastIdx = Math.max(0, n - 1);

    const makeSeriesData = (seriesIndex: number) =>
      data.map((row, i) => {
        let value = 0;
        switch(seriesIndex) {
          case 0: value = row.nativeVolume; break;
          case 1: value = row.tradeVolume; break;
          case 2: value = row.synthVolume; break;
          case 3: value = row.securedVolume; break;
        }
        
        const radius = i === lastIdx ? [0, 0, 0, 0] : [8, 8, 0, 0];
        
        return {
          value,
          itemStyle: { 
            borderRadius: radius,
            color: getSeriesColor(seriesIndex)
          },
        };
      });

    const series = seriesNames.map((name, index) => ({
      name,
      type: "bar" as const,
      stack: "total",
      data: makeSeriesData(index),
    }));

    return {
      labels: data.map(item => item.date),
      series,
    };
  }, [data, theme]);

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
          const separator = '<div class="tooltip-separator"></div>';
          
          const bodyLines = seriesNames.map((name, index) => {
            let value = 0;
            switch(index) {
              case 0: value = dataPoint.nativeVolume; break;
              case 1: value = dataPoint.tradeVolume; break;
              case 2: value = dataPoint.synthVolume; break;
              case 3: value = dataPoint.securedVolume; break;
            }
            
            const showValue = Math.abs(value) > 0.0001;
            const valueText = showValue ? formatValue(value) : "-";

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

          const totalLine = `
            <span class="tooltip-item space total-line">
              <span>Total Volume</span>
              <span>${formatValue(dataPoint.total || 
                dataPoint.nativeVolume + dataPoint.tradeVolume + 
                dataPoint.synthVolume + dataPoint.securedVolume)}</span>
            </span>
          `;

          const countLine = dataPoint.count !== undefined ? `
            <span class="tooltip-item space count-line">
              <span>Swap Count</span>
              <span>${dataPoint.count.toLocaleString()}</span>
            </span>
          ` : '';

          return `
          ${header}
          ${separator}
          <div class="tooltip-body">
            ${bodyLines}
            ${totalLine}
            ${countLine}
          </div>`;
        },
      },
      series: chartDataForECharts.series.map(series => ({
        ...series,
        barWidth: '85%',
      })),
    };
  }, [theme, data, chartDataForECharts]);

  if (loading) {
    return <ChartLoader />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">
            No swap type data available
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

export default TypeSwapChart;