"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "@/lib/store";
import { getChartColor, getCurrentChartTheme } from "@/utils/global";
import EChartsWrapper from "./charts/EChartsWrapper";
import "@/styles/tooltip.css";

interface PieData {
  name: string;
  value: number;
  [key: string]: any;
}

interface PieChartProps {
  pieData?: PieData[];
  formatter?: (value: any, name: string) => string;
  name?: string;
  extraSeries?: any;
  extra?: any;
  width?: string | number;
  height?: string | number;
  click?: (data: any) => void;
  showLoading?: boolean;
  showLegend?: boolean;
  type?: "pie" | "doughnut";
}

const PieChart: React.FC<PieChartProps> = ({
  pieData = [],
  formatter,
  name = "",
  extraSeries = {},
  extra = {},
  width = "100%",
  height = "250px",
  click,
  showLoading = false,
  showLegend = true,
  type = "pie",
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 990);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getPieColors = () => {
    if (!pieData || pieData.length === 0) return [];

    const tcyAllocationColors: Record<string, string> = {
      Staked: "#63fdd9",
      Unclaimed: "#00ccff",
      Pooled: "#F59E0B",
      "Protocol Owned": "#EF4444",
      Unstaked: "#F3F4F6",
    };

    return pieData.map((item) => {
      if (tcyAllocationColors[item.name]) {
        return tcyAllocationColors[item.name];
      }
      return getChartColor(pieData.indexOf(item), getCurrentChartTheme(theme));
    });
  };

  const chartData = useMemo(() => {
    if (!pieData || pieData.length === 0) return { labels: [], datasets: [] };

    const colors = getPieColors();

    return {
      labels: pieData.map((item) => item.name),
      datasets: [
        {
          data: pieData.map((item) => item.value),
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: 1,
        },
      ],
    };
  }, [pieData, theme]);

  const chartOptions = useMemo(() => {
    return {
      legend: {
        show: showLegend && !isMobile,
      },
      plugins: {
        legend: {
          display: showLegend && !isMobile,
          position: "left" as const,
          labels: {
            usePointStyle: true,
            pointStyle: "circle",
            padding: 20,
            font: {
              family: "Montserrat",
              size: 14,
            },
          },
        },
        tooltip: {
          enabled: true,
          displayColors: false,
          backgroundColor: "transparent",
          titleColor: "var(--sec-font-color)",
          bodyColor: "var(--sec-font-color)",
          borderColor: "var(--border)",
          borderWidth: 1,
          cornerRadius: 6,
          className: "echarts-tooltip",
          callbacks: {
            title: function (context: any) {
              return context[0].label || "";
            },
            label: function (context: any) {
              const label = context.label || "";
              const value = context.parsed;

              if (formatter) {
                return formatter(value, label);
              }

              return `${label}: ${value}`;
            },
            footer: function () {
              return "";
            },
            afterLabel: function () {
              return "";
            },
            afterBody: function () {
              return "";
            },
            beforeLabel: function () {
              return "";
            },
            afterTitle: function () {
              return "";
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
      onClick: (event: any, elements: any) => {
        if (click && elements.length > 0) {
          const elementIndex = elements[0].index;
          const data = pieData[elementIndex];
          click(data);
        }
      },
      ...extra,
    };
  }, [isMobile, formatter, click, pieData, extra, showLegend]);

  if (showLoading) {
    return (
      <div
        style={{
          width: width,
          height: height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (!pieData || pieData.length === 0) {
    return (
      <div
        style={{
          width: width,
          height: height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div
      style={{
        width: width,
        height: height,
        minHeight: "initial",
      }}
    >
      <EChartsWrapper
        type={type}
        data={chartData}
        options={{
          ...chartOptions,
          ...extraSeries,
          tooltip: {
            ...chartOptions.tooltip,
            formatter: formatter
              ? function (params: any) {
                  return formatter(params.value, params.name);
                }
              : undefined,
            className: "echarts-tooltip",
            backgroundColor: "var(--bgt-color)",
            borderColor: "var(--border)",
            textStyle: {
              color: "var(--sec-font-color)",
              fontSize: "var(--font-size-sm)",
            },
          },
        }}
        height={typeof height === "string" ? height : `${height}px`}
      />
    </div>
  );
};

export default PieChart;
