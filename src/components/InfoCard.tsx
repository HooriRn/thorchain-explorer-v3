"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import UnknownIcon from "../assets/images/unknown.svg";
import RightArrow from "../assets/images/arrow-right.svg";
import Card from "./ui/Card";
import { Skeleton } from "./ui/Skeleton";
import GlassmorphismTooltip from "./GlassmorphismTooltip";
import { formatTrendCurrency, formatRoundedCurrency } from "../utils/format";
import { useAppStore } from "@/lib/store";
import styles from "./InfoCard.module.css";

interface ProgressData {
  data: number;
  down: boolean;
  filter?: (value: any) => string;
}

interface InfoItem {
  name?: string;
  value?: string | number;
  link?: string;
  filter?: (value: any) => React.ReactNode | string;
  progress?: ProgressData;
  usdValue?: boolean | ((value: any) => string);
  extraText?: string;
  extraInfo?: string;
  header?: boolean;
  nameSlot?: string;
  valueSlot?: string;
}

interface InfoSection {
  title: string;
  icon?: string;
  link?: string;
  items: InfoItem[];
  allSlot?: string;
  cluster?: boolean;
  colSpan?: string;
  grid?: boolean;
  rowStart?: number;
}

interface InfoCardProps {
  options: InfoSection[];
  inner?: boolean;
  isLoading?: boolean;
  link?: string;
  runePrice?: number;
  tcyPrice?: number;
  children?: React.ReactNode;
  nested?: boolean;
}

const ProgressIcon: React.FC<{
  dataNumber: number;
  isDown: boolean;
  filter?: (value: any) => string;
  size?: string;
}> = ({ dataNumber, isDown, filter, size = "15.5px" }) => (
  <span style={{ fontSize: size, color: isDown ? "red" : "green" }}>
    {filter ? filter(dataNumber) : dataNumber}
  </span>
);

const SkeletonItem: React.FC<{
  loading: boolean;
  customClass?: string;
  children: React.ReactNode;
}> = ({ loading, customClass, children }) => {
  if (loading) {
    return (
      <div className={customClass || ""}>
        <Skeleton variant="text" width="100%" height="10px" />
      </div>
    );
  }
  return <>{children}</>;
};

