"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import moment from "moment";
import { orderBy } from "lodash";
import { useTheme } from "@/lib/store";
import EChartsWrapper from "@/components/charts/EChartsWrapper";
import ChartLoader from "@/components/ChartLoader";
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
  
  const [affiliateSwaps, setAffiliateSwaps] = useState([]);
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

  const chartCount = useMemo(() => 
    parseInt(chartPeriod) || 24, 
    [chartPeriod]
  );

  const affiliateListOptions = useMemo(() => 
    affiliateList().map(({ id }) => id), 
    []
  );

  const sortByVolume = useCallback((rowX, rowY) => {
    const getVolumeFromRow = (row) => {
      const inPrice = +row?.metadata?.swap?.inPriceUSD ?? 0;
      const inAmount = +row?.in[0]?.coins[0]?.amount ?? 0;
      return inPrice * inAmount;
    };

    const volumeX = getVolumeFromRow(rowX);
    const volumeY = getVolumeFromRow(rowY);
    return volumeX < volumeY ? -1 : volumeX > volumeY ? 1 : 0;
  }, []);

  const tableColumns = useMemo(() => [
    {
      label: 'Hash',
      field: 'hash',
      renderCell: (item) => {
        const hash = item?.tx?.hash || item?.hash || '';
        return <span className={styles.mono}>{hash.slice(0, 8)}...</span>;
      }
    },
    {
      label: 'Date',
      field: 'date',
      renderCell: (item) => {
        const date = item?.tx?.date 
          ? moment.unix(item.tx.date).format('YYYY-MM-DD HH:mm')
          : moment().format('YYYY-MM-DD HH:mm');
        return <span>{date}</span>;
      }
    },
    {
      label: 'From',
      field: 'from',
      renderCell: (item) => {
        const from = item?.in?.[0]?.address || '';
        return <span className={styles.mono}>{from.slice(0, 8)}...</span>;
      }
    },
    {
      label: 'To',
      field: 'to',
      renderCell: (item) => {
        const to = item?.out?.[0]?.address || '';
        return <span className={styles.mono}>{to.slice(0, 8)}...</span>;
      }
    },
    {
      label: 'Volume',
      field: 'volume',
      sortFn: sortByVolume,
      renderCell: (item) => {
        const inPrice = +item?.metadata?.swap?.inPriceUSD ?? 0;
        const inAmount = +item?.in[0]?.coins[0]?.amount ?? 0;
        const volume = inPrice * inAmount;
        return <span className={styles.mono}>{formatValue(volume)}</span>;
      }
    },
  ], [sortByVolume]);

  const formatValue = useCallback((value) => {
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

  const formatDate = useCallback((interval) => {
    const timestamp = +interval.startTime * 1e3;
    const date = moment.utc(timestamp).local();
    return chartPeriod === '24h'
      ? date.format('MMM Do, HH:mm')
      : date.format('dddd, MMM D');
  }, [chartPeriod]);

  const calculateStatsTotals = useCallback((data) => {
    let totalVolume = 0;
    let totalCount = 0;

    if (data && Array.isArray(data)) {
      data.forEach((item) => {
        totalVolume += item.total_volume / 1e8;
        totalCount += item.count;
      });
    }

    return { totalVolume, totalCount };
  }, []);

  const calculateTotalEarnings = useCallback((data) => {
    let totalEarnings = 0;

    if (data?.intervals) {
      data.intervals.forEach((interval) => {
        interval.thornames?.forEach((thorname) => {
          totalEarnings += +thorname.volumeUSD / 1e2;
        });
      });
    }

    return totalEarnings;
  }, []);

  const mapInterfaceName = useCallback((s) => {
    if (!s) return undefined;
    
    let ifc = interfaces[s.toLowerCase()];
    
    if (!ifc) {
      ifc = affiliateMap[s.toLowerCase()];
      if (!ifc) {
        return undefined;
      }
    }

    const icons = {
      url: undefined,
      urlDark: undefined,
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

  const formatAffiliateHistory = useCallback((data) => {
    if (!data?.intervals || data.intervals.length === 0) {
      console.log('No history data available');
      return { labels: [], series: [] };
    }

    const labels = [];
    const seriesMap = new Map();

    data.intervals.forEach((interval, intervalIndex) => {
      if (intervalIndex === data.intervals.length - 1) return;

      const date = formatDate(interval);
      labels.push(date);

      const groupedThornames = interval.thornames?.reduce((acc, thorname) => {
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
        
        const seriesData = seriesMap.get(name);
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

    const othersData = [];
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

  const formatAffiliateStats = useCallback((data) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('No stats data available');
      return { labels: [], series: [] };
    }

    const labels = [];
    const seriesMap = new Map();

    data.forEach((interval, intervalIndex) => {
      if (intervalIndex === data.length - 1) return;

      const date = formatDate(interval);
      labels.push(date);

      const groupedAffiliates = interval.affiliates?.reduce((acc, affiliate) => {
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
        
        const seriesData = seriesMap.get(name);
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

    const othersData = [];
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

      const [historyData, statsData, swapsData] = await Promise.all([
        getAffiliateHistory(historyParams).catch(err => {
          console.error('Error fetching affiliate history:', err);
          return null;
        }),
        getAffiliateStats(statsParams).catch(err => {
          console.error('Error fetching affiliate stats:', err);
          return null;
        }),
        getSwapsByThorname({
          thorname: affiliate,
          period: chartPeriod
        }).catch(err => {
          console.error('Error fetching swaps:', err);
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
      setAffiliateSwaps(swapsData?.actions || []);

      setAffiliateChartKey(prev => prev + 1);
      setAffiliateStatsChartKey(prev => prev + 1);

      const { totalVolume, totalCount } = calculateStatsTotals(statsData);
      const totalEarnings = calculateTotalEarnings(historyData);
      const volumePerSwap = totalCount > 0 ? totalVolume / totalCount : 0;

      const formatNumber = (num) => {
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
    if (affiliate !== undefined) {
      console.log('Affiliate changed, fetching data:', affiliate);
      fetchAllData();
    }
  }, [affiliate, chartCount, chartInterval, chartPeriod]);

  const onPeriodChange = useCallback((newPeriod) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', newPeriod);
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const onAffiliateChange = useCallback((affiliateValue) => {
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
      return;
    }

    const csvData = affiliateSwaps.map((swap) => {
      const inPrice = +swap?.metadata?.swap?.inPriceUSD ?? 0;
      const inAmount = +swap?.in[0]?.coins[0]?.amount ?? 0;
      const volume = inPrice * inAmount;

      const nonAffiliateOuts = swap.out?.filter((out) => !out.affiliate) || [];
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
      ...csvData.map((row) =>
        Object.values(row)
          .map((value) => `"${value}"`)
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
      return;
    }

    const series = affiliateChartData.series || [];
    const xAxis = affiliateChartData.labels || [];

    if (!xAxis || !Array.isArray(xAxis)) {
      console.error('Invalid chart data structure.');
      return;
    }

    const csvData = [];
    xAxis.forEach((date, index) => {
      const row = { Date: date };
      series.forEach((s) => {
        const value = s.data?.[index] || 0;
        if (s.name && s.name !== 'undefined') {
          row[s.name] = value;
        }
      });
      csvData.push(row);
    });

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map((row) =>
        Object.values(row)
          .map((value) => `"${value}"`)
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
      return;
    }

    const series = affiliateStatsChartData.series || [];
    const xAxis = affiliateStatsChartData.labels || [];

    if (!xAxis || !Array.isArray(xAxis)) {
      console.error('Invalid chart data structure.');
      return;
    }

    const csvData = [];
    xAxis.forEach((date, index) => {
      const row = { Date: date };
      series.forEach((s) => {
        const value = s.data?.[index] || 0;
        if (s.name && s.name !== 'undefined') {
          row[s.name] = value;
        }
      });
      csvData.push(row);
    });

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map((row) =>
        Object.values(row)
          .map((value) => `"${value}"`)
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

  const handleClickOutside = useCallback((event) => {
    const dropdown = document.querySelector('.dropdown-container');
    if (dropdown && !dropdown.contains(event.target)) {
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
          onUpdateActiveMode={onPeriodChange}
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
          <Card title="Fees Stats">
            <div className={styles.cardHeader}>
              <h3>Fees Stats</h3>
              <div className={styles.csvDownload} title="Download CSV" onClick={downloadAffiliateFeesChart}>
                <FileDownloadIcon className="clickable" style={{ cursor: 'pointer' }} />
              </div>
            </div>
            
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
          <Card title="Swaps Stats">
            <div className={styles.cardHeader}>
              <h3>Swaps Stats</h3>
              <div className={styles.csvDownload} title="Download CSV" onClick={downloadAffiliateSwapsChart}>
                <FileDownloadIcon className="clickable" style={{ cursor: 'pointer' }} />
              </div>
            </div>
            
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
        
        <Transactions
          txs={{ actions: affiliateSwaps }}
          loading={isTableLoading}
          props={tableColumns}
        />
      </div>
    </div>
  );
};

export default AffiliatesChart;