"use client";

import React, { useMemo } from "react";
import moment from "moment";
import styles from "./Pagination.module.css";
import AngleLeftIcon from "@/assets/images/angle-left.svg";
import AngleRightIcon from "@/assets/images/angle-right.svg";

interface PaginationProps {
  meta?: Array<{ date: number }>;
  loading?: boolean;
  onPrevPage?: () => void;
  onNextPage?: () => void;
}

const Pagination: React.FC<PaginationProps> = ({
  meta,
  loading = false,
  onPrevPage,
  onNextPage,
}) => {
  const timeFrame = useMemo(() => {
    if (!meta || meta.length <= 1) {
      return null;
    }

    const firstAction = meta[0];
    const lastAction = meta[meta.length - 1];

    const from = moment(firstAction?.date / 1e6).format("MM/DD/YYYY hh:mm:ss");
    const next = moment(lastAction?.date / 1e6).format("MM/DD/YYYY hh:mm:ss");

    return {
      from,
      next,
    };
  }, [meta]);

  return (
    <div className={styles.paginationContainer}>
      <div className={styles.navIcons} onClick={onPrevPage}>
        <AngleLeftIcon />
        Newer
      </div>
      <div className={`${styles.navIcons} ${styles.mono}`}>
        {!loading && timeFrame ? (
          <>
            {timeFrame.from} - {timeFrame.next}
          </>
        ) : (
          <span>...</span>
        )}
      </div>
      <div className={styles.navIcons} onClick={onNextPage}>
        Older
        <AngleRightIcon />
      </div>
    </div>
  );
};

export default Pagination;
