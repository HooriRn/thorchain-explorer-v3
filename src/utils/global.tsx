import {
  bnOrZero,
  formatBN,
  AssetCurrencySymbol,
  isSynthAsset,
} from "@xchainjs/xchain-util";
import compare from "semver/functions/compare";
import moment from "moment";
import ColorHash from "color-hash";
import getAssetImagePath from "@/classes/assetImage";
import { NumericFormat } from "react-number-format";

import {
  assetFromString,
  parseMemoToTxType,
  shortAssetName,
  assetToString,
  affiliateMap,
  darkTheme,
  lightTheme,
  blueElectraTheme,
  interfaces,
} from "@/utils/index";
import API_ENDPOINTS from "@/lib/api/config";
import { smallBaseAmountFormat as smallBaseAmountFormatFn } from "@/utils/format";

const colorHash = new ColorHash({ lightness: 0.5 });

export const showLoading = {
  text: "",
  color: "#63fdd9",
  maskColor: "rgba(0,0,0,0)",
  zlevel: 1,
};

export const chartTheme = (isBlueElectra, isDark) => {
  return getChartTheme(isBlueElectra, isDark);
};

export const assetImage = (assetStr) => {
  try {
    const result = getAssetImagePath(assetStr);
    if (result) {
      return result;
    }
    return "/globe.svg";
  } catch (error) {
    return "/globe.svg";
  }
};

export const assetToChain = (assetStr) => {
  if (!assetStr) {
    return;
  }
  const assetData = assetFromString(assetStr);
  if (!assetData) {
    return;
  }
  const { chain, synth, trade, secure } = assetData;
  let asset = `${chain}.${chain}`;
  if (synth || trade || secure) {
    return "THOR.RUNE";
  }
  switch (chain) {
    case "GAIA":
      asset = "GAIA.ATOM";
      break;
    case "BSC":
      asset = "BSC.BNB";
      break;
    case "THOR":
      asset = "THOR.RUNE";
      break;
    default:
      break;
  }
  return asset;
};

export const imgErr = (e) => {
  e.target.src = "/globe.svg";
};

export const baseChainAsset = (chain) => {
  switch (chain) {
    case "THOR":
      return "THOR.RUNE";
    case "GAIA":
      return "GAIA.ATOM";
    case "BSC":
      return "BSC.BNB";
    default:
      return `${chain}.${chain}`;
  }
};

export const goto = (router, url) => {
  router.push(url);
};

export const gotoAddr = (router, address) => {
  router.push(`/address/${address}`);
};

export const popRandomColor = () => {
  const rand = Math.random();
  const color = defaultColors[Math.floor(rand * defaultColors.length)];
  defaultColors.splice(Math.floor(rand * defaultColors.length), 1);
  return color;
};

const defaultColors = [
  "#5470c6",
  "#91cc75",
  "#fac858",
  "#ee6666",
  "#73c0de",
  "#3ba272",
  "#fc8452",
  "#9a60b4",
  "#ea7ccc",
];

export const getChartColor = (
  index: number,
  theme: "dark" | "light" = "light"
): string => {
  const themeColors = theme === "dark" ? darkTheme.color : lightTheme.color;
  return themeColors[index % themeColors.length];
};

export const getChartTheme = (isBlueElectra: boolean, isDark: boolean) => {
  if (isBlueElectra) {
    return blueElectraTheme;
  }
  return isDark ? darkTheme : lightTheme;
};

export const getCurrentChartTheme = (
  theme: "light" | "dark" | "system" | "BlueElectra"
): "dark" | "light" => {
  if (theme === "BlueElectra") {
    return "dark";
  }
  if (theme === "system") {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  }
  return theme;
};

export const getAssetChartColor = (
  asset: string,
  index: number,
  theme: "dark" | "light" = "light"
): string => {
  const assetColor = assetColorPalette(asset);
  if (assetColor) {
    return assetColor;
  }
  return getChartColor(index, theme);
};

