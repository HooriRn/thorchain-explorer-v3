"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import moment from "moment";
import Card from "@/components/ui/Card";
import Nav from "@/components/Nav";
import ChartLoader from "@/components/ChartLoader";
import ReactECharts from "echarts-for-react";
import AssetIcon from "@/components/AssetIcon";
import { usePools } from "@/lib/store";
import { showAsset, basicChartFormat, getChartColor } from "@/utils/global";
import { formatVueNumber } from "@/utils/format";
import AngleIcon from "@/assets/images/angle-down.svg";
import FileDownloadIcon from "@/assets/images/file-download.svg";
import styles from "./swap.module.css";

interface NavItem {
  text: string;
  mode: string;
}

interface SwapInterval {
  startTime: number;
  endTime: number;
  synthRedeemVolumeUSD: string;
  synthMintVolumeUSD: string;
  fromTradeVolumeUSD: string;
  toTradeVolumeUSD: string;
  toRuneVolumeUSD: string;
  toAssetVolumeUSD: string;
  fromSecuredVolumeUSD: string;
  toSecuredVolumeUSD: string;
  totalCount: number;
}

interface SwapHistoryData {
  intervals: SwapInterval[];
}

const SwapChartPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pools = usePools();

  const [swapHistory, setSwapHistory] = useState<any>(undefined);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<string>("All");
  const [chartPeriod, setChartPeriod] = useState<string>("90");
  const [swapCount, setSwapCount] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const chartPeriods: NavItem[] = [
    { text: "90 D", mode: "90" },
    { text: "180 D", mode: "180" },
    { text: "365 D", mode: "365" },
    { text: "100 W", mode: "100w" },
  ];

  const assets = useMemo(() => {
    return pools?.map((pool: any) => pool.asset) || [];
  }, [pools]);

  const displayText = useMemo(() => {
    return selectedOption === "All"
      ? selectedOption
      : showAsset(selectedOption);
  }, [selectedOption]);

  useEffect(() => {
    const queryPool = searchParams.get("pool");
    if (queryPool) {
      setSelectedOption(queryPool);
    }

    const queryChartPeriod = searchParams.get("chartPeriod");
    const savedPeriod = localStorage.getItem("selectedPeriod");

    if (queryChartPeriod) {
      setChartPeriod(queryChartPeriod);
    } else if (savedPeriod) {
      setChartPeriod(savedPeriod);
    } else {
      setChartPeriod("90");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!chartPeriod) return;

    const fetchData = async () => {
      setLoading(true);
      setSwapHistory(undefined);

      try {
        const interval = chartPeriod.includes("w") ? "week" : "day";
        const count = interval === "week" ? 100 : 365;
        const poolParam =
          selectedOption === "All" ? "" : `&pool=${selectedOption}`;

        const response = await fetch(
          `/api/get-swap-history?interval=${interval}&count=${count}${poolParam}`
        );
        const result = await response.json();

        if (result.success && result.data) {
          processSwapData(result.data);
        }
      } catch (error) {
        console.error("Error fetching swap history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [chartPeriod, selectedOption]);

  useEffect(() => {
    if (chartPeriod) {
      localStorage.setItem("selectedPeriod", chartPeriod);
    }
  }, [chartPeriod]);

  const processSwapData = (data: SwapHistoryData) => {
    if (!data?.intervals) return;

    let count = 90;
    if (chartPeriod === "180") count = 180;
    else if (chartPeriod === "365") count = 365;
    else if (chartPeriod === "100w") count = 100;

    const intervals = data.intervals.slice(-count);

    const xAxis: string[] = [];
    const nativeSwaps: number[] = [];
    const tradeSwaps: number[] = [];
    const synthSwaps: number[] = [];
    const securedSwaps: number[] = [];
    const counts: number[] = [];

    intervals.forEach((interval, index) => {
      if (index === intervals.length - 1) return;

      xAxis.push(
        moment(
          Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1000
        ).format("dddd, MMM D")
      );

      synthSwaps.push(
        (+interval.synthRedeemVolumeUSD + +interval.synthMintVolumeUSD) / 100
      );
      tradeSwaps.push(
        (+interval.fromTradeVolumeUSD + +interval.toTradeVolumeUSD) / 100
      );
      nativeSwaps.push(
        (+interval.toRuneVolumeUSD + +interval.toAssetVolumeUSD) / 100
      );
      securedSwaps.push(
        (+interval.fromSecuredVolumeUSD + +interval.toSecuredVolumeUSD) / 100
      );

      counts.push(interval.totalCount || 0);
    });

    setSwapCount(counts);

    const chartOptions = {
      title: {
        show: false,
      },
      tooltip: {
        confine: true,
        trigger: "axis",
        backgroundColor: "transparent",
        borderColor: "transparent",
        textStyle: {
          color: "transparent",
        },
        extraCssText:
          "background-color: var(--bgt-color) !important; backdrop-filter: blur(8px); box-shadow: none; border: 1px var(--border) solid; border-radius: var(--radius-lg); padding: var(--space-10); font-family: 'Montserrat', sans-serif; font-size: var(--font-size-sm); color: var(--sec-font-color);",
        formatter: (param: any) => {
          if (!param || param.length === 0) return "";

          const dataIndex = param[0].dataIndex;
          const date = xAxis[dataIndex] || "";

          let tooltipContent = `
            <div class="tooltip-header">
              <span>${date}</span>
            </div>
            <div class="tooltip-body">
          `;

          param
            .sort((a: any, b: any) => b.value - a.value)
            .forEach((p: any) => {
              const value = p.value || 0;
              const label = p.seriesName || "";

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
                    <span class="data-color" style="background-color: ${p.color};"></span>
                    <span>${label}</span>
                  </span>
                  <span>${formattedValue}</span>
                </span>
              `;
            });

          const totalVolume = param.reduce(
            (a: number, c: any) => a + (c.value || 0),
            0
          );
          let totalFormatted = "";
          if (totalVolume >= 1e9) {
            totalFormatted = `$${(totalVolume / 1e9).toFixed(1)}B`;
          } else if (totalVolume >= 1e6) {
            totalFormatted = `$${(totalVolume / 1e6).toFixed(1)}M`;
          } else if (totalVolume >= 1e3) {
            totalFormatted = `$${(totalVolume / 1e3).toFixed(1)}K`;
          } else {
            totalFormatted = `$${totalVolume.toFixed(0)}`;
          }

          tooltipContent += `
            <div class="tooltip-total">
              <span class="tooltip-item space">
                <span>Total Volume</span>
                <span>${totalFormatted}</span>
              </span>
              <span class="tooltip-item space">
                <span>Swap Count</span>
                <span>${
                  intervals[dataIndex]?.totalCount?.toLocaleString() || 0
                }</span>
              </span>
            </div>
          `;

          tooltipContent += `</div>`;
          return tooltipContent;
        },
      },
      legend: {
        type: "scroll",
        x: "right",
        y: "top",
        icon: "circle",
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
      xAxis: {
        type: "category",
        data: xAxis,
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
      series: [
        {
          type: "bar",
          name: "Native Swaps",
          stack: "total",
          showSymbol: false,
          data: nativeSwaps,
          itemStyle: {
            color: getChartColor(0),
          },
        },
        {
          type: "bar",
          name: "Trade Swaps",
          stack: "total",
          showSymbol: false,
          data: tradeSwaps,
          itemStyle: {
            color: getChartColor(1),
          },
        },
        {
          type: "bar",
          name: "Synth Swaps",
          stack: "total",
          showSymbol: false,
          data: synthSwaps,
          itemStyle: {
            color: getChartColor(2),
          },
        },
        {
          type: "bar",
          name: "Secured Swaps",
          stack: "total",
          showSymbol: false,
          data: securedSwaps,
          itemStyle: {
            color: getChartColor(3),
          },
        },
      ],
    };

    setSwapHistory(chartOptions);
  };

  const toggleDropdown = useCallback(() => {
    setDropdownOpen((prev) => !prev);
  }, []);

  const selectOption = useCallback(
    (option: string) => {
      setSelectedOption(option);
      setDropdownOpen(false);

      const newSearchParams = new URLSearchParams(searchParams.toString());
      if (option === "All") {
        newSearchParams.delete("pool");
      } else {
        newSearchParams.set("pool", option);
      }
      router.push(`?${newSearchParams.toString()}`);
      localStorage.setItem("selectedAsset", option);
    },
    [searchParams, router]
  );

  const downloadSwapChart = useCallback(() => {
    if (!swapHistory) {
      console.error("No chart data available for CSV download.");
      return;
    }

    const series = swapHistory.series;
    const xAxis = swapHistory.xAxis.data;

    if (!xAxis || !Array.isArray(xAxis)) {
      console.error("Invalid chart data structure.");
      return;
    }

    const csvData: any[] = [];
    xAxis.forEach((date: string, index: number) => {
      const row: any = { date };
      series.forEach((s: any) => {
        const value = s.data[index] || 0;
        if (s.name && s.name !== "undefined") {
          row[s.name] = value;
        }
      });
      row["Swap Count"] = swapCount[index] || 0;
      csvData.push(row);
    });

    const headers = Object.keys(csvData[0]).map((header) => {
      if (header !== "date") return `${header} (USD)`;
      return header;
    });

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        Object.values(row)
          .map((value) => `"${value}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    const poolName = selectedOption || "all";
    const timestamp = moment().format("YYYY-MM-DD");

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `swap-volume-${poolName}-${chartPeriod}-${timestamp}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [swapHistory, swapCount, selectedOption, chartPeriod]);

  return (
    <div>
      <div className={styles["header-swap"]}>
        <Nav
          activeMode={chartPeriod}
          navItems={chartPeriods}
          preText="Period :"
          onActiveModeChange={setChartPeriod}
        />
        <div
          className={`${styles.dropdown} ${dropdownOpen ? styles.open : ""}`}
        >
          <button
            className={`${styles["button-swap"]} ${
              selectedOption === "All"
                ? styles["selected-all"]
                : styles["selected-asset"]
            }`}
            onClick={toggleDropdown}
          >
            {selectedOption !== "All" && <AssetIcon asset={selectedOption} />}
            {displayText}
            <AngleIcon className={styles["dropdown-icon"]} />
          </button>
          {dropdownOpen && (
            <div className={styles["dropdown-menu"]}>
              <div
                className={styles["all-section"]}
                onClick={() => selectOption("All")}
              >
                All
              </div>
              {assets.map((asset: string) => (
                <div
                  key={asset}
                  className={styles["selected-options"]}
                  onClick={() => selectOption(asset)}
                >
                  <AssetIcon asset={asset} />
                  {showAsset(asset)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Card title="Swaps Volume" isLoading={loading}>
        <div
          className={styles["csv-download"]}
          title="Download CSV"
          onClick={downloadSwapChart}
        >
          <FileDownloadIcon className={styles.clickable} />
        </div>
        {swapHistory ? (
          <ReactECharts
            option={swapHistory}
            style={{ height: "400px", width: "100%" }}
            opts={{ renderer: "svg" }}
          />
        ) : (
          <ChartLoader barCount={30} />
        )}
      </Card>
    </div>
  );
};

export default SwapChartPage;
