"use client";

import React, { useMemo } from "react";
import Card from "@/components/ui/Card";
import EChartsWrapper from "@/components/charts/EChartsWrapper";
import ChartLoader from "@/components/ChartLoader";
import { isMainnet } from "@/utils/global";
import { useTheme } from "@/lib/store";
import { getChartColor, getCurrentChartTheme } from "@/utils/global";
import moment from "moment";
import "@/styles/tooltip.css";

interface ReserveBreakdownCardProps {
  reserveHistory: any;
  earningHistory: any;
  loading: boolean;
}

const formatReserve = (d: any, rewards: any) => {
  const xAxis: string[] = [];
  const pf: number[] = [];
  const pr: number[] = [];
  const pn: number[] = [];
  const pt: number[] = [];
  const pre: number[] = [];

  d?.intervals.forEach((interval: any, index: number) => {
    if (index === d?.intervals?.length - 1) {
      return;
    }
    xAxis.push(
      moment(
        Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
      ).format("dddd, MMM D")
    );
    pf.push(+interval.gasFeeOutbound / 10 ** 8);
    pr.push((+interval.gasReimbursement * -1) / 10 ** 8);
    pn.push(+interval.networkFee / 10 ** 8);

    pt.push(
      (+interval.gasFeeOutbound +
        +interval.networkFee -
        +interval.gasReimbursement -
        +rewards?.intervals[index]?.blockRewards) /
        1e8
    );

    pre.push((-1 * rewards?.intervals[index]?.blockRewards) / 1e8);
  });

  const result = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "none",
      },
      formatter: (params: any) => {
        if (!params || params.length === 0) return "";

        const dataIndex = params[0].dataIndex;
        const date = xAxis[dataIndex] || "";

        const format = (v: number) => {
          if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B RUNE`;
          if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M RUNE`;
          if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K RUNE`;
          return `${(v || 0).toFixed(0)} RUNE`;
        };

        const valueOf = (p: any) =>
          typeof p?.value === "object" && p?.value !== null
            ? Number(p.value.value || 0)
            : Number(p?.value || 0);

        const header = `<div class="tooltip-header">${date}</div>`;

        const bodyLines = params
          .map((param: any) => {
            const value = valueOf(param);
            const label = param.seriesName || "";

            return `
            <span class="tooltip-item space">
              <span class="series-name-color">
                <span class="data-color" style="background-color: ${
                  param.color
                };"></span>
                <span>${label}</span>
              </span>
              <span>${format(value)}</span>
            </span>
          `;
          })
          .join("");

        return `
          ${header}
          <div class="tooltip-body">
            ${bodyLines}
          </div>
        `;
      },
    },
    legend: {
      data: [
        "Fee outbound",
        "Network Fee",
        "Gas Reimbursement",
        "Reward Emission",
        "Income Burn",
        "Total Income",
      ],
    },
    xAxis: {
      type: "category",
      data: xAxis,
      show: false,
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        show: true,
      },
    },
    yAxis: {
      type: "value",
      position: "left",
      show: false,
      splitLine: {
        show: false,
      },
      axisLine: {
        show: false,
      },
      min: "dataMin",
      max: "dataMax",
    },
    series: [
      {
        type: "bar",
        name: "Fee outbound",
        stack: "total",
        showSymbol: false,
        data: pf,
      },
      {
        type: "bar",
        name: "Network Fee",
        stack: "total",
        showSymbol: false,
        data: pn,
      },
      {
        type: "bar",
        name: "Gas Reimbursement",
        stack: "total",
        showSymbol: false,
        data: pr,
      },
      {
        type: "bar",
        name: "Reward Emission",
        stack: "total",
        showSymbol: false,
        data: pre,
      },
      {
        type: "line",
        name: "Total Income",
        showSymbol: false,
        areaStyle: {
          color: "rgba(243, 186, 47, 0.2)",
        },
        data: pt,
        smooth: true,
        lineStyle: {
          width: 2,
        },
        z: 3,
      },
    ],
  };

  return result;
};

const ReserveBreakdownCard: React.FC<ReserveBreakdownCardProps> = ({
  reserveHistory,
  earningHistory,
  loading,
}) => {
  const theme = useTheme();

  if (!isMainnet()) {
    return null;
  }

  const chartOptions = useMemo(() => {
    if (!reserveHistory) return {};

    const formattedData = formatReserve(reserveHistory, earningHistory);

    const enhancedOptions = {
      ...formattedData,
      legend: {
        show: true,
        top: "top",
        left: "center",
        icon: "circle",
        itemWidth: 12,
        itemHeight: 12,
        textStyle: {
          fontSize: 12,
          color:
            theme === "dark" || theme === "BlueElectra" ? "#e6e6e6" : "#333333",
        },
        data: [
          "Fee outbound",
          "Network Fee",
          "Gas Reimbursement",
          "Reward Emission",
          "Income Burn", // Added income burn to legend
          "Total Income",
        ],
      },
      color: [
        getChartColor(0, getCurrentChartTheme(theme)),
        getChartColor(1, getCurrentChartTheme(theme)),
        getChartColor(2, getCurrentChartTheme(theme)),
        getChartColor(3, getCurrentChartTheme(theme)),
        getChartColor(4, getCurrentChartTheme(theme)), // Income burn color
        getChartColor(5, getCurrentChartTheme(theme)),
      ],
      grid: {
        left: "0%",
        right: "0%",
        top: "15%",
      },
    };

    return enhancedOptions;
  }, [reserveHistory, earningHistory, theme]);

  return (
    <Card
      title="Reserve Breakdown"
      imgSrc="/assets/images/signal.svg"
      imgStyle={{
        width: "36px",
        height: "36px",
      }}
      isChart={true}
    >
      {reserveHistory ? (
        <>
          <div className="h-full w-full">
            <EChartsWrapper
              type="bar"
              data={{}}
              options={chartOptions}
              height="400px"
              width="672px"
            />
          </div>
        </>
      ) : (
        <>
          <div className="h-full w-full">
            <ChartLoader barCount={15} />
          </div>
        </>
      )}
    </Card>
  );
};

export default ReserveBreakdownCard;