export const getAssetColor = (asset) => {
  switch (asset) {
    case "BTC.BTC":
      return "#EF8F1C";
    case "ETH.ETH":
      return "#627EEA";
    case "LTC.LTC":
      return "#335E9D";
    case "DOGE.DOGE":
      return "#BCA23E";
    case "BNB.BNB":
    case "BSC.BNB":
      return "#F0BC18";
    case "BCH.BCH":
      return "#4DCA48";
    case "AVAX.AVAX":
      return "#E84142";
    case "GAIA.ATOM":
      return "#303249";
    case "ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48":
    case "AVAX.USDC-0XB97EF9EF8734C71904D8002F8B6BC66DD9C48A6E":
      return "#2775ca";
    case "BNB.BUSD-BD1":
      return "#ffc300";
    case "ETH.USDT-0XDAC17F958D2EE523A2206206994597C13D831EC7":
      return "#26A17B";
    default:
      return popRandomColor();
  }
};

export const getChainColor = (asset) => {
  switch (asset) {
    case "BTC":
      return "#F7A035";
    case "ETH":
      return "#87e9b5";
    case "LTC":
      return "#335D9D";
    case "DOGE":
      return "#BA9F32";
    case "BCH":
      return "#4DCA48";
    case "AVAX":
      return "#E84142";
    case "GAIA":
      return "#2F3148";
    case "BNB":
    case "BSC":
      return "#F1B90A";
    case "BASE":
      return "#1E6AFF";
    default:
      return popRandomColor();
  }
};

export const isInternalTx = (hash) => {
  if (
    hash ===
      "0000000000000000000000000000000000000000000000000000000000000000" ||
    hash === ""
  ) {
    return true;
  }
  return false;
};

export const gotoTx = (router, hash) => {
  if (
    hash ===
      "0000000000000000000000000000000000000000000000000000000000000000" ||
    hash === ""
  ) {
    return;
  }
  router.push(`/tx/${hash}`);
};

export const isValidTx = (hash) => {
  if (
    hash ===
      "0000000000000000000000000000000000000000000000000000000000000000" ||
    hash === ""
  ) {
    return false;
  }
  return true;
};

export const gotoNode = (router, signer) => {
  router.push(`/node/${signer}`);
};

export const gotoPool = (router, pool) => {
  router.push(`/pool/${pool}`);
};

export const copy = (address, setCopyText) => {
  navigator.clipboard.writeText(address).then(
    () => {
      setCopyText("Copied");
      setTimeout(() => {
        setCopyText("Copy");
      }, 2000);
    },
    (err) => {}
  );
};

export const checkSynth = (asset) => {
  if (!asset) {
    return false;
  }
  return isSynthAsset(assetFromString(asset));
};

export const formatUnixDate = (date, format = "MMM D, h:mm a") => {
  return moment.unix(date).format(format);
};

export const fromNow = (date) => {
  return moment(date).fromNow();
};

export const percentageFormat = (number, decimal, percentFormatter) => {
  return number ? percentFormatter(+number, decimal ?? 4) : "-";
};

export const unitFormat = (number, numberFormatter) => {
  return number ? numberFormatter(+number / 1e8, "0,0") : "-";
};

export const minFormat = (number, numberFormatter) => {
  return number ? numberFormatter(+number, "0,0a") : "-";
};

export const normalFormat = (number, numberFormatter) => {
  return number ? numberFormatter(+number, "0,0") : "-";
};

export const toZeroFormat = (num) => {
  return (+num).toLocaleString("en-US", { maximumFractionDigits: 8 });
};

export const decimalFormat = (number) => {
  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  });

  const num = formatter.format(number);
  return num;
};

export const numberFormat = (number, numberFormatter) => {
  return number ? numberFormatter(+number, "0,0.0000") : "-";
};

export const balanceFormat = (n) => {
  return n.toString().replace(/(?<!\.\d*)(\d)(?=(?:\d{3})+(?!\d))/g, "$1,");
};

export const showAsset = (assetStr, ticker = false) => {
  if (!assetStr) {
    return "";
  }
  try {
    if (typeof assetStr !== "string") {
      assetStr = assetToString(assetStr);
    }
    let del = ".";
    const asset = assetFromString(assetStr);
    if (asset.id) {
      return asset.ticker;
    }
    if (isSynthAsset(asset)) {
      del = "/";
    } else if (asset.trade) {
      del = "~";
    } else if (asset.secure) {
      del = "-";
    }
    if (ticker) {
      return asset.ticker;
    }
    return asset.chain + del + asset.ticker;
  } catch (error) {}
};

