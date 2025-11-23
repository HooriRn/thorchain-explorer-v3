"use client";

import React from "react";
import { useRouter } from "next/navigation";
import UnknownIcon from "../assets/images/unknown.svg";
import { Skeleton } from "./ui/Skeleton";
import GlassmorphismTooltip from "./GlassmorphismTooltip";
import styles from "./CardsHeader.module.css";

const ProgressIcon: React.FC<{
  dataNumber: number;
  isDown: boolean;
  size?: string;
}> = ({ dataNumber, isDown, size = "1rem" }) => (
  <span
    style={{
      fontSize: size,
      color: isDown ? "red" : "green",
    }}
  >
    {dataNumber}
  </span>
);

const SkeletonItem: React.FC<{
  loading: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ loading, className, children }) => {
  if (loading) {
    return (
      <div className={className || ""}>
        <Skeleton variant="text" width="100%" height="10px" />
      </div>
    );
  }
  return <div className={className || ""}>{children}</div>;
};

interface TableGeneralStat {
  name: string;
  value?: string | number;
  extraText?: string;
  description?: string;
  link?: string;
  change?: number;
  isDown?: boolean;
}

interface CardsHeaderProps {
  tableGeneralStats: TableGeneralStat[];
  showChange?: boolean;
}

const CardsHeader: React.FC<CardsHeaderProps> = ({
  tableGeneralStats,
  showChange = false,
}) => {
  const router = useRouter();

  if (!tableGeneralStats || tableGeneralStats.length === 0) {
    return null;
  }

  const handleIconClick = (link: string) => {
    if (link) {
      router.push(link);
    }
  };

  return (
    <div className={styles["header-class"]}>
      {tableGeneralStats.map((stat, i) => (
        <div key={i} className={styles["table-stat-card"]}>
          <div className={styles.name}>
            {stat.name}
            {stat.description && (
              <GlassmorphismTooltip content={stat.description} placement="top">
                <UnknownIcon
                  className={`${styles["header-icon"]} ${
                    stat.link ? styles.link : ""
                  }`}
                  onClick={() => stat.link && handleIconClick(stat.link)}
                />
              </GlassmorphismTooltip>
            )}
          </div>
          {stat.change && (
            <div className={styles["stat-change"]}>
              <ProgressIcon
                dataNumber={stat.change}
                isDown={stat.isDown}
                size="1rem"
              />
            </div>
          )}
          <SkeletonItem loading={!stat.value} className={styles.value}>
            {stat.value}
            {stat.extraText && <small>{stat.extraText}</small>}
          </SkeletonItem>
        </div>
      ))}
    </div>
  );
};

export default CardsHeader;
