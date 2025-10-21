"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import moment from "moment";
import { useRunePrice, useSetRunePrice, useTheme } from "@/lib/store";
import RuneAsset from "@/components/RuneAsset";
import CardsHeader from "@/components/CardsHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import ChartLoader from "@/components/ChartLoader";
import Rune from "@/assets/images/rune.svg";
import { getDuration } from "@/utils/global";

const ReactECharts = dynamic(() => import("echarts-for-react"), {
  ssr: false,
  loading: () => <ChartLoader height={200} barCount={15} />,
});

const SkeletonItem: React.FC<{
  loading: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ loading, className, style, children }) => {
  if (loading) {
    return (
      <div className={className || ""} style={style}>
        <Skeleton variant="text" width="100%" height="10px" />
      </div>
    );
  }
  return (
    <div className={className || ""} style={style}>
      {children}
    </div>
  );
};
import {
  formatVueNumber,
  formatTrendCurrency,
  formatUSDValueFixed,
} from "@/utils/format";
import { api } from "@/lib/api";
import BurnIcon from "@/assets/images/burn.svg";
import styles from "./burn.module.css";

interface BurnedBlock {
  blockHeight: number;
  timestamp: number;
  burnedAmount: number;
}

interface GeneralStatsDetail {
  name: string;
  value?: string;
  extraText?: string;
  description?: string;
  link?: string;
}

interface BurnChartData {
  xAxis: string[];
  series: Array<{
    type: string;
    name: string;
    showSymbol: boolean;
    data: number[];
    itemStyle: {
      color: string;
    };
    areaStyle: {
      color: string;
    };
  }>;
}