export const showTicker = (assetStr) => {
  if (!assetStr) {
    return "";
  }
  try {
    if (typeof assetStr !== "string") {
      assetStr = assetToString(assetStr);
    }
    const asset = assetFromString(assetStr);
    return asset.ticker;
  } catch (error) {}
};

export const baseAmountFormat = (number, numberFormatter) => {
  return number ? numberFormatter(+number / 10 ** 8, "0,0.0000") : "-";
};

export const baseAmountFormatOrZero = (number) => {
  return formatBN(bnOrZero(number).div(1e8), 8);
};

export const smallBaseAmountFormat = smallBaseAmountFormatFn;

export const smallBaseAmountFormatWithCur = (number, numberFormatter) => {
  return number ? `$${smallBaseAmountFormat(number, numberFormatter)}` : "-";
};

export const formatCurrency = (number, currencyFormatter) => {
  return currencyFormatter(number);
};

export const formatBnCurrency = (number) => {
  return `$${formatBN(bnOrZero(number))}`;
};

export const formatSmallCurrency = (number, currencyFormatter) => {
  return currencyFormatter(number / 10 ** 8, "$", 2);
};

export const versionSort = (x, y, col, rowX, rowY) => {
  return compare(x, y);
};

export const formatAddress = (string) => {
  if (string && string.length > 12) {
    return string.slice(0, 6) + "..." + string.slice(-6);
  } else {
    return string;
  }
};

export const getDuration = (timestamp) => {
  const now = moment();
  const before = moment(timestamp);
  return moment.duration(now.diff(before)).asSeconds().toFixed();
};

export const getHumanizeDuration = (timestamp) => {
  const now = moment();
  const before = moment(timestamp);
  return moment.duration(now.diff(before)).humanize();
};

export const formatTimeSort = (x, y, col, rowX, rowY) => {
  return +x < +y ? -1 : +x > +y ? 1 : 0;
};

export const formatTimeNow = (timestamp) => {
  return moment(timestamp * 1e3).fromNow();
};

export const addressFormatV2 = (string, number = 6, isOnlyLast = false) => {
  if (!string) {
    return string;
  }
  return (
    (isOnlyLast ? "" : string.slice(0, number) + "...") + string.slice(-number)
  );
};

export const gotoNodeUrl = (node) => {
  return `${
    API_ENDPOINTS[process.env.NETWORK].THORNODE_URL
  }thorchain/node/${node}`;
};

export const isMainnet = () => {
  return process.env.NETWORK === "mainnet";
};

export const gotoSaver = (router, params) => {
  if (!params) {
    return;
  }
  router.push(`/pool/${params.row.asset}/savers`);
};

export const basicChartFormat = (
  valueFormatter = undefined,
  series,
  xAxis,
  extraSettings = {},
  globalFormatter
) => {
  return {
    title: {
      show: false,
    },
    tooltip: {
      confine: true,
      trigger: "axis",
      valueFormatter,
      formatter: globalFormatter,
    },
    legend: {
      type: "scroll",
      x: "right",
      y: "top",
      icon: "circle",
      textStyle: {
        color: "var(--font-color)",
      },
    },
    xAxis: {
      data: xAxis,
      splitLine: {
        show: false,
      },
      axisLabel: {
        fontFamily: "ProductSans",
      },
    },
    yAxis: {
      show: false,
      splitLine: {
        show: true,
      },
    },
    grid: {
      left: 0,
      right: 0,
      bottom: 0,
      containLabel: false,
    },
    series,
    ...extraSettings,
  };
};

export const camelCase = (e) => {
  return (
    e &&
    e
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
  );
};

export const parseConstant = (key, options, mimir, networkConst) => {
  if (!mimir || !networkConst || !networkConst?.int_64_values) {
    return {};
  }

  const uniKey = key.toUpperCase();
  const uniName = camelCase(key);

  let value = networkConst?.int_64_values[key];
  let isMimir = false;
  if (mimir[uniKey] !== undefined) {
    isMimir = value && true;
    value = mimir[uniKey];
  }

  let extraText = options?.extraText;
  if (typeof extraText === "function") {
    extraText = options?.extraText(value);
  }

  return {
    name: uniName,
    ...(options?.filter
      ? { value: options?.filter(value) }
      : { value: value || 0 }),
    ...(isMimir && { extraInfo: "Overwritten by Mimir" }),
    ...(isMimir &&
      extraText && {
        extraInfo: `${extraText}, Overwritten by Mimir`,
      }),
    ...(!isMimir && extraText && { extraInfo: extraText }),
  };
};

