"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import SearchComponent from "./SearchComponent";
import MoonIcon from "@/assets/images/moon-icon.svg";
import SunIcon from "@/assets/images/sun-icon.svg";
import SettingsIcon from "@/assets/images/settings.svg";
import BlueElectraIcon from "@/assets/images/blueelectra.svg";
import styles from "./Searchbar.module.css";
import { formatUSDValue } from "@/utils/format";

const links = {
  mainnet: "https://mainnet.example.com",
  stagenet: "https://stagenet.example.com",
};

interface SearchbarProps {
  className?: string;
}

const Searchbar: React.FC<SearchbarProps> = ({ className }) => {
  const router = useRouter();
  const pathname = usePathname();

  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);

  const [isSearch, setIsSearch] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [innerWidth, setInnerWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  const [isScrolled, setIsScrolled] = useState(false);

  const headerInfo1Ref = useRef<HTMLDivElement>(null);
  const headerInfo2Ref = useRef<HTMLAnchorElement>(null);
  const headerInfo3Ref = useRef<HTMLAnchorElement>(null);
  const themeContainerRef = useRef<HTMLDivElement>(null);
  const themeDialogRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<HTMLDivElement>(null);
  const netDialogRef = useRef<HTMLDivElement>(null);

  const runePrice = useAppStore((state) => state.runePrice);
  const pools = useAppStore((state) => state.pools);
  const nodesData = useAppStore((state) => state.nodesData);
  const networkData = useAppStore((state) => state.networkData);

  const isOverviewPage = pathname === "/dashboard";
  const networkEnv = process.env.NEXT_PUBLIC_NETWORK || "mainnet";

  const getCurrentTheme = () => {
    return theme || "system";
  };

  const currentTheme = getCurrentTheme();

  const tcyPrice = React.useMemo(() => {
    if (pools && pools.length > 0) {
      const tcyPool = pools.find((pool: any) => pool.asset === "THOR.TCY");
      return tcyPool ? tcyPool.assetPriceUSD : null;
    }
    return null;
  }, [pools]);

  useEffect(() => {
    const handleResize = () => {
      setInnerWidth(window.innerWidth);
    };

    const handleScroll = () => {
      const scrollPosition = window.scrollY || window.pageYOffset;
      if (isOverviewPage) {
        setIsScrolled(scrollPosition > 100);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    if (isOverviewPage) {
      window.addEventListener("scroll", handleScroll);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (isOverviewPage) {
        window.removeEventListener("scroll", handleScroll);
      }
    };
  }, [isOverviewPage]);

  useEffect(() => {
    if (headerInfo1Ref.current) {
      headerInfo1Ref.current.classList.add("animate");
      setTimeout(() => {
        headerInfo1Ref.current?.classList.remove("animate");
      }, 1000);
    }
  }, [runePrice]);

  useEffect(() => {
    if (headerInfo2Ref.current) {
      headerInfo2Ref.current.classList.add("animate");
      setTimeout(() => {
        headerInfo2Ref.current?.classList.remove("animate");
      }, 1000);
    }
  }, [nodesData]);

  useEffect(() => {
    if (headerInfo3Ref.current) {
      headerInfo3Ref.current.classList.add("animate");
      setTimeout(() => {
        headerInfo3Ref.current?.classList.remove("animate");
      }, 1000);
    }
  }, [pools]);

  useEffect(() => {
    if (innerWidth < 900) {
      setShowDialog(false);
      setShowSettings(false);
    }
  }, [innerWidth]);

  const handleSearch = useCallback((query: string) => {
    setIsSearch(true);
  }, []);

  const handleExpandedUpdate = useCallback((expanded: boolean) => {
    setIsSearch(expanded);
  }, []);

  const handleCloseExpanded = useCallback(() => {
    setIsSearch(false);
  }, []);

  const handleExpandSearch = useCallback(() => {
    setIsSearch(true);
  }, []);

  const handleSetTheme = useCallback(
    (newTheme: "light" | "dark" | "system" | "BlueElectra") => {
      setTheme(newTheme);
      setShowSettings(false);
    },
    [setTheme]
  );

  const toggleDialog = useCallback(() => {
    setShowDialog((prev) => !prev);
  }, []);

  const toggleSettings = useCallback(() => {
    setShowSettings((prev) => !prev);
  }, []);

  const gotoInstance = useCallback((instance: string, disabled: boolean) => {
    if (disabled) return;
    return links[instance as keyof typeof links];
  }, []);

  const followContainer = useCallback(
    (
      parentContainer: string,
      childContainer: string,
      styles: { leftM?: number; topM?: number }
    ) => {
      const parentRef =
        parentContainer === "network" ? networkRef : themeContainerRef;
      const childRef =
        childContainer === "netDialog" ? netDialogRef : themeDialogRef;

      if (parentRef.current && childRef.current) {
        const rect = parentRef.current.getBoundingClientRect();
        const { leftM, topM } = styles;

        childRef.current.style.right = "0px";
        childRef.current.style.top = `${rect.top + (topM || 0)}px`;
      }
    },
    []
  );

  const createListener = useCallback(
    (
      parentContainer: string,
      childContainer: string,
      styles: { leftM?: number; topM?: number }
    ) => {
      const handleResize = () => {
        followContainer(parentContainer, childContainer, styles);
      };

      window.addEventListener("resize", handleResize);
      followContainer(parentContainer, childContainer, styles);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    },
    [followContainer]
  );

  useEffect(() => {
    const cleanup1 = createListener("network", "netDialog", { topM: 35 });
    const cleanup2 = createListener("themeContainer", "themeDialog", {
      topM: 35,
    });

    return () => {
      cleanup1();
      cleanup2();
    };
  }, [createListener]);

  return (
    <div
      className={`${styles["search-bar-container"]} ${
        innerWidth < 992 && isSearch ? "expanded" : ""
      } ${className || ""}`}
    >
      <div className={styles["left-section"]}>
        <div className={styles["header-info"]}>
          <div className={styles["price-container"]}>
            <div ref={headerInfo1Ref}>
              <small style={{ color: "var(--sec-font-color)" }}>
                RUNE Price:
              </small>
              <small style={{ color: "var(--primary)" }} className="mono value">
                {runePrice ? formatUSDValue(runePrice) : "-"}
              </small>
            </div>
            <Link href="/thorfi/tcy" ref={headerInfo3Ref}>
              <small style={{ color: "var(--sec-font-color)" }}>
                TCY Price:
              </small>
              <small style={{ color: "var(--primary)" }} className="mono value">
                {tcyPrice && tcyPrice > 0 ? formatUSDValue(tcyPrice) : "-"}
              </small>
            </Link>
          </div>
          <Link href="/nodes" ref={headerInfo2Ref}>
            <small style={{ color: "var(--sec-font-color)" }}>
              Node Count:
            </small>
            <small style={{ color: "var(--primary)" }} className="mono value">
              {networkData?.activeNodeCount || "-"}
            </small>
          </Link>
        </div>
      </div>

      <div className={styles["right-section"]}>
        <div
          id="search-container"
          style={{
            display: isOverviewPage ? (isScrolled ? "block" : "none") : "block",
          }}
        >
          <SearchComponent
            useDefaultStyles={true}
            showSearchIcon={true}
            isMobile={innerWidth < 992}
            isExpanded={isSearch}
            onSearch={handleSearch}
            onExpandedUpdate={handleExpandedUpdate}
            onCloseExpanded={handleCloseExpanded}
            onExpandSearch={handleExpandSearch}
          />
        </div>

        {innerWidth >= 990 && (
          <div id="theme-wrapper">
            <div
              ref={themeContainerRef}
              className={styles["theme-container"]}
              onClick={toggleSettings}
            >
              {currentTheme === "dark" && (
                <MoonIcon className={styles["menu-icon"]} />
              )}
              {currentTheme === "light" && (
                <SunIcon className={styles["menu-icon"]} />
              )}
              {currentTheme === "BlueElectra" && (
                <BlueElectraIcon className={styles["menu-icon"]} />
              )}
            </div>
            {showSettings && (
              <div ref={themeDialogRef} className={styles["theme-dialog"]}>
                <a
                  className={currentTheme === "dark" ? styles.active : ""}
                  onClick={() => handleSetTheme("dark")}
                >
                  <MoonIcon className={styles["menu-icon"]} /> Dark
                </a>
                <a
                  className={currentTheme === "light" ? styles.active : ""}
                  onClick={() => handleSetTheme("light")}
                >
                  <SunIcon className={styles["menu-icon"]} /> Light
                </a>
                <a
                  className={
                    currentTheme === "BlueElectra" ? styles.active : ""
                  }
                  onClick={() => handleSetTheme("BlueElectra")}
                >
                  <BlueElectraIcon className={styles["menu-icon"]} />{" "}
                  BlueElectra
                </a>
              </div>
            )}
          </div>
        )}

        {innerWidth >= 990 && (
          <div id="network-wrapper">
            <div
              ref={networkRef}
              className={styles["network-container"]}
              onClick={toggleDialog}
            >
              <SettingsIcon className={styles["menu-icon"]} />
            </div>
            {showDialog && (
              <div ref={netDialogRef} className={styles["network-dialog"]}>
                <a
                  className={networkEnv === "mainnet" ? styles.active : ""}
                  href={gotoInstance("mainnet", networkEnv === "mainnet")}
                >
                  Mainnet
                </a>
                <a
                  className={networkEnv === "stagenet" ? styles.active : ""}
                  href={gotoInstance("stagenet", networkEnv === "stagenet")}
                >
                  Stagenet
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Searchbar;
