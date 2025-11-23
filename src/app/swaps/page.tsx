"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import moment from "moment";
import Page from "@/components/PageContainer";
import Nav from "@/components/Nav";
import { Table, TableColumn, TableData } from "@/components/table";
import Swap from "@/app/charts/swap/page";
import { formatTrendCurrency, formatVueNumber } from "@/utils/format";
import { smallBaseAmountFormatWithCur } from "@/utils/global";
import FileDownloadIcon from "@/assets/images/file-download.svg";
import styles from "./swaps.module.css";
import Transactions from "@/components/Transactions";
import Header from "@/components/Header";

interface SwapData {
  in?: Array<{
    txID: string;
    address: string;
    coins: Array<{
      asset: string;
      amount: string;
    }>;
  }>;
  out?: Array<{
    address: string;
    coins: Array<{
      asset: string;
      amount: string;
    }>;
    affiliate?: boolean;
  }>;
  height: number;
  date: number;
  type: string;
  status: string;
  metadata?: any;
  tx?: {
    hash: string;
    date: number;
  };
  hash?: string;
  txHash?: string;
}

interface NavItem {
  text: string;
  mode: string;
}

const SwapsPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [swaps, setSwaps] = useState<SwapData[] | undefined>(undefined);
  const [tablePeriod, setTablePeriod] = useState<string>("day");
  const [loading, setLoading] = useState<boolean>(false);

  const tablePeriods: NavItem[] = [
    { text: "1 Day", mode: "day" },
    { text: "1 Week", mode: "week" },
    { text: "1 Month", mode: "month" },
  ];

  const getVolume = (props: any) => {
    const inPrice = +(props?.metadata?.swap?.inPriceUSD || 0);
    const inAmount = +(props?.in?.[0]?.coins?.[0]?.amount || 0);
    return inPrice * inAmount;
  };

  const formatProp: TableColumn[] = [
    {
      label: "Volume",
      renderCell: (item: any) => (
        <span className="mono">
          {smallBaseAmountFormatWithCur(getVolume(item), formatVueNumber)}
        </span>
      ),
    },
  ];

  useEffect(() => {
    const queryTablePeriod = searchParams.get("tablePeriod");
    let shouldUpdateQuery = false;

    if (queryTablePeriod) {
      setTablePeriod(queryTablePeriod);
    } else {
      shouldUpdateQuery = true;
    }

    if (shouldUpdateQuery) {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set("tablePeriod", tablePeriod);
      router.push(`?${newSearchParams.toString()}`);
    }

    fetchTableData(tablePeriod);
  }, []);

  useEffect(() => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set("tablePeriod", tablePeriod);
    router.push(`?${newSearchParams.toString()}`);
    fetchTableData(tablePeriod);
  }, [tablePeriod]);

  const fetchTableData = async (period: string) => {
    try {
      setLoading(true);
      const response = await getTopSwaps(period);
      if (response?.data) {
        setSwaps(response.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTopSwaps = async (period: string) => {
    try {
      let apiEndpoint = "/api/top-swap";

      switch (period) {
        case "day":
          apiEndpoint = "/api/top-swap";
          break;
        case "week":
          apiEndpoint = "/api/top-swap-weekly";
          break;
        case "month":
          apiEndpoint = "/api/top-swap-monthly";
          break;
        default:
          apiEndpoint = "/api/top-swap";
      }

      const response = await fetch(apiEndpoint);
      const data = await response.json();

      if (data.success && data.data) {
        return {
          success: true,
          data: data.data,
        };
      }

      return { success: false, data: [] };
    } catch (error) {
      console.error("Error fetching top swaps:", error);
      return { success: false, data: [] };
    }
  };

  const downloadSwaps = (data: SwapData[]) => {
    let swapsData = data;
    if (data && (data as any).actions && Array.isArray((data as any).actions)) {
      swapsData = (data as any).actions;
    } else if (Array.isArray(data)) {
      swapsData = data;
    } else {
      console.error("Unexpected data structure:", data);
      return;
    }

    if (!swapsData.length) {
      console.error("No swaps data available for CSV download.");
      return;
    }

    const csvData = swapsData.map((swap) => {
      const inPrice = +(swap?.metadata?.swap?.inPriceUSD || 0);
      const inAmount = +(swap?.in?.[0]?.coins?.[0]?.amount || 0);
      const volume = inPrice * inAmount;

      const nonAffiliateOuts = swap.out?.filter((out) => !out.affiliate) || [];
      const firstNonAffiliateOut = nonAffiliateOuts[0];

      return {
        hash:
          swap.tx?.hash || swap.hash || swap.txHash || swap.in?.[0]?.txID || "",
        date: swap.tx?.date
          ? moment.unix(swap.tx.date).format("YYYY-MM-DD HH:mm:ss")
          : swap.date
          ? moment(swap.date / 1e6).format("YYYY-MM-DD HH:mm:ss")
          : "",
        volume: volume / 1e8,
        volumeUSD: formatVueNumber(volume / 1e8, "0,0.00a"),
        from: swap.in?.[0]?.address || "",
        to: firstNonAffiliateOut?.address || "",
        inAsset: swap.in?.[0]?.coins[0]?.asset || "",
        inAmount: Number(swap.in?.[0]?.coins?.[0]?.amount || 0) / 1e8,
        outAsset: firstNonAffiliateOut?.coins?.[0]?.asset || "",
        outAmount: Number(firstNonAffiliateOut?.coins?.[0]?.amount || 0) / 1e8,
      };
    });

    const csvContent = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) =>
        Object.values(row)
          .map((value) => `"${value}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    const period = tablePeriod;
    const timestamp = moment().format("YYYY-MM-DD");

    link.setAttribute("href", url);
    link.setAttribute("download", `top-swaps-${period}-${timestamp}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Page error={false} fluid={false}>
      <Swap />
      <div className={styles["header-top-swap"]}>
        <Header title="Top Swaps" />
        <Nav
          activeMode={tablePeriod}
          navItems={tablePeriods}
          preText="Period :"
          onActiveModeChange={setTablePeriod}
        >
          <div
            className={styles["csv-download"]}
            title="Download CSV"
            onClick={() => downloadSwaps(swaps || [])}
          >
            <FileDownloadIcon className={styles["clickable"]} />
          </div>
        </Nav>
        <Transactions
          txs={{ actions: swaps || [] }}
          loading={loading}
          props={formatProp}
        />
      </div>
    </Page>
  );
};

export default SwapsPage;
