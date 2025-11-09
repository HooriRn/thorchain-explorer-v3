"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRunePrice } from "@/lib/store";
import {
  getSecuredAssets,
  getThorPools,
  getAsgard,
  getPoolsHistory,
} from "@/lib/api";
import {
  formatAsset,
  securedToAsset,
  assetFromString,
  assetToSecure,
} from "@/utils";
import { baseAmountFormat, formatCurrency } from "@/utils/global";
import { formatVueNumber, formatPercent } from "@/utils/format";
import Page from "@/components/PageContainer";
import Card from "@/components/ui/Card";
import CardsHeader from "@/components/CardsHeader";
import TableLoader from "@/components/TableLoader";
import { Table, TableColumn, TableData } from "@/components/table";
import AssetIcon from "@/components/AssetIcon";
import UsdIcon from "@/assets/images/usd.svg";
import UsdFillIcon from "@/assets/images/usd-fill.svg";
import GlassmorphismTooltip from "@/components/GlassmorphismTooltip";
import styles from "./secured.module.css";

type SecuredAsset = any;
type ThorPool = any;
type Vault = any;
type PoolHistory = any;

interface SecuredRow extends TableData {
  asset: string;
  assetImage: string;
  securedDepth: number;
  volume24h: number;
  securedDepthRatio: number;
  depth: number;
  price: number;
  vaultDepth: number;
  vaultRatio: number;
  depthRatio: number;
  [key: string]: any;
}

interface TableGeneralStat {
  name: string;
  value?: string | number;
}

