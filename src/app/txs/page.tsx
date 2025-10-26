"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { pick } from "lodash";
import Page from "@/components/PageContainer";
import Transactions from "@/components/Transactions";
import CrossIcon from "@/assets/images/cross.svg";
import AdvancedFilter from "./components/AdvancedFilter";
import { getActions } from "@/lib/api";
import styles from "./page.module.css";

interface FilterItem {
  label: string;
  filter: {
    type?: string[];
    asset?: string[];
  };
}

const TxsPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [txs, setTxs] = useState<any>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(
    undefined
  );
  const [prevPageToken, setPrevPageToken] = useState<string | undefined>(
    undefined
  );
  const [count, setCount] = useState<number>(-1);

  const limit = 30;

  const filtersList: FilterItem[] = [
    { label: "All", filter: {} },
    {
      label: "L1 Swaps",
      filter: { type: ["swap"], asset: ["notrade"] },
    },
    { label: "Secure", filter: { type: ["secure"] } },
    { label: "Trade Swaps", filter: { type: ["swap"], asset: ["trade"] } },
    { label: "Synth Swaps", filter: { type: ["swap"], asset: ["synth"] } },
    {
      label: "LP / Savers",
      filter: { type: ["addLiquidity", "withdraw"] },
    },
    {
      label: "RUNEPool",
      filter: { type: ["runePoolDeposit", "runePoolWithdraw"] },
    },
    { label: "Send", filter: { type: ["send"] } },
    { label: "Refund", filter: { type: ["refund"] } },
    { label: "Switch", filter: { type: ["switch"] } },
    { label: "Contract", filter: { type: ["contract"] } },
    {
      label: "TCY",
      filter: { type: ["tcy_claim", "tcy_stake", "tcy_unstake"] },
    },
  ];

  const checkQuery = (queries: any) => {
    return pick(queries, [
      "address",
      "asset",
      "height",
      "fromHeight",
      "affiliate",
      "txType",
      "type",
      "fromTimestamp",
      "timestamp",
      "nextPageToken",
      "prevPageToken",
    ]);
  };

  const isActive = (filter: FilterItem) => {
    if (filter.label === "All") {
      return (
        Object.keys(Object.fromEntries(searchParams.entries())).length === 0
      );
    }

    const filterType = filter.filter.type ? filter.filter.type.join(",") : null;
    const filterAsset = filter.filter.asset
      ? filter.filter.asset.join(",")
      : null;

    const currentType = searchParams.get("type") || null;
    const currentAsset = searchParams.get("asset") || null;

    return filterType === currentType && filterAsset === currentAsset;
  };

  const applyFilter = (filter: FilterItem) => {
    if (filter.label === "All") {
      router.push("/txs");
    } else {
      const query: Record<string, string> = {};

      if (filter.filter.type) {
        query.type = filter.filter.type.join(",");
      }

      if (filter.filter.asset) {
        query.asset = filter.filter.asset.join(",");
      }

      const params = new URLSearchParams(query);
      router.push(`/txs?${params.toString()}`);
    }
    setShowFilters(false);
  };

  const toggleModal = () => {
    setShowFilters(!showFilters);
  };

  const fetchData = async (params: any) => {
    setLoading(true);
    setError(false);

    const cleanParams = checkQuery(params);

    let offset = 0;
    const pageParam = searchParams.get("page");
    if (pageParam) {
      const page = parseInt(pageParam);
      setCurrentPage(page);
      offset = (page - 1) * limit;
    }

    try {
      const res = await getActions({
        limit,
        ...cleanParams,
        offset,
      });

      const responseData = (res as any).data || res;
      setTxs(responseData);
      if ((res as any).meta) {
        setNextPageToken((res as any).meta.nextPageToken);
        setPrevPageToken((res as any).meta.prevPageToken);
      }
      if ((res as any).count !== undefined) {
        setCount((res as any).count);
      }
      setError(false);
      setLoading(false);
    } catch (error: any) {
      if (error.message === "cancel") {
        setLoading(true);
        return;
      }
      setError(true);
      console.error(error);
      setLoading(false);
    }
  };

  const goNext = () => {
    if (!nextPageToken) return;
    const currentQuery = Object.fromEntries(searchParams.entries());
    const params = new URLSearchParams({
      ...currentQuery,
      nextPageToken,
      prevPageToken: "",
    });
    router.push(`/txs?${params.toString()}`);
  };

  const goPrev = () => {
    if (!prevPageToken) return;
    const currentQuery = Object.fromEntries(searchParams.entries());
    const params = new URLSearchParams({
      ...currentQuery,
      prevPageToken,
      nextPageToken: "",
    });
    router.push(`/txs?${params.toString()}`);
  };

  const onPageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const currentQuery = Object.fromEntries(searchParams.entries());
    const params = new URLSearchParams({
      ...currentQuery,
      page: newPage.toString(),
    });
    router.push(`/txs?${params.toString()}`);
  };

  useEffect(() => {
    const query = Object.fromEntries(searchParams.entries());
    fetchData(query);
  }, [searchParams]);

  useEffect(() => {
    const query = Object.fromEntries(searchParams.entries());
    if (Object.keys(query).length === 0) {
      const params = new URLSearchParams({
        asset: "notrade",
        type: "swap",
      });
      router.push(`/txs?${params.toString()}`);
    }
  }, []);

  return (
    <Page error={false} fluid={false}>
      <div className={styles["transactions-container"]}>
        <div className={styles["top-bar"]}>
          <button
            className={styles["mobile-filter-btn"]}
            onClick={() => setShowFilters(true)}
          >
            Quick Filters
          </button>
          <div
            className={`${styles["action-types"]} ${styles["desktop-filters"]}`}
          >
            {filtersList.map((filter, index) => (
              <div
                key={index}
                className={`${styles["action-type"]} ${
                  isActive(filter) ? styles.active : ""
                }`}
                onClick={() => applyFilter(filter)}
              >
                {filter.label}
              </div>
            ))}
          </div>

          <AdvancedFilter />
        </div>

        {showFilters && (
          <div className={styles["mobile-filter-modal"]}>
            <div className={styles["modal-content"]}>
              <div className={styles["modal-header"]}>
                <h3>Quick Filters</h3>
                <CrossIcon
                  className={styles["close-btn"]}
                  onClick={toggleModal}
                />
              </div>
              <div className={styles["action-types"]}>
                {filtersList.map((filter, index) => (
                  <div
                    key={index}
                    className={`${styles["action-type"]} ${
                      isActive(filter) ? styles.active : ""
                    }`}
                    onClick={() => applyFilter(filter)}
                  >
                    {filter.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div>
          {error ? (
            <div className={styles["error-container"]}>
              Can't Fetch the actions! Please Try again Later.
            </div>
          ) : (
            <Transactions txs={txs} loading={loading} />
          )}
        </div>

        {txs && txs.actions && count > -1 && (
          <div>{/* NewPagination component would go here */}</div>
        )}

        {txs && txs.actions && count === -1 && (
          <div>{/* Pagination component would go here */}</div>
        )}
      </div>
    </Page>
  );
};

export default TxsPage;
