"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CrossIcon from "@/assets/images/cross.svg";
import FilterIcon from "@/assets/images/filter.svg";
import styles from "./AdvancedFilter.module.css";
import { usePools } from "@/lib/store";
import InputFilter from "@/components/InputFilter";
import SelectFilter from "@/components/SelectFilter";
import CustomDatePicker from "@/components/DatePicker";

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

  const assets = useMemo(() => {
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
  }, [pools]);

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
      filters.dateValue &&
      filters.dateValue[0] !== null &&
      filters.dateValue[1] !== null
    ) {
      return false;
    }
    if (
      (filters.fromHeight.trim() !== "" &&
        isNaN(parseInt(filters.fromHeight))) ||
      (filters.toHeight.trim() !== "" && isNaN(parseInt(filters.toHeight)))
    ) {
      return false;
    }
    return (
      filters.addresses.length > 0 ||
      filters.txId.length > 0 ||
      filters.affiliate.length > 0 ||
      filters.asset.length > 0 ||
      filters.type.length > 0 ||
      filters.txType.length > 0 ||
      filters.toHeight.trim() !== "" ||
      filters.fromHeight.trim() !== "" ||
      (filters.dateValue &&
        filters.dateValue[0] !== null &&
        filters.dateValue[1] !== null)
    );
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
      router.push(`/txs?${params.toString()}`);
      toggleModal();
    }
  };

  const resetForm = () => {
    router.push("/txs");
  };

  useEffect(() => {
    const query = Object.fromEntries(searchParams.entries());
    updateFiltersFromQuery(query);
  }, [searchParams]);

  useEffect(() => {
    setSubmittedCount(filledFilterCount());
  }, [filters]);

  const updateFromHeight = (value: string) => {
    setFilters((prev) => ({ ...prev, fromHeight: value }));
  };

  const updateToHeight = (value: string) => {
    setFilters((prev) => ({ ...prev, toHeight: value }));
  };

  const updateDateValue = (dates: [Date | null, Date | null]) => {
    const [startDate, endDate] = dates;
    setFilters((prev) => ({
      ...prev,
      dateValue: [
        startDate ? startDate.getTime() : null,
        endDate ? endDate.getTime() : null,
      ],
    }));
  };

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
              {!hideAddressFilter && (
                <div className={styles["input-row"]}>
                  <InputFilter
                    tags={filters.addresses}
                    placeholder="Enter Addresses, press enter"
                    label={filterLabels.addresses}
                    showEnterIcon={true}
                    onTagsUpdate={(tags) => updateTags("addresses", tags)}
                  />
                </div>
              )}

              <div className={styles["input-row"]}>
                <InputFilter
                  tags={filters.affiliate}
                  placeholder="Enter Affiliate, press enter"
                  label={filterLabels.affiliate}
                  showEnterIcon={true}
                  onTagsUpdate={(tags) => updateTags("affiliate", tags)}
                />
                <InputFilter
                  tags={filters.asset}
                  placeholder="Enter Asset, press enter"
                  label={filterLabels.asset}
                  suggestions={assets}
                  showEnterIcon={true}
                  onTagsUpdate={(tags) => updateTags("asset", tags)}
                />
              </div>

              <div className={styles["input-row"]}>
                <div className={styles["input-group"]}>
                  <label htmlFor="fromHeight">{filterLabels.fromHeight}</label>
                  <input
                    id="fromHeight"
                    type="text"
                    value={filters.fromHeight}
                    onChange={(e) => updateFromHeight(e.target.value)}
                    placeholder="Enter fromHeight, press enter"
                  />
                </div>
                <div className={styles["input-group"]}>
                  <label htmlFor="toHeight">{filterLabels.toHeight}</label>
                  <input
                    id="toHeight"
                    type="text"
                    value={filters.toHeight}
                    onChange={(e) => updateToHeight(e.target.value)}
                    placeholder="Enter toHeight, press enter"
                  />
                </div>
              </div>

              <div className={styles["input-row"]}>
                <SelectFilter
                  options={getOptions("type")}
                  default={filters.type}
                  label={filterLabels.type}
                  onSelectedOptionsUpdate={(options) =>
                    selectOption("type", options)
                  }
                />
                <SelectFilter
                  options={getOptions("txType")}
                  default={filters.txType}
                  label={filterLabels.txType}
                  onSelectedOptionsUpdate={(options) =>
                    selectOption("txType", options)
                  }
                />
              </div>

              <div className={styles["input-row"]}>
                <CustomDatePicker
                  startDate={
                    filters.dateValue[0] ? new Date(filters.dateValue[0]) : null
                  }
                  endDate={
                    filters.dateValue[1] ? new Date(filters.dateValue[1]) : null
                  }
                  onChange={updateDateValue}
                  label={filterLabels.date}
                  placeholder="Select date range"
                  disabled={isHeightFilled()}
                />
              </div>
            </div>

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
      )}
    </div>
  );
};

export default AdvancedFilter;
