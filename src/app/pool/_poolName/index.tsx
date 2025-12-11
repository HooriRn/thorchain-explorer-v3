import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import moment from 'moment';
import { assetFromString } from '@xchainjs/xchain-util';
import { useTheme } from '@/lib/store';
import Page from '@/components/PageContainer';
import InfoCard from '@/components/InfoCard';
import Card from '@/components/ui/Card';
import EChartsWrapper from '@/components/charts/EChartsWrapper';
import ChartLoader from '@/components/ChartLoader';
import { number, percent } from '@/utils/format';
import { showAsset } from '@/utils/global';
import { api } from '@/lib/api';
import './PoolOverview.module.css';

interface ChartSeries {
  type: string;
  name: string;
  showSymbol: boolean;
  data: number[];
  yAxisIndex?: number;
  stack?: string;
  areaStyle?: any;
  smooth?: boolean;
  lineStyle?: any;
  z?: number;
  itemStyle?: any;
}

const PoolOverview = () => {
  const { poolName } = useParams();
  const [pool, setPool] = useState();
  const [poolDetail, setPoolDetail] = useState();
  const [earningsHistory, setEarningsHistory] = useState();
  const [depthHistory, setDepthHistory] = useState();
  const [swapHistory, setSwapHistory] = useState();
  const [loading, setLoading] = useState(true);
  const [periodFees, setPeriodFees] = useState(0);
  const [periodFeesUSD, setPeriodFeesUSD] = useState(0);

  const runePrice = useSelector((state) => state.runePrice);
  const theme = useTheme();

  const poolDetailStats = useMemo(() => {
    return [
      {
        title: 'Overview',
        rowStart: 1,
        colSpan: 1,
        items: [
          {
            name: 'Asset Price',
            value: pool?.assetPriceUSD,
            filter: (v: number) => `$${number(v, '0,0.00a')}`,
          },
          {
            name: 'Fees Annual to Depth (30D)',
            value:
              (periodFeesUSD * 12) /
              (pool?.assetDepth * pool?.assetPriceUSD),
            filter: (v: number) => `${percent(v, 2)}`,
          },
          {
            name: 'Status',
            value:
              pool?.status?.charAt(0).toUpperCase() +
              pool?.status?.slice(1),
          },
          {
            name: 'Asset Depth',
            value: pool?.assetDepth / 10 ** 8,
            filter: (v: number) =>
              `${number(v, '0,0')} ${showAsset(pool?.asset)}`,
          },
          {
            name: 'Rune Depth',
            value: pool?.runeDepth / 10 ** 8,
            filter: (v: number) => formatRune(v, '0,0a'),
          },
          {
            header: 'All Time Stats',
          },
          {
            name: 'Total Swaps (Overall)',
            value: pool?.swapVolume / 10 ** 8,
            filter: (v: number) => `${number(v, '0,0.00a')} RUNE`,
            usdValue: true,
          },
          {
            name: 'Total Fees Earned by Pool (30D)',
            value: periodFees / 10 ** 8,
            filter: (v: number) => `${number(v, '0,0.00a')} RUNE`,
            usdValue: true,
          },
          {
            name: 'Average Slip',
            value: pool?.averageSlip / 10000,
            filter: (v: number) => `${percent(v, 2)}`,
          },
        ],
      },
    ];
  }, [pool, periodFees, periodFeesUSD, runePrice]);

  useEffect(() => {
    loadData();
  }, [poolName]);

  const loadData = async () => {
    setLoading(true);

    try {
      const [poolRes, poolDetailRes, earningRes, depthRes, swapsRes] = await Promise.all([
        api.getPoolStats(poolName),
        api.getPoolDetail(poolName),
        api.getEarningHistory(),
        api.getPoolDepth(poolName, 30),
        api.getSwapsHistory({
          interval: 'day',
          count: 30,
          pool: poolName,
        }),
      ]);

      setPool(poolRes.data);
      setPoolDetail(poolDetailRes.data);
      setEarningsHistory(formatEarnings(earningRes.data));
      setDepthHistory(formatDepth(depthRes.data));
      setSwapHistory(formatSwaps(swapsRes.data));
    } catch (error) {
      console.error('Error loading pool data:', error);
    } finally {
      setLoading(false);
    }
  };

  const assetString = (assetStr: string) => {
    const { chain, ticker } = assetFromString(assetStr);
    return `${chain}.${ticker}`;
  };

  const formatSwaps = (d: any) => {
    const xAxis: string[] = [];
    const pn: number[] = [];
    const pt: number[] = [];
    const ps: number[] = [];
    const psec: number[] = [];
    
    d?.intervals?.forEach((interval: any, index: number) => {
      if (index === d?.intervals?.length - 1) {
        return;
      }
      
      xAxis.push(
        moment(
          Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
        ).format('dddd, MMM D')
      );
      
      ps.push(
        (+interval.synthRedeemVolumeUSD + +interval.synthMintVolumeUSD) /
          10 ** 2
      );
      pt.push(
        (+interval.fromTradeVolumeUSD + +interval.toTradeVolumeUSD) / 10 ** 2
      );
      pn.push(
        (+interval.toRuneVolumeUSD + +interval.toAssetVolumeUSD) / 10 ** 2
      );
      psec.push(
        (+interval.toSecuredVolumeUSD + +interval.fromSecuredVolumeUSD) /
          10 ** 2
      );
    });

    const series: ChartSeries[] = [
      {
        type: 'bar',
        name: 'Native Swaps',
        stack: 'total',
        showSymbol: false,
        data: pn,
      },
      {
        type: 'bar',
        name: 'Trade Swaps',
        stack: 'total',
        showSymbol: false,
        data: pt,
      },
      {
        type: 'bar',
        name: 'Synth Swaps',
        stack: 'total',
        showSymbol: false,
        data: ps,
      },
      {
        type: 'bar',
        name: 'Secured Swaps',
        stack: 'total',
        showSymbol: false,
        data: psec,
      },
    ];

    const tooltipFormatter = (params: any[]) => {
      const formattedParams = params.map(p => ({
        ...p,
        value: p.value || 0
      })).sort((a, b) => b.value - a.value);
      
      return `
        <div class="tooltip-header">
          ${formattedParams[0]?.name || ''}
        </div>
        <div class="tooltip-body">
          ${formattedParams
            .map(
              (p) => `
              <span>
                <div class="tooltip-item">
                  <div class="data-color" style="background-color: ${p.color}">
                  </div>
                  <span style="text-align: left;">
                    ${p.seriesName}
                  </span>
                </div>
                <b>$${p.value ? number(p.value, '0,0.00a') : '-'}</b>
              </span>`
            )
            .join('')}
        </div>
        <span style="border-top: 1px solid var(--border-color); margin: 2px 0;"></span>
        <hr>
        <span class="tooltip-item space">
          <span>Total Volume</span>
          <b>$${number(
            formattedParams.reduce((a, c) => a + (c.value ? c.value : 0), 0),
            '0,0.00a'
          )}</b>
        </span>
        <span class="tooltip-item space">
          <span style="text-align: left;">
            Swap Count
          </span>
          <b>${number(d?.intervals[formattedParams[0]?.dataIndex]?.totalCount, '0,0.00a')}</b>
        </span>
      `;
    };

    return {
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: tooltipFormatter,
        backgroundColor: theme === 'dark' ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: theme === 'dark' ? '#424242' : '#e0e0e0',
        textStyle: {
          color: theme === 'dark' ? '#ffffff' : '#333333',
        },
      },
      legend: {
        data: series.map(s => s.name),
        textStyle: {
          color: theme === 'dark' ? '#ffffff' : '#333333',
        },
      },
      xAxis: {
        type: 'category',
        data: xAxis,
        axisLabel: {
          color: theme === 'dark' ? '#ffffff' : '#333333',
        },
        axisLine: {
          lineStyle: {
            color: theme === 'dark' ? '#424242' : '#e0e0e0',
          },
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: theme === 'dark' ? '#ffffff' : '#333333',
          formatter: (value: number) => `$ ${number(+value, '0,0.00a')}`,
        },
        splitLine: {
          lineStyle: {
            color: theme === 'dark' ? '#424242' : '#e0e0e0',
            type: 'dashed',
          },
        },
      },
      series,
    };
  };

  const formatDepth = (d: any) => {
    const xAxis: string[] = [];
    const pe: number[] = [];
    const pr: number[] = [];
    
    d?.intervals?.forEach((interval: any, index: number) => {
      if (index === d?.intervals?.length - 1) {
        return;
      }
      
      xAxis.push(
        moment(
          Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
        ).format('dddd, MMM D')
      );
      pe.push(+interval.assetDepth / 10 ** 8);
      pr.push(+interval.runeDepth / 10 ** 8);
    });
    
    const series: ChartSeries[] = [
      {
        type: 'bar',
        name: 'Asset Depth',
        showSymbol: false,
        yAxisIndex: 1,
        data: pe,
      },
      {
        type: 'bar',
        name: 'Rune Depth',
        showSymbol: false,
        yAxisIndex: 0,
        data: pr,
      },
    ];

    return {
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        backgroundColor: theme === 'dark' ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: theme === 'dark' ? '#424242' : '#e0e0e0',
        textStyle: {
          color: theme === 'dark' ? '#ffffff' : '#333333',
        },
      },
      legend: {
        data: series.map(s => s.name),
        textStyle: {
          color: theme === 'dark' ? '#ffffff' : '#333333',
        },
      },
      xAxis: {
        type: 'category',
        data: xAxis,
        axisLabel: {
          color: theme === 'dark' ? '#ffffff' : '#333333',
        },
        axisLine: {
          lineStyle: {
            color: theme === 'dark' ? '#424242' : '#e0e0e0',
          },
        },
      },
      yAxis: [
        {
          type: 'value',
          name: '',
          position: 'right',
          show: false,
          splitLine: {
            show: true,
            lineStyle: {
              color: theme === 'dark' ? '#424242' : '#e0e0e0',
              type: 'dashed',
            },
          },
          max: 'dataMax',
          axisLabel: {
            formatter: (value: number) => `${number(+value, '0,0.00a')}`,
          },
        },
        {
          type: 'value',
          name: '',
          position: 'left',
          show: false,
          splitLine: {
            show: true,
            lineStyle: {
              color: theme === 'dark' ? '#424242' : '#e0e0e0',
              type: 'dashed',
            },
          },
          max: 'dataMax',
          axisLabel: {
            formatter: (value: number) => `${number(+value, '0,0.00a')}`,
          },
        },
      ],
      series,
    };
  };

  const formatEarnings = (d: any) => {
    const xAxis: string[] = [];
    const pe: number[] = [];
    const pw: (number | null)[] = [];
    const pf: number[] = [];
    
    let localPeriodFees = 0;
    let localPeriodFeesUSD = 0;
    
    d?.intervals?.forEach((interval: any, index: number) => {
      if (index === d?.intervals?.length - 1) {
        return;
      }
      
      xAxis.push(
        moment(
          Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
        ).format('dddd, MMM D')
      );
      
      const poolData = interval?.pools?.find((p: any) => p.pool === poolName);
      const earnings = (+poolData?.earnings * +interval.runePriceUSD) / 10 ** 8;
      const rewards = (+poolData?.rewards * +interval.runePriceUSD) / 10 ** 8;
      const liquidityFee =
        (+poolData?.totalLiquidityFeesRune * +interval.runePriceUSD) / 10 ** 8;

      localPeriodFeesUSD +=
        +poolData?.totalLiquidityFeesRune * +interval.runePriceUSD;
      localPeriodFees += +poolData?.totalLiquidityFeesRune;
      
      pe.push(earnings);
      pw.push(rewards < 0 ? null : rewards);
      pf.push(liquidityFee);
    });

    setPeriodFees(localPeriodFees);
    setPeriodFeesUSD(localPeriodFeesUSD);
    
    const series: ChartSeries[] = [
      {
        type: 'bar',
        name: 'Liquidity Fee',
        stack: 'total',
        showSymbol: false,
        data: pf,
      },
      ...(pw.some((v) => v !== null)
        ? [
            {
              type: 'bar',
              name: 'Rewards',
              stack: 'total',
              showSymbol: false,
              data: pw.filter(v => v !== null) as number[],
            },
          ]
        : []),
      {
        type: 'line',
        name: `LP Earnings`,
        showSymbol: false,
        areaStyle: {
          color: 'rgba(243, 186, 47, 0.2)',
        },
        data: pe,
        smooth: true,
        lineStyle: {
          width: 2,
        },
        z: 3,
      },
    ];

    const tooltipFormatter = (params: any[]) => {
      const filteredParam = params.filter(
        (p) => p.seriesName !== 'Rewards' || p.value >= 0
      );

      if (filteredParam.length === 0) return '';

      return `
        <div class="tooltip-header">
          ${filteredParam[0].name}
        </div>
        <div class="tooltip-body">
          ${filteredParam
            .map(
              (p) => `
              <span>
                <div class="tooltip-item">
                  <div class="data-color" style="background-color: ${p.color}"></div>
                  <span style="text-align: left;">
                    ${p.seriesName}
                  </span>
                </div>
                <b>$${number(p.value, '0,0.00a')}</b>
              </span>`
            )
            .join('')}
        </div>
      `;
    };

    return {
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: tooltipFormatter,
        backgroundColor: theme === 'dark' ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: theme === 'dark' ? '#424242' : '#e0e0e0',
        textStyle: {
          color: theme === 'dark' ? '#ffffff' : '#333333',
        },
      },
      legend: {
        data: series.map(s => s.name),
        textStyle: {
          color: theme === 'dark' ? '#ffffff' : '#333333',
        },
      },
      xAxis: {
        type: 'category',
        data: xAxis,
        axisLabel: {
          color: theme === 'dark' ? '#ffffff' : '#333333',
        },
        axisLine: {
          lineStyle: {
            color: theme === 'dark' ? '#424242' : '#e0e0e0',
          },
        },
      },
      yAxis: {
        type: 'value',
        position: 'left',
        show: false,
        splitLine: {
          show: true,
          lineStyle: {
            color: theme === 'dark' ? '#424242' : '#e0e0e0',
            type: 'dashed',
          },
        },
        axisLine: {
          show: false,
        },
        min: 'dataMin',
        max: 'dataMax',
        axisLabel: {
          formatter: (value: number) => `$ ${normalFormat(value)}`,
        },
      },
      series,
    };
  };

  const formatRune = (value: number, format: string) => {
    return `${number(value, format)} RUNE`;
  };

  const normalFormat = (value: number) => {
    return number(value, '0,0.00a');
  };

  const renderChart = (chartData: any, title: string) => {
    if (loading || !chartData) {
      return <ChartLoader barCount={15} />;
    }

    return (
      <EChartsWrapper
        type="bar"
        data={{
          labels: chartData.xAxis?.data || [],
          series: chartData.series || [],
        }}
        options={chartData}
        height="400px"
        theme={theme === 'dark' ? 'dark' : 'light'}
      />
    );
  };

  return (
    <Page className="pool-overview">
      <div className="cards-container">
        <InfoCard options={poolDetailStats} />
        <Card isLoading={loading} title={`${showAsset(poolName)} Earnings`}>
          {renderChart(earningsHistory, 'Earnings')}
        </Card>
      </div>
      <div className="cards-container">
        <Card isLoading={loading} title={`${showAsset(poolName)} Depth`}>
          {renderChart(depthHistory, 'Depth')}
        </Card>
        <Card isLoading={loading} title={`${showAsset(poolName)} Swaps`}>
          {renderChart(swapHistory, 'Swaps')}
        </Card>
      </div>
      <div className="footer-stat">
        <small>
          <sup>*</sup>
          All of the stat are based on 30 days period
        </small>
      </div>
    </Page>
  );
};

export default PoolOverview;