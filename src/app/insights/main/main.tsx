"use client";

import React, { useState, useEffect } from 'react';
import moment from 'moment';
import Card from '@/components/ui/Card';
import TradingViewChart from '@/components/TradingViewChart';
import ChartLoader from '@/components/ChartLoader';
import { Skeleton } from "@/components/ui/Skeleton";
import RuneAsset from '@/components/RuneAsset';
import SwapChartNormalized from '@/app/insights/main/components/SwapChartNormalized';
import TypeSwapChart from '@/app/insights/main/components/TypeSwapChart';
import { formatTrendCurrency, formatNumber, formatPercent } from '@/utils/format';
import { ProgressIcon } from '@/components/ui/ProgressIcon';
import FlipSideIcon from '@/assets/images/flipside.svg';
import { useTheme } from '@/lib/store';
import './main.scss';
import { 
  getCoinMarketInfo, 
  getSwapsHistory, 
  getAffiliateSwapsMonthly, 
  getDashboardPlots 
} from "@/lib/api";
import FeesRewardsNormalizedChart from '@/app/insights/main/components/FeesRewardsNormalizedChart';
import RewardsByPoolChart from '@/app/insights/main/components/RewardsByPoolChart';
import SupplyBurnChart from '@/app/insights/main/components/SupplyBurnChart';

interface MarketInfo {
  price: number | undefined;
  rank: number | undefined;
  marketCap: number | undefined;
  tradeVolume: number | undefined;
  totalSupply: number | undefined;
  change_24h: number | undefined;
  percent_change_24h: number | undefined;
}

interface SwapTypeData {
  date: string;
  nativeVolume: number;
  tradeVolume: number;
  synthVolume: number;
  securedVolume: number;
  count?: number;
  total?: number;
}

