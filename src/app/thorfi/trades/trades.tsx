"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { getTradeAssets, getThorPools, getAsgard } from "@/lib/api";
import { formatAsset, tradeToAsset, assetFromString } from "@/utils";
import { baseAmountFormat } from "@/utils/global";
import { formatVueNumber, formatPercent } from "@/utils/format";
import Card from "@/components/ui/Card";
import CardsHeader from "@/components/CardsHeader";
import TableLoader from "@/components/TableLoader";
import Table from "@/components/table/Table";
import AssetIcon from "@/components/AssetIcon";
import UsdIcon from "@/assets/images/usd.svg";
import UsdFillIcon from "@/assets/images/usd-fill.svg";
import { TableColumn, TableData } from "@/components/table/types";
import styles from "./trades.module.css";

interface TradeAsset {
  asset: string;
  depth: number;
  units?: number;
  [key: string]: any;
}

interface ThorPool {
  asset: string;
  balance_rune: number;
  balance_asset: number;
  [key: string]: any;
}

interface Vault {
  coins: Array<{ asset: string; amount: string }>;
  [key: string]: any;
}

interface TradeRow extends TableData {
  asset: string;
  depth: number;
  depthRatio: number;
  vaultDepth: number;
  vaultRatio: number;
  units?: number;
  price: number;
  [key: string]: any;
}

