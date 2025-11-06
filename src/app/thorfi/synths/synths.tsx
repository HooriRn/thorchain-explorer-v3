"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { getAssets, getThorPools, getMimir } from "@/lib/api";
import { usePools } from "@/lib/store";
import Card from "@/components/ui/Card";
import CardsHeader from "@/components/CardsHeader";
import TableLoader from "@/components/TableLoader";
import Table from "@/components/table/Table";
import AssetIcon from "@/components/AssetIcon";
import GlassmorphismTooltip from "@/components/GlassmorphismTooltip";
import InfoIcon from "@/assets/images/info.svg";
import NewPagination from "@/components/NewPagination";
import {
  formatAsset,
  synthToAsset,
  assetFromString,
  assetToString,
} from "@/utils";
import { showAsset, amountToUSD } from "@/utils/global";
import {
  formatVueNumber,
  formatPercent,
  smallBaseAmountFormat,
} from "@/utils/format";
import { TableColumn, TableData } from "@/components/table/types";
import styles from "./synths.module.css";

interface SynthAsset {
  denom: string;
  amount?: string;
  [key: string]: any;
}

interface AssetsResponse {
  supply?: SynthAsset[];
  [key: string]: any;
}

interface ThorPool {
  asset?: string;
  synth_units?: string;
  synth_supply?: string;
  balance_asset?: string;
  savers_depth?: string;
  pool_units?: string;
  [key: string]: any;
}

interface MimirData {
  POLTARGETSYNTHPERPOOLDEPTH?: number;
  POLBUFFER?: number;
  MAXSYNTHPERPOOLDEPTH?: number;
  [key: string]: any;
}

interface SynthUtil {
  asset: string;
  synth: string;
  synth_units?: string | undefined;
  synth_supply?: string | undefined;
  asset_depth?: string | undefined;
  savers_depth?: string | undefined;
  units?: string | undefined;
}

interface SynthRow extends TableData {
  asset: string;
  synth: string;
  utilisation: number;
  isPol: boolean;
  saverPercentage: number;
  supply: number;
}

interface TableGeneralStat {
  name: string;
  value?: string | number;
  description?: string;
}

