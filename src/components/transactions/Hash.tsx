import React from "react";
import Link from "next/link";
import Copy from "@/components/Copy";
import { addressFormatV2 } from "@/utils/global";
import styles from "./Hash.module.css";

interface HashProps {
  param?: string;
  showCopy?: boolean;
}

const Hash: React.FC<HashProps> = ({ param, showCopy = true }) => {
  if (!param) {
    return <span>-</span>;
  }

  return (
    <div className={styles["transaction-hash"]}>
      <Link
        href={`/tx/${param}`}
        className={`${styles.clickable} ${styles.mono}`}
      >
        {addressFormatV2(param)}
      </Link>
      {showCopy && <Copy strCopy={param} />}
    </div>
  );
};

export default Hash;
