import NumberFormat from "react-number-format";

export const formatNumber = (value: number, options: any = {}) => {
  const { decimalScale = 0, ...rest } = options;
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimalScale,
    minimumFractionDigits: decimalScale,
    ...rest,
  }).format(value);
};

export const formatNumberToString = (value: number, options = {}) => {
  return formatNumber(value, options);
};

export const number = (value: number, pattern: string = "0,0") => {
  if (isNaN(value) || value === null || value === undefined) {
    return "0";
  }

  if (pattern.includes("a")) {
    if (value >= 1e9) {
      return (value / 1e9).toFixed(1) + "B";
    } else if (value >= 1e6) {
      return (value / 1e6).toFixed(1) + "M";
    } else if (value >= 1e3) {
      return (value / 1e3).toFixed(1) + "K";
    }
  }

  if (pattern.includes(",")) {
    return new Intl.NumberFormat("en-US").format(value);
  }

  if (pattern.includes(".")) {
    const decimalPlaces = pattern.split(".")[1]?.length || 0;
    return value.toFixed(decimalPlaces);
  }

  return value.toString();
};

export const formatRuneToString = (value: number) => {
  return `${formatNumber(value)} RUNE`;
};

export const formatPercentToString = (value: number) => {
  return `${formatNumber(value * 100, { decimalScale: 2 })}%`;
};

export const formatPercent = (value: number, decimals: number = 2) => {
  return `${formatNumber(value * 100, { decimalScale: decimals })}%`;
};

export const formatTCYToString = (value: number) => {
  return `${formatNumber(value / 1e8, { decimalScale: 2 })} TCY`;
};

export const formatUSDValue = (value: number) => {
  return `$${formatNumber(value, { decimalScale: 2 })}`;
};

export interface TrendFilterOptions {
  decimals?: number;
  compact?: boolean;
  currency?: boolean;
  currencySymbol?: string;
}

/**
 * Formats a number in trend format (e.g., 35m, 1.2k, 2.1M)
 * @param value - The number to format
 * @param options - Formatting options
 * @returns Formatted string
 */
export const formatTrendNumber = (
  value: number | string | null | undefined,
  options: TrendFilterOptions = {}
): string => {
  if (value === null || value === undefined || value === "") {
    return "0";
  }

  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return "0";
  }

  const {
    decimals = 1,
    compact = true,
    currency = false,
    currencySymbol = "$",
  } = options;

  if (!compact) {
    return currency
      ? `${currencySymbol}${numValue.toFixed(decimals)}`
      : numValue.toFixed(decimals);
  }

  if (numValue >= 1e9) {
    const formatted = (numValue / 1e9).toFixed(decimals);
    const cleanFormatted = formatted.endsWith(".0")
      ? formatted.slice(0, -2)
      : formatted;
    return currency
      ? `${currencySymbol}${cleanFormatted}B`
      : `${cleanFormatted}B`;
  }

  if (numValue >= 1e6) {
    const formatted = (numValue / 1e6).toFixed(decimals);
    const cleanFormatted = formatted.endsWith(".0")
      ? formatted.slice(0, -2)
      : formatted;
    return currency
      ? `${currencySymbol}${cleanFormatted}M`
      : `${cleanFormatted}M`;
  }

  if (numValue >= 1e3) {
    const formatted = (numValue / 1e3).toFixed(decimals);
    const cleanFormatted = formatted.endsWith(".0")
      ? formatted.slice(0, -2)
      : formatted;
    return currency
      ? `${currencySymbol}${cleanFormatted}k`
      : `${cleanFormatted}k`;
  }

  if (numValue >= 1) {
    return currency
      ? `${currencySymbol}${numValue.toFixed(decimals)}`
      : numValue.toFixed(decimals);
  }

  if (numValue >= 0.01) {
    return currency
      ? `${currencySymbol}${numValue.toFixed(2)}`
      : numValue.toFixed(2);
  }

  if (numValue > 0) {
    return currency ? `${currencySymbol}<0.01` : "<0.01";
  }

  return currency ? `${currencySymbol}0` : "0";
};

/**
 * Formats percentage values in trend format
 * @param value - The percentage value (0-100)
 * @param options - Formatting options
 * @returns Formatted percentage string
 */
export const formatTrendPercentage = (
  value: number | string | null | undefined,
  options: TrendFilterOptions = {}
): string => {
  if (value === null || value === undefined || value === "") {
    return "0%";
  }

  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return "0%";
  }

  const { decimals = 1 } = options;
  return `${numValue.toFixed(decimals)}%`;
};

