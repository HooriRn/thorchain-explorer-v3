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
  showLineNumbers = false,
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
        _rowIndex: index,
      })),
    }),
    [data]
  );

  const columnsWithLineNumbers = useMemo(() => {
    let processedColumns = columns.map((column) => {
      if (column.headerRender) {
        return {
          ...column,
          label: column.headerRender() as any,
        };
      }
      return column;
    });

    if (!showLineNumbers) {
      return processedColumns;
    }

    const lineNumberColumn: TableColumn = {
      label: "",
      sortKey: "_lineNumber",
      minWidth: 50,
      width: 50,
      className: "line-numbers",
      renderCell: (item: TableData) => {
        const rowIndex = (item as any)._rowIndex;
        return <span>{rowIndex !== undefined ? rowIndex + 1 : ""}</span>;
      },
    };

    return [lineNumberColumn, ...processedColumns];
  }, [columns, showLineNumbers]);

  const sortFns = useMemo(() => {
    const fns: { [key: string]: (array: any[]) => any[] } = {};

    columnsWithLineNumbers.forEach((column: TableColumn) => {
      if (column.sortKey && column.sortFn) {
        fns[column.sortKey] = column.sortFn;
      } else if (column.sortKey && column.sortKey !== "_lineNumber") {
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
  }, [columnsWithLineNumbers]);

  const gridTemplateColumns = useMemo(() => {
    const customGridMatch = customTheme?.Table?.match(
      /--data-table-library_grid-template-columns:\s*([^;]+);?/
    );
    if (customGridMatch) {
      return `--data-table-library_grid-template-columns: ${customGridMatch[1]};`;
    }
    const gridColumns = columnsWithLineNumbers.map((column) => {
      if (column.width) {
        return `${column.width}px`;
      }
      if (column.minWidth) {
        return `minmax(${column.minWidth}px, 1fr)`;
      }
      return "1fr";
    });

    return `--data-table-library_grid-template-columns: ${gridColumns.join(
      " "
    )};`;
  }, [columnsWithLineNumbers, customTheme]);

  const theme = useTheme([
    getTheme(),
    {
      Table: `
        font-size: 16px;
        border: none;
        background: transparent;
        border-collapse: collapse;
        table-layout: fixed;
        ${gridTemplateColumns}
        ${
          customTheme?.Table?.replace(
            /--data-table-library_grid-template-columns:[^;]*;?/g,
            ""
          ) || ""
        }
      `,
      Header: `
        background: transparent;
        border-bottom: 1px solid var(--border) !important;
        position: relative;
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

        ${customTheme?.HeaderCell || ""}
      `,
      Body: `
        background: transparent;
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
        padding: .75em;        
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
    const loaderColumns = columnsWithLineNumbers.map((col) => ({
      label: col.label,
      field: col.sortKey || col.label.toLowerCase(),
      type: col.loaderType || "text",
    }));

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
        columns={columnsWithLineNumbers}
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
