"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { forEach as eachLod } from "lodash";
import { getSaversInfo, getMimir } from "@/lib/api";
import { useRunePrice } from "@/lib/store";
import Page from "@/components/PageContainer";
import Card from "@/components/ui/Card";
import CardsHeader from "@/components/CardsHeader";
import TableLoader from "@/components/TableLoader";
import Table from "@/components/table/Table";
import { ProgressIcon } from "@/components/ui/ProgressIcon";
import AssetIcon from "@/components/AssetIcon";
import GlassmorphismTooltip from "@/components/GlassmorphismTooltip";
import InfoIcon from "@/assets/images/info.svg";
import { formatAsset } from "@/utils";
import { showAsset } from "@/utils/global";
import {
  formatVueNumber,
  formatPercent,
  smallBaseAmountFormat,
  smallBaseAmountFormatWithCurrency,
  formatBaseAmount,
  formatNormalNumber,
  formatPercentageRatio,
} from "@/utils/format";
import { getAssetColor } from "@/utils/global";
import { TableColumn, TableData } from "@/components/table/types";
import styles from "./savers.module.css";

interface SaverInfo {
  savers: {
    asset: string;
    saversDepth: number;
    assetDepth: number;
    saversCount: number;
    saversReturn: number;
    filled: number;
    earned: number;
    assetPriceUSD: number;
    [key: string]: any;
  };
  oldSavers: {
    saversDepth: number;
    saversCount: number;
    saversReturn: number;
    filled: number;
    earned: number;
    [key: string]: any;
  };
}

interface SaverRow extends TableData {
  asset: string;
  saversDepthUSD: number;
  saversDepth: number;
  saversDepthRatio: number;
  filled: number;
  saversCount: number;
  saversReturn: number;
  delta: {
    [key: string]: number | undefined;
  };
  [key: string]: any;
}