const BurnPage: React.FC = () => {
  const [selectedUnit, setSelectedUnit] = useState<"rune" | "dollar">("rune");
  const [totalBurned24h, setTotalBurned24h] = useState<number | undefined>(
    undefined
  );
  const [totalBurned7d, setTotalBurned7d] = useState<number | undefined>(
    undefined
  );
  const [totalBurned30d, setTotalBurned30d] = useState<number | undefined>(
    undefined
  );
  const [totalBurned, setTotalBurned] = useState<number | undefined>(undefined);
  const [burnedBlocks, setBurnedBlocks] = useState<BurnedBlock[]>([]);
  const [totalSupply, setTotalSupply] = useState<number | undefined>(undefined);
  const [uncirculatedSupply, setUncirculatedSupply] = useState<
    number | undefined
  >(undefined);
  const [circulatingSupply, setCirculatingSupply] = useState<
    number | undefined
  >(undefined);
  const [burnChart, setBurnChart] = useState<any>({
    tooltip: {
      trigger: "axis",
      formatter: () => "Loading...",
    },
    legend: { show: false },
    grid: {
      left: "2%",
      right: "2%",
      bottom: "2%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: [],
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        type: "line",
        name: "Burned Rune",
        data: [],
        itemStyle: { color: "#ff9962" },
        areaStyle: { color: "rgba(255, 153, 98, 0.2)" },
      },
    ],
  });
  const [chartLoading, setChartLoading] = useState(true);
  const [selectedInterval, setSelectedInterval] = useState<string>("24h");
  const [generalStatsDetails, setGeneralStatsDetails] = useState<
    GeneralStatsDetail[]
  >([{ name: "Total Supply" }, { name: "Reserve" }]);
  const [isClient, setIsClient] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const runePrice = useRunePrice();
  const setRunePrice = useSetRunePrice();
  const intervals = {
    "24h": "24H",
    "7d": "7D",
    "30d": "30D",
  };
  const displayTotalBurned = useMemo(() => {
    if (selectedUnit === "dollar" && totalBurned && runePrice) {
      return totalBurned * runePrice;
    }
    return totalBurned;
  }, [selectedUnit, totalBurned, runePrice]);
  const toggleUnit = useCallback(() => {
    setSelectedUnit((prev) => (prev === "rune" ? "dollar" : "rune"));
  }, []);

  const formatBurn = useCallback((data: any, intervalType: string) => {
    const xAxis: string[] = [];
    const runeBurned: number[] = [];

    const dateFormat = intervalType === "hour" ? "H:mm" : "MMM DD";
    if (!data || !data.intervals || !Array.isArray(data.intervals)) {
      return {
        tooltip: {
          trigger: "axis",
          formatter: (param: any) => {
            return `
              <div class="tooltip-header">
                <div class="data-color" style="background-color: ${
                  param[0]?.color || "#ff9962"
                }"></div>
                ${param[0]?.name || "Burned Rune"}
              </div>
              <div class="tooltip-body">
                <span>
                  <span>Burned Rune</span>
                  <b>0 RUNE</b>
                </span>
              </div>`;
          },
        },
        legend: {
          show: false,
        },
        grid: {
          left: "2%",
          right: "2%",
          bottom: "2%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          boundaryGap: false,
          axisLine: { show: false },
          splitLine: { show: false },
          axisTick: { show: false },
          data: [],
          min: "dataMin",
          max: "dataMax",
          onZero: false,
        },
        yAxis: [
          {
            type: "value",
            axisLine: { show: false },
            splitLine: { show: false },
            axisTick: { show: false },
            minorTick: { show: false },
            position: "right",
            min: "dataMin",
            max: "dataMax",
            show: true,
            splitNumber: 2,
            axisLabel: {
              formatter: (value: number) => formatVueNumber(value, "0,0a"),
            },
          },
        ],
        series: [
          {
            type: "line",
            name: "Burned Rune",
            showSymbol: false,
            data: [],
            itemStyle: {
              color: "#ff9962",
            },
            areaStyle: {
              color: "rgba(255, 153, 98, 0.2)",
            },
          },
        ],
      };
    }

    data.intervals.forEach((interval: any, index: number) => {
      if (index === data.intervals.length - 1) {
        return;
      }

      const time = moment(interval.endTime * 1000).format(dateFormat);
      xAxis.push(time);

      const burns = interval?.pools?.find(
        (p: any) => p.pool === "income_burn"
      )?.earnings;
      runeBurned.push(+(burns || 0) / 1e8);
    });
    const validLabels = xAxis.length > 0 ? xAxis : ["No Data"];
    const validData = runeBurned.length > 0 ? runeBurned : [0];

    return {
      tooltip: {
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
          const date = validLabels[dataIndex] || "";

          let tooltipContent = `
            <div class="tooltip-header">
              <span>${date}</span>
            </div>
            <div class="tooltip-body">
          `;

          param.forEach((p: any) => {
            const value = p.value || 0;
            const label = p.seriesName || "Burned Rune";

            let formattedValue = "";
            if (value >= 1e9) {
              formattedValue = `${(value / 1e9).toFixed(1)}B RUNE`;
            } else if (value >= 1e6) {
              formattedValue = `${(value / 1e6).toFixed(1)}M RUNE`;
            } else if (value >= 1e3) {
              formattedValue = `${(value / 1e3).toFixed(1)}K RUNE`;
            } else {
              formattedValue = `${formatVueNumber(value, "0,0.00")} RUNE`;
            }

            tooltipContent += `
              <span class="tooltip-item space">
                <span class="series-name-color">
                  <span class="data-color" style="background-color: ${
                    p.color || "#ff9962"
                  };"></span>
                  <span>${label}</span>
                </span>
                <span>${formattedValue}</span>
              </span>
            `;
          });

          tooltipContent += `</div>`;
          return tooltipContent;
        },
      },
      legend: {
        show: false,
      },
      grid: {
        left: "2%",
        right: "2%",
        bottom: "2%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        axisLine: { show: false },
        splitLine: { show: false },
        axisTick: { show: false },
        data: validLabels,
        min: "dataMin",
        max: "dataMax",
        onZero: false,
      },
      yAxis: [
        {
          type: "value",
          axisLine: { show: false },
          splitLine: { show: false },
          axisTick: { show: false },
          minorTick: { show: false },
          position: "right",
          min: "dataMin",
          max: "dataMax",
          show: true,
          splitNumber: 2,
          axisLabel: {
            formatter: (value: number) => formatVueNumber(value, "0,0a"),
          },
        },
      ],
      series: [
        {
          type: "line",
          name: "Burned Rune",
          showSymbol: false,
          data: validData,
          itemStyle: {
            color: "#ff9962",
          },
          areaStyle: {
            color: "rgba(255, 153, 98, 0.2)",
          },
        },
      ],
    };
  }, []);

  const updateStatsDetails = useCallback(() => {
    if (
      totalSupply !== undefined &&
      uncirculatedSupply !== undefined &&
      runePrice
    ) {
      const statsDetails = [
        {
          name: "Total Supply",
          value: `${formatVueNumber(totalSupply, "0.00a")} RUNE`,
          extraText: `$${formatVueNumber(totalSupply * runePrice, "0,0.00")}`,
          description: "Total RUNE breakdown (click for more info)",
          link: "/network",
        },
        {
          name: "Reserve",
          value: `${formatVueNumber(uncirculatedSupply, "0.00a")} RUNE`,
          extraText: `$${formatVueNumber(
            uncirculatedSupply * runePrice,
            "0,0.00"
          )}`,
        },
      ];
      setGeneralStatsDetails(statsDetails);
    }
  }, [totalSupply, uncirculatedSupply, runePrice]);

  const fetchData = useCallback(
    async (intervalKey: string, retryAttempt: number = 0) => {
      try {
        setChartLoading(true);
        setApiError(null);

        let resData: any;
        let incomeBurn: number;
        try {
          if (intervalKey === "7d") {
            resData = await api.midgard.getEarnings("day", 7);
            incomeBurn =
              resData?.meta?.pools?.find(
                (pool: any) => pool.pool === "income_burn"
              )?.earnings || 0;
            setTotalBurned7d(+incomeBurn / 1e8);
          } else if (intervalKey === "30d") {
            resData = await api.midgard.getEarnings("day", 30);
            incomeBurn =
              resData?.meta?.pools?.find(
                (pool: any) => pool.pool === "income_burn"
              )?.earnings || 0;
            setTotalBurned30d(+incomeBurn / 1e8);
          } else if (intervalKey === "24h") {
            resData = await api.midgard.getEarnings("hour", 24);
            incomeBurn =
              resData?.meta?.pools?.find(
                (pool: any) => pool.pool === "income_burn"
              )?.earnings || 0;
            setTotalBurned24h(+incomeBurn / 1e8);
          }
        } catch (earningsError) {
          console.warn("Failed to fetch earnings data:", earningsError);
          resData = {
            intervals: Array.from(
              {
                length:
                  intervalKey === "24h" ? 24 : intervalKey === "7d" ? 7 : 30,
              },
              (_, i) => ({
                endTime:
                  Date.now() / 1000 -
                  i * (intervalKey === "24h" ? 3600 : 86400),
                pools: [{ pool: "income_burn", earnings: 0 }],
              })
            ),
          };
        }
        let currentTotalSupply = 500000000; 

        try {
          const supplyData = await fetch("/api/supply");
          const supplyDataJson = await supplyData.json();
          currentTotalSupply = +supplyDataJson.data.amount.amount / 1e8;
          setTotalSupply(currentTotalSupply);
        } catch (supplyError) {
          console.warn("Failed to fetch supply data:", supplyError);
          setTotalSupply(500000000);
        }

        try {
          const uncirculatedData = await fetch(
            "/api/balance?address=thor1dheycdevq39qlkxs2a6wuuzyn4aqxhve4qxtxt"
          );
          const uncirculatedDataJson = await uncirculatedData.json();
          const runeBalance = uncirculatedDataJson.data.result.find(
            (item: any) => item.denom === "rune"
          );
          const uncirculated = runeBalance
            ? Number(runeBalance.amount) / 1e8
            : 0;
          setUncirculatedSupply(uncirculated);
          setCirculatingSupply(currentTotalSupply - uncirculated);
        } catch (balanceError) {
          console.warn("Failed to fetch balance data:", balanceError);
          setUncirculatedSupply(0);
          setCirculatingSupply(500000000);
        }

        const chartData = formatBurn(
          resData,
          intervalKey.includes("d") ? "day" : "hour"
        );
        if (chartData && chartData.series && chartData.xAxis) {
          setBurnChart(chartData);
        } else {
          setBurnChart({
            tooltip: {
              trigger: "axis",
              formatter: () => "No Data Available",
            },
            legend: { show: false },
            grid: {
              left: "2%",
              right: "2%",
              bottom: "2%",
              containLabel: true,
            },
            xAxis: {
              type: "category",
              data: ["No Data"],
            },
            yAxis: {
              type: "value",
            },
            series: [
              {
                type: "line",
                name: "Burned Rune",
                data: [0],
                itemStyle: { color: "#ff9962" },
                areaStyle: { color: "rgba(255, 153, 98, 0.2)" },
              },
            ],
          });
        }

        if (!runePrice || runePrice === 0) {
          try {
            const runePriceData = await api.insights.getRunePrice();
            if (runePriceData && runePriceData.length > 0) {
              setRunePrice(Number.parseFloat(runePriceData[0].price));
            }
          } catch (runePriceError) {
            console.warn("Failed to fetch rune price:", runePriceError);
          }
        }

        setChartLoading(false);
        setTimeout(() => {
          updateStatsDetails();
        }, 100);
        setRetryCount(0);
      } catch (error) {
        console.error("Error fetching data:", error);
        setChartLoading(false);

        if (retryAttempt < 3) {
          setRetryCount(retryAttempt + 1);
          setApiError(`Connection failed. Retrying... (${retryAttempt + 1}/3)`);
          setTimeout(() => {
            fetchData(intervalKey, retryAttempt + 1);
          }, 2000 * (retryAttempt + 1)); 
        } else {
          setApiError(
            "Unable to connect to the network. Please check your connection and try again."
          );
          setRetryCount(0);
        }
      }
    },
    [formatBurn, updateStatsDetails, totalSupply]
  );

  const changeInterval = useCallback(
    (intervalKey: string) => {
      setSelectedInterval(intervalKey);
      fetchData(intervalKey);
    },
    [fetchData]
  );

  const getBurnData = useCallback(async () => {
    try {
      const data = await api.middleware.getBurnedBlocks();
      setTotalBurned(500_000_000 - +data.totalBurned / 1e8);
      setBurnedBlocks(data.burnedBlocks.reverse());
    } catch (error) {
      console.warn("Error fetching burn data:", error);
      setTotalBurned(0);
      setBurnedBlocks([]);
    }
  }, []);
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const updateInterval = setInterval(() => {
      getBurnData();
    }, 5000);

    fetchData(selectedInterval);

    return () => {
      clearInterval(updateInterval);
    };
  }, [isClient, getBurnData, fetchData, selectedInterval]);

  useEffect(() => {
    if (!isClient) return;
    updateStatsDetails();
  }, [isClient, updateStatsDetails]);

  useEffect(() => {
    if (
      totalSupply !== undefined &&
      uncirculatedSupply !== undefined &&
      runePrice
    ) {
      updateStatsDetails();
    }
  }, [totalSupply, uncirculatedSupply, runePrice, updateStatsDetails]);
  const renderErrorState = () => {
    if (!apiError) return null;

    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorMessage}>
          <p>{apiError}</p>
          {retryCount > 0 && (
            <button
              onClick={() => fetchData(selectedInterval)}
              className={styles.retryButton}
            >
              Retry Now
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderBurnedValue = () => {
    if (totalBurned) {
      return (
        <h1>
          {selectedUnit === "rune" ? (
            <>
              <Rune className={styles.runeCur}></Rune>
              {formatVueNumber(totalBurned, "0,0.00")}
            </>
          ) : (
            `$${formatVueNumber(displayTotalBurned!, "0,0.00")}`
          )}
        </h1>
      );
    }
    return <Skeleton height="1rem" width="12rem" />;
  };

  const renderIntervalData = () => {
    if (selectedInterval === "24h") {
      return (
        <div className={styles.burnedItem}>
          <div className={styles.totalBurned}>
            {selectedUnit === "rune" ? (
              <>
                <SkeletonItem
                  loading={!totalBurned24h}
                  style={{ minWidth: "70px" }}
                >
                  {formatVueNumber(totalBurned24h!, "0,0.00")}
                </SkeletonItem>
                <RuneAsset showIcon={false} />
              </>
            ) : (
              <span>
                ${formatVueNumber((totalBurned24h || 0) * runePrice, "0,0.00")}
              </span>
            )}
          </div>
          <h3>24H</h3>
        </div>
      );
    } else if (selectedInterval === "7d") {
      return (
        <div className={styles.burnedItem}>
          <div className={styles.totalBurned}>
            {selectedUnit === "rune" ? (
              <>
                <SkeletonItem
                  loading={!totalBurned7d}
                  style={{ minWidth: "70px" }}
                >
                  {formatVueNumber(totalBurned7d!, "0,0.00")}
                </SkeletonItem>
                <RuneAsset showIcon={false} />
              </>
            ) : (
              <span>
                ${formatVueNumber((totalBurned7d || 0) * runePrice, "0,0.00")}
              </span>
            )}
          </div>
          <h3>7D</h3>
        </div>
      );
    } else if (selectedInterval === "30d") {
      return (
        <div className={styles.burnedItem}>
          <div className={styles.totalBurned}>
            {selectedUnit === "rune" ? (
              <>
                <SkeletonItem
                  loading={!totalBurned30d}
                  style={{ minWidth: "75px" }}
                >
                  {formatVueNumber(totalBurned30d!, "0,0.00")}
                </SkeletonItem>
                <RuneAsset showIcon={false} />
              </>
            ) : (
              <span>
                ${formatVueNumber((totalBurned30d || 0) * runePrice, "0,0.00")}
              </span>
            )}
          </div>
          <h3>30D</h3>
        </div>
      );
    }
    return <div>Please select an interval</div>;
  };
  if (!isClient) {
    return (
      <div>
        <div className={styles.burnContainer}>
          <div className={styles.burnCard}>
            <h3>
              <BurnIcon className={styles.burnIcon} />
              Burned RUNE
            </h3>
            <div className={styles.totalResData}>
              <h1 className={styles.burnedValue}>
                <Skeleton height="4rem" width="12rem" />
              </h1>
            </div>
            <div className={styles.totalBurnedContainer}>
              <div className={styles.unitSwitcher}>
                <label className={styles.switch}>
                  <input type="checkbox" checked={false} disabled />
                  <span className={styles.slider}></span>
                </label>
                <span className={styles.unitLabel}>RUNE</span>
              </div>
              <div className={styles.burnedItem}>
                <div className={styles.totalBurned}>
                  <Skeleton height="1.5rem" width="100px" />
                </div>
                <h3>24H</h3>
              </div>
            </div>
            <div className={styles.burnChart}>
              <ChartLoader height={200} barCount={15} />
            </div>
            <div className={styles.intervalButtons}>
              {Object.entries(intervals).map(([key, label]) => (
                <button key={key} disabled>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.balanceDetails}>
          <div className={styles.headerClass}>
            <div className={styles.tableStatCard}>
              <div className={styles.name}>Total Supply</div>
              <div className={styles.value}>
                <Skeleton height="1rem" width="120px" />
              </div>
            </div>
            <div className={styles.tableStatCard}>
              <div className={styles.name}>Reserve</div>
              <div className={styles.value}>
                <Skeleton height="1rem" width="120px" />
              </div>
            </div>
          </div>
        </div>
        <div className={styles.blockCard}>
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className={styles.loaderItem}>
              <Skeleton height="1rem" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {renderErrorState()}
      <div className={styles.burnContainer}>
        <div className={styles.burnCard}>
          <h3>
            <BurnIcon className={styles.burnIcon} />
            Burned RUNE
          </h3>
          <div className={styles.totalResData}>
            <div className={styles.burnedValue}>{renderBurnedValue()}</div>
          </div>

          <div className={styles.totalBurnedContainer}>
            <div className={styles.unitSwitcher}>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={selectedUnit === "dollar"}
                  onChange={toggleUnit}
                />
                <span className={styles.slider}></span>
              </label>
              <span className={styles.unitLabel}>
                {selectedUnit === "rune" ? "RUNE" : "USD"}
              </span>
            </div>
            {renderIntervalData()}
          </div>

          <div className={styles.burnChart}>
            {chartLoading ? (
              <ChartLoader height={200} barCount={15} />
            ) : burnChart ? (
              <ReactECharts
                option={burnChart}
                style={{ height: "200px", minHeight: "200px" }}
                className={styles.burnChart}
                opts={{ renderer: "canvas" }}
              />
            ) : (
              <div className={styles.noDataMessage}>
                <p>No chart data available</p>
              </div>
            )}
          </div>

          <div className={styles.intervalButtons}>
            {Object.entries(intervals).map(([key, label]) => (
              <button
                key={key}
                className={selectedInterval === key ? styles.active : ""}
                onClick={() => changeInterval(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.balanceDetails}>
        <CardsHeader tableGeneralStats={generalStatsDetails} />
      </div>

      <div className={styles.blockCard}>
        {burnedBlocks.length === 0
          ? Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className={styles.loaderItem}>
                <Skeleton height="1rem" />
              </div>
            ))
          : burnedBlocks.map((block) => (
              <div key={block.blockHeight} className={styles.blockItem}>
                <div className={styles.blockInfo}>
                  <span className={styles.height}>
                    {formatVueNumber(block.blockHeight, "0,0")}
                  </span>
                  <small className={styles.duration}>
                    {parseInt(getDuration(block.timestamp)) < 0
                      ? `${getDuration(block.timestamp)} Seconds`
                      : `-${getDuration(block.timestamp)} Seconds`}
                  </small>
                </div>
                <div className={styles.rightSection}>
                  <div className={styles.burnInfo}>
                    <RuneAsset showIcon={false} />
                    {block.burnedAmount / 1e8}
                  </div>
                  <small>
                    {formatUSDValueFixed(
                      (block.burnedAmount / 1e8) * runePrice
                    )}
                  </small>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};

export default BurnPage;
