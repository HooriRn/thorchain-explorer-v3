import React, { useState } from "react";
import Link from "next/link";
import addressMap from "@/utils/address";
import Copy from "@/components/Copy";
import GlassmorphismTooltip from "@/components/GlassmorphismTooltip";
import styles from "./Address.module.css";
import { addressFormatV2 } from "@/utils/global";

interface AddressProps {
  address?: string;
  disable?: boolean;
  hoveredAddress?: string;
  useCustomName?: boolean;
  copySize?: "normal" | "small";
  showCopyIcon?: boolean;
  onSetHovered?: (address: string) => void;
  onRemoveHovered?: () => void;
}

const Address: React.FC<AddressProps> = ({
  address = "",
  disable = false,
  hoveredAddress = "",
  useCustomName = false,
  copySize = "normal",
  showCopyIcon = true,
  onSetHovered,
  onRemoveHovered,
}) => {
  const [localHovered, setLocalHovered] = useState(false);

  const handleMouseOver = () => {
    setLocalHovered(true);
    if (onSetHovered && address) {
      onSetHovered(address);
    }
  };

  const handleMouseLeave = () => {
    setLocalHovered(false);
    if (onRemoveHovered) {
      onRemoveHovered();
    }
  };

  const getDisplayText = (): string => {
    if (!address) return "";

    if (useCustomName && addressMap[address as keyof typeof addressMap]) {
      return addressMap[address as keyof typeof addressMap];
    }
    return addressFormatV2(address);
  };

  const displayText = getDisplayText();
  const isHovered = hoveredAddress === address || localHovered;

  return (
    <div
      className={styles["address-container"]}
      onMouseOver={handleMouseOver}
      onMouseLeave={handleMouseLeave}
    >
      {address ? (
        <>
          {disable ? (
            <GlassmorphismTooltip content={address} placement="top">
              <span
                className={`${styles["mono"]} ${styles["address"]} ${
                  isHovered ? styles["hovered"] : ""
                }`}
              >
                {displayText}
              </span>
            </GlassmorphismTooltip>
          ) : (
            <GlassmorphismTooltip content={address} placement="top">
              <Link
                className={`${styles["mono"]} ${styles["address"]} clickable ${
                  isHovered ? styles["hovered"] : ""
                }`}
                href={`/address/${address}`}
              >
                {displayText}
              </Link>
            </GlassmorphismTooltip>
          )}
          {!disable && showCopyIcon && (
            <div className={styles["copy-icon"]}>
              <Copy strCopy={address} size={copySize} hideToast={false} />
            </div>
          )}
        </>
      ) : (
        <span className={`${styles["mono"]} ${styles["no-hover"]}`}>-</span>
      )}
    </div>
  );
};

export default Address;
