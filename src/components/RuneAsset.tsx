import React, { useEffect, useState } from "react";
import styles from "./RuneAsset.module.css";
import AssetIcon from "@/assets/images/rune.svg";

interface RuneAssetProps {
  height?: string;
  showIcon?: boolean;
  symbol?: string;
  icon?: string;
  environment?: string;
  customClass?: string;
  asset?: string;
}

const RuneAsset: React.FC<RuneAssetProps> = ({
  height = "1.2rem",
  showIcon = true,
  symbol = "RUNE",
  icon,
  environment: initialEnvironment = "mainnet",
  customClass = "",
  asset,
}) => {
  const [environment, setEnvironment] = useState(initialEnvironment);

  useEffect(() => {
    if (!initialEnvironment || initialEnvironment === "mainnet") {
      const network = process.env.NEXT_PUBLIC_NETWORK || "mainnet";

      if (network === "stagenet") {
        setEnvironment("stagenet");
      } else {
        setEnvironment("mainnet");
      }
    }
  }, [initialEnvironment]);

  const getAssetConfig = () => {
    const configs = {
      mainnet: {
        symbol: "RUNE",
        icon: "/assets/images/rune.svg",
        name: "Thorchain Rune",
      },
      stagenet: {
        symbol: "RUNE",
        icon: "/assets/images/rune.svg",
        name: "Stagenet Rune",
      },
    };

    return configs[environment as keyof typeof configs] || configs.mainnet;
  };

  const getRuneAssetHTML = (
    showIcon: boolean = false,
    height: string = "1.2rem"
  ) => {
    if (showIcon) {
      return `<svg style="height: ${height}; fill: var(--sec-font-color);" viewBox="0 0 15.859 30.71" xmlns="http://www.w3.org/2000/svg"><polygon points="3.865 30.71 0 30.71 0 0 3.865 0 13.758 5.587 13.758 9.809 10.23 15.859 15.859 30.71 11.742 30.71 6.155 15.649 10.482 8.129 3.865 4.39 3.865 30.71" style="fill-rule: evenodd; stroke-width: 0px;"/></svg>`;
    } else {
      return `<span>${getAssetSymbol()}</span>`;
    }
  };

  const getAssetSymbol = () => {
    if (asset === "THOR.RUNE") {
      return getAssetConfig().symbol;
    }

    if (symbol !== "RUNE") {
      return symbol;
    }

    return getAssetConfig().symbol;
  };

  const getAssetIconComponent = () => {
    if (asset === "THOR.RUNE") {
      return getAssetConfig().icon;
    }

    if (icon && icon !== "/assets/images/rune.svg") {
      return icon;
    }

    return getAssetConfig().icon;
  };

  const getAssetName = () => {
    return getAssetConfig().name;
  };

  const renderIcon = () => {
    if (asset === "THOR.RUNE") {
      return (
        <AssetIcon
          asset={asset}
          height={height}
          classes={customClass ? [customClass] : []}
        />
      );
    }

    if (showIcon) {
      const iconSrc = getAssetIconComponent();
      return (
        <img
          src={iconSrc}
          style={{ height }}
          className={customClass}
          alt={getAssetSymbol()}
        />
      );
    }

    return <span className={customClass}>{getAssetSymbol()}</span>;
  };

  return <span className={styles["rune-asset"]}>{renderIcon()}</span>;
};

export default RuneAsset;
