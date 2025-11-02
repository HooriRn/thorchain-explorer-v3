"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { getOutboundFees } from "@/lib/api";
import { formatAsset, showAsset, decimalFormat } from "@/utils/global";
import { number, formatPercent } from "@/utils/format";
import Card from "@/components/ui/Card";
import AssetIcon from "@/components/AssetIcon";
import Rune from "@/assets/images/rune.svg";
import { Table, TableColumn, TableData } from "@/components/table";
import { createCustomColumn } from "@/components/table/utils";
import styles from "./outbounds.module.css";

interface OutboundFeeData extends TableData {
  asset: string;
  outboundFee: number;
  feeWithheld: number;
  feeSpent: number;
  surplus: number;
  dynamicMultiplier: number;
}

const customTheme = {
  HeaderCell: `
       &:last-child {
          text-align: right;
        }
      `,
  Cell: `
      &:last-child {
        text-align: right;
        }
    `,
};
const OutboundsPage: React.FC = () => {
  const runePrice = useAppStore((state) => state.runePrice);

  const [loading, setLoading] = useState(true);
  const [outboundFees, setOutboundFees] = useState<OutboundFeeData[]>([]);

  const columns = useMemo((): TableColumn<OutboundFeeData>[] => {
    return [
      createCustomColumn<OutboundFeeData>("Asset", {
        sortKey: "asset",
        minWidth: 120,
        renderCell: (item: OutboundFeeData) => (
          <span className={styles.cellContent}>
            <AssetIcon asset={item.asset} classes={[styles.assetIcon]} />
            <span>{formatAsset(item.asset)}</span>
          </span>
        ),
      }),
      createCustomColumn<OutboundFeeData>("Outbound Fee", {
        sortKey: "outboundFee",
        minWidth: 120,
        className: "mono",
        renderCell: (item: OutboundFeeData) => (
          <span className="mono">
            {decimalFormat(item.outboundFee / 1e8)}{" "}
            {showAsset(item.asset, true)}
          </span>
        ),
      }),
      createCustomColumn<OutboundFeeData>("Fee Withheld", {
        sortKey: "feeWithheld",
        minWidth: 150,
        className: "mono",
        renderCell: (item: OutboundFeeData) => (
          <span className={`mono ${styles.cellContent}`}>
            <Rune className={styles.runeCur} />
            {number(item.feeWithheld / 1e8, "0,0.00a")}
            {+item.feeWithheld > 0 && (
              <small>
                (${number((item.feeWithheld / 1e8) * runePrice, "0,0.00a")})
              </small>
            )}
          </span>
        ),
      }),
      createCustomColumn<OutboundFeeData>("Fee Spent", {
        sortKey: "feeSpent",
        minWidth: 150,
        className: "mono",
        renderCell: (item: OutboundFeeData) => (
          <span className={`mono ${styles.cellContent}`}>
            <Rune className={styles.runeCur} />
            {number(item.feeSpent / 1e8, "0,0.00a")}
            {+item.feeSpent > 0 && (
              <small>
                (${number((item.feeSpent / 1e8) * runePrice, "0,0.00a")})
              </small>
            )}
          </span>
        ),
      }),
      createCustomColumn<OutboundFeeData>("Surplus", {
        sortKey: "surplus",
        minWidth: 150,
        className: "mono",
        renderCell: (item: OutboundFeeData) => (
          <span className={`mono ${styles.cellContent}`}>
            <Rune className={styles.runeCur} />
            {number(item.surplus / 1e8, "0,0.00a")}
            {+item.surplus > 0 && (
              <small>
                (${number((item.surplus / 1e8) * runePrice, "0,0.00a")})
              </small>
            )}
          </span>
        ),
      }),
      createCustomColumn<OutboundFeeData>("Dynamic Multiplier", {
        sortKey: "dynamicMultiplier",
        minWidth: 150,
        className: "mono",
        renderCell: (item: OutboundFeeData) => (
          <span className="mono">
            {formatPercent(item.dynamicMultiplier / 1e6, 2)}
          </span>
        ),
      }),
    ];
  }, [runePrice]);

  useEffect(() => {
    fetchOutboundFees();
  }, []);

  const fetchOutboundFees = async () => {
    try {
      const response = await getOutboundFees();
      const formattedData = response.map((item: any) => ({
        asset: item.asset,
        outboundFee: item.outbound_fee,
        feeWithheld: item.fee_withheld_rune || 0,
        feeSpent: item.fee_spent_rune || 0,
        surplus: item.surplus_rune || 0,
        dynamicMultiplier: item.dynamic_multiplier_basis_points || 0,
      }));

      const sortedData = [...formattedData].sort((a, b) =>
        a.asset.localeCompare(b.asset)
      );

      setOutboundFees(sortedData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching outbound fees:", error);
      setLoading(false);
    }
  };

  return (
    <Card title="Outbound Fees">
      <Table
        columns={columns}
        data={outboundFees}
        loading={loading}
        onSortChange={(action, state) => {}}
        onRowSelectChange={(action, state) => {}}
        enableSort={true}
        enableSelect={false}
        customTheme={customTheme}
        className="vgt-table net-table"
      />
    </Card>
  );
};

export default OutboundsPage;
