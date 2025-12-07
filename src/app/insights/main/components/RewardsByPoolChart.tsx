"use client";

import React, { useMemo } from "react";
import moment from "moment";
import { orderBy } from "lodash";
import { useTheme } from "@/lib/store";
import EChartsWrapper from "@/components/charts/EChartsWrapper";
import ChartLoader from "@/components/ChartLoader";
import { showAsset } from "@/utils/global";

interface RewardsByPoolChartProps {
  data?: any;
  loading?: boolean;
}

const RewardsByPoolChart: React.FC<RewardsByPoolChartProps> = ({
  data,
  loading = false,
}) => {
  const theme = useTheme();

  const normalFormat = (value: number, format: string = "0,0.00") => {
    if (!value && value !== 0) return "-";

    const numValue = Math.abs(value);

    if (numValue >= 1e12) {
      return `$${(numValue / 1e12).toFixed(2)}T`;
    } else if (numValue >= 1e9) {
      return `$${(numValue / 1e9).toFixed(2)}B`;
    } else if (numValue >= 1e6) {
      return `$${(numValue / 1e6).toFixed(2)}M`;
    } else if (numValue >= 1e3) {
      return `$${(numValue / 1e3).toFixed(2)}K`;
    } else if (numValue >= 1) {
      return `$${numValue.toFixed(2)}`;
    }
    return `$${numValue.toFixed(4)}`;
  };

  const chartOptions = useMemo(() => {
    if (!data?.intervals || !Array.isArray(data.intervals)) {
      return null;
    }

    const top = 6;
    const lastInterval = data.intervals[data.intervals.length - 2];

    const poolEarnings = orderBy(
      lastInterval.pools.filter(
        (p: any) =>
          p.pool !== "income_burn" &&
          p.pool !== "dev_fund_reward" &&
          p.pool !== "tcy_stake_reward" &&
          p.pool !== "marketing_fund_reward"
      ),
      [(o) => Math.abs(+o.rewards || 0)],
      ["desc"]
    )
      .slice(0, top)
      .map((p: any) => p.pool);

    const xAxis: string[] = [];
    const series: any[] = [];
    const pt: number[] = [];

    const otherPoolsSeries = {
      type: "bar",
      name: "Other Pools",
      showSymbol: false,
      stack: "Total",
      data: [] as number[],
    };

    const poolSeries = poolEarnings.map((poolName: string, index: number) => ({
      type: "bar",
      name: showAsset(poolName),
      showSymbol: false,
      stack: "Total",
      data: [] as number[],
    }));

    data.intervals.forEach((interval: any, index: number) => {
      if (index === data.intervals.length - 1) {
        return;
      }

      const date = moment(
        Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
      );
      xAxis.push(date.format("dddd, MMM D"));

      let otherEarnings = interval.pools.filter(
        (p: any) =>
          !poolEarnings.slice(0, top).includes(p.pool) &&
          p.pool !== "income_burn" &&
          p.pool !== "dev_fund_reward" &&
          p.pool !== "tcy_stake_reward" &&
          p.pool !== "marketing_fund_reward"
      );

      otherEarnings = otherEarnings.reduce(
        (a: number, c: any) =>
          a + (-1 * +c.rewards * +interval.runePriceUSD) / 1e8,
        0
      );

      otherPoolsSeries.data.push(otherEarnings);

      let total = 0;
      poolEarnings.forEach((poolName: string, pi: number) => {
        const pool = interval.pools.find((p: any) => p.pool === poolName);
        const value = pool
          ? (+pool.rewards * -1 * +interval.runePriceUSD) / 1e8
          : 0;
        total += value;

        if (poolSeries[pi]) {
          poolSeries[pi].data.push(value);
        }
      });

      pt.push(total);
    });

    const allSeries = [
      otherPoolsSeries,
      ...poolSeries,
      {
        type: "line",
        name: "Total Income",
        showSymbol: false,
        areaStyle: {
          color: "rgba(0, 0, 47, 0.2)",
        },
        data: pt,
        smooth: true,
        lineStyle: {
          width: 2,
        },
        z: 3,
      },
    ];

    const getSeriesColor = (index: number, seriesName: string) => {
      const vueColors = [
        "#63FDD9",
        "#00CCFF",
        "#F3BA2F",
        "#FF4954",
        "#95e77e",
        "#ff8a65",
        "#9575cd",
        "#4db6ac",
      ];

      if (seriesName === "Total Income") {
        return theme === "light" ? "#1976d2" : "#64b5f6";
      }

      if (seriesName === "Other Pools") {
        return theme === "light" ? "#9e9e9e" : "#757575";
      }

      return vueColors[index % vueColors.length];
    };

    const tooltipFormatter = (params: any[]) => {
      if (!params || params.length === 0) return "";

      const tooltipHTML = `
        <div class="tooltip-header">
          ${params[0].name}
        </div>
        <div class="tooltip-body">
          ${params
            .filter((a) => a.value || a.value === 0)
            .sort((a, b) => {
              if (
                a.seriesName === "Total Income" ||
                a.seriesName === "Other Pools"
              )
                return 1;
              if (
                b.seriesName === "Total Income" ||
                b.seriesName === "Other Pools"
              )
                return -1;
              return (b.value || 0) - (a.value || 0);
            })
            .map(
              (p, i) => `
              ${
                params.length - 2 === i
                  ? ` <span style="border-top: 1px solid var(--border-color); margin: 2px 0;"></span>`
                  : ""
              }
              <span>
                <div class="tooltip-item">
                  <div class="data-color" style="background-color: ${p.color}">
                  </div>
                  <span style="text-align: left;">
                    ${p.seriesName}
                  </span>
                </div>
                <b>${normalFormat(p.value, "0,0.00a")}</b>
              </span>`
            )
            .join("")}
        </div>
      `;

      return tooltipHTML;
    };

    return {
      legend: {
        show: false,
      },
      xAxis: {
        type: "category",
        data: xAxis,
        axisLabel: {
          show: false,
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
      },
      yAxis: [
        {
          type: "value",
          name: "",
          position: "right",
          show: false,
          splitLine: {
            show: true,
            lineStyle: {
              color: theme === "light" ? "#e0e0e0" : "#424242",
              type: "dashed",
            },
          },
          axisLabel: {
            formatter: (value: number) => normalFormat(value),
          },
        },
      ],
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        backgroundColor:
          theme === "dark"
            ? "rgba(30, 30, 30, 0.9)"
            : "rgba(255, 255, 255, 0.95)",
        borderColor: theme === "dark" ? "#424242" : "#e0e0e0",
        borderWidth: 1,
        textStyle: {
          color: theme === "dark" ? "#ffffff" : "#333333",
          fontSize: 12,
        },
        formatter: tooltipFormatter,
      },
      series: allSeries.map((series, index) => ({
        ...series,
        itemStyle: {
          color: getSeriesColor(index, series.name),
        },
      })),
    };
  }, [data, theme]);

  if (loading) {
    return <ChartLoader barCount={15} />;
  }

  if (!data || !chartOptions) {
    return <ChartLoader barCount={15} />;
  }

  return (
    <div className="h-full w-full">
      <EChartsWrapper
        type="bar"
        data={{
          labels: chartOptions.xAxis.data || [],
          series: chartOptions.series || [],
        }}
        options={chartOptions}
        height="400px"
      />
    </div>
  );
};

export default RewardsByPoolChart;
