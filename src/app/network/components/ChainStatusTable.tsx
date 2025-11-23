"use client";

import React from "react";
import { Table } from "@/components/table";
import {
  createTextColumn,
  createNumericColumn,
  createCustomColumn,
} from "@/components/table/utils";
import Card from "@/components/ui/Card";
import AssetIcon from "@/components/AssetIcon";
import DangerIcon from "@/assets/images/danger.svg";
import { baseChainAsset } from "@/utils/global";
import { formatRune } from "@/utils/global";
import styles from "../network.module.css";

interface ChainStatusTableProps {
  inboundInfo: any[];
  loading: boolean;
}

const ChainStatusTable: React.FC<ChainStatusTableProps> = ({
  inboundInfo,
  loading,
}) => {
  const numberFormat = (value: number) => {
    if (value > 1) return value.toString();
    if (value === 1) return "1";
    return "0";
  };

  const normalFormat = (value: number) => {
    return value?.toLocaleString() || "0";
  };
  const customTheme = {
    Table: `
      --data-table-library_grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
      --data-table-library_grid-gap: 0.5rem;
    `,
  };

  const getRowProps = (item: any) => ({
    className: styles.tableRow,
  });

  const tableColumns = [
    createCustomColumn("Chain", {
      sortKey: "chain",
      minWidth: 120,
      renderCell: (item: any) => (
        <div className={styles.chainCol}>
          <AssetIcon
            asset={baseChainAsset(item.chain)}
            height="20px"
            chainHeight="20px"
          />
          <span>{item.chain}</span>
        </div>
      ),
    }),
    createCustomColumn("Scanning", {
      sortKey: "haltHeight",
      minWidth: 100,
      renderCell: (item: any) => {
        if (item.haltHeight > 1) {
          return (
            <DangerIcon
              title={`Scheduled halt: ${item.haltHeight}`}
              className={styles.tableIcon}
              style={{ fill: "var(--red)" }}
            />
          );
        } else if (item.haltHeight === 1) {
          return (
            <DangerIcon
              title="Mimir halt"
              className={styles.tableIcon}
              style={{ fill: "var(--red)" }}
            />
          );
        } else {
          return (
            <span className="mono" style={{ color: "var(--green)" }}>
              OK
            </span>
          );
        }
      },
    }),
    createCustomColumn("Trading", {
      sortKey: "haltTradingHeight",
      minWidth: 100,
      renderCell: (item: any) => {
        if (item.haltTradingHeight > 1) {
          return (
            <DangerIcon
              title={`Scheduled halt: ${item.haltTradingHeight}`}
              className={styles.tableIcon}
              style={{ fill: "var(--red)" }}
            />
          );
        } else if (item.haltTradingHeight === 1) {
          return (
            <DangerIcon
              title="Mimir halt"
              className={styles.tableIcon}
              style={{ fill: "var(--red)" }}
            />
          );
        } else {
          return (
            <span className="mono" style={{ color: "var(--green)" }}>
              OK
            </span>
          );
        }
      },
    }),
    createCustomColumn("LP", {
      sortKey: "haltLPHeight",
      minWidth: 80,
      renderCell: (item: any) => {
        if (item.haltLPHeight > 1) {
          return (
            <DangerIcon
              title={`Scheduled halt: ${item.haltLPHeight}`}
              className={styles.tableIcon}
              style={{ fill: "var(--red)" }}
            />
          );
        } else if (item.haltLPHeight === 1) {
          return (
            <DangerIcon
              title="Mimir halt"
              className={styles.tableIcon}
              style={{ fill: "var(--red)" }}
            />
          );
        } else {
          return (
            <span className="mono" style={{ color: "var(--green)" }}>
              OK
            </span>
          );
        }
      },
    }),
    createCustomColumn("Signing", {
      sortKey: "haltSigningHeight",
      minWidth: 100,
      renderCell: (item: any) => {
        if (item.haltSigningHeight > 1) {
          return (
            <DangerIcon
              title={`Scheduled halt: ${item.haltSigningHeight}`}
              className={styles.tableIcon}
              style={{ fill: "var(--red)" }}
            />
          );
        } else if (item.haltSigningHeight === 1) {
          return (
            <DangerIcon
              title="Mimir halt"
              className={styles.tableIcon}
              style={{ fill: "var(--red)" }}
            />
          );
        } else {
          return (
            <span className="mono" style={{ color: "var(--green)" }}>
              OK
            </span>
          );
        }
      },
    }),
    createCustomColumn("Observed Height", {
      sortKey: "last_observed_in",
      minWidth: 120,
      renderCell: (item: any) => (
        <span className="mono center">
          {normalFormat(item.last_observed_in)}
        </span>
      ),
    }),
    createCustomColumn("Fee Rate", {
      sortKey: "gas_rate",
      minWidth: 100,
      renderCell: (item: any) => (
        <span className="mono center">
          {normalFormat(item.gas_rate)} {item.gas_rate_units}
        </span>
      ),
    }),
    createCustomColumn("Outbound Fee", {
      sortKey: "outbound_fee",
      minWidth: 120,
      renderCell: (item: any) => (
        <span className="mono center">
          {(item.outbound_fee / 1e8).toString()}
        </span>
      ),
    }),
    createCustomColumn("Outbound Tx size", {
      sortKey: "outbound_tx_size",
      minWidth: 120,
      renderCell: (item: any) => (
        <span className="mono center">
          {normalFormat(item.outbound_tx_size)}
        </span>
      ),
    }),
    createCustomColumn("Dust Threshold", {
      sortKey: "dust_threshold",
      minWidth: 120,
      renderCell: (item: any) => (
        <span className="mono center">
          {(item.dust_threshold / 1e8).toString()}
        </span>
      ),
    }),
  ];

  return (
    <>
      <Card title="Chain Status">
        <Table
          columns={tableColumns}
          data={inboundInfo || []}
          loading={loading}
          onSortChange={(action, state) => {}}
          onRowSelectChange={(action, state) => {}}
          rowProps={getRowProps}
          enableSort={true}
          enableSelect={false}
          customTheme={customTheme}
          className={styles.tableContainer}
        />
      </Card>

      <div className={styles.footerStat}>
        <small>
          <sup>*</sup>
          Hover on the table elements to see more info!
        </small>
      </div>
    </>
  );
};

export default ChainStatusTable;