export const runeCur = () => {
  return AssetCurrencySymbol.RUNE;
};

export const clearIntervalId = (id) => {
  if (id) {
    clearInterval(id);
  }
};

export const formatRune = (amount: number, decimalScale: number = 2) => (
  <NumericFormat
    value={amount}
    displayType="text"
    thousandSeparator={true}
    decimalScale={decimalScale}
    suffix=" RUNE"
  />
);

export const numberSort = (x, y, col, rowX, rowY) => {
  return +x < +y ? -1 : +x > +y ? 1 : 0;
};

export const vaultColor = (vaultAddress, disable) => {
  if (disable || !vaultAddress) {
    return "var(--active-primary-color)";
  }
  return colorHash.hex(vaultAddress);
};

export const createColor = (hash) => {
  return colorHash.hex(hash);
};

export const parseCosmosAsset = (casset) => {
  if (!casset) {
    return "";
  }
  const firstAsset = casset.split(",")[0];
  const match = firstAsset.match(/[a-zA-Z.]+/);
  return match ? match[0].toUpperCase() : casset;
};

export const parseMemo = (memo) => {
  if (!memo) {
    return {};
  }

  const type = parseMemoToTxType(memo);

  const parts = memo.split(":");
  if (type === "swap") {
    const [limit, interval, quantity] = parts[3] ? parts[3].split("/") : [];
    return {
      type: type || null,
      asset: parts[1] || null,
      destAddr: parts[2] || null,
      limit: limit || null,
      interval: parseInt(interval) || null,
      quantity: parseInt(quantity) || null,
      affiliate: parts[4] || null,
      fee: parts[5] || null,
    };
  }

  if (type === "add") {
    return {
      type: type || null,
      asset: parts[1] || null,
      asymmetry: parts[2] || false,
      affiliate: parts[3] || null,
      fee: parts[4] || null,
    };
  }

  if (type === "withdraw") {
    return {
      type: type || null,
      asset: parts[1] || null,
      bps: parts[2] || null,
      withdrawAsset: parts[3] || null,
    };
  }

  if (type === "tradeDeposit" || type === "tradeWithdraw") {
    return {
      type,
      asset: null,
      address: parts[1],
    };
  }

  if (type === "outbound") {
    return {
      type,
      hash: parts[1],
    };
  }

  if (type === "bond") {
    return {
      type,
      nodeAddress: parts[1],
      provider: parts[2],
      fee: parts[3],
    };
  }

  if (type === "unbond") {
    return {
      type,
      nodeAddress: parts[1],
      amount: parts[2],
    };
  }

  if (type === "tcyClaim") {
    return {
      type,
      address: parts[1],
    };
  }

  if (type === "tcyStake") {
    return {
      type,
    };
  }

  if (type === "tcyUnstake") {
    return {
      type,
      bps: parts[1] || null,
    };
  }

  return {
    type: type || null,
    asset: parts[1] || null,
  };
};

export const findAssetInPool = (asset, pools) => {
  if (typeof asset !== "object") {
    asset = assetFromString(asset);
  }
  if (pools) {
    pools.forEach((p) => {
      const poolAsset = assetFromString(p.asset);
      if (
        poolAsset.chain === asset.chain &&
        poolAsset.ticker === asset.ticker
      ) {
        if (isSynthAsset(asset)) {
          poolAsset.synth = true;
        } else if (asset.trade) {
          poolAsset.trade = true;
        } else if (asset.secure) {
          poolAsset.secure = true;
        }
        asset = poolAsset;
      }
    });
  }
  return asset;
};

