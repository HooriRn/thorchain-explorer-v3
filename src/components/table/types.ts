import { ReactNode } from "react";

export interface TableColumn<T = any> {
  label: string;
  sortKey?: string;
  minWidth?: number;
  maxWidth?: number;
  width?: number;
  sortFn?: (array: T[]) => T[];
  renderCell: (item: T) => ReactNode;
  headerRender?: () => ReactNode;
  resizable?: boolean;
  pinLeft?: boolean;
  pinRight?: boolean;
  hidden?: boolean;
  loaderType?: "text" | "number" | "percentage" | "date";
  className?: string;
}

export interface TableData {
  id?: string | number;
  [key: string]: any;
}

export interface TableTheme {
  Table?: string;
  Header?: string;
  HeaderCell?: string;
  Body?: string;
  Row?: string;
  Cell?: string;
}

export interface TableLayout {
  custom?: boolean;
  horizontalScroll?: boolean;
  fixedHeader?: boolean;
  isDiv?: boolean;
}

export interface TableOptions {
  renderAfterCreate?: boolean;
  isServer?: boolean;
}

export interface TableProps {
  columns: TableColumn[];
  data: TableData[];
  loading?: boolean;
  loadingText?: string;
  emptyMessage?: string;
  onSortChange?: (action: any, state: any) => void;
  onRowSelectChange?: (action: any, state: any) => void;
  rowProps?: (item: TableData) => any;
  enableSort?: boolean;
  enableSelect?: boolean;
  enableFilter?: boolean;
  enablePagination?: boolean;
  customTheme?: TableTheme;
  layout?: TableLayout;
  options?: TableOptions;
  className?: string;
}

export interface SortableTableProps extends TableProps {
  enableSort: true;
}

export interface SelectableTableProps extends TableProps {
  enableSelect: true;
}

export interface FilterableTableProps extends TableProps {
  enableFilter: true;
}

export interface PaginatedTableProps extends TableProps {
  enablePagination: true;
}
