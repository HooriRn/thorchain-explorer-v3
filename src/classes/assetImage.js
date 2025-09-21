import { ethers } from "ethers";
import { CoinIconsFromTrustWallet } from "@/constants/icon-list";
import { assetFromString } from "../utils";

const LOCAL_ASSETS = {
  xrp: "/assets/xrp.svg",
  ruji: "/assets/ruji.svg",
  tcy: "/assets/tcy.svg",
  nami: "/assets/nami.png",
  auto: "/assets/auto.png",
  lqdy: "/assets/lqdy.png",
  tgt: "/assets/tgt.png",
  dogecoin: "/assets/dogecoin.png",
  cbbtc: "/assets/cbbtc.png",
};

function getErcIconPath(chain, assetSymbol, assetTicker) {
  const assetAddress = assetSymbol.slice(assetTicker.length + 1);
  const strip0x = assetAddress.substring(2);
  const checkSummedAddress = ethers.getAddress(strip0x);
  return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chain}/assets/${checkSummedAddress}/logo.png`;
}

function getAssetImagePath(assetStr) {
  const asset = assetFromString(assetStr);
  if (!asset) {
    return null;
  }
  const { ticker, chain, symbol } = asset;

  const trustWalletMatch = CoinIconsFromTrustWallet[ticker];

  let iconPath;

  if (trustWalletMatch && chain !== "THOR") {
    if (trustWalletMatch === "XRP-BF2") {
      return LOCAL_ASSETS.xrp;
    }
    iconPath = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/${trustWalletMatch}/logo.png`;
  } else {
    switch (chain) {
      case "THOR":
        if (ticker != null && ticker === "RUNE") {
          iconPath =
            "https://raw.githubusercontent.com/asgardex/thorchain_explorer/main/assets/images/thorchain-logo.png";
          break;
        }
        if (symbol === "KUJI") {
          iconPath =
            "https://raw.githubusercontent.com/trustwallet/assets/refs/heads/master/blockchains/kujira/info/logo.png";
        } else if (symbol === "WINK") {
          iconPath = "https://kujira.network/assets/WINK.38879507.png";
        } else if (symbol === "LVN") {
          iconPath =
            "https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/levana.svg";
        } else if (symbol === "FUZN") {
          iconPath = "https://plasma.fuzion.app/png/fuzion-logo.png";
        } else if (symbol === "NSTK") {
          iconPath =
            "https://assets.coingecko.com/coins/images/33110/standard/nstk.png?1700705727";
        } else if (symbol === "RKUJI") {
          iconPath =
            "https://raw.githubusercontent.com/cosmos/chain-registry/master/kujira/images/rkuji.png";
        } else if (symbol === "RUJI") {
          return LOCAL_ASSETS.ruji;
        } else if (symbol === "TCY") {
          return LOCAL_ASSETS.tcy;
        } else if (symbol === "NAMI") {
          return LOCAL_ASSETS.nami;
        } else if (symbol === "AUTO") {
          return LOCAL_ASSETS.auto;
        } else if (symbol === "LQDY") {
          return LOCAL_ASSETS.lqdy;
        }
        break;

      case "BTC":
        iconPath =
          "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/BTCB-1DE/logo.png";
        break;

      case "LTC":
        iconPath =
          "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/LTC-F07/logo.png";
        break;

      case "BNB":
        if (ticker === "BNB") {
          iconPath =
            "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png";
        } else {
          iconPath = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/${symbol}/logo.png`;
        }
        break;

      case "ETH":
        if (symbol !== "ETH") {
          iconPath = getErcIconPath("ethereum", symbol, ticker);

          if (ticker === "ALCX") {
            iconPath = "https://etherscan.io/token/images/Alchemix_32.png";
          } else if (ticker === "TGT") {
            return LOCAL_ASSETS.tgt;
          } else if (ticker === "XRUNE") {
            iconPath =
              "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x69fa0feE221AD11012BAb0FdB45d444D3D2Ce71c/logo.png";
          } else if (ticker === "VTHOR") {
            iconPath =
              "https://meta.viewblock.io/ETH.VTHOR-0X815C23ECA83261B6EC689B60CC4A58B54BC24D8D/logo";
          } else if (ticker === "FLIP") {
            iconPath =
              "https://meta.viewblock.io/ETH.FLIP-0X826180541412D574CF1336D22C0C0A287822678A/logo";
          } else if (ticker === "LENDS") {
            iconPath = "https://etherscan.io/token/images/lends_32.png";
          } else if (ticker === "WSTETH") {
            iconPath = "https://etherscan.io/token/images/wsteth3_32.png";
          }
        }
        break;

      case "BCH":
        iconPath =
          "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoincash/info/logo.png";
        break;

      case "DOGE":
        return LOCAL_ASSETS.dogecoin;

      case "TERRA":
        if (ticker === "TERRA" || ticker === "LUNA") {
          iconPath =
            "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/terra/info/logo.png";
        } else if (ticker === "UST") {
          iconPath =
            "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/terra/assets/uusd/logo.png";
        }
        break;

      case "GAIA":
        if (symbol === "KUJI") {
          iconPath =
            "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/kujira/info/logo.png";
        } else if (symbol === "WINK") {
          iconPath = "https://kujira.network/assets/WINK.38879507.png";
        } else if (symbol === "LVN") {
          iconPath =
            "https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/levana.svg";
        } else if (symbol === "FUZN") {
          iconPath = "https://plasma.fuzion.app/png/fuzion-logo.png";
        } else if (symbol === "NSTK") {
          iconPath =
            "https://assets.coingecko.com/coins/images/33110/standard/nstk.png?1700705727";
        } else if (symbol === "RKUJI") {
          iconPath =
            "https://raw.githubusercontent.com/cosmos/chain-registry/master/kujira/images/rkuji.png";
        } else {
          iconPath =
            "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cosmos/info/logo.png";
        }
        break;
      case "AVAX":
        if (symbol !== "AVAX") {
          if (symbol === "USDC") {
            iconPath =
              "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png";
          } else {
            iconPath = getErcIconPath("avalanchec", symbol, ticker);
          }
        } else {
          iconPath =
            "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchex/info/logo.png";
        }
        break;

      case "BSC":
        if (symbol !== "BNB" && symbol !== "BSC") {
          iconPath = getErcIconPath("smartchain", symbol, ticker);
        } else {
          iconPath =
            "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png";
        }
        break;

      case "BASE":
        if (symbol !== "BASE") {
          if (ticker.toUpperCase() === "CBBTC") {
            return LOCAL_ASSETS.cbbtc;
          }
          iconPath = getErcIconPath("base", symbol, ticker);
        } else {
          iconPath =
            "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png";
        }
        break;

      default:
        break;
    }
  }

  return iconPath || null;
}

export default getAssetImagePath;
