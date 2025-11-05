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
import { formatAsset, synthToAsset } from "@/utils";
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
  [key: string]: any;
}

interface AssetsResponse {
  supply: SynthAsset[];
  [key: string]: any;
}

interface ThorPool {
  asset: string;
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
  synth_units?: string;
  synth_supply?: string;
  asset_depth?: string;
  savers_depth?: string;
  units?: string;
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

  const numberFormat = useCallback((number: number | string) => {
    return number ? smallBaseAmountFormat(+number, formatVueNumber) : "-";
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
                : " - "}
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

  const loadSynthUtils = useCallback(() => {
    try {
      if (!synthAssets || !pools) return;

      const synthUtils: SynthUtil[] = [];
      for (const asset of synthAssets.supply) {
        if (asset.denom === "bnb/bnb") {
          continue;
        }
        const assetName = synthToAsset(asset.denom);
        const pool = pools.find((p) => p.asset === assetName);
        synthUtils.push({
          asset: assetName,
          synth: asset.denom,
          synth_units: pool?.synth_units,
          synth_supply: pool?.synth_supply,
          asset_depth: pool?.balance_asset,
          savers_depth: pool?.savers_depth,
          units: pool?.pool_units,
        });
      }
      setSynthUtils(synthUtils);

      const newRows: SynthRow[] = synthUtils.map((asset) => ({
        id: asset.asset,
        asset: asset?.asset,
        synth: asset?.synth,
        utilisation:
          (+asset?.synth_supply! / (+asset?.asset_depth! * 2)) * (1 / synthCap),
        isPol: +asset?.synth_supply! / (+asset?.asset_depth! * 2) >= polCap,
        saverPercentage:
          +asset?.synth_supply! > 0
            ? +asset?.savers_depth! / +asset?.synth_supply!
            : 0,
        supply: +asset?.synth_supply! / 10 ** 8,
      }));

      setRows(newRows);

      if (midgardPools) {
        updateGeneralStats(midgardPools);
      }
    } catch (error) {
      console.error(error);
    }
  }, [synthAssets, pools, synthCap, polCap, midgardPools]);

  const updateGeneralStats = useCallback(
    (pools: any[]) => {
      if (!synthUtils || synthUtils.length === 0) return;

      const totalSynthSupply = synthUtils.reduce((total, o) => {
        if (o.synth_supply && +o.synth_supply > 0) {
          return total + (amountToUSD(o.asset, o.synth_supply, pools) || 0);
        } else {
          return total;
        }
      }, 0);

      const totalPoolDepth = synthUtils.reduce((total, o) => {
        if (o.asset_depth && +o.asset_depth > 0) {
          return total + (amountToUSD(o.asset, +o.asset_depth * 2, pools) || 0);
        } else {
          return total;
        }
      }, 0);

      const totalSaversDepth = synthUtils.reduce((total, o) => {
        if (o.savers_depth && +o.savers_depth > 0) {
          return total + (amountToUSD(o.asset, o.savers_depth, pools) || 0);
        } else {
          return total;
        }
      }, 0);

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
    },
    [synthUtils, polCap]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [synthAssetsResponse, poolsResponse, mimirDataResponse] =
          await Promise.all([getAssets(), getThorPools(), getMimir()]);

        setSynthAssets(synthAssetsResponse);
        setPools(poolsResponse);
        setMimirData(mimirDataResponse);

        const polCapValue =
          ((mimirDataResponse.POLTARGETSYNTHPERPOOLDEPTH || 0) +
            (mimirDataResponse.POLBUFFER || 0)) /
          10000;
        const synthCapValue =
          (mimirDataResponse.MAXSYNTHPERPOOLDEPTH || 0) / 10000;

        setPolCap(polCapValue);
        setSynthCap(synthCapValue);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (synthAssets && pools && synthCap > 0) {
      loadSynthUtils();
    }
  }, [synthAssets, pools, synthCap, loadSynthUtils]);

  useEffect(() => {
    if (midgardPools && synthUtils && synthUtils.length > 0) {
      updateGeneralStats(midgardPools);
    }
  }, [midgardPools, synthUtils, updateGeneralStats]);

  return (
    <div>
      <CardsHeader tableGeneralStats={synthsGeneralStats} />
      <Card title="Synth Assets">
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
            data={rows}
            loading={loading}
            onSortChange={() => {}}
            onRowSelectChange={() => {}}
            enableSort={true}
            enableSelect={false}
            className="vgt-table net-table"
            emptyMessage="No synth assets available"
          />
        )}
      </Card>
    </div>
  );
};

export default SynthsPage;
