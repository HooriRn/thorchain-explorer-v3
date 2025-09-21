import React from "react";
import { orderBy } from "lodash";
import ApiIcon from "@/assets/images/api.svg";
import Affiliate from "@/components/Affiliate";
import { Skeleton } from "@/components/ui/Skeleton";
import Card from "@/components/ui/Card";
import Link from "next/link";
import styles from "./LeaderboardCard.module.css";

interface RowData {
  affiliate: string;
  [key: string]: any;
  multi?: boolean;
}

interface LeaderboardCardProps {
  title: string;
  data: RowData[];
  sortKey: string;
  limit?: number;
  isLoading?: boolean;
  children?: (props: { row: RowData; index: number }) => React.ReactNode;
  header?: React.ReactNode;
}

const LeaderboardCard: React.FC<LeaderboardCardProps> = ({
  title,
  data,
  sortKey,
  limit = 30,
  isLoading = false,
  children,
  header,
}) => {
  const colorizeIndex = (index: number): string => {
    switch (index) {
      case 0:
        return "#FFD700";
      case 1:
        return "#EDE8DF";
      case 2:
        return "#CD7F32";
      default:
        return "var(--font-color)";
    }
  };

  const sortedData = React.useMemo(() => {
    const filteredData = data.filter((d) => d[sortKey]);
    return orderBy(filteredData, [sortKey], ["desc"]).slice(0, limit);
  }, [data, sortKey, limit]);

  return (
    <Card title={title}>
      {header}
      <div className={styles.dataSection}>
        {!isLoading
          ? sortedData.map((row, index) => (
              <div
                key={`${row.affiliate}-${index}`}
                className={styles.dataItem}
              >
                <Link
                  className={`${styles.itemContent} ${styles.hoverable}`}
                  href={`/charts/affiliates?period=14d&affiliate=${row.affiliate}`}
                >
                  <span
                    className={styles.itemNumber}
                    style={{ color: colorizeIndex(index) }}
                  >
                    {index + 1}.
                  </span>
                  <div className={styles.itemDetails}>
                    <Affiliate
                      affiliateAddress={row.affiliate}
                      useNewIcons={false}
                      showLink={false}
                      className={styles.itemLabel}
                    />
                    <div
                      className={styles.affiliateValue}
                      style={{ color: colorizeIndex(index) }}
                    >
                      {children?.({ row, index })}
                      {row.multi && (
                        <ApiIcon
                          title="Aggregator"
                          className={styles.aggIcon}
                        />
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            ))
          : Array.from({ length: limit }).map((_, index) => (
              <div key={index} className={styles.loaderItem}>
                <div style={{ display: "flex", gap: "5px" }}>
                  <Skeleton className={styles.numberLoader} width="5px" />
                  <Skeleton className={styles.walletLoader} />
                </div>
                <Skeleton className={styles.valueLoader} />
              </div>
            ))}
      </div>
    </Card>
  );
};

export default LeaderboardCard;
