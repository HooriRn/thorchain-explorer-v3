"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from "next/navigation";
import { useRunePrice } from "@/lib/store";
import moment from "moment";
import { useTheme } from '@/lib/store';
import Page from '@/components/PageContainer';
import InfoCard from '@/components/InfoCard';
import Card from '@/components/ui/Card';
import EChartsWrapper from '@/components/charts/EChartsWrapper';
import ChartLoader from '@/components/ChartLoader';
import { number, formatPercentToString, formatTrendCurrency } from '@/utils/format';
import { showAsset, getChartColor, getCurrentChartTheme } from '@/utils/global';
import {
  getPoolStats,
  getPoolDetail,
  getEarningHistory,
  getPoolDepth,
  getSwapsHistory,
} from "@/lib/api";
import styles from "./poolOverview.module.css";

interface PoolData {
  assetPriceUSD?: number;
  assetDepth?: number;
  runeDepth?: number;
  swapVolume?: number;
  averageSlip?: number;
  status?: string;
  asset?: string;
}

interface ChartDataPoint {
  date: string;
  [key: string]: number | string;
}

interface ChartSeries {
  name: string;
  type: string;
  stack?: string;
  data: any[];
  itemStyle?: any;
  showSymbol?: boolean;
  smooth?: boolean;
  lineStyle?: any;
  areaStyle?: any;
  z?: number;
}