interface TableGeneralStat {
  name: string;
  value?: string | number;
  isDown?: boolean;
  change?: number;
  description?: string;
  link?: string;
  extraText?: string;
}
const customTheme = {
  Table: `
      --data-table-library_grid-template-columns: auto auto auto auto auto auto auto;
    `,
  Cell: `
      
      &:nth-child(4) {
        text-align: center;
      }
      &:nth-child(5) {
        text-align: center;
      }
      &:nth-child(7) {
        text-align: center;
      }
    `,
};
const SaversPage: React.FC = () => {
  const router = useRouter();
  const runePrice = useRunePrice();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saversInfo, setSaversInfo] = useState<Record<string, SaverInfo>>({});
  const [saversRow, setSaversRow] = useState<SaverRow[]>([]);
  const [saversGeneralStats, setSaversGeneralStats] = useState<
    TableGeneralStat[]
  >([
    {
      name: "Total Savers",
    },
    {
      name: "Total Saved Value",
    },
    {
      name: "Total Earned",
    },
    {
      name: "APR Mean",
    },
  ]);
  const [maxSaverCap, setMaxSaverCap] = useState(0.6);

  const networkEnv =
    process.env.NEXT_PUBLIC_NETWORK || process.env.NETWORK || "mainnet";

  const getFormattedValue = useCallback((field: string, value: number) => {
    switch (field) {
      case "saversDepthUSD":
        return smallBaseAmountFormatWithCurrency(+value);
      case "saversReturn":
      case "filled":
      case "saversDepthRatio":
        return formatPercentageRatio(+value, 2);
      default:
        return +value;
    }
  }, []);

  const cols = useMemo<TableColumn[]>(() => {
    const columns: TableColumn[] = [
      {
        label: "Asset",
        sortKey: "asset",
        renderCell: (item: SaverRow) => {
          return (
            <div className={styles["cell-content"]} title={item.asset}>
              <AssetIcon asset={item.asset} />
              <span className={styles.clickable}>
                {formatAsset(item.asset)}
              </span>
            </div>
          );
        },
      },
      {
        label: "Savers Depth (USD)",
        sortKey: "saversDepthUSD",
        renderCell: (item: SaverRow) => {
          return (
            <span className={styles.mono}>
              {smallBaseAmountFormatWithCurrency(item.saversDepthUSD)}
              {item.delta?.saversDepthUSD !== undefined &&
                item.delta.saversDepthUSD !== 0 && (
                  <ProgressIcon
                    dataNumber={smallBaseAmountFormat(
                      Math.abs(item.delta.saversDepthUSD)
                    )}
                    isDown={item.delta.saversDepthUSD < 0}
                  />
                )}
            </span>
          );
        },
      },
      {
        label: "Savers Depth",
        sortKey: "saversDepth",
        renderCell: (item: SaverRow) => {
          return (
            <span className={styles.mono}>
              {formatBaseAmount(item.saversDepth)}
              {item.delta?.saversDepth !== undefined &&
                item.delta.saversDepth !== 0 && (
                  <ProgressIcon
                    dataNumber={smallBaseAmountFormat(
                      Math.abs(item.delta.saversDepth)
                    )}
                    isDown={item.delta.saversDepth < 0}
                  />
                )}
              <span
                className={styles["extra-text"]}
                style={{ fontSize: "0.6rem", fontWeight: "bold" }}
              >
                {showAsset(item.asset)}
              </span>
            </span>
          );
        },
      },
      {
        label: "Savers / Depth",
        sortKey: "saversDepthRatio",
        renderCell: (item: SaverRow) => {
          return (
            <span className={styles.mono}>
              {formatPercentageRatio(item.saversDepthRatio, 2)}
              {item.delta?.saversDepthRatio !== undefined &&
                item.delta.saversDepthRatio !== 0 && (
                  <ProgressIcon
                    dataNumber={formatPercentageRatio(
                      Math.abs(item.delta.saversDepthRatio),
                      2
                    )}
                    isDown={item.delta.saversDepthRatio < 0}
                  />
                )}
            </span>
          );
        },
        headerRender: () => (
          <div className={`${styles["table-asset"]} ${styles.end}`}>
            Savers / Depth
            <GlassmorphismTooltip
              content="Savers depth to the Asset Depth in the pool"
              placement="top"
            >
              <InfoIcon
                className={styles["header-icon"]}
                width={16}
                height={16}
                fill="currentColor"
              />
            </GlassmorphismTooltip>
          </div>
        ),
      },
      {
        label: "Savers Filled",
        sortKey: "filled",
        renderCell: (item: SaverRow) => {
          return (
            <span className={styles.mono}>
              {formatPercentageRatio(item.filled, 2)}
              {item.delta?.filled !== undefined && item.delta.filled !== 0 && (
                <ProgressIcon
                  dataNumber={formatPercentageRatio(
                    Math.abs(item.delta.filled),
                    2
                  )}
                  isDown={item.delta.filled < 0}
                />
              )}
            </span>
          );
        },
        headerRender: () => (
          <div className={`${styles["table-asset"]} ${styles.end}`}>
            Savers Filled
            <GlassmorphismTooltip
              content="Savers depth to the max synth per pool depth threshold"
              placement="top"
            >
              <InfoIcon
                className={styles["header-icon"]}
                width={16}
                height={16}
                fill="currentColor"
              />
            </GlassmorphismTooltip>
          </div>
        ),
      },
      {
        label: "Savers Count",
        sortKey: "saversCount",
        renderCell: (item: SaverRow) => {
          return (
            <span className={styles.mono}>
              {formatNormalNumber(item.saversCount)}
              {item.delta?.saversCount !== undefined &&
                item.delta.saversCount !== 0 && (
                  <ProgressIcon
                    dataNumber={Math.abs(item.delta.saversCount)}
                    isDown={item.delta.saversCount < 0}
                  />
                )}
            </span>
          );
        },
        hidden: networkEnv === "stagenet",
      },
      {
        label: "Savers APR",
        sortKey: "saversReturn",
        renderCell: (item: SaverRow) => {
          return (
            <span className={styles.mono}>
              {formatPercentageRatio(item.saversReturn, 2)}
              {item.delta?.saversReturn !== undefined &&
                item.delta.saversReturn !== 0 && (
                  <ProgressIcon
                    dataNumber={formatPercentageRatio(
                      Math.abs(item.delta.saversReturn),
                      2
                    )}
                    isDown={item.delta.saversReturn < 0}
                  />
                )}
            </span>
          );
        },
        headerRender: () => (
          <div className={`${styles["table-asset"]} ${styles.end}`}>
            Savers APR
            <GlassmorphismTooltip
              content="This week savers yield based on its depth and units growth over an extended of a year"
              placement="top"
            >
              <InfoIcon
                className={styles["header-icon"]}
                width={16}
                height={16}
                fill="currentColor"
              />
            </GlassmorphismTooltip>
          </div>
        ),
      },
    ];

    return columns.filter((col) => !col.hidden);
  }, [networkEnv, getFormattedValue]);

  const formatSaversInfo = useCallback(() => {
    const ret: SaverRow[] = [];
    for (const asset of Object.keys(saversInfo)) {
      const s = saversInfo[asset];
      const delta: Record<string, number> = {};

      eachLod(s.oldSavers, (v, k) => {
        if (k in s.savers) {
          delta[k] = +s.savers[k as keyof typeof s.savers] - +v;
        }
      });

      ret.push({
        id: asset,
        asset: s.savers.asset,
        saversDepthUSD: +s.savers.assetPriceUSD * +s.savers.saversDepth,
        saversDepth: +s.savers.saversDepth,
        saversDepthRatio: +s.savers.saversDepth / +s.savers.assetDepth,
        filled: +s.savers.filled,
        saversCount: +s.savers.saversCount,
        saversReturn: +s.savers.saversReturn,
        delta: {
          ...delta,
          saversDepthUSD:
            (+s.savers.saversDepth - +s.oldSavers.saversDepth) *
            +s.savers.assetPriceUSD,
        },
      });
    }

    return ret;
  }, [saversInfo]);

  const fillSaversTotal = useCallback(() => {
    if (!saversInfo || Object.keys(saversInfo).length === 0) return;

    const g = {
      saversCount: 0,
      totalUSDSaved: 0,
      totalEarn: 0,
      meanAPR: 0,
      totalFilled: 0,
    };

    const o = {
      saversCount: 0,
      totalUSDSaved: 0,
      totalEarn: 0,
      meanAPR: 0,
      totalFilled: 0,
    };

    eachLod(saversInfo, (v) => {
      g.saversCount += v.savers.saversCount;
      g.totalUSDSaved += (v.savers.saversDepth * +v.savers.assetPriceUSD) / 1e8;
      g.totalEarn += (v.savers.earned * +v.savers.assetPriceUSD) / 1e8;
      g.meanAPR += +v.savers.saversReturn / saversRow.length;
      g.totalFilled += +v.savers.filled;
    });

    eachLod(saversInfo, (v) => {
      o.saversCount += v.oldSavers.saversCount;
      o.totalUSDSaved +=
        (v.oldSavers.saversDepth * +v.savers.assetPriceUSD) / 1e8;
      o.totalEarn += (v.oldSavers.earned * +v.savers.assetPriceUSD) / 1e8;
      o.meanAPR += +v.oldSavers.saversReturn / saversRow.length;
      o.totalFilled += +v.oldSavers.filled;
    });

    setSaversGeneralStats([
      {
        name: "Total Savers",
        value: g.saversCount,
        isDown: g.saversCount < o.saversCount,
      },
      {
        name: "Total Value",
        value: "$" + formatVueNumber(g.totalUSDSaved || 0, "0,0a"),
        isDown: g.totalUSDSaved < o.totalUSDSaved,
      },
      {
        name: "Total Earned",
        value: "$" + formatVueNumber(g.totalEarn || 0, "0,0a"),
        isDown: g.totalEarn < o.totalEarn,
      },
      {
        name: "APR Mean",
        value: formatPercentageRatio(g.meanAPR, 2),
        isDown: g.meanAPR < o.meanAPR,
      },
    ]);
  }, [saversInfo, saversRow.length]);

  const gotoSaver = useCallback(
    (item: SaverRow) => {
      router.push(`/savers/${item.asset}`);
    },
    [router]
  );

  const getRowProps = useCallback(
    (item: TableData) => {
      const saverRow = item as SaverRow;
      return {
        onClick: () => gotoSaver(saverRow),
        style: { cursor: "pointer" },
      };
    },
    [gotoSaver]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [saversData, mimirData] = await Promise.all([
          getSaversInfo(),
          getMimir(),
        ]);

        if (!saversData) {
          setLoading(false);
          return;
        }

        let saversInfoObj: Record<string, SaverInfo>;
        if (Array.isArray(saversData)) {
          saversInfoObj = {};
          saversData.forEach((saver: any) => {
            if (saver.asset || saver.savers?.asset) {
              const asset = saver.asset || saver.savers?.asset;
              saversInfoObj[asset] = saver;
            }
          });
        } else {
          saversInfoObj = saversData as Record<string, SaverInfo>;
        }

        setSaversInfo(saversInfoObj);

        if (mimirData?.MAXSYNTHPERPOOLDEPTH) {
          setMaxSaverCap((mimirData.MAXSYNTHPERPOOLDEPTH * 2) / 10e3);
        }
      } catch (e) {
        console.error(e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (saversInfo && Object.keys(saversInfo).length > 0) {
      const formatted = formatSaversInfo();
      setSaversRow(formatted);
    }
  }, [saversInfo, formatSaversInfo]);

  useEffect(() => {
    if (saversRow.length > 0) {
      fillSaversTotal();
    }
  }, [saversRow, fillSaversTotal]);

  const sortedSaversRow = useMemo(() => {
    if (networkEnv === "mainnet") {
      return [...saversRow].sort((a, b) => b.saversDepthUSD - a.saversDepthUSD);
    }
    return saversRow;
  }, [saversRow, networkEnv]);

  return (
    <div>
      <CardsHeader tableGeneralStats={saversGeneralStats} />
      <Page error={error} fluid={false}>
        <Card title="Savers">
          {loading ? (
            <TableLoader
              cols={cols.map((col) => ({
                label: col.label,
                field: col.sortKey || "id",
              }))}
            />
          ) : (
            <Table
              columns={cols}
              data={sortedSaversRow}
              loading={loading}
              onSortChange={() => {}}
              onRowSelectChange={() => {}}
              rowProps={getRowProps}
              enableSort={true}
              enableSelect={false}
              className="vgt-table net-table"
              emptyMessage="No savers data available"
              customTheme={customTheme}
            />
          )}
        </Card>
      </Page>
      {saversRow && saversRow.length > 0 && (
        <div className={styles["footer-stat"]}>
          <small>
            <sup>*</sup>
            All of the stat changes are based on 24 hours period
          </small>
        </div>
      )}
    </div>
  );
};

export default SaversPage;
