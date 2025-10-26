"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CrossIcon from "@/assets/images/cross.svg";
import FilterIcon from "@/assets/images/filter.svg";
import styles from "./AdvancedFilter.module.css";
import { usePools } from "@/lib/store";

interface AdvancedFilterProps {
  hideAddressFilter?: boolean;
}

interface FilterState {
  addresses: string[];
  txId: string[];
  asset: string[];
  type: string[];
  txType: string[];
  affiliate: string[];
  toHeight: string;
  fromHeight: string;
  dateValue: [number | null, number | null];
}

const filterLabels = {
  addresses: "Addresses",
  txId: "TX ID",
  asset: "Asset",
  type: "Type",
  txType: "TxType",
  affiliate: "Affiliate",
  toHeight: "To Height",
  fromHeight: "From Height",
  date: "Date Range",
};

const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
  hideAddressFilter = false,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pools = usePools();
  const modalRef = useRef<HTMLDivElement>(null);

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [submittedCount, setSubmittedCount] = useState<number>(0);
  const [filters, setFilters] = useState<FilterState>({
    addresses: [],
    txId: [],
    asset: [],
    type: [],
    txType: [],
    affiliate: [],
    toHeight: "",
    fromHeight: "",
    dateValue: [null, null],
  });

  const filledFilterCount = () => {
    let count = 0;
    if (filters.addresses.length > 0) count++;
    if (filters.txId.length > 0) count++;
    if (filters.affiliate.length > 0) count++;
    if (filters.asset.length > 0) count++;
    if (filters.type.length > 0) count++;
    if (filters.txType.length > 0) count++;
    if (filters.toHeight && filters.toHeight.trim() !== "") count++;
    if (filters.fromHeight && filters.fromHeight.trim() !== "") count++;
    if (
      filters.dateValue &&
      filters.dateValue[0] != null &&
      filters.dateValue[1] != null
    ) {
      count++;
    }
    return count;
  };

  const isHeightFilled = () => {
    return filters.toHeight.trim() !== "" || filters.fromHeight.trim() !== "";
  };

  const assets = () => {
    if (pools && pools.length > 0) {
      const poolsMap = pools
        .map((p: any) => p.asset)
        .flatMap((a: string) => [
          a,
          a.replace(".", "/"),
          a.replace(".", "~"),
          a.replace(".", "-"),
        ]);

      return [...poolsMap, "THOR.RUNE"];
    }
    return [];
  };

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);

    if (!isModalVisible) {
      setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 0);
    }
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      toggleModal();
    }
  };

  const handleKeydown = (event: React.KeyboardEvent) => {
    event.stopPropagation();

    if (event.key === "Escape") {
      toggleModal();
    }
  };

  const selectOption = (key: string, options: string[]) => {
    setFilters((prev) => ({ ...prev, [key]: options }));
  };

  const updateTags = (type: string, tags: string[]) => {
    setFilters((prev) => ({ ...prev, [type]: tags }));
  };

  const getOptions = (key: string): string[] => {
    if (key === "type") {
      return [
        "swap",
        "send",
        "addLiquidity",
        "withdraw",
        "donate",
        "refund",
        "switch",
        "thorname",
        "runePoolDeposit",
        "runePoolWithdraw",
        "bond",
        "unbond",
        "trade",
        "secure",
        "contract",
      ];
    }

    return [
      "unknown",
      "add",
      "withdraw",
      "swap",
      "limitOrder",
      "outbound",
      "donate",
      "bond",
      "unbond",
      "leave",
      "yggdrasilFund",
      "yggdrasilReturn",
      "reserve",
      "refund",
      "migrate",
      "ragnarok",
      "switch",
      "noOp",
      "consolidate",
      "thorname",
      "loanOpen",
      "loanRepayment",
    ];
  };

  const isFormValid = () => {
    if (
      (filters.toHeight.trim() !== "" || filters.fromHeight.trim() !== "") &&
      filters.dateValue?.length > 0 &&
      (filters.dateValue[0] || filters.dateValue[1])
    ) {
      return false;
    }
    return true;
  };

  const prepareQueryParams = () => {
    const query: Record<string, string> = {};

    if (filters.addresses.length > 0) {
      query.address = filters.addresses.map((addr) => addr.trim()).join(",");
    }

    const otherArrayFilters = ["txId", "asset", "type", "txType", "affiliate"];
    otherArrayFilters.forEach((key) => {
      const filterValue = (filters as any)[key];
      if (filterValue?.length > 0) {
        query[key] = filterValue
          .filter(Boolean)
          .map((item: string) => item.trim())
          .join(",");
      }
    });

    if (filters.fromHeight) {
      query.fromHeight = filters.fromHeight.toString().trim();
    }

    if (filters.toHeight) {
      query.toHeight = filters.toHeight.toString().trim();
    }

    if (filters.dateValue && filters.dateValue[0] && filters.dateValue[1]) {
      query.fromTimestamp = Math.floor(filters.dateValue[0] / 1000).toString();
      query.timestamp = Math.floor(filters.dateValue[1] / 1000).toString();
    }

    return query;
  };

  const updateFiltersFromQuery = (query: any) => {
    const newFilters: FilterState = {
      addresses: [],
      txId: [],
      asset: [],
      type: [],
      txType: [],
      affiliate: [],
      toHeight: "",
      fromHeight: "",
      dateValue: [null, null],
    };

    if (query.address) {
      newFilters.addresses = query.address
        .split(",")
        .map((item: string) => item.trim());
    }

    const arrayFilters = ["txId", "asset", "type", "txType", "affiliate"];
    arrayFilters.forEach((key) => {
      if (query[key]) {
        (newFilters as any)[key] = query[key]
          .split(",")
          .map((item: string) => item.trim());
      }
    });

    if (query.fromHeight) {
      newFilters.fromHeight = query.fromHeight.toString();
    }

    if (query.toHeight) {
      newFilters.toHeight = query.toHeight.toString();
    }

    if (query.fromTimestamp && query.timestamp) {
      newFilters.dateValue = [
        parseInt(query.fromTimestamp) * 1000,
        parseInt(query.timestamp) * 1000,
      ];
    }

    setFilters(newFilters);
  };

  const submitForm = () => {
    if (isFormValid()) {
      const query = prepareQueryParams();
      const params = new URLSearchParams(query);
      router.push(`/transactions?${params.toString()}`);
      toggleModal();
    }
  };

  const resetForm = () => {
    router.push("/transactions");
  };

  useEffect(() => {
    const query = Object.fromEntries(searchParams.entries());
    updateFiltersFromQuery(query);
  }, [searchParams]);

  useEffect(() => {
    setSubmittedCount(filledFilterCount());
  }, [filters]);

  return (
    <div>
      <button className={styles["advanced-filter"]} onClick={toggleModal}>
        <FilterIcon className={styles["filter-icon"]} />
        Advanced Filter
        {submittedCount > 0 && (
          <span className={styles["mini-bubble"]}>{submittedCount}</span>
        )}
      </button>

      {isModalVisible && (
        <div
          ref={modalRef}
          className={styles["modal-overlay"]}
          tabIndex={0}
          onClick={handleOverlayClick}
          onKeyDown={handleKeydown}
        >
          <div className={styles["modal-content"]}>
            <div className={styles["modal-header"]}>
              <h3>Advanced Filters</h3>
              <CrossIcon
                className={styles["close-btn"]}
                onClick={toggleModal}
              />
            </div>
            <div className={styles["input-fields"]}>
              {/* Input filters would go here - simplified version */}
              <div className={styles["button-group"]}>
                <button
                  disabled={!isFormValid()}
                  className={!isFormValid() ? styles["disabled-btn"] : ""}
                  onClick={submitForm}
                >
                  Submit
                </button>
                <button onClick={resetForm}>Clear</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilter;
