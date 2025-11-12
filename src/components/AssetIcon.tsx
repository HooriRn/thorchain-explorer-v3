"use client";

import React, { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { assetFromString, assetToString } from "@/utils";
import { assetImage, assetToChain } from "@/utils/global";
import styles from "./AssetIcon.module.css";

interface AssetIconProps {
  asset: string | any;
  chain?: string | false;
  height?: string;
  classes?: string[];
  chainHeight?: string;
}

const AssetIcon: React.FC<AssetIconProps> = ({
  asset,
  chain,
  height = "1.5rem",
  classes = [],
  chainHeight = "0.7rem",
}) => {
  const pools = useAppStore((state) => state.pools);

  const heightStyle = useMemo(
    () =>
      ({
        "--asset-height": height,
        "--asset-width": height,
        "--chain-asset-height": chainHeight,
        "--chain-asset-width": chainHeight,
      } as React.CSSProperties),
    [height, chainHeight]
  );

  const isTokenFactory = useMemo(() => {
    let assetObj = asset;
    if (typeof asset === "string") {
      assetObj = assetFromString(asset);
    }
    return assetObj && typeof assetObj === "object" && assetObj.id;
  }, [asset]);

  const findAssetInPools = (assetSymbol: string) => {
    const pool = pools?.find((p: any) => {
      const poolAsset = assetFromString(p.asset);
      if (poolAsset?.symbol === assetSymbol) {
        return true;
      }
      return false;
    });

    return pool ? pool.asset : assetSymbol;
  };

  const tokens = useMemo(() => {
    let assetObj = asset;
    if (typeof asset === "string") {
      assetObj = assetFromString(asset);
    }

    if (assetObj?.id) {
      const [x, y] = assetObj.symbol.toUpperCase().split("/");
      return [findAssetInPools(x), findAssetInPools(y)];
    }

    return [assetObj];
  }, [asset, pools]);

  const showChainImage = () => {
    if (chain === false) {
      return false;
    }

    let assetStr = asset;
    if (typeof asset === "object") {
      assetStr = assetToString(asset);
    }

    if (chain) {
      return true;
    } else if (assetToChain(asset) !== assetStr) {
      return true;
    }
    return false;
  };

  const imgErr = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = event.target as HTMLImageElement;
    target.src = "/globe.svg";
  };

  const getAssetImage = (assetData: any) => {
    const imageSrc = assetImage(assetData);
    return imageSrc || "/globe.svg";
  };

  return (
    <div
      className={[
        styles["icon-asset-container"],
        isTokenFactory ? "is-factory" : "",
        ...classes,
      ].join(" ")}
      style={heightStyle}
    >
      {isTokenFactory ? (
        <div className={styles["asset-group"]}>
          <div className={styles["left-icon"]}>
            <img
              className={styles["asset-icon"]}
              src={getAssetImage(tokens[0])}
              alt="asset-icon"
              onError={imgErr}
            />
          </div>
          <div className={styles["right-icon"]}>
            <img
              className={styles["asset-icon"]}
              src={getAssetImage(tokens[1])}
              key="right-icon"
              alt="asset-icon"
              onError={imgErr}
            />
          </div>
        </div>
      ) : (
        <>
          <img
            className={styles["asset-icon"]}
            src={getAssetImage(asset)}
            alt="asset-icon"
            onError={imgErr}
          />
          {showChainImage() && (
            <img
              className={styles["chain-asset-icon"]}
              src={getAssetImage(chain ? chain : assetToChain(asset))}
              alt="asset-chain-icon"
            />
          )}
        </>
      )}
    </div>
  );
};

export default AssetIcon;
