import React from "react";
import { TableColumn, TableData } from "./types.js";

export function createTextColumn<T extends TableData>(
  label: string,
  dataKey: keyof T,
  options: {
    sortKey?: string;
    minWidth?: number;
    maxWidth?: number;
    width?: number;
    sortFn?: (array: T[]) => T[];
    className?: string;
  } = {}
): TableColumn<T> {
  return {
    label,
    sortKey: options.sortKey || (dataKey as string),
    minWidth: options.minWidth || 100,
    maxWidth: options.maxWidth,
    width: options.width,
    sortFn: options.sortFn,
    renderCell: (item: T) => (
      <span className={options.className}>{item[dataKey] || "-"}</span>
    ),
  };
}

export function createNumericColumn<T extends TableData>(
  label: string,
  dataKey: keyof T,
  options: {
    sortKey?: string;
    minWidth?: number;
    maxWidth?: number;
    width?: number;
    sortFn?: (array: T[]) => T[];
    formatFn?: (value: any) => string;
    className?: string;
    showTooltip?: boolean;
    loaderType?: "number" | "percentage";
  } = {}
): TableColumn<T> {
  return {
    label,
    sortKey: options.sortKey || (dataKey as string),
    minWidth: options.minWidth || 100,
    maxWidth: options.maxWidth,
    width: options.width,
    sortFn: options.sortFn,
    loaderType: options.loaderType || "number",
    renderCell: (item: T) => {
      const value = item[dataKey];
      const formattedValue = options.formatFn ? options.formatFn(value) : value;
      const displayValue = value ? formattedValue : "-";

      return (
        <div className="numericCell">
          <span
            className={`mono right ${options.className || ""}`}
            title={options.showTooltip ? `${label}: ${value}` : undefined}
          >
            {displayValue}
          </span>
        </div>
      );
    },
  };
}

export function createStatusColumn<T extends TableData>(
  label: string,
  dataKey: keyof T,
  options: {
    sortKey?: string;
    minWidth?: number;
    maxWidth?: number;
    width?: number;
    sortFn?: (array: T[]) => T[];
    statusMap?: { [key: string]: { variant: string; label: string } };
    className?: string;
  } = {}
): TableColumn<T> {
  return {
    label,
    sortKey: options.sortKey || (dataKey as string),
    minWidth: options.minWidth || 100,
    maxWidth: options.maxWidth,
    width: options.width,
    sortFn: options.sortFn,
    renderCell: (item: T) => {
      const status = item[dataKey];
      const statusConfig = options.statusMap?.[status as string] || {
        variant: "gray",
        label: status as string,
      };

      return (
        <div className="statusCell">
          <span
            className={`statusBadge ${statusConfig.variant} ${
              options.className || ""
            }`}
          >
            {statusConfig.label}
          </span>
        </div>
      );
    },
  };
}

export function createAddressColumn<T extends TableData>(
  label: string,
  dataKey: keyof T,
  options: {
    sortKey?: string;
    minWidth?: number;
    maxWidth?: number;
    width?: number;
    sortFn?: (array: T[]) => T[];
    onClick?: (value: any, item: T) => void;
    formatFn?: (value: any) => string;
    showCopy?: boolean;
    showColorHash?: boolean;
    className?: string;
  } = {}
): TableColumn<T> {
  return {
    label,
    sortKey: options.sortKey || (dataKey as string),
    minWidth: options.minWidth || 200,
    maxWidth: options.maxWidth,
    width: options.width,
    sortFn: options.sortFn,
    renderCell: (item: T) => {
      const value = item[dataKey];
      const displayValue = options.formatFn ? options.formatFn(value) : value;

      return (
        <div className="hashCell">
          <span
            className={`mono clickable ${options.className || ""}`}
            onClick={() => options.onClick?.(value, item)}
            title={`Full ${label}: ${value}`}
          >
            {displayValue}
          </span>
          {options.showColorHash && (
            <div
              className="colorHash"
              style={{
                width: 12,
                height: 12,
                backgroundColor: `hsl(${
                  Math.abs(
                    value
                      ?.toString()
                      .split("")
                      .reduce((a: number, b: string) => a + b.charCodeAt(0), 0)
                  ) % 360
                }, 70%, 50%)`,
              }}
            />
          )}
          {options.showCopy && (
            <button
              className="copy-button"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(value);
              }}
              title="Copy to clipboard"
            >
              📋
            </button>
          )}
        </div>
      );
    },
  };
}

export function createDateColumn<T extends TableData>(
  label: string,
  dataKey: keyof T,
  options: {
    sortKey?: string;
    minWidth?: number;
    maxWidth?: number;
    width?: number;
    sortFn?: (array: T[]) => T[];
    formatFn?: (value: any) => string;
    className?: string;
  } = {}
): TableColumn<T> {
  return {
    label,
    sortKey: options.sortKey || (dataKey as string),
    minWidth: options.minWidth || 150,
    maxWidth: options.maxWidth,
    width: options.width,
    sortFn: options.sortFn,
    loaderType: "date",
    renderCell: (item: T) => {
      const value = item[dataKey];
      const formattedValue = options.formatFn ? options.formatFn(value) : value;

      return (
        <div className="ageCell">
          <span className={`mono ${options.className || ""}`}>
            {value ? formattedValue : "-"}
          </span>
        </div>
      );
    },
  };
}

export function createCustomColumn<T extends TableData>(
  label: string,
  options: {
    sortKey?: string;
    minWidth?: number;
    maxWidth?: number;
    width?: number;
    sortFn?: (array: T[]) => T[];
    renderCell: (item: T) => React.ReactNode;
    headerRender?: () => React.ReactNode;
    className?: string;
    loaderType?: "text" | "number" | "percentage" | "date";
  }
): TableColumn<T> {
  return {
    label,
    sortKey: options.sortKey,
    minWidth: options.minWidth || 100,
    maxWidth: options.maxWidth,
    width: options.width,
    sortFn: options.sortFn,
    loaderType: options.loaderType,
    renderCell: options.renderCell,
    headerRender: options.headerRender,
    className: options.className,
  };
}

export function createSortFn<T extends TableData>(
  key: keyof T,
  direction: "asc" | "desc" = "asc"
) {
  return (array: T[]): T[] => {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return direction === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  };
}

export function createCustomSortFn<T extends TableData>(
  sortFunction: (a: T, b: T) => number
) {
  return (array: T[]): T[] => {
    return [...array].sort(sortFunction);
  };
}
