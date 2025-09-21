"use client";

import React from "react";
import { formatNumberToString } from "@/utils/format";
import Card from "@/components/ui/Card";
import styles from "./SummaryCard.module.css";

interface SummaryItem {
  label: string;
  value: number;
  unit?: string;
  usdValue?: number;
}

interface SummaryCardProps {
  title: string;
  items: SummaryItem[];
  lastUpdateTime?: Date | null;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  items,
  lastUpdateTime,
}) => {
  return (
    <Card title={title}>
      <div className={styles["summary-data"]}>
        <div className={styles["summary-items-grid"]}>
          {items.map((item, index) => (
            <div key={index} className={styles["summary-item"]}>
              <h5 className={styles["summary-item-label"]}>{item.label}</h5>
              <div className={styles["summary-item-value"]}>
                {formatNumberToString(item.value / 1e8, {
                  decimalScale: 2,
                })}{" "}
                {item.unit || "RUNE"}
              </div>
              {item.usdValue !== undefined && (
                <div className={styles["summary-item-usd"]}>
                  ${formatNumberToString(item.usdValue, { decimalScale: 2 })}
                </div>
              )}
            </div>
          ))}
        </div>

        {lastUpdateTime && (
          <div className={styles["last-update-time"]}>
            Last updated: {lastUpdateTime.toLocaleTimeString()}
          </div>
        )}
      </div>
    </Card>
  );
};

export default SummaryCard;
