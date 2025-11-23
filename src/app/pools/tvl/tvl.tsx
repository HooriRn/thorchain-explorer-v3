"use client";

import React, { useEffect, useState, useCallback } from "react";
import moment from "moment";
import ReactECharts from "echarts-for-react";
import { assetFromString } from "@xchainjs/xchain-util";
import { sortBy, orderBy } from "lodash";
import Card from "@/components/ui/Card";
import ChartLoader from "@/components/ChartLoader";
import { getTVLHistory } from "@/lib/api";
import { basicChartFormat, getChainColor } from "@/utils/global";
import { formatVueNumber } from "@/utils/format";
import styles from "./tvl.module.css";
import PooledView from "../components/PooledView";

const TVLPool: React.FC = () => {
  const [tvlOption, setTvlOption] = useState<any>(undefined);

  const updateDatum = useCallback(async () => {
    try {
      const response = await getTVLHistory();
      const intervals = Array.isArray(response)
        ? response
        : (response as any)?.intervals ||
          (response as any)?.data?.intervals ||
          [];

      const pools: any = {};
      const xAxis: string[] = [];

      for (let i = 0; i < intervals.length; i++) {
        const s = sortBy(intervals[i]?.poolsDepth, [
          (o) => +o.totalDepth,
        ]).reverse();

        s.forEach((pd: any) => {
          if (+pd.totalDepth === 0) {
            return;
          }

          const assetData = assetFromString(pd.pool);
          if (!assetData || !assetData.chain) {
            return;
          }

          const { chain } = assetData;
          if (chain === "BNB") {
            return;
          }
          const poolUSD = (+pd.totalDepth / 1e8) * +intervals[i].runePriceUSD;
          const chainColor = getChainColor(chain);

          if (chain in pools) {
            if (i + 1 === pools[chain].data.length) {
              const beforeUSD = pools[chain].data[i];
              pools[chain].data.splice(i, 1, beforeUSD + poolUSD);
            } else {
              pools[chain].data.push(poolUSD);
            }
          } else if (i > 0) {
            pools[chain] = {
              name: chain,
              type: "bar",
              stack: "Total",
              showSymbol: false,
              symbol: "circle",
              areaStyle: {
                color: chainColor,
              },
              lineStyle: {
                color: chainColor,
              },
              itemStyle: {
                color: chainColor,
              },
              data: new Array(i).fill(0).concat([poolUSD]),
              smooth: true,
            };
          } else {
            pools[chain] = {
              name: chain,
              type: "bar",
              stack: "Total",
              showSymbol: false,
              symbol: "circle",
              areaStyle: {
                color: chainColor,
              },
              lineStyle: {
                color: chainColor,
              },
              itemStyle: {
                color: chainColor,
              },
              data: [poolUSD],
              smooth: true,
            };
          }
        });

        xAxis.push(
          moment(
            Math.floor(
              (~~intervals[i].endTime + ~~intervals[i].startTime) / 2
            ) * 1e3
          ).format("YY/MM/DD")
        );
      }

      const seriesPools = Object.values(pools);

      const formatter = (param: any) => {
        if (param.length === 0) return "";

        const pds = orderBy(param, ["value"], ["desc"]);
        const total = pds.reduce((a: number, b: any) => a + (b.value || 0), 0);

        return `
          <div class="tooltip-header">
            ${param[0].name || param[0].axisValue}
          </div>
          <div class="tooltip-body">
            ${pds
              .map(
                (p: any) => `
              <span>
                <div class="tooltip-item">
                  <div class="data-color" style="background-color: ${
                    p.color
                  }"></div>
                  <span style="text-align: left;">
                    ${p.seriesName}
                  </span>
                </div>
                <b>$${formatVueNumber(p.value || 0, "0,0.00a")}</b>
              </span>
            `
              )
              .join("")}
            <span>
              <div class="tooltip-item">
                <span style="text-align: left;">
                  Total
                </span>
              </div>
              <b>$${formatVueNumber(total, "0,0.00a")}</b>
            </span>
          </div>
        `;
      };

      const chartOption = basicChartFormat(
        undefined,
        seriesPools,
        xAxis,
        {
          legend: {
            type: "scroll",
            pageIconColor: "var(--primary-color)",
            icon: "rect",
            textStyle: {
              color: "var(--sec-font-color)",
            },
          },
        },
        formatter
      );

      chartOption.tooltip = {
        ...chartOption.tooltip,
        backgroundColor: "transparent",
        borderColor: "transparent",
        textStyle: {
          color: "transparent",
        },
        extraCssText:
          "background-color: var(--bgt-color) !important; backdrop-filter: blur(8px); box-shadow: none; border: 1px var(--border) solid; border-radius: var(--radius-lg); padding: var(--space-10); font-family: 'Montserrat', sans-serif; font-size: var(--font-size-sm); color: var(--sec-font-color);",
      } as any;

      setTvlOption(chartOption);
    } catch (error) {
      console.error("Error loading TVL history:", error);
      setTvlOption(undefined);
    }
  }, []);

  useEffect(() => {
    updateDatum();
  }, [updateDatum]);

  return (
    <>
      <PooledView />
      <div className={`container-page ${styles["tvl-page"]}`}>
        <Card>
          {tvlOption ? (
            <ReactECharts
              className={styles.chart}
              option={tvlOption}
              style={{ height: "400px", width: "100%" }}
              opts={{ renderer: "svg" }}
            />
          ) : (
            <ChartLoader barCount={30} />
          )}
        </Card>
      </div>
    </>
  );
};

export default TVLPool;
