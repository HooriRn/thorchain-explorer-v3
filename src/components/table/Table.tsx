"use client";

import React, { useMemo } from "react";
import { CompactTable } from "@table-library/react-table-library/compact";
import { useRowSelect } from "@table-library/react-table-library/select";
import { useSort } from "@table-library/react-table-library/sort";
import { useTheme } from "@table-library/react-table-library/theme";
import { getTheme } from "@table-library/react-table-library/baseline";
import { TableColumn, TableData, TableProps } from "./types.js";
import styles from "./Table.module.css";
import TableLoader from "../TableLoader";

const Table: React.FC<TableProps> = ({
  columns,
  data,
  loading = false,
  loadingText = "Loading...",
  onSortChange,
  onRowSelectChange,
  rowProps,
  enableSort = true,
  enableSelect = false,
  enableFilter = false,
  enablePagination = false,
  customTheme,
  layout = {
    custom: true,
    horizontalScroll: true,
    fixedHeader: true,
    isDiv: true,
  },
  options = {
    renderAfterCreate: true,
    isServer: false,
  },
  className = "",
  emptyMessage = "No data available",
}) => {
  const tableData = useMemo(
    () => ({
      nodes: data.map((item: TableData, index: number) => ({
        ...item,
        id: item.id || index.toString(),
      })),
    }),
    [data]
  );

  const sortFns = useMemo(() => {
    const fns: { [key: string]: (array: any[]) => any[] } = {};

    columns.forEach((column: TableColumn) => {
      if (column.sortKey && column.sortFn) {
        fns[column.sortKey] = column.sortFn;
      } else if (column.sortKey) {
        fns[column.sortKey] = (array: any[]) =>
          [...array].sort((a, b) => {
            const aVal = a[column.sortKey!];
            const bVal = b[column.sortKey!];

            if (typeof aVal === "string" && typeof bVal === "string") {
              return aVal.localeCompare(bVal);
            }
            if (typeof aVal === "number" && typeof bVal === "number") {
              return aVal - bVal;
            }
            return 0;
          });
      }
    });

    return fns;
  }, [columns]);

  const theme = useTheme([
    getTheme(),
    {
      Table: `
        font-size: 16px;
        border: none;
        background: transparent;
        border-collapse: collapse;
        table-layout: auto;
        text-align: right;
        ${customTheme?.Table || ""}
      `,
      Header: `
        background: transparent;
        border-bottom: 1px solid var(--border) !important;
        position: relative;
        text-align: right;
        color: var(--font-color);
        ${customTheme?.Header || ""}
      `,
      HeaderCell: `
        color: var(--sec-font-color);
        font-weight: 600;
        font-size: 14px;
        border-bottom: 1px solid var(--border) !important;
        padding: .75em 1.5em .75em .75em;
        background: transparent;
        color: var(--font-color);
        min-width: auto;
        width: auto;
        

         &:first-child {
          text-align: left;
        }

        ${customTheme?.HeaderCell || ""}
      `,
      Body: `
        background: transparent;
        text-align: right;
        ${customTheme?.Body || ""}
      `,
      Row: `
        background: transparent;
        border-bottom: 1px solid var(--border) !important;
        transition: background-color 0.2s ease;
        
        &:hover {
          background-color: var(--muted);
        }
        
        &:last-child {
          border-bottom: none;
        }
        
        &:not(:last-of-type) > .td {
          border-bottom: 1px solid var(--border) !important;
        }
      `,
      Cell: `
        color: var(--sec-font-color);
        font-size: 14px;
        border: none;
        background: transparent;
        vertical-align: middle;
        ${customTheme?.Cell || ""}
      `,
    },
  ]);

  const sort = useSort(
    tableData,
    {
      onChange: onSortChange || (() => {}),
    },
    {
      sortFns,
      isServer: false,
    }
  );

  const rowSelect = useRowSelect(tableData, {
    onChange: onRowSelectChange || (() => {}),
  });

  if (loading) {
    const loaderColumns = columns.map((col) => {
      let type = "text";

      const label = col.label.toLowerCase();
      const sortKey = col.sortKey?.toLowerCase() || "";

      if (
        label.includes("height") ||
        label.includes("age") ||
        label.includes("count") ||
        label.includes("ins") ||
        label.includes("outs") ||
        label.includes("since") ||
        sortKey.includes("height") ||
        sortKey.includes("age") ||
        sortKey.includes("count")
      ) {
        type = "number";
      } else if (
        label.includes("percent") ||
        label.includes("ratio") ||
        label.includes("vb")
      ) {
        type = "percentage";
      } else if (
        label.includes("date") ||
        label.includes("time") ||
        label.includes("since")
      ) {
        type = "date";
      }

      return {
        label: col.label,
        field: col.sortKey || col.label.toLowerCase(),
        type: type,
      };
    });

    return (
      <div className={className}>
        <TableLoader cols={loaderColumns} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`${styles.emptyContainer} ${className}`}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`${styles.tableContainer} ${className}`}>
      <CompactTable
        columns={columns}
        data={tableData}
        theme={theme}
        sort={enableSort ? sort : undefined}
        select={enableSelect ? rowSelect : undefined}
        rowProps={rowProps}
        layout={layout}
        options={options}
      />
    </div>
  );
};

export default Table;
