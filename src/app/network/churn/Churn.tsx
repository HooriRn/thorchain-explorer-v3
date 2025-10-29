"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import moment from "moment";
import Counter from "@/components/Counter";
import Card from "@/components/ui/Card";
import { getNetwork, getMimir, getChurn } from "@/lib/api";
import { useChainsHeight } from "@/lib/store";
import { number } from "@/utils/format";
import styles from "./Churn.module.css";

interface Churn {
  height: number;
  date: number;
  active_nodes: string[];
  standby_nodes: string[];
}

const ChurnPage: React.FC = () => {
  const chainsHeight = useChainsHeight();
  const currentBlock = chainsHeight?.THOR ?? 0;

  const [network, setNetwork] = useState<any>(null);
  const [mimirInfo, setMimirInfo] = useState<any>(null);
  const [nextChurnHeight, setNextChurnHeight] = useState(0);
  const [poolActivationCountdown, setPoolActivationCountdown] = useState(0);
  const [churns, setChurns] = useState<Churn[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const networkData = await getNetwork();
        setNextChurnHeight(+networkData.nextChurnHeight);
        setPoolActivationCountdown(+networkData.poolActivationCountdown);
        setNetwork(networkData);
      } catch (error) {
        console.error("Error fetching network data:", error);
      }

      try {
        const mimirData = await getMimir();
        setMimirInfo(mimirData);
      } catch (error) {
        console.error("Error fetching mimir data:", error);
      }

      try {
        const churnData = await getChurn();
        setChurns(Array.isArray(churnData) ? churnData.slice(0, 10) : []);
      } catch (error) {
        console.error("Error fetching churn data:", error);
      }
    };

    fetchData();
  }, []);

  const isChurnHalted = (): boolean => {
    if (mimirInfo && mimirInfo.HALTCHURNING) {
      return true;
    }
    return false;
  };

  const getDate = (timestamp: number): string => {
    return moment.unix(timestamp / 1e9).format("YYYY MMM D");
  };

  const untilNow = (timestamp: number): string => {
    return moment.unix(timestamp / 1e9).fromNow();
  };

  const formatAddress = (
    address: string,
    start: number = 4,
    end: boolean = true
  ): string => {
    if (!address) return "";
    if (address.length <= start * 2) return address;
    if (end) {
      return `${address.slice(0, start)}...${address.slice(-start)}`;
    }
    return `${address.slice(0, start)}...`;
  };

  return (
    <div className={styles["churn-container"]}>
      <div className={styles["countdown-churn"]}>
        <div className={styles["next-churn"]}>
          <Counter
            counter={nextChurnHeight - currentBlock}
            halted={isChurnHalted()}
            title="Next Churn"
            visibleUnits={["Days", "Hours", "Minutes", "Seconds"]}
          />

          <Card extraClass={styles["block-details"]}>
            <div className={styles["block-details-items"]}>
              <div className={styles["block-details-title"]}>
                <strong>Block Details</strong>
              </div>
              <div className={styles["block-info-items"]}>
                <strong>Remaining Blocks</strong>
                <span>#{number(nextChurnHeight - currentBlock, "0,0")}</span>
                <strong>Churn Block</strong>
                <span>#{number(nextChurnHeight, "0,0")}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className={styles["next-churn"]}>
          <Counter
            counter={poolActivationCountdown}
            title="Next Pool"
            visibleUnits={["Days", "Hours", "Minutes", "Seconds"]}
          />

          <Card extraClass={styles["block-details"]}>
            <div className={styles["block-details-items"]}>
              <div className={styles["block-details-title"]}>
                <strong>Block Details</strong>
              </div>
              <div className={styles["block-info-items"]}>
                <strong>Remaining Blocks</strong>
                <span>#{number(poolActivationCountdown, "0,0")}</span>
                <strong>Activation Block</strong>
                <span>
                  #{number(currentBlock + poolActivationCountdown, "0,0")}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Churn Lists - Commented out as in original Vue component */}
      {/* 
      <div className={styles["churn-cards"]}>
        {churns.map((churn, i) => (
          <div key={churn.height} className={styles["block-item"]}>
            <div className={styles["block-upper-info"]}>
              <div className={styles["block-info"]}>
                <span className={styles.height}>Churn #{i}</span>
                <Link className="clickable" href={`/block/${churn.height}`}>
                  {number(churn.height, "0,0")}
                </Link>
              </div>
              <div className={styles["right-section"]}>
                <div style={{ color: "var(--sec-font-color)" }}>
                  {getDate(churn.date)}
                </div>
                <small>{untilNow(churn.date)}</small>
              </div>
            </div>
            <div className={styles["block-downer-info"]}>
              <strong>Active Nodes</strong>
              {churn.active_nodes?.map((n) => (
                <span key={n} className={styles["mini-bubble"]} style={{ marginLeft: "0.5rem" }}>
                  <Link className="clickable" href={`/node/${n}`}>
                    {formatAddress(n, 4, true)}
                  </Link>
                </span>
              ))}
            </div>
            <div className={styles["block-downer-info"]}>
              <strong>Standby Nodes</strong>
              {churn.standby_nodes?.map((n) => (
                <span
                  key={n}
                  className={`${styles["mini-bubble"]} ${styles.danger}`}
                  style={{ marginLeft: "0.5rem" }}
                >
                  <Link className="clickable danger" href={`/node/${n}`}>
                    {formatAddress(n, 4, true)}
                  </Link>
                </span>
              ))}
            </div>
          </div>
        ))}
        {churns.length === 0 && (
          <>
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className={styles["loader-item"]}>
                <div className={styles["skeleton-loader"]} style={{ height: "1rem" }}></div>
              </div>
            ))}
          </>
        )}
      </div>
      */}
    </div>
  );
};

export default ChurnPage;
