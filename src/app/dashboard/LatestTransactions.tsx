import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import TransactionAction from "@/components/transactions/TransactionAction";
import Address from "@/components/transactions/Address";
import { BounceLoader } from "react-spinners";
import moment from "moment";
import Link from "next/link";
import Card from "@/components/ui/Card";
import styles from "./LatestTransactions.module.css";
import { formatAddress } from "@/utils/global";

interface Transaction {
  in?: Array<{
    txID: string;
    address: string;
    coins: Array<{
      asset: string;
      amount: string;
    }>;
  }>;
  out?: Array<{
    address: string;
    coins: Array<{
      asset: string;
      amount: string;
    }>;
  }>;
  height: number;
  date: number;
  type: string;
  status: string;
  metadata?: any;
}

interface LatestTransactionsProps {
  transactions: Transaction[] | null;
}

const LatestTransactions: React.FC<LatestTransactionsProps> = ({
  transactions = null,
}) => {
  const showTx = (txID: string): string => {
    if (
      txID ===
      "0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      return "Internal Tx";
    }
    return txID;
  };

  const formatMoment = (time: number): string => {
    return moment(Number.parseInt(String(time / 10 ** 6))).fromNow();
  };

  return (
    <Card title="Latest Transactions">
      <div>
        {transactions && transactions.length > 0 ? (
          <>
            {transactions.map((t: Transaction, i: number) => {
              if (!t || !t.in || !t.in[0] || !t.in[0].txID) {
                return null;
              }

              return (
                <React.Fragment key={`tx-${i}-${t.in[0].txID}`}>
                  <div className={styles["row-item-transactions"]}>
                    <div className={styles["transactions"]}>
                      <span
                        className={styles["txid-section"]}
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--muted-foreground)",
                        }}
                      >
                        <small style={{ color: "var(--foreground)" }}>
                          TxID
                        </small>
                        <Link
                          className="clickable"
                          href={`/tx/${t.in[0].txID}`}
                        >
                          {formatAddress(showTx(t.in[0].txID))}
                        </Link>
                      </span>
                      <TransactionAction
                        row={t}
                        showMiniBubble={false}
                        noBorder={true}
                      />
                    </div>
                    <div className={styles["txs"]}>
                      <span>
                        <small style={{ color: "var(--foreground)" }}>
                          From
                        </small>
                        <Address
                          address={t.in[0].address}
                          useCustomName={true}
                          hoveredAddress=""
                          onSetHovered={() => {}}
                          onRemoveHovered={() => {}}
                        />
                      </span>
                      <Link
                        className={`clickable ${styles["header"]}`}
                        href={`/block/${t.height}`}
                      >
                        {t.height?.toLocaleString() || "N/A"}
                      </Link>
                      <span className={styles["timestamp"]}>
                        {t.date ? formatMoment(t.date) : "N/A"}
                      </span>
                    </div>
                  </div>
                  <hr key={`${i}-hr`} className={styles["hr-space"]} />
                </React.Fragment>
              );
            })}
          </>
        ) : transactions === null ? (
          <>
            {Array.from({ length: 10 }).map((_, i) => (
              <React.Fragment key={`skeleton-${i}`}>
                <div className={styles["row-item-transactions"]}>
                  <div className={styles["transactions"]}>
                    <span className={styles["txid-section"]}>
                      <Skeleton variant="text" width="30px" height="10px" />
                      <Skeleton variant="text" width="120px" height="10px" />
                    </span>
                    <Skeleton
                      variant="rectangular"
                      width="80px"
                      height="15px"
                    />
                  </div>
                  <div className={styles["txs"]}>
                    <span>
                      <Skeleton variant="text" width="25px" height="10px" />
                      <Skeleton variant="text" width="100px" height="10px" />
                    </span>
                    <Skeleton variant="text" width="60px" height="10px" />
                    <Skeleton variant="text" width="80px" height="10px" />
                  </div>
                </div>
                <hr key={`${i}-hr`} className={styles["hr-space"]} />
              </React.Fragment>
            ))}
          </>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              color: "var(--muted-foreground)",
            }}
          >
            No transactions available
          </div>
        )}
      </div>
    </Card>
  );
};

export default LatestTransactions;
