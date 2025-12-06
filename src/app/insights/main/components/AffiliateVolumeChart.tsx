"use client";

import React, { useState, useEffect, useMemo } from "react";
import BaseNormalizedChart from "./BaseNormalizedChart";

interface AffiliateData {
  affiliate: string;
  volume: number;
}

interface AffiliateVolumeChartProps {
  data?: any;
  loading?: boolean;
  topAffiliates?: number;
}

const AffiliateVolumeChart: React.FC<AffiliateVolumeChartProps> = ({
  data,
  loading = false,
  topAffiliates = 10,
}) => {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!data) {
      setChartData([]);
      return;
    }

    if (Array.isArray(data)) {
      const formattedData = formatAffiliateData(data, topAffiliates);
      setChartData(formattedData);
    } else if (data?.series && Array.isArray(data.series)) {
      const formattedData = formatChartOptionsToData(data, topAffiliates);
      setChartData(formattedData);
    } else {
      setChartData([]);
    }
  }, [data, topAffiliates]);

  const formatChartOptionsToData = (chartOptions: any, topCount: number): any[] => {
    const formattedData: any[] = [];

    if (!chartOptions.series || !Array.isArray(chartOptions.series)) {
      return [];
    }

    const xAxis = chartOptions.xAxis?.data || [];
    const seriesMap = new Map();

    chartOptions.series.forEach((series: any) => {
      if (series.name && series.data) {
        seriesMap.set(series.name, series.data);
      }
    });

    if (xAxis.length > 0) {
      xAxis.forEach((affiliate: string, index: number) => {
        if (index >= topCount) return;

        const dataPoint: any = {
          date: affiliate,
        };

        const volumeSeries = seriesMap.get("Volume");
        if (volumeSeries && volumeSeries[index] !== undefined) {
          dataPoint["Volume"] =
            typeof volumeSeries[index] === "object"
              ? volumeSeries[index].value
              : volumeSeries[index];
        }

        formattedData.push(dataPoint);
      });
    }

    return formattedData;
  };

  const formatAffiliateData = (affiliateData: any[], topCount: number): any[] => {
    const filtered = affiliateData.filter((item: any) => item.affiliate !== 'No Affiliate');
    const sorted = filtered.sort((a: any, b: any) => b.total_volume_usd - a.total_volume_usd);
    const topAffiliates = sorted.slice(0, topCount);

    return topAffiliates.map((item: any) => ({
      date: item.affiliate,
      Volume: item.total_volume_usd,
    }));
  };

  const chartOptionsOverride = useMemo(() => {
    return {
      xAxis: {
        type: 'category',
        data: chartData.map(item => item.date),
        axisLabel: {
          color: 'var(--sec-font-color)',
          fontSize: 11,
          rotate: 45,
          margin: 10,
          formatter: function(value: string) {
            if (value.length > 15) {
              return value.substring(0, 12) + '...';
            }
            return value;
          }
        },
        axisLine: {
          lineStyle: {
            color: 'var(--border-color)'
          }
        },
        axisTick: {
          show: false
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '25%',
        top: '10%',
        containLabel: true
      },
    };
  }, [chartData]);

  return (
    <BaseNormalizedChart
      data={chartData}
      loading={loading}
      seriesNames={["Volume"]}
      chartTitle="Affiliate Volume"
      height="400px"
      isNormalized={false}
      formatValue={(value) => `$${(value / 1e6).toFixed(2)}M`}
      customColors={["#45B7D1"]}
      additionalOptions={chartOptionsOverride}
    />
  );
};

export default AffiliateVolumeChart;