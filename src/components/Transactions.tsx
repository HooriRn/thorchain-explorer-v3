"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import moment from "moment";
import Card from "@/components/ui/Card";
import { Table, TableColumn, TableData } from "@/components/table";
import TableLoader from "@/components/TableLoader";
import TransactionStatus from "./transactions/TransactionStatus";
import TransactionAction from "./transactions/TransactionAction";
import Address from "./transactions/Address";
import Hash from "./transactions/Hash";
import SendIcon from "@/assets/images/send.svg";
import AlertIcon from "@/assets/images/alert.svg";
import ReceiveIcon from "@/assets/images/receive.svg";
import { formatNumber } from "@/utils/format";
import styles from "./Transactions.module.css";

interface Transaction {
  hash: string;
  type: string;
  height: number;
  age: number;
  from: string;
  to: string;
  direction: "IN" | "OUT" | "SELF";
  isScam: boolean;
  in?: Array<{
    address: string;
    txID: string;
    coins: Array<{
      asset: string;
      amount: string;
    }>;
  }>;
  out?: Array<{
    address: string;
    txID: string;
    coins: Array<{
      asset: string;
      amount: string;
    }>;
    affiliate?: boolean;
  }>;
  date: number;
  status: string;
}

interface TransactionsProps {
  txs: {
    actions: any[];
  };
  owner?: string;
  loading?: boolean;
  props?: TableColumn[];
}

