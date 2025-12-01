"use client";

import React, { useMemo } from "react";
import { CompactTable } from "@table-library/react-table-library/compact";
import { useRowSelect } from "@table-library/react-table-library/select";
import { useSort } from "@table-library/react-table-library/sort";
import { useTheme } from "@table-library/react-table-library/theme";
import { getTheme } from "@table-library/react-table-library/baseline";
import { TableColumn, TableData, TableProps } from "./types";
import styles from "./Table.module.css";
import TableLoader from "../TableLoader";

const Table = <T extends TableData>({
  columns,
  data,
  loading = false,
  loadingText = "Loading...",
  emptyMessage = "No data available",
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
  rowStyleClass,
}: TableProps<T>) => {
  const tableData = useMemo(
    () => ({
      nodes: data.map((item: T, index: number) => ({
        ...item,
        id: item.id || index.toString(),
        _rowIndex: index,
      })),
    }),
    [data]
  );

  const visibleColumns = useMemo(() => {
    return columns.filter(col => !col.hidden);
  }, [columns]);

  const processedColumns = useMemo(() => {
    return visibleColumns.map((column) => {
      if (column.formatFn && !column.renderCell) {
        return {
          ...column,
          renderCell: (item: T & { _rowIndex?: number }) => {
            const value = item[column.field as keyof T];
            const formattedValue = column.formatFn!(value, item);
            
            if (typeof formattedValue === 'string') {
              return <span className={column.className}>{formattedValue}</span>;
            }
            
            return formattedValue;
          }
        };
      }
      
      if (column.headerRender) {
        return {
          ...column,
          label: column.headerRender() as any,
        };
      }
      
      return column;
    });
  }, [visibleColumns]);

  const columnsWithLineNumbers = useMemo(() => {
    if (!showLineNumbers) {
      return processedColumns;
    }

    const lineNumberColumn: TableColumn<T> = {
      label: "#",
      field: "_lineNumber",
      sortKey: "_lineNumber",
      minWidth: 50,
      width: 50,
      className: "line-numbers",
      headerRender: () => <span>#</span>,
      renderCell: (item: T & { _rowIndex?: number }) => {
        const rowIndex = item._rowIndex;
        return <span>{rowIndex !== undefined ? rowIndex + 1 : ""}</span>;
      },
    };

    return [lineNumberColumn, ...processedColumns];
  }, [processedColumns, showLineNumbers]);

  const sortFns = useMemo(() => {
    const fns: { [key: string]: (array: any[]) => any[] } = {};

    columnsWithLineNumbers.forEach((column: TableColumn<T>) => {
      if (column.sortKey && column.sortFn) {
        fns[column.sortKey] = column.sortFn;
      } else if (column.sortKey && column.sortKey !== "_lineNumber") {
        fns[column.sortKey] = (array: any[]) =>
          [...array].sort((a, b) => {
            const aVal = a[column.sortKey!];
            const bVal = b[column.sortKey!];

            if (React.isValidElement(aVal) || React.isValidElement(bVal)) {
              return 0; 
            }

            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return 1;
            if (bVal == null) return -1;

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
        return `minmax(${column.minWidth}px, ${column.maxWidth ? `${column.maxWidth}px` : '1fr'})`;
      }
      return "1fr";
    });

    return `--data-table-library_grid-template-columns: ${gridColumns.join(" ")};`;
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
        text-align: left;
        vertical-align: middle;

        .header-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header-icon {
          display: flex;
          align-items: center;
        }

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

        ${customTheme?.Row || ""}
      `,
      Cell: `
        color: var(--sec-font-color);
        font-size: 14px;
        border: none;
        background: transparent;
        vertical-align: middle;
        padding: .75em;
        
        img, svg {
          vertical-align: middle;
        }
        
        .table-image {
          max-width: 100%;
          height: auto;
          object-fit: contain;
        }
        
        .table-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .cell-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .text-content {
          flex: 1;
        }

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
      isServer: options?.isServer || false,
    }
  );

  const rowSelect = useRowSelect(tableData, {
    onChange: onRowSelectChange || (() => {}),
  });

  const enhancedRowProps = useMemo(() => {
    return (item: T & { _rowIndex?: number }) => {
      const baseProps = rowProps ? rowProps(item) : {};
      const styleClass = rowStyleClass ? rowStyleClass(item) : "";
      
      return {
        ...baseProps,
        className: `${baseProps.className || ''} ${styleClass}`.trim(),
      };
    };
  }, [rowProps, rowStyleClass]);

  if (loading) {
    const loaderColumns = columnsWithLineNumbers.map((col) => ({
      label: col.label,
      field: col.sortKey || col.field,
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
        rowProps={enhancedRowProps}
        layout={layout}
        options={options}
      />
    </div>
  );
};

export default Table;