const SecuredPage: React.FC = () => {
  const runePrice = useRunePrice();

  const [rows, setRows] = useState<SecuredRow[]>([]);
  const [tradingGeneralStats, setTradingGeneralStats] = useState<
    TableGeneralStat[]
  >([]);
  const [usdDenom, setUsdDenom] = useState(false);
  const [error, setError] = useState(false);
  const [securedAssets, setSecuredAssets] = useState<any>(undefined);
  const [pools, setPools] = useState<any>(undefined);
  const [asgard, setAsgard] = useState<any>(undefined);
  const [poolsHistory, setPoolsHistory] = useState<any>(undefined);
  const [loading, setLoading] = useState(true);

  const baseAmountFormatFn = useCallback(
    (number: number | string | null | undefined) => {
      return baseAmountFormat(number, formatVueNumber);
    },
    []
  );

  const formatCurrencyFn = useCallback(
    (value: number | string | null | undefined) => {
      if (value === null || value === undefined) return "-";
      return formatCurrency(value, (v: number) =>
        formatVueNumber(v, "0,0.00a")
      );
    },
    []
  );

  const securedToAssetFn = useCallback((asset: string) => {
    return assetFromString(asset)?.ticker;
  }, []);

  const fillSecuredData = useCallback(
    (
      securedAssets: any[],
      pools: any[],
      asgard: any[],
      poolsHistory: any,
      usdDenom: boolean,
      runePrice: number
    ): { rows: SecuredRow[]; stats: TableGeneralStat[] } => {
      const assetPerVault: { [key: string]: number } = {};
      const asgardCoins = asgard.map((a: any) => a.coins);
      for (let i = 0; i < asgardCoins.length; i++) {
        const v = asgardCoins[i];
        for (let j = 0; j < v.length; j++) {
          const { asset, amount } = v[j];
          if (!assetPerVault[asset]) {
            assetPerVault[asset] = +amount;
          } else {
            assetPerVault[asset] += +amount;
          }
        }
      }

      const volume24hMap: { [key: string]: number } = {};
      const poolsToProcess = poolsHistory?.pools || poolsHistory;

      if (Array.isArray(poolsToProcess)) {
        poolsToProcess.forEach((pool: any) => {
          const securedAsset = assetToSecure(pool.pool);
          if (securedAsset) {
            volume24hMap[securedAsset] = (pool.securedVolume || 0) / 1e2;
          }
        });
      }

      let totalSecuredDepth = 0;
      const ret: SecuredRow[] = [];
      for (const asset of securedAssets) {
        const securedDepth = +asset.depth || 0;
        const securedSupply = +asset.supply || 0;
        const assetName = securedToAsset(asset.asset);
        const pool = pools.find((p: any) => p.asset === assetName);
        const vaultDepth = assetPerVault[assetName] || 0;

        if (!pool) {
          continue;
        }

        let assetPrice = 1;
        if (usdDenom) {
          assetPrice = (pool?.balance_rune / pool?.balance_asset) * runePrice;
        }

        totalSecuredDepth +=
          (asset.depth / 1e8) *
          (pool?.balance_rune / pool?.balance_asset) *
          runePrice;

        ret.push({
          ...asset,
          id: asset.asset,
          assetImage: assetName,
          asset: asset.asset,
          securedDepth: securedDepth * assetPrice,
          volume24h: volume24hMap[asset.asset] || 0,
          securedDepthRatio: securedSupply / pool?.balance_asset || 0,
          depth: asset.depth * assetPrice || 0,
          price: assetPrice,
          vaultDepth: vaultDepth * assetPrice || 0,
          vaultRatio: vaultDepth / pool?.balance_asset || 0,
          depthRatio: asset.depth / pool?.balance_asset || 0,
        });
      }

      let totalVaultDepth = 0;
      let totalPoolDepth = 0;
      for (const pool of pools) {
        const assetName = pool.asset;
        const vaultDepth = assetPerVault[assetName];
        if (!vaultDepth) {
          continue;
        }

        totalVaultDepth +=
          ((vaultDepth ?? 0) / 1e8) *
          (pool?.balance_rune / pool?.balance_asset) *
          runePrice;
        totalPoolDepth += (pool?.balance_rune / 1e8) * runePrice;
      }

      const stats: TableGeneralStat[] = [
        {
          name: "Total secured Depth",
          value: "$" + formatVueNumber(totalSecuredDepth || 0, "0,0.00a"),
        },
        {
          name: "Total Vault Depth",
          value: "$" + formatVueNumber(totalVaultDepth || 0, "0,0.00a"),
        },
        {
          name: "Total Vault / Pool",
          value:
            totalPoolDepth > 0
              ? formatPercent(totalVaultDepth / totalPoolDepth)
              : "0%",
        },
        {
          name: "Total secured / Pool",
          value:
            totalPoolDepth > 0
              ? formatPercent(totalSecuredDepth / totalPoolDepth, 2)
              : "0%",
        },
      ];

      return { rows: ret, stats };
    },
    []
  );

  const toggleUSD = useCallback(() => {
    setUsdDenom((prev) => !prev);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(false);

        const securedAssetsData = await getSecuredAssets();
        const poolsData = await getThorPools();
        const asgardData = await getAsgard();
        const poolsHistoryData = await getPoolsHistory();

        setSecuredAssets(securedAssetsData);
        setPools(poolsData);
        setAsgard(asgardData);
        setPoolsHistory(poolsHistoryData);
      } catch (e) {
        setError(true);
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (
      securedAssets &&
      Array.isArray(securedAssets) &&
      securedAssets.length > 0 &&
      pools &&
      Array.isArray(pools) &&
      pools.length > 0 &&
      asgard &&
      Array.isArray(asgard) &&
      asgard.length > 0 &&
      poolsHistory !== undefined
    ) {
      const { rows: newRows, stats: newStats } = fillSecuredData(
        securedAssets,
        pools,
        asgard,
        poolsHistory,
        usdDenom,
        runePrice || 0
      );

      const sortedRows = [...newRows].sort(
        (a, b) => (b.securedDepth || 0) - (a.securedDepth || 0)
      );
      setRows(sortedRows);
      setTradingGeneralStats(newStats);
    }
  }, [
    securedAssets,
    pools,
    asgard,
    poolsHistory,
    usdDenom,
    runePrice,
    fillSecuredData,
  ]);

  const cols = useMemo<TableColumn<SecuredRow>[]>(() => {
    return [
      {
        label: "Asset",
        sortKey: "asset",
        renderCell: (item: SecuredRow) => {
          return (
            <GlassmorphismTooltip content={item.asset} placement="top">
              <div className={styles["cell-content"]}>
                <AssetIcon asset={item.assetImage} chain="THOR.RUNE" />
                <span>{formatAsset(item.asset)}</span>
              </div>
            </GlassmorphismTooltip>
          );
        },
      },
      {
        label: "Secured Depth",
        sortKey: "securedDepth",
        className: "mono end",
        headerRender: () => (
          <div className={`${styles["table-asset"]} ${styles.end}`}>
            Secured Depth
          </div>
        ),
        renderCell: (item: SecuredRow) => {
          if (item.securedDepth) {
            return (
              <span className={`${styles.mono} ${styles.end}`}>
                {usdDenom && <span>$</span>}
                {baseAmountFormatFn(item.securedDepth)}
                {!usdDenom && <small>{securedToAssetFn(item.asset)}</small>}
              </span>
            );
          }
          return <span>-</span>;
        },
      },
      {
        label: "Volume 24H",
        sortKey: "volume24h",
        className: "mono",
        renderCell: (item: SecuredRow) => {
          if (item.volume24h !== null && item.volume24h !== undefined) {
            return (
              <span className={styles.mono}>
                {formatCurrencyFn(item.volume24h)}
              </span>
            );
          }
          return <span>-</span>;
        },
      },
      {
        label: "Secured / Depth",
        sortKey: "securedDepthRatio",
        className: "mono",
        renderCell: (item: SecuredRow) => {
          if (
            item.securedDepthRatio !== null &&
            item.securedDepthRatio !== undefined
          ) {
            return (
              <span className={styles.mono}>
                {formatPercent(item.securedDepthRatio)}
              </span>
            );
          }
          return <span>-</span>;
        },
      },
    ];
  }, [usdDenom, baseAmountFormatFn, formatCurrencyFn, securedToAssetFn]);

  const customTheme = {
    Table: `
      --data-table-library_grid-template-columns: auto auto auto auto;
    `,
    HeaderCell: `
      &:nth-child(2) {
        text-align: right;
      }
    `,
    Cell: `
      &:nth-child(2) {
        text-align: right;
      }
    `,
  };

  return (
    <Page error={error} fluid={false}>
      <div>
        <CardsHeader tableGeneralStats={tradingGeneralStats} />
        <Card
          title="Secured Assets"
          header={
            <button
              className={`${styles["button-container"]} ${styles["full-screen-btn"]}`}
              onClick={toggleUSD}
            >
              {usdDenom ? (
                <UsdFillIcon className={styles["btn-icon"]} />
              ) : (
                <UsdIcon className={styles["btn-icon"]} />
              )}
            </button>
          }
        >
          {loading ? (
            <TableLoader
              cols={cols.map((col) => ({
                label: col.label,
                field: col.sortKey || col.label.toLowerCase(),
              }))}
            />
          ) : rows.length > 0 ? (
            <Table
              columns={cols}
              data={rows}
              loading={false}
              enableSort={true}
              enableSelect={false}
              onSortChange={() => {}}
              onRowSelectChange={() => {}}
              customTheme={customTheme}
              className="vgt-table net-table"
            />
          ) : (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              {error
                ? "Error loading data. Please try again later."
                : "No secured assets data available."}
            </div>
          )}
        </Card>
      </div>
    </Page>
  );
};

export default SecuredPage;
