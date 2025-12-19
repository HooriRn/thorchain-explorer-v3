"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Card from "@/components/ui/Card";
import { getBalanceHistory } from "@/lib/api";
import { useTheme } from "@/lib/store";
import moment from "moment";
import EChartsWrapper from "@/components/charts/EChartsWrapper";
import ChartLoader from "@/components/ChartLoader";
import styles from "./BalanceHistory.module.css";

interface BalanceHistoryProps {
  address: string;
}

interface BalanceDataItem {
  date: number;
  balance: string;
  price: string;
}

const BalanceHistory: React.FC<BalanceHistoryProps> = ({ address }) => {
  const [loading, setLoading] = useState(true);
  const [balanceData, setBalanceData] = useState<BalanceDataItem[]>([]);
  const [showValue, setShowValue] = useState(false);
  
  const theme = useTheme();

  const getUniqueValues = useCallback((values: number[], precision: number = 2) => {
    const rounded = values.map(
      (v) => Math.round(v * Math.pow(10, precision)) / Math.pow(10, precision)
    );
    return [...new Set(rounded)];
  }, []);

  const fetchBalanceHistory = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    try {
      const response = await getBalanceHistory(address, "day", 30);
      setBalanceData(response.data || []);
    } catch (error) {
      console.error("Error fetching balance history:", error);
      setBalanceData([]);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchBalanceHistory();
  }, [fetchBalanceHistory]);

  const toggleShowValue = () => {
    setShowValue((prev) => !prev);
  };

  const chartData = useMemo(() => {
    if (!balanceData || balanceData.length === 0) {
      return {
        labels: [] as string[],
        balanceSeries: [] as number[],
        valueSeries: [] as number[],
        rawData: [] as any[],
      };
    }

    const labels: string[] = [];
    const balanceSeries: number[] = [];
    const valueSeries: number[] = [];
    const rawData: any[] = [];

    balanceData.forEach((item) => {
      const time = moment(item.date * 1000).format("MMM DD");
      labels.push(time);

      const balance = parseFloat(item.balance) / 1e8;
      const price = parseFloat(item.price);
      const value = balance * price;

      balanceSeries.push(balance);
      valueSeries.push(value);
      
      rawData.push({
        date: time,
        balance,
        price,
        value,
      });
    });

    const currentSeries = showValue ? valueSeries : balanceSeries;
    getUniqueValues(currentSeries);

    return {
      labels,
      balanceSeries,
      valueSeries,
      rawData,
    };
  }, [balanceData, showValue, getUniqueValues]);

  const chartOptions = useMemo(() => {
    const { labels, balanceSeries, valueSeries, rawData } = chartData;
    
    if (labels.length === 0) return null;

    const series = showValue
      ? [
          {
            name: "Balance Value (USD)",
            type: "line" as const,
            showSymbol: false,
            data: valueSeries.map((value) => ({
              value,
              itemStyle: {
                color: theme === "light" ? "#3ca38b" : "#63FDD9",
              },
            })),
            areaStyle: {
              color: {
                type: "linear" as const,
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: "rgba(99, 253, 217, 0.3)",
                  },
                  {
                    offset: 1,
                    color: "rgba(99, 253, 217, 0.05)",
                  },
                ],
              },
            },
            lineStyle: {
              width: 2,
              color: theme === "light" ? "#3ca38b" : "#63FDD9",
            },
          },
        ]
      : [
          {
            name: "Balance (RUNE)",
            type: "line" as const,
            showSymbol: false,
            data: balanceSeries.map((value) => ({
              value,
              itemStyle: {
                color: theme === "light" ? "#3ca38b" : "#63FDD9",
              },
            })),
            areaStyle: {
              color: {
                type: "linear" as const,
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: "rgba(99, 253, 217, 0.3)",
                  },
                  {
                    offset: 1,
                    color: "rgba(99, 253, 217, 0.05)",
                  },
                ],
              },
            },
            lineStyle: {
              width: 2,
              color: theme === "light" ? "#3ca38b" : "#63FDD9",
            },
          },
        ];

    const tooltipFormatter = (params: any[]) => {
      if (!params || params.length === 0) return "";

      const dataIndex = params[0].dataIndex;
      const dataPoint = rawData[dataIndex];
      
      if (!dataPoint) return "";

      const date = dataPoint.date;
      const seriesName = params[0].seriesName;
      const value = params[0].value;

      return `
        <div class="tooltip-header" style="font-weight: bold; margin-bottom: 8px; display: flex; align-items: center;">
          <div class="data-color" style="width: 8px; height: 8px; border-radius: 50%; background-color: ${params[0].color}; margin-right: 8px;"></div>
          ${date}
        </div>
        <div class="tooltip-body">
          <span style="display: flex; justify-content: space-between; align-items: center; margin: 4px 0;">
            <div style="display: flex; align-items: center;">
              <span style="text-align: left;">${seriesName}</span>
            </div>
            <b>${
              showValue
                ? `$${numberFormat(value, "0,0.00")}`
                : `${numberFormat(value, "0,0.00")} RUNE`
            }</b>
          </span>
        </div>
      `;
    };

    const yAxisFormatter = (value: number) => {
      return `${numberFormat(value, "0,0a")} ${showValue ? "USD" : "RUNE"}`;
    };

    const tooltipValueFormatter = (value: number) => {
      return showValue
        ? formatCurrency(value, "0,0.00")
        : `${numberFormat(value, "0,0.00")} RUNE`;
    };

    const options = {
      animation: true,
      animationDuration: 500,
      legend: {
        show: false,
      },
      grid: {
        left: "2%",
        right: "2%",
        bottom: "2%",
        top: "2%",
        containLabel: true,
      },
      xAxis: {
        type: "category" as const,
        boundaryGap: false,
        splitLine: {
          show: true,
          lineStyle: {
            color: "rgba(255, 255, 255, 0.05)",
            type: "dashed" as const,
          },
        },
        axisLabel: {
          fontSize: 11,
          margin: 12,
          padding: [4, 8],
          color: theme === "dark" ? "#e6e6e6" : "#333333",
        },
        axisTick: { show: false },
        axisLine: { show: false },
        data: labels,
        min: "dataMin" as const,
        max: "dataMax" as const,
        onZero: false,
      },
      yAxis: [
        {
          type: "value" as const,
          splitLine: {
            show: true,
            lineStyle: {
              color: "rgba(255, 255, 255, 0.05)",
              type: "dashed" as const,
            },
          },
          axisTick: {
            show: false,
            lineStyle: {
              color: "rgba(255, 255, 255, 0.1)",
            },
          },
          position: "left" as const,
          min: (val: any) => {
            const offset = val.max - val.min;
            return Math.max(0, val.min - offset);
          },
          max: "dataMax" as const,
          show: true,
          splitNumber: 4,
          axisLine: { show: false },
          axisLabel: {
            fontSize: 10,
            margin: 12,
            padding: [4, 8],
            formatter: yAxisFormatter,
            color: theme === "dark" ? "#e6e6e6" : "#333333",
          },
        },
      ],
      tooltip: {
        trigger: "axis" as const,
        axisPointer: {
          type: "cross" as const,
          label: {
            backgroundColor: "#6a7985",
          },
        },
        formatter: tooltipFormatter,
        backgroundColor: theme === "dark" ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.9)",
        borderColor: "var(--border-color)",
        textStyle: {
          color: theme === "dark" ? "#e6e6e6" : "#333333",
        },
      },
      series,
    };

    return options;
  }, [chartData, showValue, theme]);

  const headerContent = (
    <div className={styles["card-header-content"]}>
      <div className={styles["unit-switcher"]}>
        <label className={styles.switch}>
          <input
            type="checkbox"
            checked={showValue}
            onChange={toggleShowValue}
          />
          <span className={styles.slider}></span>
        </label>
        <span className={styles["unit-label"]}>
          {showValue ? "USD" : "RUNE"}
        </span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card
        title="Balance History"
        isLoading={true}
        style={{ height: "100%", display: "flex", flexDirection: "column" }}
        header={headerContent}
      >
        <ChartLoader />
      </Card>
    );
  }

  if (!balanceData || balanceData.length === 0) {
    return (
      <Card
        title="Balance History"
        style={{ height: "100%", display: "flex", flexDirection: "column" }}
        header={headerContent}
      >
        <div className="h-full w-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">
              No balance history data available
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Balance History"
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
      header={headerContent}
    >
      {chartOptions && (
        <EChartsWrapper
          type="line"
          data={{
            labels: chartData.labels,
            series: chartOptions.series,
          }}
          options={chartOptions}
          height="250px"
          className={styles["address-history-chart"]}
        />
      )}
    </Card>
  );
};

export default BalanceHistory;