const Main = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState({
    swaps: false,
    affiliate: false,
    dashboard: false,
    market: false,
  });
  
  const [swapData, setSwapData] = useState<any>(null); 
  const [typeSwapData, setTypeSwapData] = useState<SwapTypeData[]>([]);
  const [marketInfo, setMarketInfo] = useState<MarketInfo>({
    price: undefined,
    rank: undefined,
    marketCap: undefined,
    tradeVolume: undefined,
    totalSupply: undefined,
    change_24h: undefined,
    percent_change_24h: undefined,
  });

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [affiliateData, setAffiliateData] = useState<any>(null);

  const formatSwapsStatsData = (swapsData: any): SwapTypeData[] => {
    if (!swapsData?.intervals) return [];

    const formattedData: SwapTypeData[] = [];

    swapsData.intervals.forEach((interval: any, index: number) => {
      if (index === swapsData.intervals.length - 1) return;

      const date = moment(
        Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
      ).format('dddd, MMM D');
      
      const nativeVolume = ((+interval.toRuneVolumeUSD || 0) + (+interval.toAssetVolumeUSD || 0)) / 100;
      const tradeVolume = ((+interval.fromTradeVolumeUSD || 0) + (+interval.toTradeVolumeUSD || 0)) / 100;
      const synthVolume = ((+interval.synthRedeemVolumeUSD || 0) + (+interval.synthMintVolumeUSD || 0)) / 100;
      const securedVolume = ((+interval.fromSecuredVolumeUSD || 0) + (+interval.toSecuredVolumeUSD || 0)) / 100;

      formattedData.push({
        date,
        nativeVolume,
        tradeVolume,
        synthVolume,
        securedVolume,
        count: interval.totalCount || 0,
        total: nativeVolume + tradeVolume + synthVolume + securedVolume
      });
    });

    return formattedData;
  };

  const fetchSwapsHistory = async () => {
    setLoading(prev => ({ ...prev, swaps: true }));
    try {
      const result = await getSwapsHistory({
        interval: 'day',
        count: 30,
      });
      
      
      const data = result;
      
      if (data && data.intervals) {
        setSwapData(data);
        setTypeSwapData(formatSwapsStatsData(data));
      }
      
    } catch (error) {
      console.error('Error fetching swap history:', error);
    } finally {
      setLoading(prev => ({ ...prev, swaps: false }));
    }
  };

  const fetchAffiliateSwapsMonthly = async () => {
    setLoading(prev => ({ ...prev, affiliate: true }));
    try {
      const result = await getAffiliateSwapsMonthly();
      
      const data = result;
      
      if (data) {
        setAffiliateData(data);
      }
    } catch (error) {
      console.error('Error fetching affiliate swaps:', error);
    } finally {
      setLoading(prev => ({ ...prev, affiliate: false }));
    }
  };
  
  const fetchDashboardPlots = async () => {
    setLoading(prev => ({ ...prev, dashboard: true }));
    try {
      const result = await getDashboardPlots();
      
      const data = result;
      
      if (data) {
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard plots:', error);
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false }));
    }
  };

  const fetchCoinMarketInfo = async () => {
    setLoading(prev => ({ ...prev, market: true }));
    try {
      const response = await getCoinMarketInfo();
      
      if (response) {
        const coinData = response;
        const usdQuote = coinData.quote?.USD;
        
        setMarketInfo({
          price: usdQuote?.price || 0,
          rank: coinData.cmc_rank || 0,
          marketCap: usdQuote?.market_cap || 0,
          tradeVolume: usdQuote?.volume_24h || 0,
          change_24h: usdQuote?.volume_change_24h || 0,
          percent_change_24h: usdQuote?.percent_change_24h || 0,
          totalSupply: coinData.total_supply || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching coin market info:', error);
    }
    setLoading(prev => ({ ...prev, market: false }));
  };
  
  useEffect(() => {
    fetchSwapsHistory();
    fetchAffiliateSwapsMonthly();
    fetchDashboardPlots();
    fetchCoinMarketInfo();
  }, []);

  return (
    <div className="container-page">
      <Card className="coin-info">
        <TradingViewChart symbol="BINANCE:RUNEUSDT" />
        <div className="crypto-stats">
          <div className="crypto-stat">
            <span className="name">Crypto Rank</span>
            {loading.market ? (
              <div className="value" style={{ minWidth: "70px" }}>
                <Skeleton variant="text" width="100%" height="10px" />
              </div>
            ) : (
              <div className="value">
                {marketInfo.rank !== undefined && marketInfo.rank !== 0 ? marketInfo.rank : '--'}
              </div>
            )}
          </div>
          <div className="crypto-stat">
            <span className="name">Market Cap</span>
            {loading.market ? (
              <div className="value" style={{ minWidth: "70px" }}>
                <Skeleton variant="text" width="100%" height="10px" />
              </div>
            ) : (
              <div className="value">
                {marketInfo.marketCap !== undefined && marketInfo.marketCap !== 0 ? 
                  formatTrendCurrency(marketInfo.marketCap) : '--'}
              </div>
            )}
          </div>
          <div className="crypto-stat">
            <span className="name">Trade Volume</span>
            {loading.market ? (
              <div className="value" style={{ minWidth: "70px" }}>
                <Skeleton variant="text" width="100%" height="10px" />
              </div>
            ) : (
              <div className="value">
                {marketInfo.tradeVolume !== undefined && marketInfo.tradeVolume !== 0 ? (
                  <>
                    {formatTrendCurrency(marketInfo.tradeVolume)}
                    <ProgressIcon
                      dataNumber={marketInfo.change_24h}
                      isDown={marketInfo.change_24h < 0}
                      filter={(v) => formatPercent(v, 1)}
                    />
                  </>
                ) : '--'}
              </div>
            )}
          </div>
          <div className="crypto-stat">
            <span className="name">Total Supply</span>
            {loading.market ? (
              <div className="value" style={{ minWidth: "70px" }}>
                <Skeleton variant="text" width="100%" height="10px" />
              </div>
            ) : (
              <div className="value">
                {marketInfo.totalSupply !== undefined && marketInfo.totalSupply !== 0 ? (
                  <>
                    {formatNumber(marketInfo.totalSupply, '0,0')}
                    <RuneAsset height="0.7rem" />
                  </>
                ) : '--'}
              </div>
            )}
          </div>
        </div>
      </Card>
      
      <div className="chart-inner-container">
        <Card title="Type Swap Chart">
          <TypeSwapChart 
            data={typeSwapData}
            loading={loading.swaps}
          />
        </Card>
        
        <Card title="Swap Chart Normalized">
          <SwapChartNormalized 
            data={swapData}
            loading={loading.swaps}
          />
        </Card>
      </div>
      
      <div className="chart-inner-container">
        <Card title="Fees/Block Reward Chart">
          <div className="card-header-icon">
            <FlipSideIcon style={{ fill: 'var(--sec-font-color)' }} />
          </div>
          <FeesRewardsNormalizedChart 
            data={dashboardData?.earning}
            loading={loading.dashboard}
            isNormalized={false}
          />
        </Card>
        
        <Card title="Fees/Block Reward Chart Normalized">
          <div className="card-header-icon">
            <FlipSideIcon style={{ fill: 'var(--sec-font-color)' }} />
          </div>
          <FeesRewardsNormalizedChart 
            data={dashboardData?.earning}
            loading={loading.dashboard}
            isNormalized={true}
          />
        </Card>
      </div>
      
      <div className="chart-inner-container">
        <Card title="Reserve income from Pools">
          <RewardsByPoolChart 
            data={dashboardData?.earning}
            loading={loading.dashboard}
          />
        </Card>
        
        <Card title="Supply / Burn">
          <SupplyBurnChart 
            data={dashboardData?.earning}
            loading={loading.dashboard}
          />
        </Card>
      </div>
    </div>
  );
};

export default Main;