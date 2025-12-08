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

const AffiliatesChart = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();

  const [affiliateChart, setAffiliateChart] = useState(null);
  const [affiliateStatsChart, setAffiliateStatsChart] = useState(null);
  const [affiliateChartKey, setAffiliateChartKey] = useState(0);
  const [affiliateStatsChartKey, setAffiliateStatsChartKey] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);
  
  const [selectedFilter, setSelectedFilter] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [affiliate, setAffiliate] = useState('');
  
  const [affiliateSwaps, setAffiliateSwaps] = useState(null);
  const [affiliateGeneralStats, setAffiliateGeneralStats] = useState([
    { name: 'Volume', value: '-' },
    { name: 'Swaps', value: '-' },
    { name: 'Earnings', value: '-' },
    { name: 'Volume per Swap', value: '-' },
  ]);

  const sortByVolume = useCallback((x, y, col, rowX, rowY) => {
    const getVolumeFromRow = (row) => {
      const inPrice = +row?.metadata?.swap?.inPriceUSD ?? 0;
      const inAmount = +row?.in[0]?.coins[0].amount ?? 0;
      return inPrice * inAmount;
    };

    const volumeX = getVolumeFromRow(rowX);
    const volumeY = getVolumeFromRow(rowY);
    return volumeX < volumeY ? -1 : volumeX > volumeY ? 1 : 0;
  }, []);

  const chartPeriods = [
    { text: '1 Day', mode: '24h' },
    { text: '14 Days', mode: '14d' },
    { text: '30 Days', mode: '30d' },
  ];

  const chartPeriod = useMemo(() => {
    const period = searchParams.get('period');
    return period && chartPeriods.some((p) => p.mode === period) ? period : '24h';
  }, [searchParams]);

  const chartInterval = useMemo(() => 
    chartPeriod === '24h' ? 'hour' : 'day', 
    [chartPeriod]
  );

  const chartCount = useMemo(() => 
    parseInt(chartPeriod), 
    [chartPeriod]
  );

  const affiliateListOptions = useMemo(() => 
    affiliateList().map(({ id }) => id), 
    []
  );

  const tableColumns = useMemo(() => [
    {
      label: 'Volume',
      field: 'volume',
      sortFn: sortByVolume,
      renderCell: (item) => {
        const volume = formatVolume(item);
        return <span className="mono">{volume}</span>;
      }
    },
  ], [sortByVolume]);

  const mapInterfaceName = useCallback((s) => {
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

  const formatValue = useCallback((value) => {
    const numValue = Math.abs(value);
    
    if (numValue >= 1e9) {
      return `$${(numValue / 1e9).toFixed(2)}B`;
    } else if (numValue >= 1e6) {
      return `$${(numValue / 1e6).toFixed(2)}M`;
    } else if (numValue >= 1e3) {
      return `$${(numValue / 1e3).toFixed(2)}K`;
    }
    return `$${numValue.toFixed(2)}`;
  }, []);

  const formatDate = useCallback((interval) => {
    const timestamp = +interval.startTime * 1e3;
    const date = moment.utc(timestamp).local();
    return chartPeriod === '24h'
      ? date.format('MMM Do, HH:mm')
      : date.format('dddd, MMM D');
  }, [chartPeriod]);

  const fillArrayWithZero = useCallback((array, length) => {
    while (array.length < length) {
      array.push(0);
    }
    return array;
  }, []);

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
        interval.thornames.forEach((thorname) => {
          totalEarnings += +thorname.volumeUSD / 1e2;
        });
      });
    }

    return totalEarnings;
  }, []);

  const formatAffiliateHistory = useCallback((data) => {
    if (!data?.intervals) return null;

    const xAxis = [];
    const thornames = [];
    const others = [];

    data.intervals.forEach((interval, index) => {
      if (index === data.intervals.length - 1) return;

      const date = formatDate(interval);
      xAxis.push(date);

      let filteredNames = interval.thornames.reduce((acc, thorname) => {
        const key = ['t', 'tl', 'T'].includes(thorname.thorname)
          ? 't'
          : ['ti', 'te', 'tr', 'td', 'tb', 't1'].includes(thorname.thorname)
            ? 'ti'
            : ['va', 'vi', 'v0'].includes(thorname.thorname)
              ? 'va'
              : thorname.thorname;

        if (acc[key]) {
          acc[key].volumeUSD += +thorname.volumeUSD;
          acc[key].count += +thorname.count;
        } else {
          acc[key] = {
            volumeUSD: +thorname.volumeUSD,
            thorname: key,
            count: +thorname.count,
          };
        }
        return acc;
      }, {});

      filteredNames = orderBy(
        Object.values(filteredNames),
        [(o) => +o.volumeUSD],
        ['desc']
      );

      const topNames = 5;
      let otherTotal = 0;

      for (let ti = 0; ti < filteredNames.length; ti++) {
        if (topNames < ti) {
          otherTotal += +filteredNames[ti]?.volumeUSD / 1e2;
          if (filteredNames.length - 1 === ti) {
            others.push(otherTotal);
          }
          continue;
        }

        const thornameIndex = thornames.findIndex(
          (t) => t.name === filteredNames[ti].thorname
        );

        if (thornameIndex >= 0) {
          if (thornames[thornameIndex].data.length < index + 1) {
            thornames[thornameIndex].data = fillArrayWithZero(
              thornames[thornameIndex].data,
              index
            );
          }
          thornames[thornameIndex].data.push(
            +filteredNames[ti]?.volumeUSD / 1e2
          );
        } else {
          let dataArray = [];
          if (index > 0) {
            dataArray = fillArrayWithZero(dataArray, index);
          }
          dataArray.push(+filteredNames[ti]?.volumeUSD / 1e2);
          thornames.push({
            name: filteredNames[ti].thorname,
            data: dataArray,
          });
        }
      }
    });

    const series = [
      ...thornames.map((thorname, index) => ({
        name: thorname.name,
        data: thorname.data,
      })),
      {
        name: 'Others',
        data: others,
      },
    ];

    return { labels: xAxis, series };
  }, [formatDate, fillArrayWithZero]);

  const formatAffiliateStats = useCallback((data) => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    const xAxis = [];
    const thornames = [];
    const others = [];

    data.forEach((interval, index) => {
      if (index === data.length - 1) return;

      const date = formatDate(interval);
      xAxis.push(date);

      let filteredNames = {};

      const affiliateIncludes = (affiliates, affiliateEntry) => {
        const affiliatesSplit = affiliateEntry.split('/');
        return affiliatesSplit.some((aff) => affiliates.includes(aff));
      };

      const ignoreAggregator = (affiliates) => {
        const affiliatesSplit = affiliates.split('/');
        if (
          affiliates.length > 0 &&
          (affiliatesSplit.includes('-_') || affiliatesSplit.includes('ro'))
        ) {
          return affiliatesSplit.find((aff) => aff !== '-_' && aff !== 'ro');
        }
        return affiliates;
      };

      filteredNames = interval.affiliates.reduce((acc, affiliate) => {
        let key = affiliateIncludes(['t', 'tl', 'T'], affiliate.affiliate)
          ? 't'
          : affiliateIncludes(
                ['ti', 'te', 'tr', 'td', 'tb', 't1'],
                affiliate.affiliate
              )
            ? 'ti'
            : affiliateIncludes(['va', 'vi', 'v0'], affiliate.affiliate)
              ? 'va'
              : ignoreAggregator(affiliate.affiliate);

        if (key === '') {
          key = 'No Affiliate';
        }

        if (acc[key]) {
          acc[key].volume += +affiliate.volume;
          acc[key].count += +affiliate.count;
        } else {
          acc[key] = {
            volume: +affiliate.volume,
            affiliate: key,
            count: +affiliate.count,
          };
        }
        return acc;
      }, {});

      filteredNames = orderBy(
        Object.values(filteredNames),
        [(o) => +o.volume],
        ['desc']
      );

      const topNames = 5;
      let otherTotal = 0;

      for (let ti = 0; ti < filteredNames.length; ti++) {
        if (topNames < ti) {
          otherTotal += +filteredNames[ti]?.volume / 1e8;
          if (filteredNames.length - 1 === ti) {
            others.push(otherTotal);
          }
          continue;
        }

        const thornameIndex = thornames.findIndex(
          (t) => t.name === filteredNames[ti].affiliate
        );

        if (thornameIndex >= 0) {
          if (thornames[thornameIndex].data.length < index + 1) {
            thornames[thornameIndex].data = fillArrayWithZero(
              thornames[thornameIndex].data,
              index
            );
          }
          thornames[thornameIndex].data.push(+filteredNames[ti]?.volume / 1e8);
        } else {
          let dataArray = [];
          if (index > 0) {
            dataArray = fillArrayWithZero(dataArray, index);
          }
          dataArray.push(+filteredNames[ti]?.volume / 1e8);
          thornames.push({
            name: filteredNames[ti].affiliate,
            data: dataArray,
          });
        }
      }
    });

    const series = [
      ...thornames.map((thorname, index) => ({
        name: thorname.name,
        data: thorname.data,
      })),
      {
        name: 'Others',
        data: others,
      },
    ];

    return { labels: xAxis, series };
  }, [formatDate, fillArrayWithZero]);

  const createTooltipFormatter = useCallback((label = 'Fees') => {
    return (params) => {
      const sortedParams = params
        .filter((a) => a.value)
        .sort((a, b) => {
          if (a.seriesName === 'Others') return 1;
          if (b.seriesName === 'Others') return -1;
          return b.value - a.value;
        });

      const totalFees = params.reduce((sum, c) => sum + (c.value || 0), 0);

      let tooltipContent = `
        <div class="tooltip-header">${params[0].name}</div>
        <div class="tooltip-body">
      `;

      sortedParams.forEach((p) => {
        const interfaceDetail = mapInterfaceName(p.seriesName);
        
        tooltipContent += `
          <span>
            <div class="tooltip-item">
              <div class="data-color" style="background-color: ${p.color}"></div>
              ${
                interfaceDetail?.icons
                  ? `<img class="tooltip-interface-icon" src="${theme === 'light' ? interfaceDetail.icons.url : interfaceDetail.icons.urlDark}"/>`
                  : `<span style="text-align: left;">${p.seriesName}</span>`
              }
            </div>
            <b>${formatValue(p.value)}</b>
          </span>
        `;
      });

      tooltipContent += `
        </div>
        <span style="border-top: 1px solid var(--border-color); margin: 2px 0;"></span>
        <hr>
        <span>
          <span>Total ${label}</span>
          <b>${formatValue(totalFees)}</b>
        </span>
      `;

      return tooltipContent;
    };
  }, [mapInterfaceName, theme, formatValue]);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setIsTableLoading(true);

      const [historyData, statsData, swapsData] = await Promise.all([
        getAffiliateHistory(affiliate, chartCount, chartInterval),
        getAffiliateStats(affiliate, chartCount, chartInterval),
        getSwapsByThorname(affiliate, chartPeriod),
      ]);

      processAllData(historyData, statsData, swapsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setIsTableLoading(false);
    }
  }, [affiliate, chartCount, chartInterval, chartPeriod]);

  const processAllData = useCallback((historyData, statsData, swapsData) => {
    const historyChartData = formatAffiliateHistory(historyData);
    const statsChartData = formatAffiliateStats(statsData);
    
    setAffiliateChart(historyChartData);
    setAffiliateStatsChart(statsChartData);
    setAffiliateSwaps(swapsData);

    setAffiliateChartKey(prev => prev + 1);
    setAffiliateStatsChartKey(prev => prev + 1);

    updateStatsFromData(historyData, statsData);
  }, [formatAffiliateHistory, formatAffiliateStats]);

  const updateStatsFromData = useCallback((historyData, statsData) => {
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
  }, [calculateStatsTotals, calculateTotalEarnings]);

  useEffect(() => {
    const affiliateParam = searchParams.get('affiliate');
    const currentAffiliate = affiliateList()
      .find((aff) => aff.id === affiliateParam)
      ?.thornames?.join(',') || affiliateParam || '';
    
    setAffiliate(currentAffiliate);
    setSelectedFilter(affiliateParam || '');
    
    fetchAllData();
  }, [searchParams, fetchAllData]);

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

  const formatVolume = useCallback((row) => {
    const inPrice = +row?.metadata?.swap?.inPriceUSD ?? 0;
    const inAmount = +row?.in[0]?.coins[0].amount ?? 0;
    return formatValue(inPrice * inAmount);
  }, [formatValue]);

  const downloadAffiliateSwaps = useCallback((data) => {
    let swapsData = data;
    if (data.actions && Array.isArray(data.actions)) {
      swapsData = data.actions;
    } else if (Array.isArray(data)) {
      swapsData = data;
    } else {
      console.error('Unexpected data structure:', data);
      return;
    }

    if (!swapsData.length) {
      console.error('No swaps data available for CSV download.');
      return;
    }

    const csvData = swapsData.map((swap) => {
      const inPrice = +swap?.metadata?.swap?.inPriceUSD ?? 0;
      const inAmount = +swap?.in[0]?.coins[0]?.amount ?? 0;
      const volume = inPrice * inAmount;

      const nonAffiliateOuts = swap.out?.filter((out) => !out.affiliate) || [];
      const firstNonAffiliateOut = nonAffiliateOuts[0];

      return {
        hash:
          swap.tx?.hash ||
          swap.hash ||
          swap.txHash ||
          swap.in?.[0]?.txID ||
          swap.tx?.id ||
          '',
        date: swap.tx?.date
          ? moment.unix(swap.tx.date).format('YYYY-MM-DD HH:mm:ss')
          : swap.date
            ? moment(swap.date / 1e6).format('YYYY-MM-DD HH:mm:ss')
            : '',
        volume: volume / 1e8,
        volumeUSD: formatValue(volume / 1e8),
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
  }, [affiliate, chartPeriod, formatValue]);

  const downloadAffiliateFeesChart = useCallback(() => {
    if (!affiliateChart) {
      console.error('No chart data available for CSV download.');
      return;
    }

    const series = affiliateChart.series;
    const xAxis = affiliateChart.labels;

    if (!xAxis || !Array.isArray(xAxis)) {
      console.error('Invalid chart data structure.');
      return;
    }

    const csvData = [];
    xAxis.forEach((date, index) => {
      const row = { date };
      series.forEach((s) => {
        const value = s.data[index] || 0;
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
  }, [affiliateChart, affiliate, chartPeriod]);

  const downloadAffiliateSwapsChart = useCallback(() => {
    if (!affiliateStatsChart) {
      console.error('No chart data available for CSV download.');
      return;
    }

    const series = affiliateStatsChart.series;
    const xAxis = affiliateStatsChart.labels;

    if (!xAxis || !Array.isArray(xAxis)) {
      console.error('Invalid chart data structure.');
      return;
    }

    const csvData = [];
    xAxis.forEach((date, index) => {
      const row = { date };
      series.forEach((s) => {
        const value = s.data[index] || 0;
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
  }, [affiliateStatsChart, affiliate, chartPeriod]);

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

  const affiliateChartOptions = useMemo(() => ({
    tooltip: {
      formatter: createTooltipFormatter('Fees'),
    },
    legend: {
      show: false,
    },
    yAxis: {
      show: false,
    },
  }), [createTooltipFormatter]);

  const affiliateStatsChartOptions = useMemo(() => ({
    tooltip: {
      formatter: createTooltipFormatter('Volume'),
    },
    legend: {
      show: false,
    },
    yAxis: {
      show: false,
    },
  }), [createTooltipFormatter]);

  return (
    <div className="header-affiliate">
      <div className="header-controls">
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
      
      <div className="charts-container">
        <div className="chart-item">
          <Card title="Fees Stats">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Fees Stats</h3>
              <div className="csv-download" title="Download CSV" onClick={downloadAffiliateFeesChart}>
                <FileDownloadIcon className="clickable" style={{ cursor: 'pointer' }} />
              </div>
            </div>
            
            <div className="card-content">
              {affiliateChart && !loading ? (
                <EChartsWrapper
                  key={affiliateChartKey}
                  type="bar"
                  data={affiliateChart}
                  options={affiliateChartOptions}
                  height="400px"
                />
              ) : (
                <ChartLoader barCount={15} />
              )}
            </div>
          </Card>
        </div>

        <div className="chart-item">
          <Card title="Swaps Stats">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Swaps Stats</h3>
              <div className="csv-download" title="Download CSV" onClick={downloadAffiliateSwapsChart}>
                <FileDownloadIcon className="clickable" style={{ cursor: 'pointer' }} />
              </div>
            </div>
            
            <div className="card-content">
              {affiliateStatsChart && !loading ? (
                <EChartsWrapper
                  key={affiliateStatsChartKey}
                  type="bar"
                  data={affiliateStatsChart}
                  options={affiliateStatsChartOptions}
                  height="400px"
                />
              ) : (
                <ChartLoader barCount={15} />
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="affiliate-table-section">
        <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <Header title="Top Swaps" />
          <div className="csv-download" title="Download CSV" onClick={() => downloadAffiliateSwaps(affiliateSwaps)}>
            <FileDownloadIcon className="clickable" style={{ cursor: 'pointer' }} />
          </div>
        </div>
        
        <Transactions
          txs={affiliateSwaps}
          loading={!affiliateSwaps || isTableLoading}
          columns={tableColumns}
        />
      </div>
    </div>
  );
};

export default AffiliatesChart;