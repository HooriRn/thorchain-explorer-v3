"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import moment from "moment";
import Card from "@/components/ui/Card";
import Table from "@/components/table/Table";
import AssetIcon from "@/components/AssetIcon";
import { getBorrowerDetails } from "@/lib/api";
import { formatVueNumber, formatUSDValue } from "@/utils/format";
import { TableColumn } from "@/components/table/types";
import { assetFromString } from "@/utils";
import styles from "./loans.module.css";

interface LoanData {
  id?: string;
  collateral_asset: string;
  collateral: [number, number];
  debt: [number, number]; 
  lastOpenLoan: string;
  lastRepayLoan: string;
}

interface LoansProps {
  address?: string;
}

const Loans: React.FC<LoansProps> = ({ address }) => {
  const [bs, setBs] = useState<LoanData[]>([]);
  const [loading, setLoading] = useState(false);

  const showAsset = useCallback((asset: string | any) => {
    if (!asset) return "";
    if (typeof asset === "string") {
      const assetData = assetFromString(asset);
      if (assetData?.ticker) {
        return assetData.synth ? `s${assetData.ticker}` : assetData.ticker;
      }
      return asset;
    }
    if (asset.ticker) {
      return asset.synth ? `s${asset.ticker}` : asset.ticker;
    }
    return asset;
  }, []);

  const parseBorrower = useCallback((borrowerDetails: any) => {
    if (!borrowerDetails?.pools || !Array.isArray(borrowerDetails.pools)) {
      return [];
    }

    return borrowerDetails.pools.map((p: any, index: number) => ({
      id: p.collateral_asset || index.toString(),
      collateral_asset: p.collateral_asset,
      collateral: [
        p.collateral_deposited / 1e8,
        p.collateral_withdrawn / 1e8,
      ],
      debt: [p.debt_issued_tor / 1e8, p.debt_repaid_tor / 1e8],
      lastOpenLoan:
        p.last_open_loan_timestamp !== "0"
          ? moment.unix(p.last_open_loan_timestamp).fromNow()
          : "-",
      lastRepayLoan:
        p.last_repay_loan_timestamp !== "0"
          ? moment.unix(p.last_repay_loan_timestamp).fromNow()
          : "-",
    }));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!address) {
        return;
      }

      setLoading(true);
      try {
        const borrowerDetails = await getBorrowerDetails(address);
        const parsedData = parseBorrower(borrowerDetails);
        setBs(parsedData);
      } catch (error) {
        console.error("member not found", error);
        setBs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [address, parseBorrower]);

  const cols: TableColumn<LoanData>[] = useMemo(() => {
    return [
      {
        label: "Collateral Asset",
        field: "collateral_asset",
        renderCell: (item) => (
          <div className={styles["asset-cell"]}>
            <AssetIcon asset={item.collateral_asset} />
            <span className={styles.ellipsis}>
              {item.collateral_asset}
            </span>
          </div>
        ),
      },
      {
        label: "Collateral Deposited/Withdraw",
        field: "collateral",
        className: styles.mono,
        renderCell: (item) => (
          <span className={`${styles["pool-cell"]} ${styles.ellipsis}`}>
            {item.collateral[0] ? (
              <>
                <span>
                  <small>Deposited: </small>
                  {formatVueNumber(item.collateral[0], "0,0.0000")}{" "}
                  <small>{showAsset(item.collateral_asset)}</small>
                </span>
                {item.collateral[1] !== undefined && item.collateral[1] !== null && (
                  <>
                    <hr className={styles["table-hr"]} />
                    <span className={styles.ellipsis}>
                      <small>Withdrawn: </small>
                      {item.collateral[1] || item.collateral[1] === 0
                        ? formatVueNumber(item.collateral[1], "0,0.0000")
                        : "-"}{" "}
                      <small className={styles.ellipsis}>
                        {showAsset(item.collateral_asset)}
                      </small>
                    </span>
                  </>
                )}
              </>
            ) : (
              <span>-</span>
            )}
          </span>
        ),
      },
      {
        label: "Debt Issued/Repaid",
        field: "debt",
        className: styles.mono,
        renderCell: (item) => (
          <span>
            {item.debt[0] ? (
              <>
                <span>
                  <small>Issued: </small>
                  {formatUSDValue(item.debt[0])}
                </span>
                {item.debt[1] !== undefined && item.debt[1] !== null && (
                  <>
                    <hr className={styles["table-hr"]} />
                    <span className={styles.ellipsis}>
                      <small>Repaid: </small>
                      {item.debt[1] || item.debt[1] === 0
                        ? formatUSDValue(item.debt[1])
                        : "-"}
                    </span>
                  </>
                )}
              </>
            ) : (
              <span>-</span>
            )}
          </span>
        ),
      },
      {
        label: "Last Open Loan",
        field: "lastOpenLoan",
        className: styles.center,
        thClass: styles.center,
        renderCell: (item) => <span>{item.lastOpenLoan}</span>,
      },
      {
        label: "Last Repay Loan",
        field: "lastRepayLoan",
        className: styles.center,
        thClass: styles.center,
        renderCell: (item) => <span>{item.lastRepayLoan}</span>,
      },
    ];
  }, [showAsset]);

  return (
    <Card>
      <Table
        columns={cols}
        data={bs}
        loading={loading}
        className={`vgt-table net-table ${styles["loans-table"]}`}
        enableSort={true}
        enableSelect={false}
        onSortChange={() => {}}
        onRowSelectChange={() => {}}
      />
    </Card>
  );
};

export default Loans;
