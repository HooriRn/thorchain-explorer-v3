"use client";

import React, { useState, useEffect } from "react";
import moment from "moment";
import BaseNormalizedChart from "./BaseNormalizedChart";

interface SupplyBurnData {
  date: string;
  "Burned Rune": number;
}

interface SupplyBurnChartProps {
  data?: any;
  loading?: boolean;
}

const SupplyBurnChart: React.FC<SupplyBurnChartProps> = ({
  data,
  loading = false,
}) => {
  const [chartData, setChartData] = useState<SupplyBurnData[]>([]);

  useEffect(() => {
    if (!data) {
      setChartData([]);
      return;
    }

    if (data?.intervals && Array.isArray(data.intervals)) {
      const formattedData = formatSupplyBurnData(data);
      setChartData(formattedData);
    } else if (data?.series && Array.isArray(data.series)) {
      const formattedData = formatChartOptionsToData(data);
      setChartData(formattedData);
    } else {
      setChartData([]);
    }
  }, [data]);

  const formatChartOptionsToData = (chartOptions: any): SupplyBurnData[] => {
    const formattedData: SupplyBurnData[] = [];

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
      xAxis.forEach((date: string, index: number) => {
        const dataPoint: SupplyBurnData = {
          date,
          "Burned Rune": 0,
        };

        const burnSeries = seriesMap.get("Burned Rune");

        if (burnSeries && burnSeries[index] !== undefined) {
          dataPoint["Burned Rune"] =
            typeof burnSeries[index] === "object"
              ? burnSeries[index].value
              : burnSeries[index];
        }

        formattedData.push(dataPoint);
      });
    }

    return formattedData;
  };

  const formatSupplyBurnData = (earningData: any): SupplyBurnData[] => {
    const formattedData: SupplyBurnData[] = [];

    if (!earningData?.intervals || !Array.isArray(earningData.intervals)) {
      return [];
    }

    earningData.intervals.forEach((interval: any) => {
      const intervalDate = moment(
        Math.floor((+interval.endTime + +interval.startTime) / 2) * 1e3
      );

      if (intervalDate.isSame(moment(), 'day')) return;

      const date = intervalDate.format("dddd, MMM D");
      
      const burns = interval.pools?.find((p: any) => p.pool === 'income_burn')?.earnings || 0;
      const burn = +burns / 1e8;

      const dataPoint: SupplyBurnData = {
        date,
        "Burned Rune": burn,
      };

      formattedData.push(dataPoint);
    });

    return formattedData;
  };

  return (
    <BaseNormalizedChart
      data={chartData}
      loading={loading}
      seriesNames={["Burned Rune"]}
      chartTitle="Supply Burn"
      height="400px"
      isNormalized={false}
      formatValue={(value) => `$${(value / 1e6).toFixed(2)}M`}
      customColors={["#FF6B6B"]}
    />
  );
};

export default SupplyBurnChart;