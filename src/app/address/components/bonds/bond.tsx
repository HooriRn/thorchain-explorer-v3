"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Table from "@/components/table/Table";
import { formatAddress, numberFormat } from "@/utils/global";
import { formatPercent, formatVueNumber } from "@/utils/format";
import { TableColumn } from "@/components/table/types";
import styles from "./bond.module.css";

interface BondData {
  id?: string;
  node: string;
  bond: number;
  fee: number;
  operator: string;
  share: number;
}

interface BondProps {
  nodes?: any[];
  address?: string;
}

const Bond: React.FC<BondProps> = ({ nodes, address }) => {
  const [bs, setBs] = useState<BondData[]>([]);

  const formatBonds = useCallback((): BondData[] => {
    if (!nodes) {
      return [];
    }
    const ret: BondData[] = [];
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!node?.bond_providers?.providers) {
        continue;
      }
      const bond = node?.bond_providers?.providers?.find(
        (n: any) => n.bond_address === address
      );
      if (bond !== undefined) {
        ret.push({
          id: node.node_address,
          node: node.node_address,
          bond: +bond.bond / 1e8,
          fee: +node?.bond_providers?.node_operator_fee / 10000,
          operator: node?.node_operator_address,
          share: +bond.bond / +node.total_bond,
        });
      }
    }
    return ret;
  }, [nodes, address]);

  useEffect(() => {
    setBs(formatBonds());
  }, [formatBonds]);

  const cols: TableColumn<BondData>[] = useMemo(() => {
    const formatAddressFn = (value: any) => formatAddress(value);
    const numberFormatFn = (value: any) => {
      return numberFormat(value, formatVueNumber);
    };

    return [
      {
        label: "Node",
        field: "node",
        renderCell: (item) => (
          <Link href={`/node/${item.node}`} className={styles.clickable}>
            {formatAddressFn(item.node)}
          </Link>
        ),
      },
      {
        label: "Bonded",
        field: "bond",
        className: styles.mono,
        renderCell: (item) => (
          <span>
            {numberFormatFn(item.bond)} ({formatPercent(item.share, 2)})
          </span>
        ),
      },
      {
        label: "Fee",
        field: "fee",
        className: styles.mono,
        renderCell: (item) => <span>{formatPercent(item.fee, 2)}</span>,
      },
      {
        label: "Node Operator",
        field: "operator",
        renderCell: (item) => (
          <Link href={`/address/${item.operator}`} className={styles.clickable}>
            {formatAddressFn(item.operator)}
          </Link>
        ),
      },
    ];
  }, []);

  return (
    <Card>
      <Table
        columns={cols}
        data={bs}
        loading={false}
        className={`vgt-table net-table ${styles["bond-table"]}`}
        enableSort={true}
        enableSelect={false}
        onSortChange={() => {}}
        onRowSelectChange={() => {}}
      />
    </Card>
  );
};

export default Bond;