const InfoCard: React.FC<InfoCardProps> = ({
  options = [],
  inner = false,
  isLoading = false,
  link,
  runePrice: propRunePrice = 0,
  tcyPrice: propTcyPrice = 0,
  children,
  nested = false,
}) => {
  const storeRunePrice = useAppStore((state) => state.runePrice);
  const storePools = useAppStore((state) => state.pools);

  const runePrice = propRunePrice || storeRunePrice || 0;

  const tcyPrice = React.useMemo(() => {
    if (propTcyPrice) return propTcyPrice;
    if (storePools && storePools.length > 0) {
      const tcyPool = storePools.find((pool: any) => pool.asset === "THOR.TCY");
      return tcyPool ? tcyPool.assetPriceUSD : 0;
    }
    return 0;
  }, [propTcyPrice, storePools]);
  const flexContainers: { [key: number]: InfoSection[] } = {};
  options.forEach((option) => {
    const index = option.rowStart || 0;
    if (flexContainers[index]) {
      flexContainers[index].push(option);
    } else {
      flexContainers[index] = [option];
    }
  });

  const grid = options.some((option) => option.grid);

  const addStyle = (item: InfoSection) => ({
    flex: item.colSpan,
  });

  const isReady = (item: InfoItem) => {
    if (item.value === undefined || item.value === null) {
      return true;
    }
    if (typeof item.value === "number" && isNaN(item.value)) {
      return true;
    }
    if (typeof item.value === "string" && item.value === "") {
      return true;
    }
    return false;
  };

  const WrapperComponent = inner ? "div" : Card;
  const wrapperProps = inner
    ? {}
    : {
        title: undefined,
        extraClass: "info-card",
        isChart: false,
      };

  return (
    <WrapperComponent
      {...wrapperProps}
      className={`${styles["info-card"]} ${nested ? styles["nested"] : ""}`}
    >
      <div
        className={grid ? styles["grid-containers"] : styles["flex-containers"]}
      >
        {Object.entries(flexContainers).map(
          ([key, container], containerIndex) => (
            <div
              key={`container-${containerIndex}`}
              className={
                grid ? styles["grid-container"] : styles["flex-container"]
              }
            >
              {container.map((section, rowIndex) => (
                <div
                  key={`row-${rowIndex}`}
                  className={
                    grid ? styles["grid-section"] : styles["flex-section"]
                  }
                  style={addStyle(section)}
                >
                  {section.allSlot ? (
                    <div className="all-slot-content">{children}</div>
                  ) : (
                    <>
                      <div
                        className={`${styles["section-header"]} ${
                          section.icon ? styles["has-icon"] : ""
                        }`}
                      >
                        <div className={styles["header-content"]}>
                          {section.icon && (
                            <Image
                              src={section.icon}
                              className={styles["header-icon"]}
                              alt="Icon"
                              width={36}
                              height={36}
                            />
                          )}
                          <h4>{section.title}</h4>
                        </div>
                        {section.link && (
                          <Link
                            href={section.link}
                            className={`${styles["more-link"]} clickable`}
                          >
                            More
                            <RightArrow
                              fill="currentColor"
                              height={16}
                              width={16}
                            />
                          </Link>
                        )}
                      </div>
                      <div
                        className={
                          grid
                            ? styles["grid-items"]
                            : `${styles["flex-items"]} ${
                                section.cluster ? styles["cluster"] : ""
                              }`
                        }
                      >
                        {section.items?.map((item, colIndex) => (
                          <div
                            key={`item-${rowIndex}-${colIndex}`}
                            className={
                              grid ? styles["grid-item"] : styles["flex-item"]
                            }
                            style={{
                              borderTop: item.header
                                ? "1px solid var(--border)"
                                : undefined,
                              marginTop: item.header ? "8px" : undefined,
                              paddingTop: item.header ? "8px" : undefined,
                            }}
                          >
                            {item.header ? (
                              <h4>{item.header}</h4>
                            ) : (
                              <>
                                <div className={styles["item-name"]}>
                                  {item.nameSlot ? (
                                    <div className="name-slot">{item.name}</div>
                                  ) : (
                                    <>
                                      {item.name}
                                      {item.extraInfo && (
                                        <GlassmorphismTooltip
                                          content={item.extraInfo}
                                          placement="top"
                                        >
                                          <UnknownIcon
                                            className={styles["header-icon"]}
                                            width={12}
                                            height={12}
                                          />
                                        </GlassmorphismTooltip>
                                      )}
                                    </>
                                  )}
                                </div>
                                <SkeletonItem
                                  loading={isReady(item)}
                                  customClass={styles["info-loader"]}
                                >
                                  {(typeof item.value === "number" ||
                                    item.value) && (
                                    <div className={styles["item-value"]}>
                                      {item.link ? (
                                        <Link
                                          href={item.link}
                                          className="clickable"
                                        >
                                          {item.filter
                                            ? item.filter(item.value)
                                            : item.value || "-"}
                                        </Link>
                                      ) : item.filter ? (
                                        item.filter(item.value)
                                      ) : (
                                        item.value || "-"
                                      )}
                                      {item.usdValue && (
                                        <div className={styles["usd-value"]}>
                                          {item.value &&
                                          typeof item.value === "number"
                                            ? (() => {
                                                if (
                                                  typeof item.usdValue ===
                                                  "function"
                                                ) {
                                                  return `(${item.usdValue(
                                                    item.value
                                                  )})`;
                                                } else {
                                                  const isRuneValue =
                                                    item.filter &&
                                                    item.filter
                                                      .toString()
                                                      .includes("RUNE");

                                                  if (isRuneValue) {
                                                    const isRawRuneValue =
                                                      item.filter &&
                                                      item.filter
                                                        .toString()
                                                        .includes("/ 1e8");

                                                    const runeUsdValue =
                                                      isRawRuneValue
                                                        ? (item.value / 1e8) *
                                                          (runePrice || 0)
                                                        : item.value *
                                                          (runePrice || 0);

                                                    return `(${formatRoundedCurrency(
                                                      runeUsdValue
                                                    )})`;
                                                  } else {
                                                    const isRawValue =
                                                      item.filter &&
                                                      item.filter
                                                        .toString()
                                                        .includes("/ 1e8");

                                                    const usdValue = isRawValue
                                                      ? (item.value / 1e8) *
                                                        (tcyPrice || 0)
                                                      : item.value *
                                                        (tcyPrice || 0);
                                                    return `(${formatRoundedCurrency(
                                                      usdValue
                                                    )})`;
                                                  }
                                                }
                                              })()
                                            : null}
                                        </div>
                                      )}
                                      {item.extraText && (
                                        <span className={styles["extra-text"]}>
                                          ({item.extraText})
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </SkeletonItem>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </WrapperComponent>
  );
};

export default InfoCard;