const SynthsPage: React.FC = () => {
  const midgardPools = usePools();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [synthsGeneralStats, setSynthsGeneralStats] = useState<
    TableGeneralStat[]
  >([
    {
      name: "Total Synth Supply",
    },
    {
      name: "Total Utilisation",
    },
    {
      name: "Total Saver Percentage",
    },
    {
      name: "POL Cap",
    },
  ]);
  const [rows, setRows] = useState<SynthRow[]>([]);
  const [pools, setPools] = useState<ThorPool[]>([]);
  const [synthAssets, setSynthAssets] = useState<AssetsResponse | null>(null);
  const [synthUtils, setSynthUtils] = useState<SynthUtil[]>([]);
  const [mimirData, setMimirData] = useState<MimirData>({});
  const [polCap, setPolCap] = useState(0);
  const [synthCap, setSynthCap] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 30;

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      if (a.utilisation !== b.utilisation) {
        return b.utilisation - a.utilisation;
      }
      return 0;
    });
  }, [rows]);

  useEffect(() => {
    const totalPages = Math.ceil(sortedRows.length / perPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [sortedRows.length, currentPage, perPage]);

  const numberFormat = useCallback((number: number | string) => {
    return number ? formatVueNumber(+number, "0,0.0000") : "-";
  }, []);

  const cols = useMemo<TableColumn[]>(() => {
    return [
      {
        label: "Asset",
        sortKey: "asset",
        renderCell: (item: SynthRow) => {
          return (
            <div className={styles["cell-content"]} title={item.asset}>
              <AssetIcon asset={item.asset} chain="THOR.RUNE" />
              <span>{formatAsset(item.asset)}</span>
            </div>
          );
        },
      },
      {
        label: "Synth",
        sortKey: "synth",
        renderCell: (item: SynthRow) => {
          return <span title={item.synth}>{formatAsset(item.synth)}</span>;
        },
      },
      {
        label: "Saver %",
        sortKey: "saverPercentage",
        headerRender: () => (
          <div className={`${styles["table-asset"]} ${styles.end}`}>
            Saver %
            <GlassmorphismTooltip
              content="Savers depth to the Synth Supply"
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
        renderCell: (item: SynthRow) => {
          return (
            <span className={styles.mono}>
              {item.saverPercentage !== 0 && !isNaN(item.saverPercentage)
                ? formatPercent(item.saverPercentage, 2)
                : " 0.00% "}
            </span>
          );
        },
      },
      {
        label: "Utilisation",
        sortKey: "utilisation",
        headerRender: () => (
          <div className={`${styles["table-asset"]} ${styles.end}`}>
            Utilisation
            <GlassmorphismTooltip
              content={`Synth supply to the Pool Depth relative to the Synth cap (${formatPercent(
                synthCap
              )})`}
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
        renderCell: (item: SynthRow) => {
          if (item.utilisation < 1) {
            return (
              <span className={styles.mono}>
                {formatPercent(item.utilisation, 2)}
                {item.isPol && (
                  <span style={{ color: "var(--primary-color)" }}>
                    {" "}
                    (POL Cap)
                  </span>
                )}
              </span>
            );
          }
          return (
            <span style={{ color: "var(--primary-color)" }}> Filled </span>
          );
        },
      },
      {
        label: "Supply",
        sortKey: "supply",
        renderCell: (item: SynthRow) => {
          return (
            <span className={styles.mono}>
              {numberFormat(item.supply)}
              <span className={styles["extra-text"]}>
                {" "}
                {showAsset(item.asset)}
              </span>
            </span>
          );
        },
      },
    ];
  }, [synthCap, numberFormat]);

  const updateGeneralStats = useCallback(
    (pools: any) => {
      if (!synthUtils || synthUtils.length === 0 || !pools) {
        return;
      }

      const poolsArray = Array.isArray(pools) ? pools : Object.values(pools);

      try {
        console.log("🔍 Checking synth_supply in synthUtils:", {
          synthUtilsLength: synthUtils.length,
          sampleSynthUtils: synthUtils.slice(0, 5).map((o) => ({
            asset: o.asset,
            synth_supply: o.synth_supply,
            hasSynthSupply: !!o.synth_supply,
            synthSupplyNumber: o.synth_supply ? +o.synth_supply : 0,
          })),
        });

        const totalSynthSupply = synthUtils.reduce((total, o) => {
          if ((o.synth_supply as any) > 0) {
            const usdValue = amountToUSD(o.asset, o.synth_supply, poolsArray);
            console.log("💰 Synth Supply USD calculation:", {
              asset: o.asset,
              synth_supply: o.synth_supply,
              usdValue,
              total,
              poolsArrayLength: poolsArray.length,
              samplePoolAssets: poolsArray.slice(0, 5).map((p: any) => ({
                asset: p?.asset,
                price: p?.assetPriceUSD,
              })),
            });
            return total + (usdValue || 0);
          } else {
            return total;
          }
        }, 0);

        const totalPoolDepth = synthUtils.reduce((total, o) => {
          if ((o.asset_depth as any) > 0) {
            const usdValue = amountToUSD(
              o.asset,
              (o.asset_depth as any) * 2,
              poolsArray
            );
            return total + (usdValue || 0);
          } else {
            return total;
          }
        }, 0);

        const totalSaversDepth = synthUtils.reduce((total, o) => {
          if ((o.savers_depth as any) > 0) {
            const usdValue = amountToUSD(o.asset, o.savers_depth, poolsArray);
            return total + (usdValue || 0);
          } else {
            return total;
          }
        }, 0);

        console.log("📊 Total Stats:", {
          totalSynthSupply,
          totalPoolDepth,
          totalSaversDepth,
          utilisation:
            totalPoolDepth > 0 ? totalSynthSupply / totalPoolDepth : 0,
          saverPercentage:
            totalSynthSupply > 0 ? totalSaversDepth / totalSynthSupply : 0,
        });

        setSynthsGeneralStats([
          {
            name: "Total Synth Supply",
            value: "$" + formatVueNumber(totalSynthSupply || 0, "0,0a"),
            description: "Total synth asset in the protocol",
          },
          {
            name: "Total Utilisation",
            value: formatPercent(
              totalPoolDepth > 0 ? totalSynthSupply / totalPoolDepth : 0
            ),
            description: "Total Synth Supply (USD) / Total Pool Depth (USD)",
          },
          {
            name: "Total Saver Percentage",
            value: formatPercent(
              totalSynthSupply > 0 ? totalSaversDepth / totalSynthSupply : 0
            ),
            description: "Total Savers Depth (USD) / Total Synth Supply (USD)",
          },
          {
            name: "POL Cap",
            value: formatPercent(polCap),
            description: "POL synth per pool depth + POL Buffer",
          },
        ]);
      } catch (error) {
        console.error("Error updating general stats:", error);
      }
    },
    [synthUtils, polCap]
  );

  const loadSynthUtils = useCallback(() => {
    try {
      if (!synthAssets || !pools || !synthAssets.supply) {
        return;
      }

      const synthUtils: SynthUtil[] = [];

      for (const asset of synthAssets.supply) {
        if (asset.denom === "bnb/bnb") {
          continue;
        }
        const assetName = synthToAsset(asset.denom);

        if (!assetName) {
          continue;
        }

        let pool = pools.find((p) => p.asset === assetName);

        if (!pool) {
          pool = pools.find(
            (p) => p.asset?.toUpperCase() === assetName?.toUpperCase()
          );
        }

        if (!pool && assetName) {
          const variations = [
            assetName,
            assetName.replace(/\./g, "/"),
            assetName.replace(/\//g, "."),
            assetName.replace(/\./g, "-"),
            assetName.replace(/-/g, "."),
          ];

          for (const variation of variations) {
            pool = pools.find((p) => p.asset === variation);
            if (pool) break;

            pool = pools.find(
              (p) => p.asset?.toUpperCase() === variation.toUpperCase()
            );
            if (pool) break;
          }
        }

        synthUtils.push({
          asset: assetName,
          synth: asset.denom || "",
          synth_units: pool?.synth_units,
          synth_supply: pool?.synth_supply,
          asset_depth: pool?.balance_asset,
          savers_depth: pool?.savers_depth,
          units: pool?.pool_units,
        });
      }

      setSynthUtils(synthUtils);

      const newRows: SynthRow[] = synthUtils.map((asset) => {
        const synthSupply = +(asset?.synth_supply ?? 0);
        const assetDepth = +(asset?.asset_depth ?? 0);
        const saversDepth = +(asset?.savers_depth ?? 0);

        const supply = synthSupply / 10 ** 8;

        return {
          id: asset.asset,
          asset: asset?.asset || "",
          synth: asset?.synth || "",
          utilisation:
            isNaN(synthSupply) || assetDepth === 0 || isNaN(assetDepth)
              ? 0
              : (synthSupply / (assetDepth * 2)) * (1 / synthCap),
          isPol:
            isNaN(synthSupply) || assetDepth === 0 || isNaN(assetDepth)
              ? false
              : synthSupply / (assetDepth * 2) >= polCap,
          saverPercentage:
            isNaN(synthSupply) || synthSupply === 0 || isNaN(saversDepth)
              ? 0
              : saversDepth / synthSupply,
          supply: isNaN(supply) ? 0 : supply,
        };
      });

      setRows(newRows);
    } catch (error) {
      console.error("Error loading synth utils:", error);
      setError("Failed to process synth data");
    }
  }, [synthAssets, pools, synthCap, polCap]);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [synthAssetsResponse, poolsResponse, mimirDataResponse] =
          await Promise.all([getAssets(), getThorPools(), getMimir()]);

        if (!isMounted) return;

        if (!synthAssetsResponse || !poolsResponse || !mimirDataResponse) {
          throw new Error("Failed to fetch required data");
        }

        let assetsData: AssetsResponse;
        if (Array.isArray(synthAssetsResponse)) {
          assetsData = { supply: synthAssetsResponse as SynthAsset[] };
        } else if (
          synthAssetsResponse &&
          typeof synthAssetsResponse === "object"
        ) {
          if ("supply" in synthAssetsResponse) {
            assetsData = synthAssetsResponse as AssetsResponse;
          } else if ("amount" in synthAssetsResponse) {
            const responseAny = synthAssetsResponse as any;
            const amounts = Array.isArray(responseAny.amount)
              ? responseAny.amount
              : [];
            assetsData = {
              supply: amounts.map((item: any) => ({
                denom: item.denom || "",
                amount: item.amount || "0",
              })),
            };
          } else {
            const arrayKeys = Object.keys(synthAssetsResponse).filter((key) =>
              Array.isArray((synthAssetsResponse as any)[key])
            );
            if (arrayKeys.length > 0) {
              assetsData = {
                supply: (synthAssetsResponse as any)[
                  arrayKeys[0]
                ] as SynthAsset[],
              };
            } else {
              assetsData = { supply: [] };
            }
          }
        } else {
          assetsData = { supply: [] };
        }

        setSynthAssets(assetsData);
        setPools(Array.isArray(poolsResponse) ? poolsResponse : []);
        setMimirData(mimirDataResponse);

        const polCapValue =
          ((mimirDataResponse.POLTARGETSYNTHPERPOOLDEPTH || 0) +
            (mimirDataResponse.POLBUFFER || 0)) /
          10000;
        const synthCapValue =
          (mimirDataResponse.MAXSYNTHPERPOOLDEPTH || 0) / 10000;

        setPolCap(polCapValue);
        setSynthCap(synthCapValue);
      } catch (error: any) {
        console.error("Error fetching synth data:", error);
        if (isMounted) {
          setError(
            error?.message ||
              "Failed to load synth data. Please try again later."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    if (synthAssets && pools && pools.length > 0) {
      loadSynthUtils();
    }
  }, [synthAssets, pools, synthCap, polCap, loadSynthUtils]);

  useEffect(() => {
    if (
      midgardPools &&
      Object.keys(midgardPools).length > 0 &&
      synthUtils &&
      synthUtils.length > 0
    ) {
      updateGeneralStats(midgardPools);
    }
  }, [midgardPools, synthUtils, updateGeneralStats]);

  return (
    <div>
      <CardsHeader tableGeneralStats={synthsGeneralStats} />
      <Card title="Synth Assets">
        {error ? (
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <p style={{ color: "var(--error-color, #ff4444)" }}>{error}</p>
            <button
              onClick={() => {
                setError(null);
                window.location.reload();
              }}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1rem",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <TableLoader
            cols={cols.map((col) => ({
              label: col.label,
              field: col.sortKey || "id",
            }))}
          />
        ) : (
          <>
            <Table
              columns={cols}
              data={sortedRows.slice(
                (currentPage - 1) * perPage,
                currentPage * perPage
              )}
              loading={loading}
              onSortChange={() => {
                setCurrentPage(1);
              }}
              onRowSelectChange={() => {}}
              enableSort={true}
              enableSelect={false}
              className="vgt-table net-table"
              emptyMessage="No synth assets available"
            />
            {sortedRows.length > perPage && (
              <NewPagination
                totalRows={sortedRows.length}
                perPage={perPage}
                currentPage={currentPage}
                onChange={setCurrentPage}
              />
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default SynthsPage;
