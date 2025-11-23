"use client";

import React from "react";
import styles from "./TransactionStatus.module.css";

interface TransactionStatusProps {
  row: {
    type: string;
    [key: string]: any;
  };
  hoveredType: string;
  onSetHoveredType: (type: string) => void;
  onRemoveHoveredType: () => void;
}

const TransactionStatus: React.FC<TransactionStatusProps> = ({
  row,
  hoveredType,
  onSetHoveredType,
  onRemoveHoveredType,
}) => {
  const typeName = (type: string) => {
    switch (type) {
      case "addLiquidity":
        return "Add LP";
      case "withdraw":
        return "Remove LP";
      case "runePoolDeposit":
        return "RUNEPool Deposit";
      case "runePoolWithdraw":
        return "RUNEPool Withdraw";
      case "tcy_claim":
        return "TCY Claim";
      case "tcy_stake":
        return "TCY Stake";
      case "tcy_unstake":
        return "TCY Unstake";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const getTypeClass = (type: string) => {
    switch (type) {
      case "send":
        return "blue-type";
      case "swap":
      case "runePoolDeposit":
      case "bond":
      case "tcy_claim":
      case "tcy_stake":
        return "green-type";
      case "refund":
        return "yellow-type";
      case "unbond":
      case "withdraw":
      case "runePoolWithdraw":
      case "failed":
      case "tcy_unstake":
        return "red-type";
      case "switch":
      case "addLiquidity":
        return "alert-type";
      default:
        return "default-type";
    }
  };

  const handleMouseOver = () => {
    if (row?.type) {
      onSetHoveredType(row.type);
    }
  };

  const handleMouseLeave = () => {
    onRemoveHoveredType();
  };

  if (!row) {
    return null;
  }

  return (
    <div
      className={styles.customized}
      onMouseOver={handleMouseOver}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={[
          styles["type-class"],
          styles[getTypeClass(row.type)],
          hoveredType === row.type ? styles.highlighted : "",
        ].join(" ")}
      >
        <span className={styles["type-name"]} title={row.type}>
          {typeName(row.type)}
        </span>
      </div>
    </div>
  );
};

export default TransactionStatus;
