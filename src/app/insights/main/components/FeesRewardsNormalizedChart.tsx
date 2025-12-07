"use client";

import React, { useMemo } from "react";
import moment from "moment";
import { getChartColor, getCurrentChartTheme } from "@/utils/global";
import { useTheme } from "@/lib/store";
import EChartsWrapper from "@/components/charts/EChartsWrapper";
import ChartLoader from "@/components/ChartLoader";

interface FeesRewardsNormalizedChartProps {
  data?: any;
  loading?: boolean;
  isNormalized?: boolean;
}

const FeesRewardsNormalizedChart: React.FC<FeesRewardsNormalizedChartProps> = ({
  data,
  loading = false,
  isNormalized = true,
}) => {
  const theme = useTheme();

  const percentageFormat = (value: number, decimals: number = 2) => {
    return `${(value * 100).toFixed(decimals)}%`;
  };

  const normalFormat = (value: number, format: string = "0,0.00") => {
    const numValue = Math.abs(value);
    
    if (numValue >= 1e9) {
      return `${(numValue / 1e9).toFixed(2)}B`;
    } else if (numValue >= 1e6) {
      return `${(numValue / 1e6).toFixed(2)}M`;
    } else if (numValue >= 1e3) {
      return `${(numValue / 1e3).toFixed(2)}K`;
    }
    return numValue.toFixed(2);
  };

  const chartData = useMemo(() => {
    if (!data?.intervals || !Array.isArray(data.intervals)) {
      return {
        labels: [] as string[],
        feesData: [] as number[],
        rewardsData: [] as number[],
        feesPercentData: [] as number[],
        rewardsPercentData: [] as number[],
        halfLineData: [] as number[],
        totalVolume: [] as number[],
        rawData: [] as any[],
      };
    }

    const labels: string[] = [];
    const feesData: number[] = [];
    const rewardsData: number[] = [];
    const feesPercentData: number[] = [];
    const rewardsPercentData: number[] = [];
    const halfLineData: number[] = [];
    const totalVolume: number[] = [];
    const rawData: any[] = [];

    data.intervals.forEach((interval: any, index: number) => {
      if (
        interval.liquidityFees === undefined ||
        interval.blockRewards === undefined ||
        interval.runePriceUSD === undefined ||
        interval.earnings === undefined ||
        interval.startTime === undefined ||
        interval.endTime === undefined
      ) {
        return;
      }

      const intervalDate = moment(
        Math.floor((+interval.endTime + +interval.startTime) / 2) * 1e3
      );

      if (intervalDate.isSame(moment(), 'day')) {
        return;
      }

      const date = intervalDate.format("dddd, MMM D");
      
      const fees = (interval.liquidityFees * interval.runePriceUSD) / 1e8;
      const reward = (interval.blockRewards * interval.runePriceUSD) / 1e8;
      const rewards = reward > 0 ? reward : 0;
      
      const totalVol = (interval.earnings * interval.runePriceUSD) / 1e8;
      
      const feesPercent = totalVol > 0 ? fees / totalVol : 0;
      const rewardsPercent = totalVol > 0 ? rewards / totalVol : 0;

      labels.push(date);
      feesData.push(fees);
      rewardsData.push(rewards);
      feesPercentData.push(feesPercent);
      rewardsPercentData.push(rewardsPercent);
      totalVolume.push(totalVol);
      
      if (isNormalized) {
        halfLineData.push(0.5);
      }

      rawData.push({
        date,
        fees,
        rewards,
        feesPercent,
        rewardsPercent,
        totalVolume: totalVol,
      });
    });

    return {
      labels,
      feesData,
      rewardsData,
      feesPercentData,
      rewardsPercentData,
      halfLineData,
      totalVolume,
      rawData,
    };
  }, [data, isNormalized]);

  const chartOptions = useMemo(() => {
    const { 
      labels, 
      feesData, 
      rewardsData, 
      feesPercentData, 
      rewardsPercentData, 
      halfLineData,
      totalVolume,
      rawData 
    } = chartData;

    const getSeriesColors = () => {
      if (theme === "light") {
        return ["#3ca38b", "#00CCFF"];
      }
      return ["#63FDD9", "#00CCFF"];
    };

    const colors = getSeriesColors();

    const series: any[] = [];

    if (isNormalized) {
      const normSeries = [
        { name: 'Liquidity Fees', data: feesData },
        { name: 'Block Rewards', data: rewardsData }
      ].map((s, i) => {
        return {
          name: s.name,
          type: 'bar',
          stack: 'total',
          yAxisIndex: 0,
          data: s.data.map((d, j) => {
            const percentValue = totalVolume[j] > 0 ? d / totalVolume[j] : 0;
            return {
              value: percentValue,
              itemStyle: {
                borderRadius: [8, 8, 0, 0],
                color: colors[i]
              }
            };
          }),
        };
      });

      series.push(...normSeries);

      if (halfLineData.length > 0) {
        series.push({
          name: 'Half Line',
          type: 'line',
          stack: 'Total', 
          showSymbol: false,
          symbol: 'circle',
          emphasis: {
            focus: 'series',
          },
          yAxisIndex: 1,
          data: halfLineData.map(value => ({
            value,
            itemStyle: {
              color: theme === "light" ? '#666' : '#888',
            },
          })),
          lineStyle: {
            type: 'dashed',
            width: 1,
          },
        });
      }
    } else {
      series.push(
        {
          name: 'Liquidity Fees',
          type: 'bar',
          stack: 'Total',
          showSymbol: false,
          symbol: 'circle',
          data: feesData.map((value: number) => ({
            value,
            itemStyle: {
              borderRadius: [8, 8, 0, 0],
              color: colors[0]
            }
          })),
        },
        {
          name: 'Block Rewards',
          type: 'bar',
          stack: 'Total',
          showSymbol: false,
          symbol: 'circle',
          data: rewardsData.map((value: number) => ({
            value,
            itemStyle: {
              borderRadius: [8, 8, 0, 0],
              color: colors[1]
            }
          })),
        }
      );
    }

    const tooltipFormatter = (params: any[]) => {
      if (!params || params.length === 0) return '';
      
      const dataIndex = params[0].dataIndex;
      const dataPoint = rawData[dataIndex];
      
      if (!dataPoint) return '';
      
      if (isNormalized) {
        const filteredParams = params.filter(p => p.seriesName !== 'Half Line');
        
        if (filteredParams.length === 0) return '';
        
        let tooltipHTML = `
          <div class="tooltip-header" style="font-weight: bold; margin-bottom: 8px;">
            ${dataPoint.date}
          </div>
          <div class="tooltip-body">
        `;
        
        const sortedParams = [...filteredParams]
          .sort((a, b) => (b.value || 0) - (a.value || 0));
        
        sortedParams.forEach((p, i) => {
          if (p.value !== undefined) {
            tooltipHTML += `
              <span style="display: flex; justify-content: space-between; align-items: center; margin: 4px 0;">
                <div style="display: flex; align-items: center;">
                  <div class="data-color" style="width: 8px; height: 8px; border-radius: 50%; background-color: ${p.color}; margin-right: 8px;"></div>
                  <span style="text-align: left;">${p.seriesName}</span>
                </div>
                <b>${percentageFormat(p.value, 1)}</b>
              </span>
            `;
          }
        });
        
        tooltipHTML += '</div>';
        return tooltipHTML;
      } else {
        let tooltipHTML = `
          <div class="tooltip-header" style="font-weight: bold; margin-bottom: 8px;">
            ${dataPoint.date}
          </div>
          <div class="tooltip-body">
        `;
        
        const sortedParams = [...params]
          .filter(p => p.value > 0)
          .sort((a, b) => (b.value || 0) - (a.value || 0));
        
        sortedParams.forEach(p => {
          tooltipHTML += `
            <span style="display: flex; justify-content: space-between; align-items: center; margin: 4px 0;">
              <div style="display: flex; align-items: center;">
                <div class="data-color" style="width: 8px; height: 8px; border-radius: 50%; background-color: ${p.color}; margin-right: 8px;"></div>
                <span style="text-align: left;">${p.seriesName}</span>
              </div>
              <b>$${normalFormat(p.value)}</b>
            </span>
          `;
        });
        
        const total = sortedParams.reduce((sum, p) => sum + (p.value || 0), 0);
        
        tooltipHTML += `
          </div>
          <span style="border-top: 1px solid var(--border-color); margin: 8px 0; display: block;"></span>
          <span class="tooltip-total" style="display: flex; justify-content: space-between; align-items: center;">
            <span>Total</span>
            <b>$${normalFormat(total)}</b>
          </span>
        `;
        
        return tooltipHTML;
      }
    };

    const options = {
      animation: true,
      animationDuration: 500,
      legend: {
        show: true,
        top: "top",
        left: "center",
        icon: "circle",
        itemWidth: 12,
        itemHeight: 12,
        textStyle: {
          color: theme === "dark" ? "#e6e6e6" : "#333333",
          fontSize: 12,
        },
        data: isNormalized ? ["Liquidity Fees", "Block Rewards", "Half Line"] : ["Liquidity Fees", "Block Rewards"],
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
          position: 'right',
          show: false,
          splitLine: {
            show: true,
            lineStyle: {
              color: 'var(--border-color)',
              type: 'dashed'
            }
          },
          max: isNormalized ? 1 : undefined,
          axisLabel: {
            formatter: isNormalized ? 
              (value: number) => percentageFormat(value, 0) : 
              undefined,
          },
        },
        ...(isNormalized ? [{
          type: 'value',
          position: 'left',
          show: false,
          splitLine: {
            show: true,
          },
          max: 1,
        }] : [])
      ],
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: tooltipFormatter,
        backgroundColor: theme === "dark" ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        borderColor: 'var(--border-color)',
        textStyle: {
          color: theme === "dark" ? "#e6e6e6" : "#333333",
        },
      },
      series,
    };

    return options;
  }, [theme, chartData, isNormalized]);

  if (loading) {
    return <ChartLoader />;
  }

  if (!data || chartData.labels.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">
            No fees/rewards data available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <EChartsWrapper
        type="bar"
        data={{
          labels: chartData.labels,
          series: chartOptions.series,
        }}
        options={chartOptions}
        height="400px"
      />
    </div>
  );
};

export default FeesRewardsNormalizedChart;