const Transactions: React.FC<TransactionsProps> = ({
  txs,
  owner,
  loading = false,
  props: additionalProps = [],
}) => {
  const router = useRouter();
  const [hoveredType, setHoveredType] = useState<string>("");
  const [hoveredAddress, setHoveredAddress] = useState<string>("");

  const shortSymbol = (assetStr: string) => {
    if (assetStr?.includes("-")) {
      const assetStrSplit = assetStr.split("-");
      if (assetStrSplit[1].length > 8) {
        return (
          assetStrSplit[0] +
          "-" +
          assetStrSplit[1].slice(0, 4) +
          "..." +
          assetStrSplit[1].slice(-4)
        );
      } else {
        return assetStr;
      }
    } else {
      return assetStr;
    }
  };

  const checkSuspiciousTxs = (txs: any) => {
    const hashes: string[] = [];
    if (owner === undefined) {
      return hashes;
    }

    const sendActions = txs.actions
      .filter((a: any) => a.type === "send")
      .reverse();
    const outAddresses = new Set<string>();

    for (let i = 0; i < sendActions.length; i++) {
      const action = sendActions[i];
      const outAddress = action.out?.find((e: any) => e.address)?.address;
      if (!outAddress) {
        continue;
      }

      const inAddress = action.in?.find((e: any) => e.address)?.address;
      if (inAddress === owner && outAddress) {
        outAddresses.add(outAddress);
      }

      if (outAddress === owner) {
        const inShort = inAddress?.slice(0, 4) + inAddress?.slice(-4);

        outAddresses.forEach((oa) => {
          const outShort = oa.slice(0, 4) + oa.slice(-4);
          if (inShort === outShort && oa !== inAddress) {
            const txID = action.in?.find((e: any) => e.txID)?.txID;
            if (txID) hashes.push(txID);
          }
        });
      }
    }

    return hashes;
  };

  const getDirection = (fromAddr: string, toAddr: string) => {
    if (fromAddr === toAddr) {
      return "SELF";
    }
    if (owner === fromAddr) {
      return "OUT";
    }
    return "IN";
  };

  const formatActions = (txs: any): Transaction[] => {
    const actions: Transaction[] = [];
    if (!txs || txs.actions?.length === 0) {
      return actions;
    }

    const suspiciousTxs = checkSuspiciousTxs(txs);

    for (let i = 0; i < txs?.actions?.length; i++) {
      const t = txs?.actions[i];

      const fromAddr = t.in?.find((e: any) => e.address)?.address || "";
      const toAddr =
        t.out?.find((e: any) => !e.affiliate && e.address)?.address || "";
      const direction = getDirection(fromAddr, toAddr);

      const hash =
        t.in?.find((e: any) => e.txID)?.txID ||
        t.out?.find((e: any) => e.txID)?.txID;

      const action = {
        ...t,
        hash,
        age: t.date,
        from: fromAddr,
        to: toAddr,
        direction: direction as "IN" | "OUT" | "SELF",
        isScam: hash ? suspiciousTxs.includes(hash) : false,
        status: t.status || "success",
      };

      actions.push(action);
    }

    return actions;
  };

  const handleSetHoveredAddress = (address: string) => {
    setHoveredAddress(address);
  };

  const handleRemoveHoveredAddress = () => {
    setHoveredAddress("");
  };

  const handleSetHoveredType = (type: string) => {
    setHoveredType(type);
  };

  const handleRemoveHoveredType = () => {
    setHoveredType("");
  };

  const assetImage = (assetStr: string) => {
    try {
      return require("@/assets/images/unknown.png");
    } catch (e) {
      console.error(e);
      return require("@/assets/images/unknown.png");
    }
  };

  const showTx = (txID: string) => {
    if (
      txID ===
      "0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      return "Internal Tx";
    }
    return `${txID.slice(0, 4)}...${txID.slice(-4)}`;
  };

  const imgErr = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = require("@/assets/images/unknown.png");
  };

  const since = (date: number) => {
    return moment(date / 1e6).fromNow();
  };

  const getTime = (date: number) => {
    return moment(date / 1e6).format("MMMM DD YYYY, hh:mm:ss A (GMTZ)");
  };

  const addressFormatV2 = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const normalFormat = (value: any) => {
    return value?.toString() || "";
  };

  const actions = useMemo(() => {
    if (!txs) {
      return [];
    }
    return formatActions(txs);
  }, [txs, owner]);

  const columns: TableColumn<Transaction>[] = useMemo(
    () => [
      {
        label: "Transaction Hash",
        renderCell: (item: Transaction) => <Hash param={item.hash} />,
      },
      {
        label: "Type",
        renderCell: (item: Transaction) => (
          <div className={styles.type}>
            <TransactionStatus
              row={item}
              hoveredType={hoveredType}
              onSetHoveredType={handleSetHoveredType}
              onRemoveHoveredType={handleRemoveHoveredType}
            />
          </div>
        ),
      },
      {
        label: "Block Height",
        renderCell: (item: Transaction) => (
          <button
            className={styles.clickable}
            onClick={() => router.push(`/block/${item.height}`)}
          >
            {formatNumber(item.height)}
          </button>
        ),
      },
      {
        label: "Age",
        renderCell: (item: Transaction) => (
          <div className={styles.hoverable} title={getTime(item.age)}>
            {since(item.age)}
          </div>
        ),
      },
      ...(owner !== undefined
        ? [
            {
              label: "",
              renderCell: (item: Transaction) => (
                <div
                  className={`${styles["direction-class"]} ${
                    item.direction === "IN" ? styles.green : ""
                  } ${item.direction === "OUT" ? styles.yellow : ""} ${
                    item.direction === "SELF" ? styles.gray : ""
                  } ${item.isScam ? styles.scam : ""}`}
                >
                  <span>{item.isScam ? <AlertIcon /> : item.direction}</span>
                </div>
              ),
            },
          ]
        : []),
      {
        label: "From / To",
        renderCell: (item: Transaction) => (
          <div className={styles["flex-cell-content-tx"]}>
            <div className={styles["from-address"]}>
              <div className={styles["address-direction"]}>
                <SendIcon className={styles["send-icon"]} />
                <Address
                  address={item.from}
                  hoveredAddress={hoveredAddress}
                  disable={!!(owner && owner === item.from)}
                  onSetHovered={handleSetHoveredAddress}
                  onRemoveHovered={handleRemoveHoveredAddress}
                  useCustomName={true}
                />
              </div>
            </div>
            {item.to && (
              <div className={styles["to-address"]}>
                <div className={styles["address-direction"]}>
                  <ReceiveIcon className={styles["send-icon"]} />
                  <Address
                    address={item.to}
                    hoveredAddress={hoveredAddress}
                    disable={!!(owner && owner === item.to)}
                    onSetHovered={handleSetHoveredAddress}
                    onRemoveHovered={handleRemoveHoveredAddress}
                    useCustomName={true}
                  />
                </div>
              </div>
            )}
          </div>
        ),
      },
      {
        label: "Action",
        renderCell: (item: Transaction) => <TransactionAction row={item} />,
      },
      ...additionalProps,
    ],
    [owner, hoveredType, hoveredAddress, router, additionalProps]
  );

  const customTheme = useMemo(() => {
    const additionalColumns = additionalProps.length;

    const widths = [];
    widths.push("200px");
    widths.push("120px");
    widths.push("124px");
    widths.push("134px");
    if (owner !== undefined) {
      widths.push("80px");
    }
    widths.push("250px");
    widths.push("auto");
    for (let i = 0; i < additionalColumns; i++) {
      widths.push("auto");
    }

    const gridTemplateColumns = widths.join(" ");

    return {
      Table: `
        --data-table-library_grid-template-columns: ${gridTemplateColumns};
      `,
      Cell: `
        text-align: left;
      `,
    };
  }, [owner, additionalProps.length]);

  const getRowProps = (item: TableData) => {
    return {
      className: styles.transactionRow,
    };
  };

  return (
    <Card>
      {loading ? (
        <TableLoader
          cols={columns.map((col) => ({ label: col.label, field: col.label }))}
        />
      ) : actions.length === 0 ? (
        <div className={styles.noDataMessage}>No transactions found</div>
      ) : (
        <Table
          columns={columns}
          data={actions}
          loading={loading}
          onSortChange={(action, state) => {}}
          onRowSelectChange={(action, state) => {}}
          rowProps={getRowProps}
          enableSort={true}
          enableSelect={false}
          customTheme={customTheme}
          className={styles.tableContainer}
        />
      )}
    </Card>
  );
};

export default Transactions;
