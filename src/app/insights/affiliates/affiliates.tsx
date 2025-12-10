"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import moment from "moment";
import { orderBy } from "lodash";
import { useTheme } from "@/lib/store";
import EChartsWrapper from "@/components/charts/EChartsWrapper";
import ChartLoader from "@/components/ChartLoader";
import TableLoader from "@/components/TableLoader";
import CardsHeader from "@/components/CardsHeader";
import AffiliateDropdown from "@/app/insights/affiliates/components/AffiliateDropdown";
import Transactions from "@/components/Transactions";
import FileDownloadIcon from "@/assets/images/file-download.svg";
import Nav from "@/components/Nav";
import Card from "@/components/ui/Card";
import Header from "@/components/Header";
import { getAffiliateHistory, getSwapsByThorname, getAffiliateStats } from "@/lib/api";
import { affiliateList, affiliateMap, interfaces } from "@/utils";
import styles from "./Affiliate.module.css";

interface CustomTableColumn {
  label: string;
  field: string;
  renderCell: (item: any) => React.ReactElement;
  sortFn?: (array: any[]) => any[];
}

const AffiliatesChart = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  
  const [affiliateChartData, setAffiliateChartData] = useState({ labels: [], series: [] });
  const [affiliateStatsChartData, setAffiliateStatsChartData] = useState({ labels: [], series: [] });
  const [affiliateChartKey, setAffiliateChartKey] = useState(0);
  const [affiliateStatsChartKey, setAffiliateStatsChartKey] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);
  
  const [selectedFilter, setSelectedFilter] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [affiliate, setAffiliate] = useState('');
  const [affiliateParam, setAffiliateParam] = useState('');
  
  const [affiliateSwaps, setAffiliateSwaps] = useState<any[]>([]);
  const [affiliateGeneralStats, setAffiliateGeneralStats] = useState([
    { name: 'Volume', value: '-' },
    { name: 'Swaps', value: '-' },
    { name: 'Earnings', value: '-' },
    { name: 'Volume per Swap', value: '-' },
  ]);

  const chartPeriods = useMemo(() => [
    { text: '1 Day', mode: '24h' },
    { text: '14 Days', mode: '14d' },
    { text: '30 Days', mode: '30d' },
  ], []);

  const chartPeriod = useMemo(() => {
    const period = searchParams.get('period');
    return period && chartPeriods.some((p) => p.mode === period) ? period : '24h';
  }, [searchParams, chartPeriods]);

  const chartInterval = useMemo(() => 
    chartPeriod === '24h' ? 'hour' : 'day', 
    [chartPeriod]
  );

  const chartCount = useMemo(() => {
    if (chartPeriod === '24h') return 24;
    if (chartPeriod === '14d') return 14;
    if (chartPeriod === '30d') return 30;
    return 24;
  }, [chartPeriod]);

  const affiliateListOptions = useMemo(() => 
    affiliateList().map(({ id }) => id), 
    []
  );

  const sortByVolumeFn = useCallback((array: any[]) => {
    return array.sort((rowX, rowY) => {
      const getVolumeFromRow = (row: any) => {
        if (!row || !row.in || !Array.isArray(row.in) || row.in.length === 0) {
          return 0;
        }
        
        const inPrice = +row?.metadata?.swap?.inPriceUSD || 0;
        const inAmount = +row?.in[0]?.coins?.[0]?.amount || 0;
        
        if (isNaN(inPrice) || isNaN(inAmount)) {
          return 0;
        }
        
        return inPrice * inAmount;
      };

      const volumeX = getVolumeFromRow(rowX);
      const volumeY = getVolumeFromRow(rowY);
      return volumeY - volumeX; 
    });
  }, []);

  const tableColumns: CustomTableColumn[] = useMemo(() => [
    {
      label: 'Volume',
      field: 'volume',
      sortFn: sortByVolumeFn, 
      renderCell: (item: any) => {
        const inPrice = +item?.metadata?.swap?.inPriceUSD || 0;
        const inAmount = +item?.in[0]?.coins?.[0]?.amount || 0;
        const volume = inPrice * inAmount;
        return <span className={styles.mono}>{formatValue(volume)}</span>;
      }
    },
  ], [sortByVolumeFn]);

  const getTableLoaderColumns = useCallback(() => {
    return tableColumns.map((col) => ({
      label: col.label,
      field: col.field,
      type: "text",
    }));
  }, [tableColumns]);

  const formatValue = useCallback((value: number) => {
    const numValue = Math.abs(value) / 1e8;
    
    if (numValue >= 1e9) {
      return `$${(numValue / 1e9).toFixed(2)}B`;
    } else if (numValue >= 1e6) {
      return `$${(numValue / 1e6).toFixed(2)}M`;
    } else if (numValue >= 1e3) {
      return `$${(numValue / 1e3).toFixed(2)}K`;
    } else if (numValue >= 1) {
      return `$${numValue.toFixed(2)}`;
    }
    return `$${numValue.toFixed(4)}`;
  }, []);

  const formatDate = useCallback((interval: any) => {
    const timestamp = +interval.startTime * 1e3;
    const date = moment.utc(timestamp).local();
    return chartPeriod === '24h'
      ? date.format('MMM Do, HH:mm')
      : date.format('dddd, MMM D');
  }, [chartPeriod]);

  const calculateStatsTotals = useCallback((data: any) => {
    let totalVolume = 0;
    let totalCount = 0;

    if (data && Array.isArray(data)) {
      data.forEach((item: any) => {
        totalVolume += item.total_volume / 1e8;
        totalCount += item.count;
      });
    }

    return { totalVolume, totalCount };
  }, []);

  const calculateTotalEarnings = useCallback((data: any) => {
    let totalEarnings = 0;

    if (data?.intervals) {
      data.intervals.forEach((interval: any) => {
        interval.thornames?.forEach((thorname: any) => {
          totalEarnings += +thorname.volumeUSD / 1e2;
        });
      });
    }

    return totalEarnings;
  }, []);

  const mapInterfaceName = useCallback((s: string) => {
    if (!s) return undefined;
    
    let ifc = interfaces[s.toLowerCase()];
    
    if (!ifc) {
      ifc = affiliateMap[s.toLowerCase()];
      if (!ifc) {
        return undefined;
      }
    }

    const icons = {
      url: undefined as string | undefined,
      urlDark: undefined as string | undefined,
    };

    if (ifc.icon) {
      try {
        icons.url = require(`@/assets/images/${ifc.icon}.png`);
        icons.urlDark = require(`@/assets/images/${ifc.icon}-dark.png`);
      } catch (error) {
        console.warn(`Icon not found: ${ifc.icon}`);
      }
    }

    return {
      name: ifc.name ?? ifc,
      icons,
      addName: ifc.addName ?? false,
    };
  }, []);

  const formatAffiliateHistory = useCallback((data: any) => {
    if (!data?.intervals || data.intervals.length === 0) {
      console.log('No history data available');
      return { labels: [], series: [] };
    }

    const labels: string[] = [];
    const seriesMap = new Map<string, number[]>();

    data.intervals.forEach((interval: any, intervalIndex: number) => {
      if (intervalIndex === data.intervals.length - 1) return;

      const date = formatDate(interval);
      labels.push(date);

      const groupedThornames = interval.thornames?.reduce((acc: Record<string, number>, thorname: any) => {
        if (!thorname.thorname) return acc;

        let key;
        const thornameLower = thorname.thorname.toLowerCase();
        
        if (['t', 'tl'].includes(thornameLower)) {
          key = 't';
        } else if (['ti', 'te', 'tr', 'td', 'tb', 't1'].includes(thornameLower)) {
          key = 'ti';
        } else if (['va', 'vi', 'v0'].includes(thornameLower)) {
          key = 'va';
        } else {
          key = thorname.thorname;
        }

        if (!acc[key]) {
          acc[key] = 0;
        }
        
        acc[key] += (+thorname.volumeUSD || 0) / 1e2;
        
        return acc;
      }, {});

      if (!groupedThornames) return;

      Object.entries(groupedThornames).forEach(([name, value]) => {
        if (!seriesMap.has(name)) {
          seriesMap.set(name, new Array(labels.length - 1).fill(0));
        }
        
        const seriesData = seriesMap.get(name)!;
        while (seriesData.length < labels.length - 1) {
          seriesData.push(0);
        }
        seriesData.push(value);
      });
    });

    const seriesArray = Array.from(seriesMap.entries()).map(([name, data]) => ({
      name,
      data,
      total: data.reduce((sum, val) => sum + val, 0)
    }));

    const sortedSeries = orderBy(seriesArray, ['total'], ['desc']);

    const topSeries = sortedSeries.slice(0, 5);
    const otherSeries = sortedSeries.slice(5);

    const othersData: number[] = [];
    if (labels.length > 0 && otherSeries.length > 0) {
      for (let i = 0; i < labels.length; i++) {
        let otherTotal = 0;
        otherSeries.forEach(series => {
          otherTotal += series.data[i] || 0;
        });
        othersData.push(otherTotal);
      }
    }

    const finalSeries = topSeries.map(series => ({
      name: series.name,
      type: 'bar',
      stack: 'Total',
      data: series.data
    }));

    if (othersData.length > 0 && othersData.some(val => val > 0)) {
      finalSeries.push({
        name: 'Others',
        type: 'bar',
        stack: 'Total',
        data: othersData
      });
    }

    return {
      labels,
      series: finalSeries
    };
  }, [formatDate]);

  const formatAffiliateStats = useCallback((data: any) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('No stats data available');
      return { labels: [], series: [] };
    }

    const labels: string[] = [];
    const seriesMap = new Map<string, number[]>();

    data.forEach((interval: any, intervalIndex: number) => {
      if (intervalIndex === data.length - 1) return;

      const date = formatDate(interval);
      labels.push(date);

      const groupedAffiliates = interval.affiliates?.reduce((acc: Record<string, number>, affiliate: any) => {
        if (!affiliate.affiliate) return acc;

        let key;
        const affiliateStr = affiliate.affiliate.toString();
        
        if (affiliateStr.includes('/')) {
          const parts = affiliateStr.split('/');
          const filteredParts = parts.filter(part => 
            !['-_', 'ro'].includes(part.toLowerCase())
          );
          key = filteredParts[0] || 'No Affiliate';
        } else {
          const affiliateLower = affiliateStr.toLowerCase();
          
          if (['t', 'tl'].includes(affiliateLower)) {
            key = 't';
          } else if (['ti', 'te', 'tr', 'td', 'tb', 't1'].includes(affiliateLower)) {
            key = 'ti';
          } else if (['va', 'vi', 'v0'].includes(affiliateLower)) {
            key = 'va';
          } else if (['-_', 'ro'].includes(affiliateLower)) {
            key = 'No Affiliate';
          } else {
            key = affiliateStr;
          }
        }

        if (key === '') {
          key = 'No Affiliate';
        }

        if (!acc[key]) {
          acc[key] = 0;
        }
        
        acc[key] += (+affiliate.volume || 0) / 1e8;
        
        return acc;
      }, {});

      if (!groupedAffiliates) return;

      Object.entries(groupedAffiliates).forEach(([name, value]) => {
        if (!seriesMap.has(name)) {
          seriesMap.set(name, new Array(labels.length - 1).fill(0));
        }
        
        const seriesData = seriesMap.get(name)!;
        while (seriesData.length < labels.length - 1) {
          seriesData.push(0);
        }
        seriesData.push(value);
      });
    });

    const seriesArray = Array.from(seriesMap.entries()).map(([name, data]) => ({
      name,
      data,
      total: data.reduce((sum, val) => sum + val, 0)
    }));

    const sortedSeries = orderBy(seriesArray, ['total'], ['desc']);

    const topSeries = sortedSeries.slice(0, 5);
    const otherSeries = sortedSeries.slice(5);

    const othersData: number[] = [];
    if (labels.length > 0 && otherSeries.length > 0) {
      for (let i = 0; i < labels.length; i++) {
        let otherTotal = 0;
        otherSeries.forEach(series => {
          otherTotal += series.data[i] || 0;
        });
        othersData.push(otherTotal);
      }
    }

    const finalSeries = topSeries.map(series => ({
      name: series.name,
      type: 'bar',
      stack: 'Total',
      data: series.data
    }));

    if (othersData.length > 0 && othersData.some(val => val > 0)) {
      finalSeries.push({
        name: 'Others',
        type: 'bar',
        stack: 'Total',
        data: othersData
      });
    }

    return {
      labels,
      series: finalSeries
    };
  }, [formatDate]);

  const createTooltipFormatter = useCallback((label = 'Fees') => {
    return function (params: any) {
      if (!params || !Array.isArray(params)) return '';

      const sortedParams = params
        .filter((a: any) => a.value && a.value > 0)
        .sort((a: any, b: any) => {
          if (a.seriesName === 'Others') return 1;
          if (b.seriesName === 'Others') return -1;
          return b.value - a.value;
        });

      const totalFees = params.reduce((sum: number, c: any) => sum + (c.value || 0), 0);

      let tooltipContent = `
        <div class="${styles.tooltipHeader}">
          <span>${params[0]?.axisValue || ''}</span>
        </div>
        <div class="${styles.tooltipBody}">
      `;

      sortedParams.forEach((p: any) => {
        const interfaceDetail = mapInterfaceName(p.seriesName);
        
        let formattedValue = '';
        const value = p.value || 0;
        
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
          <span class="${styles.tooltipItem} ${styles.space}">
            <span class="${styles.seriesNameColor}">
              <span class="${styles.dataColor}" style="background-color: ${p.color};"></span>
              ${
                interfaceDetail?.icons?.url
                  ? `<img style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px;" src="${theme === 'light' ? interfaceDetail.icons.url : interfaceDetail.icons.urlDark}" alt="${p.seriesName}"/>`
                  : `<span>${p.seriesName}</span>`
              }
            </span>
            <span>${formattedValue}</span>
          </span>
        `;
      });

      let totalFormatted = '';
      if (totalFees >= 1e9) {
        totalFormatted = `$${(totalFees / 1e9).toFixed(1)}B`;
      } else if (totalFees >= 1e6) {
        totalFormatted = `$${(totalFees / 1e6).toFixed(1)}M`;
      } else if (totalFees >= 1e3) {
        totalFormatted = `$${(totalFees / 1e3).toFixed(1)}K`;
      } else {
        totalFormatted = `$${totalFees.toFixed(0)}`;
      }

      tooltipContent += `
        </div>
        <div class="${styles.tooltipTotal}">
          <span>Total ${label}</span>
          <b>${totalFormatted}</b>
        </div>
      `;

      return tooltipContent;
    };
  }, [mapInterfaceName, theme, styles]);

  const fetchAllData = useCallback(async () => {
    try {
      console.log('Fetching data with params:', {
        affiliate,
        chartCount,
        chartInterval,
        chartPeriod
      });
  
      setLoading(true);
      setIsTableLoading(true);
  
      const historyParams = {
        count: chartCount,
        interval: chartInterval
      };
  
      const statsParams = {
        count: chartCount,
        interval: chartInterval
      };
  
      if (affiliate) {
        historyParams.thorname = affiliate;
        statsParams.thorname = affiliate;
      }
  
      console.log('API Params:', { historyParams, statsParams, affiliate });
  
      const swapsPromise = getSwapsByThorname(affiliate, chartPeriod);
      
      console.log('Calling getSwapsByThorname with:', {
        thorname: affiliate,
        period: chartPeriod
      });
  
      const [historyData, statsData, swapsData] = await Promise.all([
        getAffiliateHistory(historyParams).catch(err => {
          console.error('Error fetching affiliate history:', err);
          return null;
        }),
        getAffiliateStats(statsParams).catch(err => {
          console.error('Error fetching affiliate stats:', err);
          return null;
        }),
        swapsPromise.catch(err => {
          console.error('Error fetching swaps:', err);
          console.error('Full error details:', err.response?.data || err.message);
          return { actions: [] };
        }),
      ]);

      const historyChartData = formatAffiliateHistory(historyData);
      const statsChartData = formatAffiliateStats(statsData);
      
      console.log('Processed Charts:', {
        historyChartData,
        statsChartData
      });

      setAffiliateChartData(historyChartData);
      setAffiliateStatsChartData(statsChartData);
      
      const swapsActions = swapsData?.actions || [];
      
      const validSwaps = swapsActions.filter(action => {
        return action && typeof action === 'object';
      });
      
      if (swapsActions.length > 0 && validSwaps.length === 0) {
        console.warn('All swaps data is invalid. Sample:', swapsActions[0]);
      }
      
      console.log('Setting affiliateSwaps:', {
        originalCount: swapsActions.length,
        validCount: validSwaps.length,
        validSwaps: validSwaps
      });
      
      setAffiliateSwaps(validSwaps);

      setAffiliateChartKey(prev => prev + 1);
      setAffiliateStatsChartKey(prev => prev + 1);

      const { totalVolume, totalCount } = calculateStatsTotals(statsData);
      const totalEarnings = calculateTotalEarnings(historyData);
      const volumePerSwap = totalCount > 0 ? totalVolume / totalCount : 0;

      const formatNumber = (num: number) => {
        if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
        if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
        if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
        return num.toFixed(0);
      };

      setAffiliateGeneralStats([
        {
          name: 'Volume',
          value: '$' + formatNumber(totalVolume),
        },
        {
          name: 'Swaps',
          value: formatNumber(totalCount),
        },
        {
          name: 'Earnings',
          value: '$' + formatNumber(totalEarnings),
        },
        {
          name: 'Volume per Swap',
          value: '$' + formatNumber(volumePerSwap),
        },
      ]);

    } catch (error) {
      console.error('Error in fetchAllData:', error);
    } finally {
      setLoading(false);
      setIsTableLoading(false);
    }
  }, [
    affiliate, 
    chartCount, 
    chartInterval, 
    chartPeriod, 
    formatAffiliateHistory, 
    formatAffiliateStats, 
    calculateStatsTotals, 
    calculateTotalEarnings
  ]);

  useEffect(() => {
    const affiliateParamValue = searchParams.get('affiliate');
    const periodParam = searchParams.get('period');

    if (affiliateParamValue !== affiliateParam) {
      const affiliateObj = affiliateList().find((aff) => aff.id === affiliateParamValue);
      const currentAffiliate = affiliateObj?.thornames?.join(',') || affiliateParamValue || '';
      
      setAffiliate(currentAffiliate);
      setAffiliateParam(affiliateParamValue || '');
      setSelectedFilter(affiliateParamValue || '');
    }
  }, [searchParams]);

  useEffect(() => {
    console.log('Current affiliate state:', {
      affiliate,
      affiliateParam,
      selectedFilter,
      affiliateSwapsLength: affiliateSwaps.length
    });
    
    if (affiliate !== undefined) {
      console.log('Fetching data for affiliate:', affiliate);
      fetchAllData();
    }
  }, [affiliate, chartCount, chartInterval, chartPeriod]);



  const onPeriodChange = useCallback((newPeriod: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', newPeriod);
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const onAffiliateChange = useCallback((affiliateValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (affiliateValue) {
      params.set('affiliate', affiliateValue);
    } else {
      params.delete('affiliate');
    }
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev);
  }, []);

  const downloadAffiliateSwaps = useCallback(() => {
    if (!affiliateSwaps || affiliateSwaps.length === 0) {
      console.error('No swaps data available for CSV download.');
      alert('No swap data available to download.');
      return;
    }

    console.log('Downloading CSV with', affiliateSwaps.length, 'swaps');

    const csvData = affiliateSwaps.map((swap: any) => {
      const inPrice = +swap?.metadata?.swap?.inPriceUSD || 0;
      const inAmount = +swap?.in[0]?.coins[0]?.amount || 0;
      const volume = inPrice * inAmount;

      const nonAffiliateOuts = swap.out?.filter((out: any) => !out.affiliate) || [];
      const firstNonAffiliateOut = nonAffiliateOuts[0];

      return {
        hash: swap.tx?.hash || swap.hash || swap.txHash || swap.in?.[0]?.txID || swap.tx?.id || '',
        date: swap.tx?.date
          ? moment.unix(swap.tx.date).format('YYYY-MM-DD HH:mm:ss')
          : swap.date
            ? moment(swap.date / 1e6).format('YYYY-MM-DD HH:mm:ss')
            : moment().format('YYYY-MM-DD HH:mm:ss'),
        volume: volume / 1e8,
        volumeUSD: formatValue(volume),
        from: swap.in?.[0]?.address || '',
        to: firstNonAffiliateOut?.address || '',
        inAsset: swap.in[0]?.coins[0]?.asset || '',
        inAmount: (swap.in[0]?.coins[0]?.amount || 0) / 1e8,
        outAsset: firstNonAffiliateOut?.coins[0]?.asset || '',
        outAmount: (firstNonAffiliateOut?.coins[0]?.amount || 0) / 1e8,
      };
    });

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map((row: any) =>
        Object.values(row)
          .map((value: any) => `"${value}"`)
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const affiliateName = affiliate || 'all';
    const period = chartPeriod;
    const timestamp = moment().format('YYYY-MM-DD');

    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `affiliate-swaps-${affiliateName}-${period}-${timestamp}.csv`
    );
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [affiliateSwaps, affiliate, chartPeriod, formatValue]);

  const downloadAffiliateFeesChart = useCallback(() => {
    if (!affiliateChartData.series || affiliateChartData.series.length === 0) {
      console.error('No chart data available for CSV download.');
      alert('No chart data available to download.');
      return;
    }

    const series = affiliateChartData.series || [];
    const xAxis = affiliateChartData.labels || [];

    if (!xAxis || !Array.isArray(xAxis)) {
      console.error('Invalid chart data structure.');
      return;
    }

    const csvData: any[] = [];
    xAxis.forEach((date: string, index: number) => {
      const row: any = { Date: date };
      series.forEach((s: any) => {
        const value = s.data?.[index] || 0;
        if (s.name && s.name !== 'undefined') {
          row[s.name] = value;
        }
      });
      csvData.push(row);
    });

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map((row: any) =>
        Object.values(row)
          .map((value: any) => `"${value}"`)
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const affiliateName = affiliate || 'all';
    const period = chartPeriod;
    const timestamp = moment().format('YYYY-MM-DD');

    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `affiliate-fees-${affiliateName}-${period}-${timestamp}.csv`
    );
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [affiliateChartData, affiliate, chartPeriod]);

  const downloadAffiliateSwapsChart = useCallback(() => {
    if (!affiliateStatsChartData.series || affiliateStatsChartData.series.length === 0) {
      console.error('No chart data available for CSV download.');
      alert('No chart data available to download.');
      return;
    }

    const series = affiliateStatsChartData.series || [];
    const xAxis = affiliateStatsChartData.labels || [];

    if (!xAxis || !Array.isArray(xAxis)) {
      console.error('Invalid chart data structure.');
      return;
    }

    const csvData: any[] = [];
    xAxis.forEach((date: string, index: number) => {
      const row: any = { Date: date };
      series.forEach((s: any) => {
        const value = s.data?.[index] || 0;
        if (s.name && s.name !== 'undefined') {
          row[s.name] = value;
        }
      });
      csvData.push(row);
    });

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map((row: any) =>
        Object.values(row)
          .map((value: any) => `"${value}"`)
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const affiliateName = affiliate || 'all';
    const period = chartPeriod;
    const timestamp = moment().format('YYYY-MM-DD');

    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `affiliate-swaps-${affiliateName}-${period}-${timestamp}.csv`
    );
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [affiliateStatsChartData, affiliate, chartPeriod]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    const dropdown = document.querySelector('.dropdown-container');
    if (dropdown && !dropdown.contains(event.target as Node)) {
      setIsDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <div className={styles.headerAffiliate}>
      <div className={styles.headerControls}>
        <Nav
          activeMode={chartPeriod}
          navItems={chartPeriods}
          preText="Period :"
          onActiveModeChange={onPeriodChange}
        />

        <AffiliateDropdown
          selected={selectedFilter}
          affiliateList={affiliateListOptions}
          isOpen={isDropdownOpen}
          onToggle={toggleDropdown}
          onSelect={onAffiliateChange}
        />
      </div>

      <CardsHeader tableGeneralStats={affiliateGeneralStats} />
      
      <div className={styles.chartsContainer}>
        <div className={styles.chartItem}>
          <Card 
            title="Fees Stats"
            header={
              <div 
                className={styles.csvDownload} 
                title="Download CSV" 
                onClick={downloadAffiliateFeesChart}
                style={{ marginLeft: 'auto' }}
              >
                <FileDownloadIcon className="clickable" style={{ cursor: 'pointer' }} />
              </div>
            }
          >
            <div className={styles.cardContent}>
              {loading ? (
                <ChartLoader barCount={15} />
              ) : affiliateChartData.series && affiliateChartData.series.length > 0 ? (
                <EChartsWrapper
                  key={`affiliate-chart-${affiliateChartKey}`}
                  type="bar"
                  data={affiliateChartData}
                  options={{
                    tooltip: {
                      formatter: createTooltipFormatter('Fees')
                    },
                    legend: {
                      show: false
                    }
                  }}
                  height="400px"
                />
              ) : (
                <div style={{
                  height: '400px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  fontSize: '16px',
                  fontWeight: '500'
                }}>
                  No fee data available
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className={styles.chartItem}>
          <Card 
            title="Swaps Stats"
            header={
              <div 
                className={styles.csvDownload} 
                title="Download CSV" 
                onClick={downloadAffiliateSwapsChart}
                style={{ marginLeft: 'auto' }}
              >
                <FileDownloadIcon className="clickable" style={{ cursor: 'pointer' }} />
              </div>
            }
          >
            <div className={styles.cardContent}>
              {loading ? (
                <ChartLoader barCount={15} />
              ) : affiliateStatsChartData.series && affiliateStatsChartData.series.length > 0 ? (
                <EChartsWrapper
                  key={`stats-chart-${affiliateStatsChartKey}`}
                  type="bar"
                  data={affiliateStatsChartData}
                  options={{
                    tooltip: {
                      formatter: createTooltipFormatter('Volume')
                    },
                    legend: {
                      show: false
                    }
                  }}
                  height="400px"
                />
              ) : (
                <div style={{
                  height: '400px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  fontSize: '16px',
                  fontWeight: '500'
                }}>
                  No swap data available
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className={styles.affiliateTableSection}>
        <div className={styles.tableHeader}>
          <Header title="Top Swaps" />
          <div className={styles.csvDownload} title="Download CSV" onClick={downloadAffiliateSwaps}>
            <FileDownloadIcon className="clickable" style={{ cursor: 'pointer' }} />
          </div>
        </div>
        
        {isTableLoading ? (
          <Card>
            <TableLoader cols={getTableLoaderColumns()} />
          </Card>
        ) : affiliateSwaps.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#666',
            backgroundColor: '#fafafa',
            borderRadius: '8px',
            marginTop: '20px'
          }}>
            <h3>No swap transactions found</h3>
            <p>Try selecting a different affiliate or time period.</p>
          </div>
        ) : (
          <Transactions
            txs={{ actions: affiliateSwaps }}
            loading={false}
            props={tableColumns as any[]} 
          />
        )}
      </div>
    </div>
  );
};

export default AffiliatesChart;