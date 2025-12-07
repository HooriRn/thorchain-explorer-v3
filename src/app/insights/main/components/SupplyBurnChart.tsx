"use client";

import React, { useMemo } from "react";
import moment from "moment";
import { useTheme } from "@/lib/store";
import EChartsWrapper from "@/components/charts/EChartsWrapper";
import ChartLoader from "@/components/ChartLoader";

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
  const theme = useTheme();

  const normalFormat = (value: number, format: string = "0,0.00") => {
    if (!value && value !== 0) return "-";
    
    const numValue = Math.abs(value);
    
    if (numValue >= 1e12) {
      return `$${(numValue / 1e12).toFixed(2)}T`;
    } else if (numValue >= 1e9) {
      return `$${(numValue / 1e9).toFixed(2)}B`;
    } else if (numValue >= 1e6) {
      return `$${(numValue / 1e6).toFixed(2)}M`;
    } else if (numValue >= 1e3) {
      return `$${(numValue / 1e3).toFixed(2)}K`;
    } else if (numValue >= 1) {
      return `$${numValue.toFixed(2)}`;
    }
    return `$${numValue.toFixed(4)}`;
  };

  const { labels, burnData, supplyData, rawData } = useMemo(() => {
    if (!data?.intervals || !Array.isArray(data.intervals)) {
      return {
        labels: [] as string[],
        burnData: [] as number[],
        supplyData: [] as number[],
        rawData: [] as SupplyBurnData[],
      };
    }

    const labels: string[] = [];
    const burnData: number[] = [];
    const supplyData: number[] = [];
    const rawData: SupplyBurnData[] = [];
    let burnCumulative = 0;

    data.intervals.forEach((interval: any) => {
      const intervalDate = moment(
        Math.floor((+interval.endTime + +interval.startTime) / 2) * 1e3
      );

      if (intervalDate.isSame(moment(), 'day')) {
        return;
      }

      const date = intervalDate.format('dddd, MMM D');
      labels.push(date);
      
      const burns = interval?.pools?.find(
        (p: any) => p.pool === 'income_burn'
      )?.earnings;

      const burn = burns ? +burns / 1e8 : 0;
      burnCumulative += burn;
      
      burnData.push(burn);
      supplyData.push(5 * 1e8 - burnCumulative);
      
      rawData.push({
        date,
        "Burned Rune": burn,
      });
    });

    return {
      labels,
      burnData,
      supplyData,
      rawData,
    };
  }, [data]);

  const chartOptions = useMemo(() => {
    if (burnData.length === 0) return null;

    const BURN_COLOR = '#ff9962';
    
    const series = [
      {
        type: 'bar',
        name: 'Burned Rune',
        showSymbol: false,
        data: burnData,
        yAxisIndex: 1,
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: BURN_COLOR,
        },
      },
    ];

    const tooltipFormatter = (params: any[]) => {
      if (!params || params.length === 0) return '';
      
      const dataIndex = params[0].dataIndex;
      const dataPoint = rawData[dataIndex];
      
      if (!dataPoint) return '';
      
      return `
        <div class="tooltip-header">
          <div class="data-color" style="background-color: ${params[0].color}"></div>
          ${params[0].name}
        </div>
        <div class="tooltip-body">
          ${params
            .map(
              (p) => `<span>
              <span>${p.seriesName}</span>
              <b>${p.value ? normalFormat(p.value, '0,0.00') : '-'}</b>
            </span>`
            )
            .join('')}
        </div>
      `;
    };

    return {
      legend: {
        show: false, 
      },
    
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: {
          show: false, 
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false
        }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Max Supply',
          position: 'left',
          show: false, 
          splitLine: {
            show: true,
            lineStyle: {
              color: theme === 'light' ? '#e0e0e0' : '#424242',
              type: 'dashed'
            }
          },
          min: supplyData.length > 0 ? supplyData[supplyData.length - 1] - 50 : undefined,
          max: 'dataMax',
          axisLabel: {
            formatter: (value: number) => normalFormat(value)
          }
        },
        {
          type: 'value',
          name: 'Burned Rune',
          position: 'right',
          show: false, 
          splitLine: {
            show: true,
            lineStyle: {
              color: theme === 'light' ? '#e0e0e0' : '#424242',
              type: 'dashed'
            }
          },
          min: 'dataMin',
          max: 'dataMax',
          axisLabel: {
            formatter: (value: number) => normalFormat(value)
          }
        },
      ],
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        backgroundColor: theme === 'dark' ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: theme === 'dark' ? '#424242' : '#e0e0e0',
        borderWidth: 1,
        textStyle: {
          color: theme === 'dark' ? '#ffffff' : '#333333',
          fontSize: 12,
        },
        formatter: tooltipFormatter,
      },
      series,
    };
  }, [theme, labels, burnData, supplyData, rawData]);

  if (loading) {
    return <ChartLoader barCount={15} />;
  }

  if (!data || !chartOptions) {
    return <ChartLoader barCount={15} />;
  }

  return (
    <div className="h-full w-full" style={{ height: '400px' }}>
      <EChartsWrapper
        type="bar"
        data={{
          labels: chartOptions.xAxis.data || [],
          series: chartOptions.series || [],
        }}
        options={chartOptions}
        height="100%"
        theme={theme === 'dark' ? 'dark' : 'light'}
      />
    </div>
  );
};

export default SupplyBurnChart;