interface TableGeneralStat {
  name: string;
  value?: string | number;
}
const customTheme = {
  Table: `
    --data-table-library_grid-template-columns: auto auto auto auto auto auto ;
  `,
  HeaderCell: `

  &:nth-child(6) {
    text-align: left;
  }
`,
Cell: `  

 
  &:nth-child(6) {
    text-align: right;
  }
`,
};
const TradesPage: React.FC = () => {
  const runePrice = useAppStore((state) => state.runePrice);

  const [rows, setRows] = useState<TradeRow[]>([]);
  const [tradingGeneralStats, setTradingGeneralStats] = useState<
    TableGeneralStat[]
  >([
    {
      name: "Total Trade Depth",
    },
    {
      name: "Total Vault Depth",
    },
    {
      name: "Total Vault / Pool",
    },
    {
      name: "Total Trade / Pool",
    },
  ]);
  const [usdDenom, setUsdDenom] = useState(false);
  const [error, setError] = useState(false);
  const [tradeAssets, setTradeAssets] = useState<TradeAsset[] | undefined>(
    undefined
  );
  const [pools, setPools] = useState<ThorPool[] | undefined>(undefined);
  const [asgard, setAsgard] = useState<Vault[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const baseAmountFormatFn = useCallback(
    (number: number | string | null | undefined) => {
      return baseAmountFormat(number, formatVueNumber);
    },
    []
  );

  const getTradeAssetTicker = useCallback((asset: string) => {
    const assetData = assetFromString(asset);
    return assetData?.ticker;
  }, []);

  const fillTradeData = useCallback(
    (
      tradeAssets: TradeAsset[],
      pools: ThorPool[],
      asgard: Vault[],
      usdDenom: boolean,
      runePrice: number
    ) => {
      const assetPerVault: { [key: string]: number } = {};
      const asgardCoins = asgard.map((a) => a.coins);
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

      let totalTradeDepth = 0;
      const ret: TradeRow[] = [];
      for (const asset of tradeAssets) {
        const assetName = tradeToAsset(asset.asset);
        const pool = pools.find((p) => p.asset === assetName);
        const vaultDepth = assetPerVault[assetName];

        if (!pool) {
          continue;
        }

        let assetPrice = 1;
        if (usdDenom) {
          assetPrice = (pool?.balance_rune / pool?.balance_asset) * runePrice;
        }

        totalTradeDepth +=
          (asset.depth / 1e8) *
          (pool?.balance_rune / pool?.balance_asset) *
          runePrice;

        ret.push({
          id: asset.asset,
          ...asset,
          depth: asset.depth * assetPrice ?? 0,
          price: assetPrice,
          vaultDepth: (vaultDepth ? vaultDepth * assetPrice : 0) ?? 0,
          vaultRatio: vaultDepth ? vaultDepth / pool?.balance_asset ?? 0 : 0,
          depthRatio: asset.depth / pool?.balance_asset ?? 0,
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

      setTradingGeneralStats([
        {
          name: "Total Trade Depth",
          value: "$" + formatVueNumber(totalTradeDepth || 0, "0,0a"),
        },
        {
          name: "Total Vault Depth",
          value: "$" + formatVueNumber(totalVaultDepth || 0, "0,0a"),
        },
        {
          name: "Total Vault / Pool",
          value: formatPercent(totalVaultDepth / totalPoolDepth),
        },
        {
          name: "Total Trade / Pool",
          value: formatPercent(totalTradeDepth / totalPoolDepth),
        },
      ]);

      return ret;
    },
    []
  );

  const toggleUSD = useCallback(() => {
    setUsdDenom((prev) => {
      const newUsdDenom = !prev;
      if (tradeAssets && pools && asgard) {
        const newRows = fillTradeData(
          tradeAssets,
          pools,
          asgard,
          newUsdDenom,
          runePrice
        );
        setRows(newRows);
      }
      return newUsdDenom;
    });
  }, [tradeAssets, pools, asgard, fillTradeData, runePrice]);

  const cols = useMemo<TableColumn[]>(() => {
    return [
      {
        label: "Asset",
        sortKey: "asset",
        renderCell: (item: TradeRow) => {
          return (
            <div className={styles["cell-content"]} title={item.asset}>
              <AssetIcon asset={item.asset} chain="THOR.RUNE" />
              <span>{formatAsset(item.asset)}</span>
            </div>
          );
        },
      },
      {
        label: "Trade Depth",
        sortKey: "depth",
        headerRender: () => (
          <div className={`${styles["table-asset"]} ${styles.end}`}>
            Trade Depth
          </div>
        ),
        renderCell: (item: TradeRow) => {
          if (item.depth) {
            return (
              <span className={`${styles.mono} ${styles.end}`}>
                {usdDenom && <span>$</span>}
                {baseAmountFormatFn(item.depth)}
                {!usdDenom && <small>{getTradeAssetTicker(item.asset)}</small>}
              </span>
            );
          }
          return <span>-</span>;
        },
      },
      {
        label: "Trade / Pool Depth",
        sortKey: "depthRatio",
        renderCell: (item: TradeRow) => {
          if (item.depthRatio !== undefined && item.depthRatio !== null) {
            return (
              <span className={styles.mono}>
                {formatPercent(item.depthRatio)}
              </span>
            );
          }
          return <span>-</span>;
        },
      },
      {
        label: "Vault Depth",
        sortKey: "vaultDepth",
        renderCell: (item: TradeRow) => {
          if (item.vaultDepth) {
            return (
              <span className={styles.mono}>
                {usdDenom && <span>$</span>}
                {baseAmountFormatFn(item.vaultDepth)}
                {!usdDenom && <small>{getTradeAssetTicker(item.asset)}</small>}
              </span>
            );
          }
          return <span>-</span>;
        },
      },
      {
        label: "Vault / Pool Depth",
        sortKey: "vaultRatio",
        renderCell: (item: TradeRow) => {
          if (item.vaultRatio !== undefined && item.vaultRatio !== null) {
            return (
              <span className={styles.mono}>
                {formatPercent(item.vaultRatio)}
              </span>
            );
          }
          return <span>-</span>;
        },
      },
      {
        label: "Units",
        sortKey: "units",
        headerRender: () => (
          <div className={`${styles["table-asset"]} ${styles.end}`}>Units</div>
        ),
        renderCell: (item: TradeRow) => {
          if (item.units !== undefined && item.units !== null) {
            return (
              <span className={`${styles.mono} ${styles.end}`}>
                {baseAmountFormatFn(item.units)}
              </span>
            );
          }
          return <span>-</span>;
        },
      },
    ];
  }, [usdDenom, baseAmountFormatFn, getTradeAssetTicker]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(false);

        const [tradeAssetsResponse, poolsResponse, asgardResponse] =
          await Promise.all([getTradeAssets(), getThorPools(), getAsgard()]);

        if (!isMounted) return;

        const tradeAssetsData = Array.isArray(tradeAssetsResponse)
          ? tradeAssetsResponse
          : [];
        const poolsData = Array.isArray(poolsResponse) ? poolsResponse : [];
        const asgardData = Array.isArray(asgardResponse) ? asgardResponse : [];

        setTradeAssets(tradeAssetsData);
        setPools(poolsData);
        setAsgard(asgardData);

        const newRows = fillTradeData(
          tradeAssetsData,
          poolsData,
          asgardData,
          usdDenom,
          runePrice
        );
        setRows(newRows);
      } catch (e) {
        console.error(e);
        if (isMounted) {
          setError(true);
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
    };
  }, [fillTradeData, usdDenom, runePrice]);

  useEffect(() => {
    if (tradeAssets && pools && asgard) {
      const newRows = fillTradeData(
        tradeAssets,
        pools,
        asgard,
        usdDenom,
        runePrice
      );
      setRows(newRows);
    }
  }, [usdDenom, runePrice, tradeAssets, pools, asgard, fillTradeData]);

  return (
    <div>
      <CardsHeader tableGeneralStats={tradingGeneralStats} />
      <Card
        title="Trade Assets"
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
            emptyMessage="No trade assets available"
            customTheme={customTheme}
          />
        )}
      </Card>
    </div>
  );
};

export default TradesPage;
