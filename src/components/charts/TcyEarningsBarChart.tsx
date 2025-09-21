"use client";

import React, { useMemo } from "react";
import { getChartColor, getCurrentChartTheme } from "@/utils/global";
import { useTheme } from "@/lib/store";
import ChartLoader from "@/components/ChartLoader";
import EChartsWrapper from "./EChartsWrapper";

interface EarningsHistory {
  xAxis: string[];
  series: Array<{
    type: string;
    name: string;
    showSymbol: boolean;
    data: number[];
  }>;
}

interface TcyEarningsBarChartProps {
  earningsHistory: EarningsHistory | null;
  loading?: boolean;
}

const TcyEarningsBarChart: React.FC<TcyEarningsBarChartProps> = ({
  earningsHistory,
  loading = false,
}) => {
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

  const chartData = useMemo(() => {
    if (!earningsHistory) return { labels: [], datasets: [] };

    return {
      labels: earningsHistory.xAxis,
      datasets: [
        {
          label: "TCY Pool Fees",
          data: earningsHistory.series[0]?.data || [],
          backgroundColor: getChartColor(0, getCurrentChartTheme(theme)),
          borderColor: getChartColor(0, getCurrentChartTheme(theme)),
          borderWidth: 1,
        },
        {
          label: "Stake Earnings",
          data: earningsHistory.series[1]?.data || [],
          backgroundColor: getChartColor(1, getCurrentChartTheme(theme)),
          borderColor: getChartColor(1, getCurrentChartTheme(theme)),
          borderWidth: 1,
        },
      ],
    };
  }, [earningsHistory, theme]);

  const chartOptions = useMemo(() => {
    return {
      legend: {
        show: true,
        right: "5%",
        top: "5%",
        orient: "horizontal",
        icon: "circle",
        itemWidth: 12,
        itemHeight: 12,
        textStyle: {
          fontSize: 12,
          color:
            theme === "dark" || theme === "BlueElectra" ? "#e6e6e6" : "#333333",
        },
        itemGap: 20,
      },
      grid: {
        top: "20%",
        left: "3%",
        right: "3%",
        bottom: "3%",
        containLabel: true,
      },
    };
  }, [theme]);

  if (loading) {
    return <ChartLoader />;
  }

  if (!earningsHistory) {
    return <ChartLoader />;
  }

  return (
    <div className="chart-container tcy-earnings-chart-container">
      <EChartsWrapper
        type="bar"
        data={chartData}
        options={chartOptions}
        height="400px"
      />
    </div>
  );
};

export default TcyEarningsBarChart;