const PoolOverview = () => {
  const params = useParams();
  const poolName = params?.poolName;
  const [pool, setPool] = useState<PoolData | null>(null);
  const [poolDetail, setPoolDetail] = useState<any>(null);
  const [earningsHistory, setEarningsHistory] = useState<any>(null);
  const [depthHistory, setDepthHistory] = useState<any>(null);
  const [swapHistory, setSwapHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [periodFees, setPeriodFees] = useState(0);
  const [periodFeesUSD, setPeriodFeesUSD] = useState(0);
  
  const runePrice = useRunePrice();
  const theme = useTheme();

  const poolNameString = useMemo(() => {
    if (!poolName) return '';
    if (Array.isArray(poolName)) return poolName[0];
    return poolName;
  }, [poolName]);

  const poolDetailStats = useMemo(() => {
    if (!pool) return [];

    const swapVolume = pool?.swapVolume ? pool.swapVolume / 10 ** 8 : 0;
    const feesVolume = periodFees / 10 ** 8;
    
    return [
      {
        title: 'Overview',
        rowStart: 1,
        colSpan: 1,
        items: [
          {
            name: 'Asset Price',
            value: pool?.assetPriceUSD || 0,
            filter: (v: number) => `$${number(v, '0,0.00a')}`,
          },
          {
            name: 'Fees Annual to Depth (30D)',
            value: pool?.assetDepth && pool?.assetPriceUSD && periodFeesUSD > 0 
              ? (periodFeesUSD * 12) / (pool.assetDepth * pool.assetPriceUSD)
              : 0,
            filter: (v: number) => `${formatPercentToString(v, 2)}`,
          },
          {
            name: 'Status',
            value: pool?.status 
              ? pool.status.charAt(0).toUpperCase() + pool.status.slice(1)
              : 'Unknown',
          },
          {
            name: 'Asset Depth',
            value: pool?.assetDepth ? pool.assetDepth / 10 ** 8 : 0,
            filter: (v: number) => `${number(v, '0,0')} ${showAsset(pool?.asset || '')}`,
          },
          {
            name: 'Rune Depth',
            value: pool?.runeDepth ? pool.runeDepth / 10 ** 8 : 0,
            filter: (v: number) => `${number(v, '0,0a')} RUNE`,
          },
          {
            header: 'All Time Stats',
          },
          {
            name: 'Total Swaps (Overall)',
            value: swapVolume,
            filter: (v: number) => `${number(v, '0,0.00a')} RUNE`,
            usdValue: runePrice
              ? (v: any) => formatTrendCurrency(v * runePrice, { decimals: 2 })
              : () => "$0",
          },
          {
            name: 'Total Fees Earned by Pool (30D)',
            value: feesVolume,
            filter: (v: number) => `${number(v, '0,0.00a')} RUNE`,
            usdValue: runePrice
              ? (v: any) => formatTrendCurrency(v * runePrice, { decimals: 2 })
              : () => "$0",
          },
          {
            name: 'Average Slip',
            value: pool?.averageSlip ? pool.averageSlip / 10000 : 0,
            filter: (v: number) => `${formatPercentToString(v, 2)}`,
          },
        ],
      },
    ];
  }, [pool, periodFees, periodFeesUSD, runePrice]);

  useEffect(() => {
    if (!poolNameString) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      
      try {
        const results = await Promise.allSettled([
          getPoolStats(poolNameString),
          getPoolDetail(poolNameString),
          getEarningHistory(),
          getPoolDepth(poolNameString, 30),
          getSwapsHistory({
            interval: 'day',
            count: 30,
            pool: poolNameString,
          }),
        ]);

        const [
          poolRes,
          poolDetailRes,
          earningRes,
          depthRes,
          swapsRes,
        ] = results.map((res) => (res.status === "fulfilled" ? res.value : null));

        if (!poolRes || !poolDetailRes) {
          console.warn('No pool data found');
          setLoading(false);
          return;
        }

        const poolData = poolRes as PoolData;
        const poolDetailData = poolDetailRes;

        let periodFees = 0;
        let periodFeesUSD = 0;
        
        if (earningRes) {
          const earningData = earningRes as any;
          if (earningData?.intervals) {
            earningData.intervals.forEach((interval: any, index: number) => {
              if (index === earningData.intervals.length - 1) {
                return;
              }
              
              const poolDataItem = interval?.pools?.find((p: any) => p.pool === poolNameString);
              if (poolDataItem) {
                const feesRune = parseFloat(poolDataItem?.totalLiquidityFeesRune || 0);
                const runePriceUSD = parseFloat(interval.runePriceUSD || 0);
                periodFeesUSD += feesRune * runePriceUSD;
                periodFees += feesRune;
              }
            });
          }
        }

        setPool(poolData);
        setPoolDetail(poolDetailData);
        
        const formattedEarnings = earningRes ? formatEarningsData(earningRes, poolNameString) : null;
        const formattedDepth = depthRes ? formatDepthData(depthRes) : null;
        const formattedSwaps = swapsRes ? formatSwapsData(swapsRes) : null;
        
        setEarningsHistory(formattedEarnings);
        setDepthHistory(formattedDepth);
        setSwapHistory(formattedSwaps);
        setPeriodFees(periodFees);
        setPeriodFeesUSD(periodFeesUSD);
        
      } catch (error: any) {
        console.error('Error loading pool data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [poolNameString, runePrice]);

  const getSeriesColor = (seriesIndex: number) => {
    return getChartColor(seriesIndex, getCurrentChartTheme(theme));
  };

  const formatValue = (value: number, isUSD: boolean = true) => {
    const prefix = isUSD ? "$" : "";
    
    if (value >= 1e9) {
      return `${prefix}${(value / 1e9).toFixed(1)}B`;
    } else if (value >= 1e6) {
      return `${prefix}${(value / 1e6).toFixed(1)}M`;
    } else if (value >= 1e3) {
      return `${prefix}${(value / 1e3).toFixed(1)}K`;
    }
    return `${prefix}${value.toFixed(isUSD ? 0 : 2)}`;
  };

  const formatEarningsData = (earningsData: any, poolNameParam: string) => {
    if (!earningsData?.intervals) return null;

    const chartData: ChartDataPoint[] = [];
    const intervals = earningsData.intervals;

    intervals.forEach((interval: any, index: number) => {
      if (index === intervals.length - 1) return;

      const timestamp = Math.floor((~~interval.endTime + ~~interval.startTime) / 2);
      const date = moment(timestamp * 1000).format("dddd, MMM D");
      
      const poolData = interval?.pools?.find((p: any) => p.pool === poolNameParam);
      const runePriceUSD = Number.parseFloat(interval.runePriceUSD || 0);
      
      const liquidityFee = ((+poolData?.totalLiquidityFeesRune || 0) * runePriceUSD) / 10 ** 8;
      const rewards = ((+poolData?.rewards || 0) * runePriceUSD) / 10 ** 8;
      const earnings = ((+poolData?.earnings || 0) * runePriceUSD) / 10 ** 8;

      chartData.push({
        date,
        liquidityFee,
        rewards: rewards > 0 ? rewards : 0,
        lpEarnings: earnings,
      });
    });

    const series: ChartSeries[] = [
      {
        name: "Liquidity Fee",
        type: "bar",
        stack: "Total",
        data: chartData.map((item, index) => ({
          value: item.liquidityFee,
          itemStyle: {
            color: getSeriesColor(0),
            borderRadius: index === chartData.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]
          }
        })),
        itemStyle: {
          color: getSeriesColor(0),
        },
      },
      {
        name: "Rewards",
        type: "bar",
        stack: "Total",
        data: chartData.map((item, index) => ({
          value: item.rewards,
          itemStyle: {
            color: getSeriesColor(1),
            borderRadius: index === chartData.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]
          }
        })),
        itemStyle: {
          color: getSeriesColor(1),
        },
      },
      {
        name: "LP Earnings",
        type: "line",
        showSymbol: false,
        smooth: true,
        data: chartData.map((item) => item.lpEarnings),
        lineStyle: {
          width: 2,
          color: getSeriesColor(2),
        },
        itemStyle: {
          color: getSeriesColor(2),
        },
        z: 3,
      },
    ];

    const options = {
      legend: {
        show: true,
        top: "top",
        left: "center",
        icon: "circle",
        itemWidth: 12,
        itemHeight: 12,
        textStyle: {
          fontSize: 12,
          color: theme === "dark" ? "#e6e6e6" : "#333333",
        },
        data: series.map(s => s.name),
      },
      tooltip: {
        trigger: "axis",
        formatter: function (params: any[]) {
          if (!params || !params.length) return "";
          const idx = params[0].dataIndex ?? 0;
          const date = chartData[idx]?.date || "";

          const valueOf = (p: any) => {
            if (p?.value?.value !== undefined) return Number(p.value.value || 0);
            return Number(p?.value || 0);
          };

          const header = `<div class="tooltip-header">${date}</div>`;
          
          const bodyLines = params.map((p: any) => {
            const value = valueOf(p);
            if (value <= 0) return "";
            
            return `
              <span class="tooltip-item space">
                <span class="series-name-color">
                  <span class="data-color" style="background-color: ${p.color};"></span>
                  <span>${p.seriesName}</span>
                </span>
                <span>${formatValue(value)}</span>
              </span>`;
          }).filter(line => line.trim() !== "");

          const total = params.reduce((sum, p) => sum + valueOf(p), 0);
          
          const totalLine = `
            <span class="tooltip-item space" style="border-top: 1px solid var(--border); margin-top: 4px; padding-top: 4px;">
              <span>Total</span>
              <span>${formatValue(total)}</span>
            </span>`;

          return `
            ${header}
            <div class="tooltip-body">
              ${bodyLines.join("")}
              ${totalLine}
            </div>`;
        },
        backgroundColor: theme === "dark" ? "rgba(30, 30, 30, 0.9)" : "rgba(255, 255, 255, 0.95)",
        borderColor: theme === "dark" ? "#424242" : "#e0e0e0",
        textStyle: {
          color: theme === "dark" ? "#ffffff" : "#333333",
        },
      },
      xAxis: {
        type: "category",
        data: chartData.map((item) => item.date),
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
      series,
      grid: {
        left: "0%",
        right: "0%",
        bottom: "0%",
        top: "15%",
        containLabel: true,
      },
    };

    return {
      data: {
        labels: chartData.map(item => item.date),
        series,
      },
      options,
    };
  };

  const formatDepthData = (depthData: any) => {
    if (!depthData?.intervals) return null;

    const chartData: ChartDataPoint[] = [];
    const intervals = depthData.intervals;

    intervals.forEach((interval: any, index: number) => {
      if (index === intervals.length - 1) return;

      const timestamp = Math.floor((~~interval.endTime + ~~interval.startTime) / 2);
      const date = moment(timestamp * 1000).format("dddd, MMM D");
      
      const assetDepth = (+interval.assetDepth || 0) / 10 ** 8;
      const runeDepth = (+interval.runeDepth || 0) / 10 ** 8;

      chartData.push({
        date,
        assetDepth,
        runeDepth,
      });
    });

    const series: ChartSeries[] = [
      {
        name: "Asset Depth",
        type: "bar",
        data: chartData.map((item, index) => ({
          value: item.assetDepth,
          itemStyle: {
            color: getSeriesColor(0),
            borderRadius: index === chartData.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]
          }
        })),
        itemStyle: {
          color: getSeriesColor(0),
        },
      },
      {
        name: "Rune Depth",
        type: "bar",
        data: chartData.map((item, index) => ({
          value: item.runeDepth,
          itemStyle: {
            color: getSeriesColor(1),
            borderRadius: index === chartData.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]
          }
        })),
        itemStyle: {
          color: getSeriesColor(1),
        },
      },
    ];

    const options = {
      legend: {
        show: true,
        top: "top",
        left: "center",
        icon: "circle",
        itemWidth: 12,
        itemHeight: 12,
        textStyle: {
          fontSize: 12,
          color: theme === "dark" ? "#e6e6e6" : "#333333",
        },
        data: series.map(s => s.name),
      },
      tooltip: {
        trigger: "axis",
        formatter: function (params: any[]) {
          if (!params || !params.length) return "";
          const idx = params[0].dataIndex ?? 0;
          const date = chartData[idx]?.date || "";

          const valueOf = (p: any) => {
            if (p?.value?.value !== undefined) return Number(p.value.value || 0);
            return Number(p?.value || 0);
          };

          const header = `<div class="tooltip-header">${date}</div>`;
          
          const bodyLines = params.map((p: any) => {
            const value = valueOf(p);
            return `
              <span class="tooltip-item space">
                <span class="series-name-color">
                  <span class="data-color" style="background-color: ${p.color};"></span>
                  <span>${p.seriesName}</span>
                </span>
                <span>${formatValue(value, false)} ${p.seriesName.includes('Asset') ? showAsset(pool?.asset || '') : 'RUNE'}</span>
              </span>`;
          }).filter(line => line.trim() !== "");

          const totalDepthUSD = params.reduce((sum, p) => {
            const value = valueOf(p);
            if (p.seriesName.includes('Asset')) {
              return sum + (value * (pool?.assetPriceUSD || 1));
            }
            return sum + (value * (runePrice || 1));
          }, 0);

          const totalLine = `
            <span class="tooltip-item space" style="border-top: 1px solid var(--border); margin-top: 4px; padding-top: 4px;">
              <span>Total Depth (USD)</span>
              <span>${formatValue(totalDepthUSD)}</span>
            </span>`;

          return `
            ${header}
            <div class="tooltip-body">
              ${bodyLines.join("")}
              ${totalLine}
            </div>`;
        },
        backgroundColor: theme === "dark" ? "rgba(30, 30, 30, 0.9)" : "rgba(255, 255, 255, 0.95)",
        borderColor: theme === "dark" ? "#424242" : "#e0e0e0",
        textStyle: {
          color: theme === "dark" ? "#ffffff" : "#333333",
        },
      },
      xAxis: {
        type: "category",
        data: chartData.map((item) => item.date),
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
      series,
      grid: {
        left: "0%",
        right: "0%",
        bottom: "0%",
        top: "15%",
        containLabel: true,
      },
    };

    return {
      data: {
        labels: chartData.map(item => item.date),
        series,
      },
      options,
    };
  };

  const formatSwapsData = (swapsData: any) => {
    if (!swapsData?.intervals) return null;

    const chartData: ChartDataPoint[] = [];
    const intervals = swapsData.intervals;

    intervals.forEach((interval: any, index: number) => {
      if (index === intervals.length - 1) return;

      const timestamp = Math.floor((~~interval.endTime + ~~interval.startTime) / 2);
      const date = moment(timestamp * 1000).format("dddd, MMM D");
      
      const nativeSwaps = (+interval.toRuneVolumeUSD + +interval.toAssetVolumeUSD) / 100;
      const tradeSwaps = (+interval.fromTradeVolumeUSD + +interval.toTradeVolumeUSD) / 100;
      const synthSwaps = (+interval.synthRedeemVolumeUSD + +interval.synthMintVolumeUSD) / 100;
      const securedSwaps = (+interval.toSecuredVolumeUSD + +interval.fromSecuredVolumeUSD) / 100;
      const swapCount = interval.totalCount || 0;

      chartData.push({
        date,
        nativeSwaps,
        tradeSwaps,
        synthSwaps,
        securedSwaps,
        swapCount,
      });
    });

    const series: ChartSeries[] = [
      {
        name: "Native Swaps",
        type: "bar",
        stack: "Total",
        data: chartData.map((item, index) => ({
          value: item.nativeSwaps,
          itemStyle: {
            color: getSeriesColor(0),
            borderRadius: index === chartData.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]
          }
        })),
        itemStyle: {
          color: getSeriesColor(0),
        },
      },
      {
        name: "Trade Swaps",
        type: "bar",
        stack: "Total",
        data: chartData.map((item, index) => ({
          value: item.tradeSwaps,
          itemStyle: {
            color: getSeriesColor(1),
            borderRadius: index === chartData.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]
          }
        })),
        itemStyle: {
          color: getSeriesColor(1),
        },
      },
      {
        name: "Synth Swaps",
        type: "bar",
        stack: "Total",
        data: chartData.map((item, index) => ({
          value: item.synthSwaps,
          itemStyle: {
            color: getSeriesColor(2),
            borderRadius: index === chartData.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]
          }
        })),
        itemStyle: {
          color: getSeriesColor(2),
        },
      },
      {
        name: "Secured Swaps",
        type: "bar",
        stack: "Total",
        data: chartData.map((item, index) => ({
          value: item.securedSwaps,
          itemStyle: {
            color: getSeriesColor(3),
            borderRadius: index === chartData.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]
          }
        })),
        itemStyle: {
          color: getSeriesColor(3),
        },
      },
    ];

    const options = {
      legend: {
        show: true,
        top: "top",
        left: "center",
        icon: "circle",
        itemWidth: 12,
        itemHeight: 12,
        textStyle: {
          fontSize: 12,
          color: theme === "dark" ? "#e6e6e6" : "#333333",
        },
        data: series.map(s => s.name),
      },
      tooltip: {
        trigger: "axis",
        formatter: function (params: any[]) {
          if (!params || !params.length) return "";
          const idx = params[0].dataIndex ?? 0;
          const date = chartData[idx]?.date || "";
          const swapCount = chartData[idx]?.swapCount || 0;

          const valueOf = (p: any) => {
            if (p?.value?.value !== undefined) return Number(p.value.value || 0);
            return Number(p?.value || 0);
          };

          const header = `<div class="tooltip-header">${date}</div>`;
          
          const sortedParams = [...params].sort((a, b) => valueOf(b) - valueOf(a));
          
          const bodyLines = sortedParams.map((p: any) => {
            const value = valueOf(p);
            if (value <= 0) return "";
            
            return `
              <span class="tooltip-item space">
                <span class="series-name-color">
                  <span class="data-color" style="background-color: ${p.color};"></span>
                  <span>${p.seriesName}</span>
                </span>
                <span>${formatValue(value)}</span>
              </span>`;
          }).filter(line => line.trim() !== "");

          const totalVolume = sortedParams.reduce((sum, p) => sum + valueOf(p), 0);
          
          const totalLine = `
            <span class="tooltip-item space" style="border-top: 1px solid var(--border); margin-top: 4px; padding-top: 4px;">
              <span>Total Volume</span>
              <span>${formatValue(totalVolume)}</span>
            </span>`;
          
          const countLine = `
            <span class="tooltip-item space">
              <span>Swap Count</span>
              <span>${number(swapCount, '0,0')}</span>
            </span>`;

          return `
            ${header}
            <div class="tooltip-body">
              ${bodyLines.join("")}
              ${totalLine}
              ${countLine}
            </div>`;
        },
        backgroundColor: theme === "dark" ? "rgba(30, 30, 30, 0.9)" : "rgba(255, 255, 255, 0.95)",
        borderColor: theme === "dark" ? "#424242" : "#e0e0e0",
        textStyle: {
          color: theme === "dark" ? "#ffffff" : "#333333",
        },
      },
      xAxis: {
        type: "category",
        data: chartData.map((item) => item.date),
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
      series,
      grid: {
        left: "0%",
        right: "0%",
        bottom: "0%",
        top: "15%",
        containLabel: true,
      },
    };

    return {
      data: {
        labels: chartData.map(item => item.date),
        series,
      },
      options,
    };
  };

  const renderEarningsChart = () => {
    if (loading) {
      return <ChartLoader />;
    }

    if (!earningsHistory || !earningsHistory.data || !earningsHistory.data.series || earningsHistory.data.series.length === 0) {
      return (
        <div className={styles.noData}>
          <p>No earnings data available</p>
          <small>Try refreshing or check back later</small>
        </div>
      );
    }

    return (
      <div className={styles.chartContainer}>
        <EChartsWrapper
          type="bar"
          data={earningsHistory.data}
          options={earningsHistory.options}
          height="400px"
        />
      </div>
    );
  };

  const renderDepthChart = () => {
    if (loading) {
      return <ChartLoader />;
    }

    if (!depthHistory || !depthHistory.data || !depthHistory.data.series || depthHistory.data.series.length === 0) {
      return (
        <div className={styles.noData}>
          <p>No depth data available</p>
          <small>Try refreshing or check back later</small>
        </div>
      );
    }

    return (
      <div className={styles.chartContainer}>
        <EChartsWrapper
          type="bar"
          data={depthHistory.data}
          options={depthHistory.options}
          height="400px"
        />
      </div>
    );
  };

  const renderSwapsChart = () => {
    if (loading) {
      return <ChartLoader />;
    }

    if (!swapHistory || !swapHistory.data || !swapHistory.data.series || swapHistory.data.series.length === 0) {
      return (
        <div className={styles.noData}>
          <p>No swaps data available</p>
          <small>Try refreshing or check back later</small>
        </div>
      );
    }

    return (
      <div className={styles.chartContainer}>
        <EChartsWrapper
          type="bar"
          data={swapHistory.data}
          options={swapHistory.options}
          height="400px"
        />
      </div>
    );
  };

  if (!poolNameString) {
    return (
      <Page className={styles.page} suppressHydrationWarning>
        <div className={styles.cardsContainer}>
          <Card title="Error">
            <div className={styles.errorContainer}>
              <p>Pool name is required</p>
            </div>
          </Card>
        </div>
      </Page>
    );
  }

  return (
    <Page className={styles.page} suppressHydrationWarning>
      <div className={styles.cardsContainer}>
        <InfoCard 
          options={poolDetailStats} 
          inner={true}
          runePrice={runePrice}
        />
        <Card title={`${showAsset(poolNameString)} Earnings`}>
          {renderEarningsChart()}
        </Card>
      </div>
      <div className={styles.cardsContainer}>
        <Card title={`${showAsset(poolNameString)} Depth`}>
          {renderDepthChart()}
        </Card>
        <Card title={`${showAsset(poolNameString)} Swaps`}>
          {renderSwapsChart()}
        </Card>
      </div>
      <div className={styles.footerStat}>
        <small>
          <sup>*</sup>
          All of the stat are based on 30 days period
        </small>
      </div>
    </Page>
  );
};

export default PoolOverview;