"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import moment from "moment";
import { useAppStore } from "@/lib/store";
import {
  isValidTx,
  formatAddress,
  findAssetInPool,
  amountToUSD,
} from "@/utils/global";
import { shortAssetName } from "@/utils/index";
import { formatNumberToString, formatPercent } from "@/utils/format";
import Card from "@/components/ui/Card";
import AssetIcon from "@/components/AssetIcon";
import DotLive from "@/components/DotLive";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/Skeleton";
import styles from "./Streaming.module.css";
import StreamingIcon from "@/assets/images/streaming.svg";

const RightArrow = () => (
  <svg
    className={styles["action-type"]}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
  </svg>
);

const SkeletonLoader = ({
  width,
  height,
}: {
  width: string;
  height?: string;
}) => <Skeleton variant="text" width={width} height={height || "10px"} />;

interface StreamingSwap {
  tx_id: string;
  source_asset: string;
  deposit: string;
  interval: number;
  quantity: number;
  count: number;
  inputAsset?: {
    asset: string;
    amount: number;
  };
  outputAsset?: {
    asset: string;
    amount: number;
  };
  remaingIntervals?: number;
  remaningETA?: string;
}

const Streaming: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [noStreaming, setNoStreaming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [streamingSwaps, setStreamingSwaps] = useState<StreamingSwap[]>([]);
  const [totalSumAmount, setTotalSumAmount] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const perPage = 7;
  const pools = useAppStore((state) => state.pools);

  const filteredStreamingSwaps = streamingSwaps.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const updateStreamingSwap = useCallback(async () => {
    setNoStreaming(false);

    try {
      const response = await fetch("/api/streaming-swap");
      const result = await response.json();

      const resData = result.data;

      if (!resData || resData.length === 0) {
        setNoStreaming(true);
        setStreamingSwaps([]);
        setLoading(false);
        return;
      }

      const totalAmount = resData.reduce((acc: number, swap: any) => {
        const inputUsdValue = amountToUSD(
          swap.source_asset,
          swap.deposit,
          pools
        );
        return acc + (inputUsdValue || 0);
      }, 0);
      setTotalSumAmount(totalAmount);

      const swaps: StreamingSwap[] = [];

      for (let i = 0; i < resData.length; i++) {
        const swap: any = { ...resData[i] };

        try {
          const txResponse = await fetch(
            `/api/transaction-status?txid=${resData[i].tx_id}`
          );
          const txResult = await txResponse.json();

          const swapDetails = txResult.data;

          const txAsset = swapDetails?.tx;
          if (txAsset && txAsset.coins && txAsset.coins.length > 0) {
            swap.inputAsset = {
              asset: txAsset.coins[0].asset,
              amount: txAsset.coins[0].amount,
            };
          }

          let nonRUNE = false;
          if (!swap.outputAsset?.asset) {
            const memo = swapDetails.tx?.memo;
            if (memo) {
              const m = swapDetails.tx?.memo.split(":", 3)[1];
              const outAsset = shortAssetName(m);

              const assetName =
                typeof outAsset === "object" && outAsset !== null
                  ? outAsset.symbol || outAsset.ticker || m
                  : outAsset;
              if (assetName !== "THOR.RUNE") {
                nonRUNE = true;
              }
              swap.outputAsset = {
                asset: outAsset,
              };
            }
          }

          const outAsset = swapDetails?.out_txs;
          if (outAsset && outAsset.length > 0) {
            const oa = outAsset.map((o: any) => ({
              asset: o.coins?.[0]?.asset,
              amount: o.coins?.[0]?.amount,
            }));

            const tmpOut = {
              amount: 0,
              asset: "",
              new: false,
            };

            if (oa.every((a: any) => a.asset === "THOR.RUNE") && !nonRUNE) {
              tmpOut.amount = oa?.reduce(
                (a: number, b: any) => Math.max(+a, +b),
                -Infinity
              );
              tmpOut.asset = oa[0].asset;
              tmpOut.new = true;
            } else {
              const nonRuneAsset = oa.find((a: any) => a.asset !== "THOR.RUNE");
              if (nonRuneAsset) {
                tmpOut.amount = nonRuneAsset.amount;
                tmpOut.asset = nonRuneAsset.asset;
                tmpOut.new = true;
              }
            }

            if (tmpOut.new) {
              swap.outputAsset = {
                asset: tmpOut.asset,
                amount: tmpOut.amount,
              };
            }
          }

          const plannedAsset = swapDetails?.planned_out_txs;
          if (plannedAsset && plannedAsset.length > 0) {
            if (nonRUNE && plannedAsset[0].coin?.asset !== "THOR.RUNE") {
              swap.outputAsset = {
                asset: plannedAsset[0].coin?.asset,
                amount: plannedAsset[0].coin?.amount,
              };
            }
          }

          swap.remaingIntervals =
            resData[i].interval * (resData[i].quantity - resData[i].count);
          swap.remaningETA = moment
            .duration(swap.remaingIntervals * 6, "seconds")
            .humanize();

          if (swap.outputAsset?.asset && pools) {
            swap.outputAsset.asset = findAssetInPool(
              swap.outputAsset?.asset,
              pools
            );
          }

          swaps.push(swap as StreamingSwap);
        } catch (error) {
          console.error(`❌ Error processing swap ${resData[i].tx_id}:`, error);
          console.error("❌ Swap data:", resData[i]);
        }
      }

      setStreamingSwaps(swaps);
      setLoading(false);
    } catch (error) {
      console.error("❌ Error updating streaming swaps:", error);
      console.error("❌ Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      setNoStreaming(true);
      setLoading(false);
    }
  }, [pools]);

  useEffect(() => {
    const interval = setInterval(updateStreamingSwap, 10000);
    setIntervalId(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [updateStreamingSwap]);

  useEffect(() => {
    if (pools) {
      updateStreamingSwap();
    }
  }, [pools, updateStreamingSwap]);

  const showAsset = (asset: string) => {
    if (!asset) return "";
    try {
      const result = shortAssetName(asset);

      if (typeof result === "object" && result !== null) {
        return result.symbol || result.ticker || asset;
      }
      return result;
    } catch (error) {
      return asset;
    }
  };

  const totalPages = Math.ceil(streamingSwaps.length / perPage);

  return (
    <Card title="Ongoing Streaming Swaps" bodyClass="streaming-flex">
      <div className={styles.header}>
        <DotLive />
      </div>

      <div className={styles["custom-card"]}>
        <div className={styles["overview-box"]}>
          <div className={styles["stats-container"]}>
            <div>
              <span className={styles["item-value"]}>Amount: </span>
              {totalSumAmount && !loading ? (
                <span
                  className={styles["total-swaps"]}
                  style={{ paddingRight: "1rem" }}
                >
                  ${formatNumberToString(totalSumAmount, { decimalScale: 0 })}
                </span>
              ) : loading ? (
                <SkeletonLoader width="50px" />
              ) : (
                <span>-</span>
              )}
            </div>
            <div>
              <span className={styles["item-value"]}>Count: </span>
              {!loading ? (
                <span className={styles["total-swaps"]}>
                  {streamingSwaps.length}
                </span>
              ) : (
                <SkeletonLoader width="50px" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles["dashboard-card"]}>
        {noStreaming ? (
          <div className={styles["no-streaming"]}>
            <StreamingIcon className={styles["streaming-icon"]} />
            <h3>There is no streaming swaps ongoing at the moment.</h3>
          </div>
        ) : loading ? (
          <>
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className={styles["streaming-item"]}>
                <div className={styles["upper-body"]}>
                  <div className={styles["asset-container"]}>
                    <div className={styles["asset-item"]}>
                      <SkeletonLoader width="24px" height="24px" />
                      <SkeletonLoader width="80px" />
                    </div>
                    <RightArrow />
                    <div className={styles["asset-item"]}>
                      <SkeletonLoader width="24px" height="24px" />
                      <SkeletonLoader width="80px" height="10" />
                    </div>
                  </div>
                  <SkeletonLoader width="120px" />
                </div>
                <SkeletonLoader width="200px" />
              </div>
            ))}
          </>
        ) : (
          <>
            {filteredStreamingSwaps.map((swap, i) => (
              <React.Fragment key={i}>
                <div className={styles["streaming-item"]}>
                  <div className={styles["upper-body"]}>
                    <div className={styles["asset-container"]}>
                      {swap.inputAsset && (
                        <div className={styles["asset-item"]}>
                          <AssetIcon asset={swap.inputAsset.asset} />
                          <span className={styles["asset-name"]}>
                            {formatNumberToString(
                              swap.inputAsset.amount / 1e8,
                              { decimalScale: 4 }
                            )}
                            <small className={styles["asset-text"]}>
                              {swap.inputAsset.asset}
                            </small>
                          </span>
                        </div>
                      )}
                      <RightArrow />
                      {swap.outputAsset && (
                        <div className={styles["asset-item"]}>
                          <AssetIcon asset={swap.outputAsset.asset} />
                          <span className={styles["asset-name"]}>
                            {swap.outputAsset.amount &&
                              formatNumberToString(
                                swap.outputAsset.amount / 1e8,
                                { decimalScale: 4 }
                              )}
                            <small className={styles["asset-text"]}>
                              {showAsset(swap.outputAsset.asset)}
                            </small>
                          </span>
                        </div>
                      )}
                    </div>
                    {swap.tx_id && (
                      <small className={styles["sec-color"]}>
                        {isValidTx(swap.tx_id) ? (
                          <Link
                            href={`/tx/${swap.tx_id}`}
                            className="clickable"
                          >
                            {formatAddress(swap.tx_id)}
                          </Link>
                        ) : (
                          formatAddress(swap.tx_id)
                        )}
                      </small>
                    )}
                  </div>

                  <div className={styles["extra-info"]}>
                    {swap.quantity > 0 && (
                      <>
                        <Progress
                          value={Math.max(
                            0,
                            Math.min(100, (swap.count / swap.quantity) * 100)
                          )}
                        />
                      </>
                    )}
                    <small style={{ whiteSpace: "nowrap" }}>
                      {formatPercent(swap.count / swap.quantity)}
                    </small>
                  </div>

                  <small style={{ marginTop: "5px" }}>
                    {swap.interval} Blocks / Swap
                    <span className={styles["sec-color"]}>
                      <small style={{ color: "var(--font-color)" }}>
                        (ETA{" "}
                      </small>
                      {swap.remaningETA}
                      <small style={{ color: "var(--font-color)" }}>
                        , Remaining swaps: {swap.quantity - swap.count}
                      </small>
                      <small style={{ color: "var(--font-color)" }}>)</small>
                    </span>
                  </small>
                </div>
                <hr key={`${i}-hr`} className={styles["hr-space"]} />
              </React.Fragment>
            ))}
          </>
        )}
      </div>

      <Link href="/swaps" className={styles["swaps-nav"]}>
        TOP Swaps (24hr)
      </Link>

      {streamingSwaps.length > perPage && (
        <div className={styles.footer}>
          <div className={styles.pagination}>
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                className={`${styles["page-button"]} ${
                  currentPage === index + 1 ? styles.active : ""
                }`}
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default Streaming;
