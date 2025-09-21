"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Burn from "@/assets/images/burn.svg";
import RuneAsset from "../../components/RuneAsset";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/Skeleton";
import styles from "./LatestBlocks.module.css";
import { getDuration } from "@/utils/global";
import { formatNumberToString } from "@/utils/format";

interface Block {
  blockHeight: number;
  timestamp: string;
  burnedAmount: number;
  devAmount: number;
  poolAmount: number;
  bondAmount: number;
}

interface LatestBlocksProps {
  burnedBlocks: Block[];
}

const LatestBlocks: React.FC<LatestBlocksProps> = ({ burnedBlocks }) => {
  const decimalFormat = (value: number) => {
    const convertedValue = value / 1e8;
    return formatNumberToString(convertedValue, { decimalScale: 8 });
  };

  const skeletonItems = [
    { labelWidth: "40px" },
    { labelWidth: "30px" },
    { labelWidth: "35px" },
    { labelWidth: "35px" },
  ];

  return (
    <Card title="Latest Blocks">
      <div>
        {burnedBlocks.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {burnedBlocks.map((block, index) => (
              <div key={block.blockHeight}>
                <motion.div
                  initial={{ opacity: 0, y: -30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={styles["block-items"]}
                >
                  <div className={styles["block-info-overview"]}>
                    <Link
                      className={`${styles.height} clickable`}
                      href={`/block/${block.blockHeight}`}
                    >
                      {formatNumberToString(block.blockHeight)}
                    </Link>
                    <small className={styles.duration}>
                      {getDuration(block.timestamp)} Seconds
                    </small>
                  </div>
                  <div className={styles["middle-section-overview"]}>
                    <div className={styles["block-burned-item"]}>
                      <small>Burned</small>
                      <Badge variant="orange" className={styles["burn-item"]}>
                        <Burn className={styles["burn-icon"]} />
                        {decimalFormat(block.burnedAmount)}
                      </Badge>
                    </div>

                    <div className={styles["block-burned-item"]}>
                      <small>Dev</small>
                      <Badge variant="yellow" className={styles["burn-item"]}>
                        <RuneAsset asset="THOR.RUNE" height="0.7rem" />
                        <div className={styles["amount-burn"]}>
                          {decimalFormat(block.devAmount)}
                        </div>
                      </Badge>
                    </div>

                    <div className={styles["block-burned-item"]}>
                      <small>Pool</small>
                      <Badge variant="info" className={styles["burn-item"]}>
                        <RuneAsset asset="THOR.RUNE" height="0.7rem" />
                        <div className={styles["amount-burn"]}>
                          {decimalFormat(block.poolAmount)}
                        </div>
                      </Badge>
                    </div>

                    <div className={styles["block-burned-item"]}>
                      <small>Bond</small>
                      <Badge variant="gray" className={styles["burn-item"]}>
                        <RuneAsset asset="THOR.RUNE" height="0.7rem" />
                        <div className={styles["amount-burn"]}>
                          {decimalFormat(block.bondAmount)}
                        </div>
                      </Badge>
                    </div>
                  </div>
                </motion.div>
                {index < burnedBlocks.length - 1 && (
                  <hr className={styles["hr-space"]} />
                )}
              </div>
            ))}
          </AnimatePresence>
        ) : (
          <>
            {Array.from({ length: 11 }).map((_, index) => (
              <div key={index} className={styles["block-items"]}>
                <div className={styles["block-info-overview"]}>
                  <Skeleton variant="text" width="80px" height="10px" />
                  <Skeleton variant="text" width="60px" height="10px" />
                </div>
                <div className={styles["middle-section-overview"]}>
                  {skeletonItems.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className={styles["block-burned-item"]}
                    >
                      <Skeleton
                        variant="text"
                        width={item.labelWidth}
                        height="10px"
                      />
                      <div>
                        <Skeleton variant="text" width="50px" height="10px" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </Card>
  );
};

export default LatestBlocks;
