import React, { useState, useEffect } from "react";
import { useChainsHeight, usePools, useRunePrice } from "@/lib/store";
import moment from "moment";
import { Badge } from "@/components/ui/badge";
import Card from "@/components/ui/Card";
import Link from "next/link";
import DotLive from "./DotLive";
import ScheduleIcon from "@/assets/images/schedule.svg";
import ArrowToDown from "@/assets/images/arrow-down.svg";
import TransactionAction from "@/components/transactions/TransactionAction";
import AngleIcon from "@/assets/images/angle-down.svg";
import { Skeleton } from "@/components/ui/Skeleton";
import Address from "@/components/transactions/Address";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { getScheduled, getTopSwaps } from "@/lib/api";
import AssetIcon from "./AssetIcon";
import styles from "./OutboundSwapsCard.module.css";
import {
  amountToUSD as convertAmountToUSD,
  showAsset as showAssetUtil,
  formatAddress,
} from "@/utils/global";
import { formatNumberToString, formatTotalAmount } from "@/utils/format";

const OutboundSwapsCard = () => {
  const [isVisible, setIsVisible] = useState<boolean[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [noOutbound, setNoOutbound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [outbounds, setOutbounds] = useState<any[]>([]);
  const [outData, setOutData] = useState<any[]>([]);
  const [schData, setSchData] = useState<any[]>([]);
  const [mode, setMode] = useState("ongoing-outbounds");
  const [topSwaps, setTopSwaps] = useState<any[]>([]);
  const [angleRotated, setAngleRotated] = useState<boolean[]>([]);

  const chainsHeight = useChainsHeight();
  const pools = usePools();

  const navs = [
    { title: "Ongoing Outbounds", value: "ongoing-outbounds" },
    { title: "TOP Swaps (24hr)", value: "top-swaps" },
  ];

  useEffect(() => {
    updateOutbounds();
    updateTopSwaps();

    const intervalId = setInterval(() => {
      updateOutbounds();
      updateTopSwaps();
    }, 20000);

    return () => clearInterval(intervalId);
  }, []);

  const updateTopSwaps = async () => {
    try {
      const topSwapsData = await getTopSwaps();

      if (topSwapsData && Array.isArray(topSwapsData)) {
        const swaps = topSwapsData.slice(0, 10).map((swap: any) => {
          let outputAsset = swap.out?.[0];
          if (swap.in?.length > 0) {
            outputAsset = swap.out?.find((s: any) => s.affiliate !== true);
          }

          return {
            type: swap.type,
            in: swap.in || [],
            out: swap.out || [],
            metadata: swap.metadata,
            date: moment(swap.date / 1e6).format("MMM D, HH:MM"),
            txID: swap.in?.[0]?.txID,
            inputAsset: {
              address: swap.in?.[0]?.address,
              asset: swap.in?.[0]?.coins?.[0]?.asset,
              amount: swap.in?.[0]?.coins?.[0]?.amount,
            },
            outputAsset: {
              address: outputAsset?.address,
              asset: outputAsset?.coins?.[0]?.asset,
              amount: outputAsset?.coins?.[0]?.amount,
            },
          };
        });
        setTopSwaps(swaps);
      } else if (
        topSwapsData &&
        typeof topSwapsData === "object" &&
        (topSwapsData as any).actions
      ) {
        const swaps = (topSwapsData as any).actions
          .slice(0, 10)
          .map((swap: any) => {
            let outputAsset = swap.out?.[0];
            if (swap.in?.length > 0) {
              outputAsset = swap.out?.find((s: any) => s.affiliate !== true);
            }

            return {
              type: swap.type,
              in: swap.in || [],
              out: swap.out || [],
              metadata: swap.metadata,
              date: moment(swap.date / 1e6).format("MMM D, HH:MM"),
              txID: swap.in?.[0]?.txID,
              inputAsset: {
                address: swap.in?.[0]?.address,
                asset: swap.in?.[0]?.coins?.[0]?.asset,
                amount: swap.in?.[0]?.coins?.[0]?.amount,
              },
              outputAsset: {
                address: outputAsset?.address,
                asset: outputAsset?.coins?.[0]?.asset,
                amount: outputAsset?.coins?.[0]?.amount,
              },
            };
          });
        setTopSwaps(swaps);
      } else {
        try {
          const response = await fetch("/api/top-swap");
          if (response.ok) {
            const resData = await response.json();

            if (
              resData.success &&
              resData.data &&
              Array.isArray(resData.data)
            ) {
              const swaps = resData.data.slice(0, 10).map((swap: any) => {
                let outputAsset = swap.out?.[0];
                if (swap.in?.length > 0) {
                  outputAsset = swap.out?.find(
                    (s: any) => s.affiliate !== true
                  );
                }

                return {
                  type: swap.type,
                  in: swap.in || [],
                  out: swap.out || [],
                  metadata: swap.metadata,
                  date: moment(swap.date / 1e6).format("MMM D, HH:MM"),
                  txID: swap.in?.[0]?.txID,
                  inputAsset: {
                    address: swap.in?.[0]?.address,
                    asset: swap.in?.[0]?.coins?.[0]?.asset,
                    amount: swap.in?.[0]?.coins?.[0]?.amount,
                  },
                  outputAsset: {
                    address: outputAsset?.address,
                    asset: outputAsset?.coins?.[0]?.asset,
                    amount: outputAsset?.coins?.[0]?.amount,
                  },
                };
              });
              setTopSwaps(swaps);
              return;
            }
          }
        } catch (fallbackError) {}

        setTopSwaps([]);
      }
    } catch (error) {
      setTopSwaps([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOutbounds = async () => {
    setNoOutbound(false);
    const resData = [];

    try {
      const outboundResponse = await fetch("/api/outbound");
      const scheduledResponse = await getScheduled();

      const outboundData = await outboundResponse.json();
      const outData = outboundData.success ? outboundData.data || [] : [];
      const schData = scheduledResponse || [];

      setOutData(outData);
      setSchData(schData);

      resData.push(
        ...outData.map((s: any) => ({
          ...s,
          label: "Ongoing",
          ...(s.memo.toUpperCase().includes("MIGRATE") && { label: "migrate" }),
        })),
        ...schData.map((s: any) => ({ ...s, label: "Scheduled" }))
      );

      if (!resData || resData.length === 0) {
        setOutbounds([]);
        setNoOutbound(true);
        setLoading(false);
        return;
      }

      setOutbounds(resData);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const getOutboundEta = (height: number | string) => {
    if (chainsHeight?.THOR) {
      const h = typeof height === "string" ? parseInt(height, 10) : height;
      if (typeof h !== "number" || isNaN(h)) return "";
      const remHeight = h - chainsHeight.THOR;
      if (remHeight <= 0) return "Ready";
      return moment.duration(remHeight * 6, "seconds").humanize();
    }
    return "";
  };

  const toggleExtraRight = (index: number) => {
    const newIsVisible = [...isVisible];
    newIsVisible[index] = !newIsVisible[index];
    setIsVisible(newIsVisible);

    const newAngleRotated = [...angleRotated];
    newAngleRotated[index] = !newAngleRotated[index];
    setAngleRotated(newAngleRotated);
  };

  const getAssetAmountUSD = (asset: string, amount: number | string) => {
    if (!pools) return undefined;
    return convertAmountToUSD(asset, amount, pools);
  };

  const totalOutboundValue = outData.reduce((total, o) => {
    return (
      total + (convertAmountToUSD(o.coin.asset, o.coin.amount, pools) || 0)
    );
  }, 0);

  const totalScheduledValue = schData.reduce((total, o) => {
    return total + convertAmountToUSD(o.coin.asset, o.coin.amount, pools);
  }, 0);

  const groupedOutbounds = outbounds.reduce(
    (acc: Record<string, any>, o: any) => {
      const key = o.coin.asset;
      if (!acc[key]) {
        acc[key] = {
          asset: key,
          totalAmount: 0,
          totalAmountUSD: 0,
          count: 0,
          scheduledCount: 0,
          ongoingCount: 0,
          label: o.label,
          items: [],
        };
      }

      const amount = o.coin.amount ? parseFloat(o.coin.amount) : 0;
      const amountUSD = convertAmountToUSD(o.coin.asset, amount, pools) || 0;
      acc[key].totalAmount += amount;
      acc[key].totalAmountUSD += amountUSD;
      acc[key].count += 1;

      if (o.label === "Scheduled") {
        acc[key].scheduledCount += 1;
      }

      if (o.label === "Ongoing") {
        acc[key].ongoingCount += 1;
      }

      acc[key].items.push(o);
      return acc;
    },
    {} as Record<string, any>
  );

  const filteredOutbounds = (Object.values(groupedOutbounds) as any[]).slice(
    (currentPage - 1) * 10,
    currentPage * 10
  );

  return (
    <Card
      navs={navs}
      actNav={mode}
      onActNavChange={setMode}
      header={<DotLive />}
      footer={
        mode === "ongoing-outbounds" &&
        Object.values(groupedOutbounds).length > 10 ? (
          <div className={styles["center"]}>
            <Pagination>
              {Array.from({
                length: Math.ceil(Object.values(groupedOutbounds).length / 10),
              }).map((_, i) => (
                <PaginationItem key={i + 1}>
                  <PaginationLink
                    isActive={i + 1 === currentPage}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(i + 1);
                    }}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
            </Pagination>
          </div>
        ) : null
      }
    >
      {mode === "ongoing-outbounds" ? (
        <>
          {!noOutbound ? (
            !loading ? (
              <>
                <div className={styles["overview-card"]}>
                  <div className={styles["overview-box"]}>
                    <Badge variant="info" className="text-xs px-3 py-1">
                      Scheduled
                    </Badge>
                    <div className={styles["stats-container"]}>
                      <div>
                        <span className={styles["item-value"]}>Amount: </span>
                        <span
                          className={`${styles["outbound-overall"]} ${styles["mono"]}`}
                          style={{ paddingRight: "0.8rem" }}
                        >
                          ${formatNumberToString(totalScheduledValue, "0a")}
                        </span>
                      </div>
                      <div>
                        <span className={styles["item-value"]}>Count: </span>
                        <span
                          className={`${styles["outbound-overall"]} ${styles["mono"]}`}
                        >
                          {schData.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <ArrowToDown className={styles["arrow-down-icon"]} />
                <div className={styles["overview-card"]}>
                  <div className={styles["overview-box"]}>
                    <Badge variant="green" className="text-xs px-3 py-1">
                      Ongoing
                    </Badge>
                    <div className={styles["stats-container"]}>
                      <div>
                        <span className={styles["item-value"]}>Amount: </span>
                        <span
                          className={`${styles["outbound-overall"]} ${styles["mono"]}`}
                          style={{ paddingRight: "0.8rem" }}
                        >
                          ${formatNumberToString(totalOutboundValue, "0a")}
                        </span>
                      </div>
                      <div>
                        <span className={styles["item-value"]}>Count: </span>
                        <span
                          className={`${styles["outbound-overall"]} ${styles["mono"]}`}
                        >
                          {outData.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className={styles["overview-card"]}>
                  <div className={styles["overview-box"]}>
                    <Skeleton width="80px" />
                    <div style={{ display: "flex" }}>
                      <div>
                        <Skeleton width="40px" height="10px" />
                      </div>
                      <div>
                        <Skeleton width="30px" height="10px" />
                      </div>
                    </div>
                  </div>
                </div>
                <ArrowToDown className={styles["arrow-down-icon"]} />
                <div className={styles["overview-card"]}>
                  <div className={styles["overview-box"]}>
                    <Skeleton width="70px" />
                    <div style={{ display: "flex" }}>
                      <div>
                        <Skeleton width="40px" height="10px" />
                      </div>
                      <div>
                        <Skeleton width="30px" height="10px" />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )
          ) : (
            <div className={styles["no-outbound"]}>
              <ScheduleIcon className={styles["schedule-icon"]} />
              <h3>There is no outbound schedule inside THORChain.</h3>
            </div>
          )}

          {!noOutbound && !loading && filteredOutbounds.length > 0
            ? filteredOutbounds.map((group, i) => (
                <div
                  key={i}
                  className={styles["outbound-item"]}
                  onClick={() => toggleExtraRight(i)}
                >
                  <div className={styles["outbound-collapse"]}>
                    <div className={styles["asset-item"]}>
                      <div className={styles["asset-details"]}>
                        <AssetIcon asset={group.asset} />
                        <span className={styles["asset-name"]}>
                          {formatTotalAmount(group.totalAmount, 4)}
                          <small
                            className={`${styles["asset-text"]} ${styles["sec-color"]}`}
                          >
                            {showAssetUtil(group.asset)}
                          </small>
                          {group.totalAmountUSD > 0 && (
                            <span className={styles["asset-total-usd"]}>
                              - $
                              {formatNumberToString(
                                group.totalAmountUSD,
                                "0,0.0a"
                              )}
                            </span>
                          )}
                        </span>
                      </div>

                      <div className={styles["number-item"]}>
                        {group.ongoingCount > 0 && (
                          <Badge variant="green" className="rounded-full p-0">
                            {group.ongoingCount}
                          </Badge>
                        )}
                        {group.scheduledCount > 0 && (
                          <Badge variant="info" className="rounded-full p-0">
                            {group.scheduledCount}
                          </Badge>
                        )}
                        <AngleIcon
                          className={`${styles["trigger"]} ${
                            angleRotated[i] ? styles["rotated"] : ""
                          }`}
                        />
                      </div>
                    </div>

                    {isVisible[i] && (
                      <div className={styles["extra-right"]}>
                        {group.items.map((o: any, idx: number) => (
                          <div key={idx} className={styles["asset-info"]}>
                            <div className={styles["left-part"]}>
                              <span className={styles["asset-name"]}>
                                {formatTotalAmount(o.coin.amount, 4)}
                                {pools &&
                                  !isNaN(
                                    (getAssetAmountUSD(
                                      o.coin.asset,
                                      o.coin.amount
                                    ) ?? NaN) as number
                                  ) && (
                                    <>
                                      -{" "}
                                      <small>
                                        $
                                        {formatNumberToString(
                                          (getAssetAmountUSD(
                                            o.coin.asset,
                                            o.coin.amount
                                          ) as number) ?? 0,
                                          "0,0.0a"
                                        )}
                                      </small>
                                    </>
                                  )}
                              </span>
                              {o.label === "Scheduled" && (
                                <Badge
                                  variant="info"
                                  className="text-xs px-2 py-0.5"
                                >
                                  Scheduled
                                </Badge>
                              )}
                            </div>
                            <div className={styles["right-part"]}>
                              {o.height && (
                                <div>
                                  <span
                                    style={{
                                      color: "var(--sec-font-color)",
                                      fontSize: "10px",
                                    }}
                                  >
                                    {getOutboundEta(o.height)}
                                  </span>
                                </div>
                              )}
                              {o.in_hash && o.label !== "migrate" && (
                                <small className={styles["mono"]}>
                                  <Link
                                    className={styles["clickable"]}
                                    href={`/tx/${o.in_hash}`}
                                  >
                                    {formatAddress(o.in_hash)}
                                  </Link>
                                </small>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            : !noOutbound
            ? Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className={styles["outbound-item"]}>
                  <div className={styles["outbound-collapse"]}>
                    <div className={styles["asset-item"]}>
                      <div className={styles["asset-details"]}>
                        <Skeleton width="24px" height="24px" />
                        <div className={styles["asset-name-skeleton"]}>
                          <Skeleton width="120px" />
                          <Skeleton width="80px" />
                        </div>
                      </div>
                      <div className={styles["number-item"]}>
                        <Skeleton width="16px" height="16px" />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            : null}
        </>
      ) : mode === "top-swaps" ? (
        <>
          {!topSwaps || topSwaps.length === 0 ? (
            <div className={styles["no-outbound"]}>
              <h3>There is been no swaps in the last 24hr.</h3>
            </div>
          ) : (
            topSwaps.map((swap, index) => (
              <div key={index} className={styles["top-swap-item"]}>
                <div className={styles["transactions"]}>
                  <span
                    className={styles["txid-section"]}
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--sec-font-color)",
                    }}
                  >
                    <small style={{ color: "var(--font-color)" }}>TxID</small>
                    <Link
                      className={styles["clickable"]}
                      href={`/tx/${swap.txID}`}
                    >
                      {formatAddress(swap.txID)}
                    </Link>
                  </span>
                  <TransactionAction
                    row={swap}
                    showMiniBubble={false}
                    noBorder={true}
                  />
                </div>
                <div className={styles["break"]}></div>
                <div className={styles["right-section"]}>
                  <span className={styles["mono"]}>
                    <small style={{ color: "var(--font-color)" }}>
                      Address
                    </small>
                    <Address
                      address={swap.inputAsset.address}
                      useCustomName={true}
                    />
                  </span>
                  <span>
                    <small style={{ color: "var(--font-color)" }}>Date</small>
                    <span className={styles["date"]}>{swap.date}</span>
                  </span>
                </div>
              </div>
            ))
          )}
          <Link href="/swaps" className={styles["swaps-nav"]}>
            More
          </Link>
        </>
      ) : null}
    </Card>
  );
};

export default OutboundSwapsCard;
