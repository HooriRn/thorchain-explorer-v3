"use client";

import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { useTheme } from "@/lib/store";
import { getChartColor, getCurrentChartTheme } from "@/utils/global";

interface EChartsWrapperProps {
  type: "bar" | "pie" | "line" | "doughnut";
  data: any;
  options?: any;
  height?: string;
  width?: string;
  className?: string;
}

const EChartsWrapper: React.FC<EChartsWrapperProps> = ({
  type,
  data,
  options = {},
  height = "300px",
  width = "100%",
  className = "",
}) => {
  const theme = useTheme();

  const chartOptions = useMemo(() => {
    const currentTheme = getCurrentChartTheme(theme);

    const baseTheme = {
      backgroundColor: "transparent",
      textStyle: {
        color: "var(--font-color)",
        fontFamily: "Montserrat, sans-serif",
      },
      tooltip: {
        backgroundColor: "transparent",
        borderColor: "transparent",
        textStyle: {
          color: "transparent",
        },
        extraCssText:
          "background-color: var(--bgt-color) !important; backdrop-filter: blur(8px); box-shadow: none; border: 1px var(--border) solid; border-radius: var(--radius-lg); padding: var(--space-10); font-family: 'Montserrat', sans-serif; font-size: var(--font-size-sm); color: var(--sec-font-color);",
      },
      legend: {
        textStyle: {
          color: "var(--font-color)",
        },
      },
      grid: {
        left: "3%",
        right: "3%",
        bottom: "3%",
        top: "15%",
        containLabel: true,
      },
    };

    let chartConfig: any = { ...baseTheme };

    if (type === "bar") {
      chartConfig = {
        ...chartConfig,
        tooltip: {
          ...chartConfig.tooltip,
          trigger: "axis",
          axisPointer: {
            type: "shadow",
          },
          formatter: function (params: any) {
            if (!params || params.length === 0) return "";

            const dataIndex = params[0].dataIndex;
            const date = data.labels?.[dataIndex] || "";

            let tooltipContent = `
              <div class="tooltip-header">
                <span>${date}</span>
              </div>
              <div class="tooltip-body">
            `;

            params.forEach((param: any) => {
              const value = param.value || 0;
              const label = param.seriesName || "";

              if (options?.countData && label.toLowerCase().includes("eod")) {
                return;
              }

              if (label.toLowerCase().includes("eod")) {
                return;
              }

              let formattedValue = "";
              if (value >= 1e9) {
                formattedValue = `$${(value / 1e9).toFixed(1)}B`;
              } else if (value >= 1e6) {
                formattedValue = `$${(value / 1e6).toFixed(1)}M`;
              } else if (value >= 1e3) {
                formattedValue = `$${(value / 1e3).toFixed(1)}K`;
              } else {
                formattedValue = `$${value.toFixed(0)}`;
              }

              tooltipContent += `
                <span class="tooltip-item space">
                  <span class="series-name-color">
                    <span class="data-color" style="background-color: ${param.color};"></span>
                    <span>${label}</span>
                  </span>
                  <span>${formattedValue}</span>
                </span>
              `;
            });

            if (
              options?.countData &&
              options.countData[dataIndex] !== undefined
            ) {
              const countValue = options.countData[dataIndex];
              tooltipContent += `
                <span class="tooltip-item space">
                  <span class="series-name-color">
                    <span class="data-color" style="background-color: #63fdd9;"></span>
                    <span>Count</span>
                  </span>
                  <span>${Number(countValue).toLocaleString()}</span>
                </span>
              `;
            }

            tooltipContent += `</div>`;
            return tooltipContent;
          },
        },
        xAxis: {
          type: "category",
          data: data.labels || [],
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
        series:
          data.series ||
          data.datasets?.map((dataset: any, index: number) => ({
            name: dataset.label,
            type: "bar",
            data: dataset.data,
            itemStyle: {
              color:
                dataset.backgroundColor || getChartColor(index, currentTheme),
              borderRadius: [4, 4, 0, 0],
            },
            stack: dataset.stack || undefined,
          })) ||
          [],
      };
    } else if (type === "pie" || type === "doughnut") {
      chartConfig = {
        ...chartConfig,
        tooltip: {
          ...chartConfig.tooltip,
          trigger: "item",
          formatter:
            options?.tooltip?.formatter ||
            function (params: any) {
              if (options?.tooltip?.callbacks?.label) {
                return options.tooltip.callbacks.label(params);
              }
              return `${params.name}: ${params.value}`;
            },
        },
        series: [
          {
            name: "Data",
            type: "pie",
            radius: type === "doughnut" ? ["40%", "70%"] : "70%",
            center: options?.center || ["50%", "50%"],
            label: {
              show:
                options?.label?.show !== undefined ? options.label.show : false,
              position: options?.label?.position || "inside",
              formatter:
                options?.label?.formatter ||
                function (params: any) {
                  return `{a|${params.name}: ${params.value}}`;
                },
              distanceToLabelLine: options?.label?.distanceToLabelLine || 5,
              color: options?.label?.color || "var(--font-color)",
              fontSize: options?.label?.fontSize || 12,
              fontFamily: options?.label?.fontFamily || "Montserrat",
              textStyle: {
                color:
                  options?.label?.textStyle?.color ||
                  options?.label?.color ||
                  "var(--font-color)",
                fontSize:
                  options?.label?.textStyle?.fontSize ||
                  options?.label?.fontSize ||
                  12,
                fontFamily:
                  options?.label?.textStyle?.fontFamily ||
                  options?.label?.fontFamily ||
                  "Montserrat",
              },
              rich: {
                a: {
                  color:
                    options?.label?.rich?.a?.color ||
                    options?.label?.textStyle?.color ||
                    options?.label?.color ||
                    "var(--font-color)",
                  fontSize:
                    options?.label?.rich?.a?.fontSize ||
                    options?.label?.textStyle?.fontSize ||
                    options?.label?.fontSize ||
                    12,
                  fontFamily:
                    options?.label?.rich?.a?.fontFamily ||
                    options?.label?.textStyle?.fontFamily ||
                    options?.label?.fontFamily ||
                    "Montserrat",
                },
              },
            },
            labelLine: {
              show:
                options?.labelLine?.show !== undefined
                  ? options.labelLine.show
                  : false,
              length: options?.labelLine?.length || 15,
              length2: options?.labelLine?.length2 || 10,
              lineStyle: {
                color: options?.labelLine?.lineStyle?.color || "#999999",
                width: options?.labelLine?.lineStyle?.width || 1,
              },
            },
            data:
              data.datasets?.[0]?.data?.map((value: number, index: number) => ({
                value,
                name: data.labels?.[index] || `Item ${index + 1}`,
                itemStyle: {
                  color:
                    data.datasets?.[0]?.backgroundColor?.[index] ||
                    getChartColor(index, currentTheme),
                  borderWidth: 0,
                  borderColor: "transparent",
                },
              })) || [],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)",
                borderWidth: 0,
                borderColor: "transparent",
              },
            },
          },
        ],
      };
    } else if (type === "line") {
      chartConfig = {
        ...chartConfig,
        tooltip: {
          ...chartConfig.tooltip,
          trigger: "axis",
        },
        xAxis: {
          type: "category",
          data: data.labels || [],
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
        series:
          data.datasets?.map((dataset: any, index: number) => ({
            name: dataset.label,
            type: "line",
            data: dataset.data,
            smooth: true,
            lineStyle: {
              color: dataset.borderColor || getChartColor(index, currentTheme),
              width: 2,
            },
            itemStyle: {
              color: dataset.borderColor || getChartColor(index, currentTheme),
            },
            areaStyle: dataset.fill
              ? {
                  color: {
                    type: "linear",
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                      {
                        offset: 0,
                        color:
                          (dataset.backgroundColor ||
                            getChartColor(index, currentTheme)) + "80",
                      },
                      {
                        offset: 1,
                        color:
                          (dataset.backgroundColor ||
                            getChartColor(index, currentTheme)) + "20",
                      },
                    ],
                  },
                }
              : undefined,
          })) || [],
      };
    }

    const merged = {
      ...chartConfig,
      ...options,
    } as any;

    if (options?.tooltip) {
      merged.tooltip = {
        ...chartConfig.tooltip,
        ...options.tooltip,
      };
    }

    return merged;
  }, [type, data, options, theme]);

  return (
    <div style={{ height, width }} className={className}>
      <ReactECharts
        option={chartOptions}
        style={{ height: "100%", width: "100%" }}
        opts={{ renderer: "canvas" }}
      />
    </div>
  );
};

export default EChartsWrapper;
