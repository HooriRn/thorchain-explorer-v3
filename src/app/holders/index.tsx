"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { orderBy, sumBy } from "lodash";
import { assetFromString } from "@/utils";
import { getHolders } from "@/lib/api";
import { useRunePrice, usePools, useTheme } from "@/lib/store";
import { decimalFormat, showAsset, addressFormatV2 } from "@/utils/global";
import { number as formatNumber, formatVueNumber } from "@/utils/format";
import Page from "@/components/PageContainer";
import Header from "@/components/Header";
import Card from "@/components/ui/Card";
import PieChart from "@/components/PieChart";
import TableLoader from "@/components/TableLoader";
import { Table, TableColumn, TableData } from "@/components/table";
import Address from "@/components/transactions/Address";
import Avatar from "@/components/Avatar";
import styles from "./index.module.css";

interface HolderData extends TableData {
  address: string;
  amount: number;
  value: number;
  asset: string;
}

interface PieChartData {
  name: string;
  value: number;
}

const ThorHolders: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const runePrice = useRunePrice();
  const pools = usePools();
  const theme = useTheme();

  const [holders, setHolders] = useState<HolderData[]>([]);
  const [asset, setAsset] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [showValue, setShowValue] = useState<boolean>(false);
  const [pieData, setPieData] = useState<PieChartData[]>([]);

  const allColumns = useMemo((): TableColumn<HolderData>[] => {
    return [
      {
        label: "Address",
        sortKey: "address",
        renderCell: (item: HolderData) => (
          <span className={styles["address-container"]}>
            <Avatar name={item.address} small={true} />
            <Address address={item.address} useCustomName={true} />
          </span>
        ),
      },
      {
        label: "Balance",
        sortKey: "amount",
        className: "mono",
        renderCell: (item: HolderData) => (
          <span>
            {formatNumber(Math.round(item.amount), "0,0")}
            <small> {showAsset(item.asset, true)}</small>
          </span>
        ),
      },
      {
        label: "Value",
        sortKey: "value",
        className: "mono",
        renderCell: (item: HolderData) => (
          <span>${showValue ? formatNumber(item.value, "$0,0.00") : "-"}</span>
        ),
      },
    ];
  }, [showValue]);

  const filteredColumns = useMemo((): TableColumn<HolderData>[] => {
    return allColumns.filter((column) => {
      if (column.sortKey === "value") {
        return showValue;
      }
      return true;
    });
  }, [allColumns, showValue]);

  useEffect(() => {
    const assetParam = searchParams.get("asset");
    if (assetParam) {
      setAsset(assetParam.toUpperCase());
      fetchHoldersData(assetParam.toUpperCase());
    } else {
      router.replace(`?asset=THOR.RUNE`);
    }
  }, [searchParams, router]);

  useEffect(() => {
    const assetParam = searchParams.get("asset");
    if (!assetParam) {
      router.replace(`?asset=THOR.RUNE`);
    } else {
      setAsset(assetParam.toUpperCase());
      fetchHoldersData(assetParam.toUpperCase());
    }
  }, []);

  const fetchHoldersData = async (assetParam: string) => {
    try {
      setLoading(true);
      let assetPrice: number | null = null;

      if (pools) {
        const assetObject = assetFromString(assetParam);
        const assetPool = pools.find(
          (p: any) => assetFromString(p.asset).ticker === assetObject.ticker
        );
        assetPrice = assetPool?.assetPriceUSD ? +assetPool.assetPriceUSD : null;
      }

      if (assetParam === "THOR.RUNE") {
        assetPrice = runePrice;
      }

      const shouldShowValue = !!assetPrice;
      if (shouldShowValue) {
        setShowValue(true);
      }

      const data = await getHolders(assetParam);

      const mappedHolders: HolderData[] = data.map((holder: any) => {
        const coin = holder.coins.find((c: any) => c.asset === assetParam);
        const amount = coin.amount / 1e8;
        return {
          id: holder.address,
          address: holder.address,
          amount,
          value: shouldShowValue && assetPrice ? amount * assetPrice : 0,
          asset: coin.asset,
        };
      });

      setHolders(mappedHolders);
      createRunePieData(mappedHolders, shouldShowValue);
    } catch (error) {
      console.error("Error fetching holders data:", error);
    } finally {
      setLoading(false);
    }
  };

  const createRunePieData = (
    runeData: HolderData[],
    useValue: boolean = showValue
  ) => {
    const sortedData = orderBy(runeData, useValue ? "value" : "amount", "desc");

    const topHolders = sortedData.slice(0, 10).map((holder) => ({
      name: addressFormatV2(holder.address),
      value: useValue ? holder.value : holder.amount,
    }));

    const othersValue = sumBy(
      sortedData.slice(10),
      useValue ? "value" : "amount"
    );

    const newPieData: PieChartData[] = [
      ...topHolders,
      ...(othersValue > 0
        ? [
            {
              name: "Others",
              value: othersValue,
            },
          ]
        : []),
    ];

    setPieData(newPieData);
  };

  const totalFormatter = (params: any) => {
    const param =
      typeof params === "object" && params !== null
        ? params
        : { name: "", value: 0, color: "" };

    const name = param.name || "";
    const value = param.value || 0;
    const color = param.color || "#000";

    return `
      <div class="tooltip-header">
        <div class="data-color" style="background-color: ${color}"></div>
        ${name.length > 30 ? addressFormatV2(name) : name}
      </div>
      <div class="tooltip-body">
        <span>
          <span>${showValue ? "Value" : "Amount"}</span>
          <b>${
            showValue
              ? `$${formatVueNumber(value, "0,0.00 a")} `
              : `${formatVueNumber(value, "0,0.00 a")} ${showAsset(
                  asset,
                  true
                )}`
          }</b>
        </span>
      </div>
    `;
  };

  return (
    <Page error={false} fluid={false}>
      <Header title={`${asset} Holders`} />
      <Card title="Holder Distribution">
        <PieChart
          pieData={pieData}
          formatter={totalFormatter}
          showLegend={false}
          extra={{
            label: {
              show: true,
              position: "outside",
              formatter: function (params: any) {
                const name = params.name;
                return `${name}`;
              },
              fontSize: 12,
              color:
                theme === "dark" || theme === "BlueElectra"
                  ? "#ffff"
                  : "#333333",
            },
            labelLine: {
              show: true,
              length: 15,
              length2: 10,
              lineStyle: {
                color: "#999999",
                width: 1,
              },
            },
          }}
        />
      </Card>
      <Card>
        {loading ? (
          <TableLoader
            cols={filteredColumns.map((col) => ({
              label: col.label,
              field: col.sortKey || col.label.toLowerCase(),
              type: "text",
            }))}
          />
        ) : (
          <Table
            columns={filteredColumns}
            data={holders}
            loading={false}
            enableSort={false}
            enableSelect={false}
            showLineNumbers={true}
            className="vgt-table net-table"
            onSortChange={() => {}}
            onRowSelectChange={() => {}}
          />
        )}
      </Card>
    </Page>
  );
};

export default ThorHolders;