export const parseMemoAsset = (assetInString, pools) => {
  if (!assetInString) {
    return null;
  }

  if (typeof assetInString === "object") {
    return assetInString;
  }

  assetInString = assetInString.toUpperCase();

  if (assetInString.split(".").length === 1) {
    const shortResult = shortAssetName(assetInString);

    assetInString =
      typeof shortResult === "object" && shortResult !== null
        ? shortResult.symbol || shortResult.ticker || assetInString
        : shortResult;
  }

  let asset = assetFromString(assetInString);
  if (!asset) {
    return;
  }

  if (asset?.address) {
    asset = findAssetInPool(asset, pools);
  } else if (
    asset.chain === "ETH" ||
    asset.chain === "AVAX" ||
    asset.chain === "BNB" ||
    asset.chain === "BSC"
  ) {
    asset = findAssetInPool(asset, pools);
  }

  return asset;
};

export const formatAsset = (asset) => {
  if (!asset) {
    return asset;
  }
  return asset.length > 10 ? asset.slice(0, 14) + "..." : asset;
};

export const amountToUSD = (asset, amount, pools) => {
  if (!asset || !amount || !pools) {
    return;
  }

  amount = parseInt(amount, 10) / 1e8;
  if (typeof asset === "string") {
    asset = assetFromString(asset);
  }

  const copyAsset = { ...asset };

  if (isSynthAsset(copyAsset)) {
    copyAsset.synth = false;
  }

  if (asset.trade) {
    copyAsset.trade = false;
  }

  if (copyAsset.chain === "THOR" && copyAsset.symbol === "RUNE") {
    return amount * usdPerRune(pools);
  }

  const pricePerAsset =
    +pools.find((p) => p.asset === assetToString(copyAsset))?.assetPriceUSD ??
    0;

  return amount * pricePerAsset;
};

export const usdPerRune = (pools) => {
  let asset = 0;
  let rune = 0;

  const anchorPools = [
    "ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48",
    "ETH.USDT-0XDAC17F958D2EE523A2206206994597C13D831EC7",
    "AVAX.USDC-0XB97EF9EF8734C71904D8002F8B6BC66DD9C48A6E",
    "BNB.BUSD-BD1",
  ];

  pools.forEach((p) => {
    if (anchorPools.includes(p.asset)) {
      asset += parseInt(p.assetDepth);
      rune += parseInt(p.runeDepth);
    }
  });
  return asset / rune;
};

export const assetColorPalette = (asset) => {
  if (!asset) {
    return null;
  }

  if (typeof asset === "string") {
    asset = assetFromString(asset);
  }

  switch (asset?.ticker?.toUpperCase()) {
    case "USDT":
      return "#27A17C";
    case "BNB":
      return "#F1B90A";
    case "USDC":
      return "#2775CA";
    case "ETH":
      return "#CACACA";
    case "WBTC":
      return "#F19440";
    case "BUSD":
      return "#F0BB02";
    case "AVAX":
      return "#E84142";
    case "ATOM":
      return "#2F3148";
    case "BTC":
    case "BTCB":
      return "#F7A035";
    case "DAI":
      return "#FAB62B";
    case "LTC":
      return "#335D9D";
    case "LUSD":
      return "#745DDF";
    case "GUSD":
      return "#161819";
    case "DOGE":
      return "#BA9F32";
    case "BCH":
      return "#4DCA48";
    case "TWT":
      return "#FFFFFF";
    case "AAVE":
      return "#6B8AB4";
    case "YFI":
      return "#0163C9";
    case "SNX":
      return "#0C032B";
    case "TGT":
      return "#000000";
    case "FOX":
      return "#1F2A4D";
    case "DPI":
      return "#8150E6";
    case "XDEFI":
      return "#163CD4";
    case "THOR":
      return "#07AEFE";
    case "RUNE":
      return "#1BE8C4";
    case "FLIP":
      return "#FC92C5";
    case "VTHOR":
      return "#65532F";
    case "USDP":
      return "#88BA4F";
    case "LINK":
      return "#305DD4";
    case "CBBTC":
      return "#1E6AFF";
    default:
      return null;
  }
};

export const blockSeconds = (chain) => {
  switch (chain) {
    case "BTC":
      return 600;
    case "BCH":
      return 600;
    case "LTC":
      return 150;
    case "DOGE":
      return 60;
    case "ETH":
      return 12;
    case "THOR":
      return 6;
    case "GAIA":
      return 6;
    case "AVAX":
      return 3;
    case "BSC":
    case "BASE":
      return 3;
    case "BNB":
      return 0.5;
    default:
      return 0;
  }
};

