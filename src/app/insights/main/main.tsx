"use client";

import React, { useState, useEffect, useMemo } from 'react';
import moment from 'moment';
import { orderBy } from 'lodash';
import Card from '@/components/ui/Card';
import TradingViewChart from '@/components/TradingViewChart';
import ChartLoader from '@/components/ChartLoader';
import SkeletonItem from '@/components/ui/Skeleton';
import RuneAsset from '@/components/RuneAsset';
import EChartsWrapper from '@/components/charts/EChartsWrapper';
import { api } from '@/lib/api';
import { formatTrendCurrency, formatNumber, formatPercent } from '@/utils/format';
import { ProgressIcon } from '@/components/ui/ProgressIcon';
import FlipSideIcon from '@/assets/images/flipside.svg';
import { useTheme } from '@/lib/store';
import { getChartColor, getCurrentChartTheme } from '@/utils/global';
import './main.scss';

const Main = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState({
    swaps: false,
    affiliate: false,
    dashboard: false,
    market: false,
  });
  const [chartData, setChartData] = useState({
    swapsStats: null,
    swapsStatsNorm: null,
    feesRewards: null,
    feesRewardsNorm: null,
    rewards: null,
    supplyBurn: null,
    affiliate: null,
  });
  const [marketInfo, setMarketInfo] = useState({
    price: undefined,
    rank: undefined,
    marketCap: undefined,
    tradeVolume: undefined,
    totalSupply: undefined,
    change_24h: undefined,
    percent_change_24h: undefined,
  });

  const getSeriesColor = (index: number) => {
    return getChartColor(index, getCurrentChartTheme(theme));
  };

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

  const formatChartDataForEChartsWrapper = (xAxis: string[], seriesConfig: any[], dataPoints: any[], showCount = false, isNormalized = false) => {
    const datasets = seriesConfig.map((config, index) => {
      if (config.name === 'Half Line') {
        return {
          label: config.name,
          data: config.data,
          type: 'line' as const,
          backgroundColor: 'transparent',
          borderColor: '#888',
          borderWidth: 1,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        };
      }

      if (config.name === 'Total Income') {
        return {
          label: config.name,
          data: config.data,
          type: 'line' as const,
          backgroundColor: 'transparent',
          borderColor: getSeriesColor(0),
          borderWidth: 2,
          tension: 0.4,
          fill: false,
          pointRadius: 0,
        };
      }

      return {
        label: config.name,
        data: config.data.map((value: any) => ({
          value,
          itemStyle: {
            color: getSeriesColor(index),
          },
        })),
        type: config.type === 'line' ? 'line' : ('bar' as const),
        backgroundColor: getSeriesColor(index),
        borderColor: getSeriesColor(index),
        borderWidth: 1,
        borderRadius: {
          topLeft: 8,
          topRight: 8,
          bottomLeft: 0,
          bottomRight: 0,
        },
        borderSkipped: false,
        stack: config.stack || 'total',
      };
    });

    const chartDataForChartJs = {
      labels: xAxis,
      datasets,
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          displayColors: false,
          backgroundColor: 'var(--tooltip-bg)',
          borderColor: 'var(--border-color)',
          borderWidth: 1,
          titleColor: 'var(--font-color)',
          bodyColor: 'var(--font-color)',
          callbacks: {
            title: function(context: any) {
              const dataIndex = context[0].dataIndex;
              return dataPoints[dataIndex]?.date || xAxis[dataIndex] || '';
            },
            afterTitle: function() {
              return '─────────────';
            },
            label: function(context: any) {
              const dataIndex = context.dataIndex;
              const label = context.dataset.label || '';
              const value = context.parsed?.y || context.raw?.value || 0;
              
              if (isNormalized && label !== 'Half Line') {
                return `${label}: ${(value * 100).toFixed(1)}%`;
              }
              return `${label}: ${formatValue(value)}`;
            },
            afterBody: function(context: any) {
              const dataIndex = context[0].dataIndex;
              if (showCount && dataPoints[dataIndex]?.count !== undefined) {
                return [`Count: ${Number(dataPoints[dataIndex].count).toLocaleString()}`];
              }
              return [];
            },
          },
        },
      },
      scales: {
        x: {
          display: false,
          stacked: true,
        },
        y: {
          display: false,
          stacked: true,
          beginAtZero: true,
          ticks: {
            callback: function(value: any) {
              if (isNormalized) {
                return `${(value * 100).toFixed(0)}%`;
              }
              return formatValue(value);
            },
          },
        },
      },
    };

    return {
      data: chartDataForChartJs,
      options,
      dataPoints,
      showCount,
      isNormalized,
    };
  };

  const formatRewardsData = (earningData) => {
    if (!earningData?.intervals) return null;

    const top = 6;
    const lastInterval = earningData.intervals[earningData.intervals.length - 2];
    if (!lastInterval?.pools) return null;

    const poolEarnings = orderBy(
      lastInterval.pools.filter(p => 
        p.pool !== 'income_burn' && 
        p.pool !== 'dev_fund_reward' && 
        p.pool !== 'tcy_stake_reward'
      ),
      [(o) => Math.abs(+o.rewards || 0)],
      ['desc']
    )
      .slice(0, top)
      .map(p => p.pool);

    const xAxis = [];
    const seriesData = {};
    const otherPoolsData = [];
    const dataPoints = [];

    earningData.intervals.forEach((interval, index) => {
      if (index === earningData.intervals.length - 1) return;

      const date = moment(
        Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
      ).format('dddd, MMM D');
      
      xAxis.push(date);

      const otherEarnings = interval.pools
        ?.filter(p => 
          !poolEarnings.includes(p.pool) &&
          p.pool !== 'income_burn' &&
          p.pool !== 'dev_fund_reward' &&
          p.pool !== 'tcy_stake_reward'
        )
        .reduce((sum, p) => sum + (-1 * (+p.rewards || 0) * (+interval.runePriceUSD || 0)) / 1e8, 0) || 0;

      otherPoolsData.push(otherEarnings);

      poolEarnings.forEach((poolName) => {
        const pool = interval.pools?.find(p => p.pool === poolName);
        const value = pool ? (+pool.rewards * -1 * +interval.runePriceUSD) / 1e8 : 0;
        
        if (!seriesData[poolName]) {
          seriesData[poolName] = [];
        }
        seriesData[poolName].push(value);
      });

      dataPoints.push({
        date,
        otherEarnings,
        poolEarnings: poolEarnings.map(poolName => ({
          name: poolName,
          value: seriesData[poolName]?.[seriesData[poolName].length - 1] || 0
        }))
      });
    });

    const seriesConfig = [
      {
        name: 'Other Pools',
        data: otherPoolsData,
        stack: 'Total',
      },
      ...Object.entries(seriesData).map(([poolName, data]) => ({
        name: poolName,
        data: data,
        stack: 'Total',
      })),
      {
        name: 'Total Income',
        type: 'line',
        data: xAxis.map((_, idx) => {
          let total = otherPoolsData[idx];
          Object.values(seriesData).forEach(poolData => {
            total += poolData[idx] || 0;
          });
          return total;
        }),
      },
    ];

    return formatChartDataForEChartsWrapper(xAxis, seriesConfig, dataPoints);
  };

  const formatSwapsStatsData = (swapsData) => {
    if (!swapsData?.intervals) return null;

    const xAxis = [];
    const nativeData = [];
    const tradeData = [];
    const synthData = [];
    const securedData = [];
    const dataPoints = [];

    swapsData.intervals.forEach((interval, index) => {
      if (index === swapsData.intervals.length - 1) return;

      const date = moment(
        Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
      ).format('dddd, MMM D');
      
      xAxis.push(date);

      const nativeVolume = ((+interval.toRuneVolumeUSD || 0) + (+interval.toAssetVolumeUSD || 0)) / 100;
      const tradeVolume = ((+interval.fromTradeVolumeUSD || 0) + (+interval.toTradeVolumeUSD || 0)) / 100;
      const synthVolume = ((+interval.synthRedeemVolumeUSD || 0) + (+interval.synthMintVolumeUSD || 0)) / 100;
      const securedVolume = ((+interval.fromSecuredVolumeUSD || 0) + (+interval.toSecuredVolumeUSD || 0)) / 100;

      nativeData.push(nativeVolume);
      tradeData.push(tradeVolume);
      synthData.push(synthVolume);
      securedData.push(securedVolume);

      dataPoints.push({
        date,
        nativeVolume,
        tradeVolume,
        synthVolume,
        securedVolume,
        count: interval.totalCount || 0,
        total: nativeVolume + tradeVolume + synthVolume + securedVolume
      });
    });

    const seriesConfig = [
      {
        name: 'Native Swap Volume',
        data: nativeData,
        stack: 'total',
      },
      {
        name: 'Trade Swaps',
        data: tradeData,
        stack: 'total',
      },
      {
        name: 'Synth Swaps',
        data: synthData,
        stack: 'total',
      },
      {
        name: 'Secured Swaps',
        data: securedData,
        stack: 'total',
      },
    ];

    return formatChartDataForEChartsWrapper(xAxis, seriesConfig, dataPoints, true);
  };

  const formatSwapsStatsNormData = (swapsData) => {
    if (!swapsData?.intervals) return null;

    const xAxis = [];
    const nativeData = [];
    const tradeData = [];
    const synthData = [];
    const securedData = [];
    const dataPoints = [];

    swapsData.intervals.forEach((interval, index) => {
      if (index === swapsData.intervals.length - 1) return;

      const date = moment(
        Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
      ).format('dddd, MMM D');
      
      xAxis.push(date);

      const nativeVolume = ((+interval.toRuneVolumeUSD || 0) + (+interval.toAssetVolumeUSD || 0)) / 100;
      const tradeVolume = ((+interval.fromTradeVolumeUSD || 0) + (+interval.toTradeVolumeUSD || 0)) / 100;
      const synthVolume = ((+interval.synthRedeemVolumeUSD || 0) + (+interval.synthMintVolumeUSD || 0)) / 100;
      const securedVolume = ((+interval.fromSecuredVolumeUSD || 0) + (+interval.toSecuredVolumeUSD || 0)) / 100;
      const total = nativeVolume + tradeVolume + synthVolume + securedVolume;

      const nativePercent = total > 0 ? nativeVolume / total : 0;
      const tradePercent = total > 0 ? tradeVolume / total : 0;
      const synthPercent = total > 0 ? synthVolume / total : 0;
      const securedPercent = total > 0 ? securedVolume / total : 0;

      nativeData.push(nativePercent);
      tradeData.push(tradePercent);
      synthData.push(synthPercent);
      securedData.push(securedPercent);

      dataPoints.push({
        date,
        nativePercent,
        tradePercent,
        synthPercent,
        securedPercent
      });
    });

    const seriesConfig = [
      {
        name: 'Native Swap Volume',
        data: nativeData,
        stack: 'total',
      },
      {
        name: 'Trade Swaps',
        data: tradeData,
        stack: 'total',
      },
      {
        name: 'Synth Swaps',
        data: synthData,
        stack: 'total',
      },
      {
        name: 'Secured Swaps',
        data: securedData,
        stack: 'total',
      },
    ];

    return formatChartDataForEChartsWrapper(xAxis, seriesConfig, dataPoints, false, true);
  };

  const formatFeesRewardsData = (intervals) => {
    if (!intervals?.length) return null;

    const xAxis = [];
    const feesData = [];
    const rewardsData = [];
    const dataPoints = [];

    intervals.forEach((interval) => {
      const intervalDate = moment(
        Math.floor((+interval.endTime + +interval.startTime) / 2) * 1e3
      );

      if (intervalDate.isSame(moment(), 'day')) return;

      const date = intervalDate.format('dddd, MMM D');
      
      xAxis.push(date);
      const fees = (interval.liquidityFees * interval.runePriceUSD) / 1e8;
      const rewards = Math.max((interval.blockRewards * interval.runePriceUSD) / 1e8, 0);

      feesData.push(fees);
      rewardsData.push(rewards);

      dataPoints.push({
        date,
        fees,
        rewards,
        total: fees + rewards
      });
    });

    const seriesConfig = [
      {
        name: 'Liquidity Fees',
        data: feesData,
        stack: 'Total',
      },
      {
        name: 'Block Rewards',
        data: rewardsData,
        stack: 'Total',
      },
    ];

    return formatChartDataForEChartsWrapper(xAxis, seriesConfig, dataPoints);
  };

  const formatFeesRewardsNormData = (intervals) => {
    if (!intervals?.length) return null;

    const xAxis = [];
    const feesData = [];
    const rewardsData = [];
    const halfLineData = [];
    const dataPoints = [];

    intervals.forEach((interval) => {
      const intervalDate = moment(
        Math.floor((+interval.endTime + +interval.startTime) / 2) * 1e3
      );

      if (intervalDate.isSame(moment(), 'day')) return;

      const date = intervalDate.format('dddd, MMM D');
      
      xAxis.push(date);
      const fees = (interval.liquidityFees * interval.runePriceUSD) / 1e8;
      const rewards = Math.max((interval.blockRewards * interval.runePriceUSD) / 1e8, 0);
      const total = interval.earnings ? (interval.earnings * interval.runePriceUSD) / 1e8 : fees + rewards;

      const feesPercent = total > 0 ? fees / total : 0;
      const rewardsPercent = total > 0 ? rewards / total : 0;

      feesData.push(feesPercent);
      rewardsData.push(rewardsPercent);
      halfLineData.push(0.5);

      dataPoints.push({
        date,
        feesPercent,
        rewardsPercent
      });
    });

    const seriesConfig = [
      {
        name: 'Liquidity Fees',
        data: feesData,
        stack: 'total',
      },
      {
        name: 'Block Rewards',
        data: rewardsData,
        stack: 'total',
      },
      {
        name: 'Half Line',
        type: 'line',
        data: halfLineData,
      },
    ];

    return formatChartDataForEChartsWrapper(xAxis, seriesConfig, dataPoints, false, true);
  };

  const formatSupplyBurnData = (earningData) => {
    if (!earningData?.intervals) return null;

    const xAxis = [];
    const burnData = [];
    const dataPoints = [];

    earningData.intervals.forEach((interval) => {
      const intervalDate = moment(
        Math.floor((+interval.endTime + +interval.startTime) / 2) * 1e3
      );

      if (intervalDate.isSame(moment(), 'day')) return;

      const date = intervalDate.format('dddd, MMM D');
      
      xAxis.push(date);
      const burns = interval.pools?.find(p => p.pool === 'income_burn')?.earnings || 0;
      const burn = +burns / 1e8;
      burnData.push(burn);

      dataPoints.push({
        date,
        burn,
      });
    });

    const seriesConfig = [
      {
        name: 'Burned Rune',
        data: burnData,
      },
    ];

    const chartData = formatChartDataForEChartsWrapper(xAxis, seriesConfig, dataPoints);
    
    chartData.data.datasets[0].backgroundColor = getSeriesColor(5);
    chartData.data.datasets[0].borderColor = getSeriesColor(5);

    return chartData;
  };

  const formatAffiliateData = (affiliateData) => {
    if (!affiliateData?.length) return null;

    const filtered = affiliateData.filter(item => item.affiliate !== 'No Affiliate');
    const sorted = filtered.sort((a, b) => b.total_volume_usd - a.total_volume_usd);
    
    const xAxis = sorted.map(item => item.affiliate);
    const volumeData = sorted.map(item => item.total_volume_usd);
    const dataPoints = sorted.map(item => ({
      date: item.affiliate,
      volume: item.total_volume_usd
    }));

    const seriesConfig = [
      {
        name: 'Volume',
        data: volumeData,
      },
    ];

    const chartData = formatChartDataForEChartsWrapper(xAxis, seriesConfig, dataPoints);
    
    chartData.options.scales.x.display = true;
    chartData.options.scales.x.ticks = {
      maxRotation: 45,
      minRotation: 45,
    };

    return chartData;
  };

  const fetchSwapsHistory = async () => {
    setLoading(prev => ({ ...prev, swaps: true }));
    try {
      const response = await api.getSwapsHistory({
        interval: 'day',
        count: 30,
      });
      const data = response.data;
      
      setChartData(prev => ({
        ...prev,
        swapsStats: formatSwapsStatsData(data),
        swapsStatsNorm: formatSwapsStatsNormData(data),
      }));
    } catch (error) {
      console.error('Error fetching swap history:', error);
    } finally {
      setLoading(prev => ({ ...prev, swaps: false }));
    }
  };

  const fetchAffiliateSwapsMonthly = async () => {
    setLoading(prev => ({ ...prev, affiliate: true }));
    try {
      const response = await api.getAffiliateSwapsMonthly();
      const data = response.data;
      setChartData(prev => ({
        ...prev,
        affiliate: formatAffiliateData(data),
      }));
    } catch (error) {
      console.error('Error fetching affiliate swaps:', error);
    } finally {
      setLoading(prev => ({ ...prev, affiliate: false }));
    }
  };

  const fetchDashboardPlots = async () => {
    setLoading(prev => ({ ...prev, dashboard: true }));
    try {
      const response = await api.getDashboardPlots();
      const data = response.data;
      
      setChartData(prev => ({
        ...prev,
        feesRewards: formatFeesRewardsData(data.earning?.intervals),
        feesRewardsNorm: formatFeesRewardsNormData(data.earning?.intervals),
        rewards: formatRewardsData(data.earning),
        supplyBurn: formatSupplyBurnData(data.earning),
      }));
    } catch (error) {
      console.error('Error fetching dashboard plots:', error);
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false }));
    }
  };

  const getCoinMarketInfo = async () => {
    setLoading(prev => ({ ...prev, market: true }));
    try {
      const response = await api.getCoinMarketInfo();
      const data = response.data;

      setMarketInfo({
        price: data.quote?.USD?.price,
        rank: data.cmc_rank,
        marketCap: data.quote?.USD?.market_cap,
        tradeVolume: data.quote?.USD?.volume_24h,
        change_24h: data.quote?.USD?.volume_change_24h,
        percent_change_24h: data.quote?.USD?.percent_change_24h,
        totalSupply: data.total_supply,
      });
    } catch (error) {
      console.error('Error coin market info:', error);
    } finally {
      setLoading(prev => ({ ...prev, market: false }));
    }
  };

  useEffect(() => {
    fetchSwapsHistory();
    fetchAffiliateSwapsMonthly();
    fetchDashboardPlots();
    getCoinMarketInfo();
  }, []);

  return (
    <div className="container-page">
      <Card className="coin-info">
        <TradingViewChart symbol="BINANCE:RUNEUSDT" />
        <div className="crypto-stats">
          <div className="crypto-stat">
            <span className="name">Crypto Rank</span>
            <SkeletonItem loading={!marketInfo.rank && loading.market} className="value">
              {marketInfo.rank || '--'}
            </SkeletonItem>
          </div>
          <div className="crypto-stat">
            <span className="name">Market Cap</span>
            <SkeletonItem loading={!marketInfo.marketCap && loading.market} className="value">
              {marketInfo.marketCap ? formatTrendCurrency(marketInfo.marketCap) : '--'}
            </SkeletonItem>
          </div>
          <div className="crypto-stat">
            <span className="name">Trade Volume</span>
            <SkeletonItem loading={!marketInfo.tradeVolume && loading.market} className="value">
              {marketInfo.tradeVolume ? (
                <>
                  {formatTrendCurrency(marketInfo.tradeVolume)}
                  <ProgressIcon
                    dataNumber={marketInfo.change_24h}
                    isDown={marketInfo.change_24h < 0}
                    filter={(v) => formatPercent(v, 1)}
                  />
                </>
              ) : '--'}
            </SkeletonItem>
          </div>
          <div className="crypto-stat">
            <span className="name">Total Supply</span>
            <SkeletonItem loading={!marketInfo.totalSupply && loading.market} className="value">
              {marketInfo.totalSupply ? (
                <>
                  {formatNumber(marketInfo.totalSupply, '0,0')}
                  <RuneAsset height="0.7rem" />
                </>
              ) : '--'}
            </SkeletonItem>
          </div>
        </div>
      </Card>
      
      <div className="chart-inner-container">
        <Card title="Type Swap Chart">
          {chartData.swapsStats ? (
            <EChartsWrapper
              type="bar"
              data={chartData.swapsStats.data}
              options={chartData.swapsStats.options}
              height="400px"
            />
          ) : (
            <ChartLoader barCount={15} />
          )}
        </Card>
        <Card title="Swap Chart Normalized">
          {chartData.swapsStatsNorm ? (
            <EChartsWrapper
              type="bar"
              data={chartData.swapsStatsNorm.data}
              options={chartData.swapsStatsNorm.options}
              height="400px"
            />
          ) : (
            <ChartLoader barCount={15} />
          )}
        </Card>
      </div>
      
      <div className="chart-inner-container">
        <Card title="Fees/Block Reward Chart">
          <div className="card-header-icon">
            <FlipSideIcon style={{ fill: 'var(--sec-font-color)' }} />
          </div>
          {chartData.feesRewards ? (
            <EChartsWrapper
              type="bar"
              data={chartData.feesRewards.data}
              options={chartData.feesRewards.options}
              height="400px"
            />
          ) : (
            <ChartLoader barCount={15} />
          )}
        </Card>
        <Card title="Fees/Block Reward Chart Normalized">
          <div className="card-header-icon">
            <FlipSideIcon style={{ fill: 'var(--sec-font-color)' }} />
          </div>
          {chartData.feesRewardsNorm ? (
            <EChartsWrapper
              type="bar"
              data={chartData.feesRewardsNorm.data}
              options={chartData.feesRewardsNorm.options}
              height="400px"
            />
          ) : (
            <ChartLoader barCount={15} />
          )}
        </Card>
      </div>
      
      <div className="chart-inner-container">
        <Card title="Reserve income from Pools">
          {chartData.rewards ? (
            <EChartsWrapper
              type="bar"
              data={chartData.rewards.data}
              options={chartData.rewards.options}
              height="400px"
            />
          ) : (
            <ChartLoader barCount={15} />
          )}
        </Card>
        <Card title="Supply / Burn">
          {chartData.supplyBurn ? (
            <EChartsWrapper
              type="bar"
              data={chartData.supplyBurn.data}
              options={chartData.supplyBurn.options}
              height="400px"
            />
          ) : (
            <ChartLoader barCount={15} />
          )}
        </Card>
      </div>
    </div>
  );
};

export default Main;