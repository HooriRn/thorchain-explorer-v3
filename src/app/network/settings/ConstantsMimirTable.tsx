"use client";

import React, { useState, useMemo } from "react";
import Card from "@/components/ui/Card";
import Table from "@/components/table/Table";
import { createCustomColumn, createTextColumn } from "@/components/table/utils";
import { Badge } from "@/components/ui/badge";
import InfoIcon from "@/assets/images/info.svg";
import SearchIcon from "@/assets/images/search.svg";
import GlassmorphismTooltip from "@/components/GlassmorphismTooltip";
import styles from "./settings.module.css";

export interface CombinedSetting {
  name: string;
  value: any;
  status: string;
  key: string;
  extraInfo?: string;
}

interface ConstantsMimirTableProps {
  data: CombinedSetting[];
}

const ConstantsMimirTable: React.FC<ConstantsMimirTableProps> = ({ data }) => {
  const [searchKey, setSearchKey] = useState("");

  const filteredData = useMemo(() => {
    let result = data;

    if (searchKey) {
      result = result.filter((row) =>
        row.key.toLowerCase().includes(searchKey.toLowerCase())
      );
    }

    return [...result].sort((a, b) => {
      if (a.status === "Mimir" && b.status === "Constant") return -1;
      if (a.status === "Constant" && b.status === "Mimir") return 1;
      return 0;
    });
  }, [data, searchKey]);

  const columns = useMemo(
    () => [
      createTextColumn<CombinedSetting>("Key", "name", { sortKey: "name" }),
      createCustomColumn<CombinedSetting>("Value", {
        sortKey: "value",
        renderCell: (row) => <span className="mono">{row.value || "0"}</span>,
      }),
      createCustomColumn<CombinedSetting>("Status", {
        sortKey: "status",
        renderCell: (row) => (
          <div
            className={styles["status-container"]}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              width: "100%",
              gap: "0.5rem",
            }}
          >
            <Badge variant={row.status === "Constant" ? "info" : "green"}>
              {row.status}
            </Badge>
            {row.extraInfo && (
              <GlassmorphismTooltip content={row.extraInfo}>
                <InfoIcon className={styles["table-icon"]} />
              </GlassmorphismTooltip>
            )}
          </div>
        ),
      }),
    ],
    []
  );
  const customTheme = {
    Table: `
      --data-table-library_grid-template-columns: auto auto auto ;
    `,
    HeaderCell: `
      padding: 1rem 0.75rem !important;
      
      &:nth-child(1) {
        text-align: left;
      }
      &:nth-child(2) {
        text-align: center;
      }
      &:nth-child(3) {
        text-align: left;
      }
    `,
    Cell: `
      padding: 1rem 0.75rem !important;
      
      &:nth-child(1) {
        text-align: left;
      }
      &:nth-child(2) {
        text-align: center;
      }
      &:nth-child(3) {
        text-align: left;
      }
    `,
  };

  return (
    <div className={styles["constants-table"]}>
      <div id="vote-search-container" className={styles["search-container"]}>
        <input
          value={searchKey}
          onChange={(e) => setSearchKey(e.target.value)}
          type="text"
          placeholder="Search by key..."
          className={styles["search-input"]}
        />
        <SearchIcon className={styles["search-icon"]} />
      </div>
      <Card>
        <Table
          columns={columns}
          data={filteredData.map((row) => ({
            ...row,
            id: row.key,
            value: row.value || "0",
          }))}
          enableSort={true}
          customTheme={customTheme}
        />
      </Card>
    </div>
  );
};

export default ConstantsMimirTable;