export const getNativeAsset = (denom, pools) => {
  if (!denom) {
    return;
  }

  if (typeof denom === "object") {
    return denom;
  }

  if (denom === "rune") {
    return assetFromString("THOR.RUNE");
  }

  pools.forEach((p) => {
    const poolAsset = assetFromString(p.asset);
    if (poolAsset.ticker === denom.toUpperCase()) {
      poolAsset.synth = true;
      return poolAsset;
    }
  });
};

export const mapInterfaceName = (s) => {
  let ifc = interfaces[s.toLowerCase()];

  if (!ifc) {
    ifc = affiliateMap[s.toLowerCase()];
    if (!ifc) {
      return undefined;
    }
  }

  const icons = {
    url: undefined,
    urlDark: undefined,
  };

  if (ifc.icon) {
    icons.url = require(`@/assets/images/${ifc.icon}.png`);
    icons.urlDark = require(`@/assets/images/${ifc.icon}-dark.png`);
  }

  return {
    name: ifc.name ?? ifc,
    icons,
    addName: ifc.addName ?? false,
  };
};

export const mapAffiliateName = (s) => {
  const ifc = affiliateMap[s];
  if (!ifc) {
    return undefined;
  }

  const icons = {
    url: undefined,
    urlDark: undefined,
  };

  if (ifc.icon) {
    icons.url = require(`@/assets/images/${ifc.icon}.png`);
    icons.urlDark = require(`@/assets/images/${ifc.icon}-dark.png`);
  }

  return {
    name: ifc.name ?? ifc,
    icons,
  };
};

export const addAnimate = (d, className, duration) => {
  d.classList?.add(className);
  setTimeout(function () {
    d.classList?.remove(className);
  }, duration);
};

export const animate = (ref, className, duration = 2000) => {
  const d = ref.current;
  if (!d) {
    return;
  }
  if (Array.isArray(d)) {
    d.forEach((c) => {
      addAnimate(c, className, duration);
    });
  } else {
    addAnimate(d, className, duration);
  }
};

export const createDurationText = (duration) => {
  const hours = String(duration.hours()).padStart(2, "0");
  const minutes = String(duration.minutes()).padStart(2, "0");
  const seconds = String(duration.seconds()).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
};

export const getOutAssetFromMemo = (memo, pools) => {
  if (!memo) {
    return null;
  }

  const parts = memo.split(":");
  if (parts.length < 2) {
    return null;
  }

  const asset = parseMemoAsset(parts[1], pools);
  if (!asset) {
    return null;
  }

  return assetToString(asset);
};

export { parseMemoToTxType };

export default {
  showLoading,
  chartTheme,
  assetImage,
  assetToChain,
  imgErr,
  baseChainAsset,
  goto,
  gotoAddr,
  popRandomColor,
  getAssetColor,
  getChainColor,
  isInternalTx,
  gotoTx,
  isValidTx,
  gotoNode,
  gotoPool,
  copy,
  checkSynth,
  formatUnixDate,
  fromNow,
  percentageFormat,
  unitFormat,
  minFormat,
  normalFormat,
  toZeroFormat,
  decimalFormat,
  numberFormat,
  balanceFormat,
  showAsset,
  showTicker,
  baseAmountFormat,
  baseAmountFormatOrZero,
  smallBaseAmountFormat,
  smallBaseAmountFormatWithCur,
  formatCurrency,
  formatBnCurrency,
  formatSmallCurrency,
  versionSort,
  formatAddress,
  getDuration,
  getHumanizeDuration,
  formatTimeSort,
  formatTimeNow,
  addressFormatV2,
  gotoNodeUrl,
  isMainnet,
  gotoSaver,
  basicChartFormat,
  camelCase,
  parseConstant,
  runeCur,
  clearIntervalId,
  formatRune,
  numberSort,
  vaultColor,
  createColor,
  parseCosmosAsset,
  parseMemo,
  findAssetInPool,
  parseMemoAsset,
  formatAsset,
  amountToUSD,
  usdPerRune,
  assetColorPalette,
  blockSeconds,
  getNativeAsset,
  mapInterfaceName,
  mapAffiliateName,
  addAnimate,
  animate,
  createDurationText,
  getOutAssetFromMemo,
};