/**
 * Formats currency values in trend format
 * @param value - The currency value
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export const formatTrendCurrency = (
  value: number | string | null | undefined,
  options: TrendFilterOptions = {}
): string => {
  return formatTrendNumber(value, { ...options, currency: true });
};

/**
 * Formats large numbers with custom suffixes
 * @param value - The number to format
 * @param suffixes - Array of suffixes (e.g., ['', 'K', 'M', 'B'])
 * @param options - Formatting options
 * @returns Formatted string
 */
export const formatTrendWithCustomSuffixes = (
  value: number | string | null | undefined,
  suffixes: string[] = ["", "K", "M", "B", "T"],
  options: TrendFilterOptions = {}
): string => {
  if (value === null || value === undefined || value === "") {
    return "0";
  }

  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return "0";
  }

  const { decimals = 1, currency = false, currencySymbol = "$" } = options;

  if (numValue === 0) {
    return currency ? `${currencySymbol}0` : "0";
  }

  const magnitude = Math.floor(Math.log10(Math.abs(numValue)) / 3);
  const suffixIndex = Math.min(magnitude, suffixes.length - 1);
  const scaledValue = numValue / Math.pow(1000, suffixIndex);

  const formatted = scaledValue.toFixed(decimals);
  const cleanFormatted = formatted.endsWith(".0")
    ? formatted.slice(0, -2)
    : formatted;

  return currency
    ? `${currencySymbol}${cleanFormatted}${suffixes[suffixIndex]}`
    : `${cleanFormatted}${suffixes[suffixIndex]}`;
};

/**
 * Formats time duration in trend format
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 */
export const formatTrendDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }

  if (seconds < 3600) {
    const minutes = Math.round(seconds / 60);
    return `${minutes}m`;
  }

  if (seconds < 86400) {
    const hours = Math.round(seconds / 3600);
    return `${hours}h`;
  }

  const days = Math.round(seconds / 86400);
  return `${days}d`;
};

/**
 * Formats file size in trend format
 * @param bytes - Size in bytes
 * @returns Formatted size string
 */
export const formatTrendFileSize = (bytes: number): string => {
  if (bytes === 0) return "0B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))}${sizes[i]}`;
};

export const numberWithTrend = (
  value: number,
  pattern: string = "0,0",
  trendOptions?: TrendFilterOptions
) => {
  if (isNaN(value) || value === null || value === undefined) {
    return "0";
  }

  if (pattern.includes("t")) {
    return formatTrendNumber(value, trendOptions);
  }

  if (pattern.includes("a")) {
    return formatTrendNumber(value, { decimals: 1, ...trendOptions });
  }

  return number(value, pattern);
};

export const formatUSDValueWithTrend = (
  value: number,
  useTrend: boolean = false,
  trendOptions?: TrendFilterOptions
) => {
  if (useTrend) {
    return formatTrendCurrency(value, trendOptions);
  }
  return formatUSDValue(value);
};

/**
 * Formats total amount from blockchain units (divided by 1e8) with custom decimal places
 * Similar to Vue.js number filter with pattern '0,0.0000'
 * @param value - The total amount in blockchain units
 * @param decimals - Number of decimal places (default: 4)
 * @returns Formatted string with commas and specified decimal places
 */
export const formatTotalAmount = (
  value: number | string | null | undefined,
  decimals: number = 4
): string => {
  if (value === null || value === undefined || value === "") {
    return "0";
  }

  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return "0";
  }

  const convertedValue = numValue / 1e8;

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(convertedValue);
};

/**
 * Vue.js $options.filters.number equivalent
 * Formats numbers with patterns like '0,0.00a' (comma separator, decimals, abbreviated)
 * @param value - The number to format
 * @param pattern - Format pattern (e.g., '0,0.00a', '0,0', '0.00')
 * @returns Formatted string
 */
export const formatVueNumber = (
  value: number | string | null | undefined,
  pattern: string = "0,0.00a"
): string => {
  if (value === null || value === undefined || value === "") {
    return "0";
  }

  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return "0";
  }

  if (pattern.includes("a")) {
    if (numValue >= 1e9) {
      return (numValue / 1e9).toFixed(1) + "B";
    } else if (numValue >= 1e6) {
      return (numValue / 1e6).toFixed(1) + "M";
    } else if (numValue >= 1e3) {
      return (numValue / 1e3).toFixed(1) + "K";
    }
  }

  if (pattern.includes(",")) {
    const parts = pattern.split(".");
    if (parts.length > 1) {
      const decimalCount = parts[1].replace("a", "").length;
      return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimalCount,
        maximumFractionDigits: decimalCount,
      }).format(numValue);
    } else {
      return new Intl.NumberFormat("en-US").format(numValue);
    }
  }

  if (pattern.includes(".")) {
    const decimalCount = pattern.split(".")[1]?.replace("a", "").length || 0;
    return numValue.toFixed(decimalCount);
  }

  return numValue.toString();
};
