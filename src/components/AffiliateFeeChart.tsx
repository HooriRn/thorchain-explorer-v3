"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import moment from "moment";
import { orderBy } from "lodash";
import ChartLoader from "./ChartLoader";
import { getChartColor, getCurrentChartTheme } from "@/utils/global";
import { formatTrendNumber } from "@/utils/format";
import { useTheme } from "@/lib/store";
import Affiliate from "./Affiliate";
import EChartsWrapper from "./charts/EChartsWrapper";

interface AffiliateFeeChartProps {
  data?: any;
  loading?: boolean;
  thornameData?: any;
}

const AffiliateFeeChart: React.FC<AffiliateFeeChartProps> = ({
  data,
  loading = false,
  thornameData,
}) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [seriesNames, setSeriesNames] = useState<string[]>([]);
  const [tooltipData, setTooltipData] = useState<any>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [customTooltip, setCustomTooltip] = useState<any>(null);
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

  const debouncedUpdateTooltip = useCallback(
    (data: any, position: { x: number; y: number }) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        setTooltipData(data);
        setTooltipPosition(position);
        setIsTooltipVisible(true);
      }, 16);
    },
    []
  );

  const CustomTooltip = useMemo(() => {
    if (!customTooltip) return null;

    return (
      <div
        ref={tooltipRef}
        className="fixed pointer-events-none z-50"
        style={{
          left: `${customTooltip.x}px`,
          top: `${customTooltip.y}px`,
          transform: "translate(-50%, -100%)",
          backgroundColor: "var(--bgt-color)",
          backdropFilter: "blur(8px)",
          border: "1px var(--border) solid",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-10)",
          fontFamily: "'Montserrat', sans-serif",
          fontSize: "var(--font-size-sm)",
          color: "var(--sec-font-color)",
        }}
      >
        <div className="tooltip-header">
          <span>{customTooltip.date}</span>
        </div>
        <div className="tooltip-body">
          {customTooltip.affiliates.map((affiliate: any, index: number) => (
            <span key={index} className="tooltip-item space">
              <span className="series-name-color">
                <Affiliate
                  affiliateAddress={affiliate.name}
                  useNewIcons={false}
                  showLink={false}
                />
              </span>
              <span>{customTooltip.formatValue(affiliate.value)}</span>
            </span>
          ))}
          {customTooltip.othersValue > 0 && (
            <span className="tooltip-item space">
              <span className="series-name-color">
                <span
                  className="data-color"
                  style={{
                    backgroundColor: getChartColor(
                      7,
                      getCurrentChartTheme(theme)
                    ),
                  }}
                />
                <span>Others</span>
              </span>
              <span>
                {customTooltip.formatValue(customTooltip.othersValue)}
              </span>
            </span>
          )}
          <span className="tooltip-total tooltip-item space">
            <span className="series-name-color">
              <span
                className="data-color"
                style={{
                  backgroundColor: getChartColor(
                    7,
                    getCurrentChartTheme(theme)
                  ),
                }}
              />
              <span>Total Fees</span>
            </span>
            <span>{customTooltip.formatValue(customTooltip.totalFees)}</span>
          </span>
        </div>
      </div>
    );
  }, [customTooltip, theme]);

  useEffect(() => {
    if (!data) {
      setChartData([]);
      setSeriesNames([]);
      return;
    }

    if (data?.intervals && Array.isArray(data.intervals)) {
      const { formattedData, names } = formatAffiliateHistoryData(data);
      setChartData(formattedData);
      setSeriesNames(names);
    } else if (data?.xAxis && data?.series) {
      const { formattedData, names } = formatChartOptionsToData(data);
      setChartData(formattedData);
      setSeriesNames(names);
    } else {
      setChartData([]);
      setSeriesNames([]);
    }
  }, [data]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const formatChartOptionsToData = (
    chartOptions: any
  ): { formattedData: any[]; names: string[] } => {
    const formattedData: any[] = [];
    const names: string[] = [];

    if (!chartOptions.series || !Array.isArray(chartOptions.series)) {
      return { formattedData, names };
    }

    const xAxis = chartOptions.xAxis?.data || [];
    const seriesMap = new Map();

    chartOptions.series.forEach((series: any) => {
      if (series.name && series.data) {
        seriesMap.set(series.name, series.data);
        if (!names.includes(series.name)) {
          names.push(series.name);
        }
      }
    });

    if (xAxis.length > 0) {
      xAxis.forEach((date: string, index: number) => {
        const dataPoint: any = {
          date,
        };

        names.forEach((name) => {
          const series = seriesMap.get(name);
          if (series && series[index] !== undefined) {
            dataPoint[name] =
              typeof series[index] === "object"
                ? series[index].value
                : series[index];
          } else {
            dataPoint[name] = 0;
          }
        });

        formattedData.push(dataPoint);
      });
    }

    return { formattedData, names };
  };

  const formatAffiliateHistoryData = (
    affiliateData: any
  ): { formattedData: any[]; names: string[] } => {
    const formattedData: any[] = [];
    const allNames: string[] = [];

    if (!affiliateData.intervals || !Array.isArray(affiliateData.intervals)) {
      return { formattedData, names: [] };
    }

    affiliateData.intervals.forEach((interval: any, index: number) => {
      const affiliateArray = interval.affiliates || interval.thornames;
      if (affiliateArray && Array.isArray(affiliateArray)) {
        affiliateArray.forEach((affiliate: any) => {
          const affiliateName =
            affiliate.affiliate ||
            affiliate.thorname ||
            affiliate.name ||
            affiliate;
          if (affiliateName && !allNames.includes(affiliateName)) {
            allNames.push(affiliateName);
          }
        });
      }
    });

    const affiliateTotals: { [key: string]: number } = {};

    const getAffiliateUsdForInterval = (affiliate: any, interval: any) => {
      const usdCents =
        affiliate.feeUSD ?? affiliate.volumeUSD ?? affiliate.earningsUSD;
      if (usdCents !== undefined && usdCents !== null) {
        return Number(usdCents) / 1e2;
      }
      const raw = affiliate.earnings || affiliate.fee || affiliate.volume || 0;
      const runePrice = interval?.runePriceUSD || 1;
      return (+raw / 10 ** 8) * Number.parseFloat(runePrice);
    };

    affiliateData.intervals.forEach((interval: any) => {
      const affiliateArray = interval.affiliates || interval.thornames;
      if (affiliateArray && Array.isArray(affiliateArray)) {
        affiliateArray.forEach((affiliate: any) => {
          const affiliateName =
            affiliate.affiliate ||
            affiliate.thorname ||
            affiliate.name ||
            affiliate;

          if (affiliateName) {
            const earnings = getAffiliateUsdForInterval(affiliate, interval);

            if (!affiliateTotals[affiliateName]) {
              affiliateTotals[affiliateName] = 0;
            }
            affiliateTotals[affiliateName] += earnings;
          }
        });
      }
    });

    const sortedAffiliates = Object.entries(affiliateTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([name]) => name);

    const names = [...sortedAffiliates, "Others"];

    affiliateData.intervals.forEach((interval: any, index: number) => {
      const startTime = interval.startTime;
      const endTime = interval.endTime;

      let date: string;
      if (!startTime || !endTime || isNaN(startTime) || isNaN(endTime)) {
        date = moment().format("dddd, MMM D");
      } else {
        const timestamp = Math.floor((~~endTime + ~~startTime) / 2) * 1e3;
        const dateMoment = moment(timestamp);

        if (dateMoment.isValid()) {
          date = dateMoment.format("dddd, MMM D");
        } else {
          date = moment().format("dddd, MMM D");
        }
      }

      const dataPoint: any = {
        date,
      };

      sortedAffiliates.forEach((name) => {
        const affiliateArray = interval.affiliates || interval.thornames;
        const affiliate = affiliateArray?.find(
          (a: any) => (a.affiliate || a.thorname || a.name || a) === name
        );

        let earnings = 0;
        if (affiliate) {
          earnings = getAffiliateUsdForInterval(affiliate, interval);
        }

        dataPoint[name] = earnings;
      });

      let othersEarnings = 0;
      const affiliateArray = interval.affiliates || interval.thornames;
      if (affiliateArray && Array.isArray(affiliateArray)) {
        affiliateArray.forEach((affiliate: any) => {
          const affiliateName =
            affiliate.affiliate ||
            affiliate.thorname ||
            affiliate.name ||
            affiliate;

          if (affiliateName && !sortedAffiliates.includes(affiliateName)) {
            const earnings = getAffiliateUsdForInterval(affiliate, interval);
            othersEarnings += earnings;
          }
        });
      }

      dataPoint["Others"] = othersEarnings;
      formattedData.push(dataPoint);
    });

    return { formattedData, names };
  };

  const getSeriesColor = (index: number) => {
    return getChartColor(index, getCurrentChartTheme(theme));
  };

  const chartDataForECharts = useMemo(() => {
    if (!chartData || chartData.length === 0 || seriesNames.length === 0) {
      return { labels: [], series: [] };
    }

    const n = chartData.length;
    const lastIdx = Math.max(0, n - 1);
    const lastAllZero = seriesNames.every(
      (name) => ((chartData[lastIdx]?.[name] as number) || 0) === 0
    );
    const effectiveLength = lastAllZero && n > 0 ? n - 1 : n;

    const series = seriesNames.map((name, index) => ({
      name,
      type: "bar",
      stack: "Total",
      data: chartData
        .slice(0, effectiveLength)
        .map((item) => (item[name] as number) || 0),
      itemStyle: {
        color: getSeriesColor(index),
      },
    }));

    const result = {
      labels: chartData.slice(0, effectiveLength).map((item) => item.date),
      series,
    };

    return result;
  }, [chartData, seriesNames, theme]);

  const chartOptions = useMemo(() => {
    return {
      legend: {
        show: false,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        show: true,
        backgroundColor: "transparent",
        borderColor: "transparent",
        textStyle: {
          color: "transparent",
        },
        formatter: function (params: any, ticket: string, callback: any) {
          if (!params || params.length === 0) {
            setCustomTooltip(null);
            return "";
          }

          const dataIndex = params[0].dataIndex;

          const formatValueLocal = (value: any) => {
            const numValue =
              typeof value === "number" ? value : parseFloat(value) || 0;
            if (numValue >= 1e9) {
              return `$${(numValue / 1e9).toFixed(1)}B`;
            } else if (numValue >= 1e6) {
              return `$${(numValue / 1e6).toFixed(1)}M`;
            } else if (numValue >= 1e3) {
              return `$${(numValue / 1e3).toFixed(1)}K`;
            }
            return `$${numValue.toFixed(0)}`;
          };

          const interval = (data?.intervals || [])[dataIndex];
          const intervalAffiliates =
            interval?.affiliates || interval?.thornames || [];

          const affiliatesUsdAll = (intervalAffiliates as any[])
            .map((aff: any) => {
              const name =
                aff.affiliate || aff.thorname || aff.name || String(aff);
              const usdCents =
                aff.feeUSD ?? aff.volumeUSD ?? aff.earningsUSD ?? null;
              const usd =
                usdCents !== null && usdCents !== undefined
                  ? Number(usdCents) / 1e2
                  : (() => {
                      const raw = aff.earnings || aff.fee || aff.volume || 0;
                      const runePrice = interval?.runePriceUSD || 1;
                      return (+raw / 1e8) * Number.parseFloat(runePrice);
                    })();
              return { name, value: usd };
            })
            .filter((x) => !!x.name && x.value > 0);

          const sortedAffUsd = affiliatesUsdAll.sort(
            (a, b) => b.value - a.value
          );
          const topN = 4;
          const topAffiliates = sortedAffUsd.slice(0, topN);
          const othersValueCalc = sortedAffUsd
            .slice(topN)
            .reduce((s, x) => s + x.value, 0);

          const totalFees = (() => {
            const volUsdArr = (data as any)?.volumeUSDData;
            if (Array.isArray(volUsdArr) && volUsdArr[dataIndex] != null) {
              return Number(volUsdArr[dataIndex]) / 1e2;
            }
            return affiliatesUsdAll.reduce((s, x) => s + x.value, 0);
          })();

          const mouseEvent = params[0].event?.event || window.event;
          const tooltipX = mouseEvent?.clientX || 0;
          const tooltipY = mouseEvent?.clientY || 0;

          const tooltipData = {
            date: chartDataForECharts.labels?.[dataIndex] || "",
            affiliates: topAffiliates,
            othersValue: othersValueCalc,
            totalFees,
            formatValue: formatValueLocal,
            x: tooltipX,
            y: tooltipY,
          };

          setCustomTooltip(tooltipData);

          return "";
        },
      },
      xAxis: {
        type: "category",
        data: chartDataForECharts.labels,
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
    };
  }, [theme, chartDataForECharts]);

  if (loading) {
    return <ChartLoader />;
  }

  if (!chartData || chartData.length === 0 || seriesNames.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">
            No affiliate fee data available
          </p>
          <p className="text-sm text-muted-foreground">
            {seriesNames.length === 0
              ? "No affiliate names found"
              : "No data points found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full w-full relative"
      onMouseLeave={() => setCustomTooltip(null)}
    >
      <EChartsWrapper
        type="bar"
        data={chartDataForECharts}
        options={chartOptions}
        height="400px"
      />
      {CustomTooltip}
    </div>
  );
};

export default AffiliateFeeChart;
