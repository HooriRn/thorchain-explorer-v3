"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SearchComponent from "@/components/SearchComponent";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useStore } from "@/lib/store";
import styles from "./DashboardLayout.module.css";
import Searchbar from "@/components/Searchbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const router = useRouter();
  const {
    theme,
    menu,
    fullscreen,
    sidebar,
    setTheme,
    setNodesData,
    setNetworkData,
    setChainsHeight,
    setRunePrice,
    setPools,
    toggleMenu,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearch, setIsSearch] = useState(false);
  const [isSlashFocused, setIsSlashFocused] = useState(false);

  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const getChainsHeight = async () => {
    try {
      const response = await fetch("/api/chains-height");
      const data = await response.json();

      if (data.success && data.data) {
        setChainsHeight(data.data);
      }
    } catch (error) {
      console.error("Error fetching chains height:", error);
    }
  };

  const getRunePrice = async () => {
    try {
      const response = await fetch("/api/stats");
      const data = await response.json();
      if (data.success && data.data && data.data.runePriceUSD) {
        const price = Number.parseFloat(data.data.runePriceUSD);
        setRunePrice(price);
      }
    } catch (error) {}
  };

  const getPools = async () => {
    try {
      const response = await fetch("/api/pools");
      const data = await response.json();
      if (data.success && data.data) {
        setPools(data.data);
      }
    } catch (error) {}
  };

  const getNodes = async () => {
    try {
      const response = await fetch("/api/nodes");
      const data = await response.json();
      if (data.success && data.data) {
        setNodesData(data.data);
      }
    } catch (error) {}
  };

  const getNetwork = async () => {
    try {
      const response = await fetch("/api/network");
      const data = await response.json();
      if (data.success && data.data) {
        setNetworkData(data.data);
      }
    } catch (error) {}
  };

  const find = async (searchQuery: string) => {
    const search = searchQuery.toUpperCase();

    if (search.length <= 30) {
      try {
        const response = await fetch(`/api/thorname/${searchQuery}`);
        const res = await response.json();

        if (response.ok && (res.aliases?.length > 0 || res.owner)) {
          let thorchainAddr = res.aliases?.find(
            (el: any) => el.chain === "THOR"
          )?.address;
          if (!thorchainAddr) {
            thorchainAddr = res.owner;
          }
          router.push(`/address/${thorchainAddr}`);
          return;
        }
      } catch (error) {}
    }

    if (
      search.startsWith("THOR") ||
      search.startsWith("TTHOR") ||
      search.startsWith("STHOR") ||
      search.startsWith("BNB") ||
      search.startsWith("TBNB") ||
      search.startsWith("BC1") ||
      search.startsWith("TB1") ||
      search.startsWith("LTC") ||
      search.startsWith("TLTC") ||
      search.startsWith("COSMOS") ||
      search.length <= 43
    ) {
      router.push(`/address/${searchQuery}`);
    } else {
      router.push(`/tx/${searchQuery}`);
    }
  };

  const onSlashFocusChange = (isFocused: boolean) => {
    setIsSlashFocused(isFocused);
  };

  const onSlashFocus = () => {
    setIsSlashFocused(true);
  };

  const onSlashBlur = () => {
    setIsSlashFocused(false);
  };

  useEffect(() => {
    getRunePrice();
    getNodes();
    getNetwork();
    getChainsHeight();
    getPools();

    updateIntervalRef.current = setInterval(() => {
      getChainsHeight();
      getRunePrice();
      getPools();
    }, 20000);

    const changeHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    changeHeight();
    window.addEventListener("resize", changeHeight);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      window.removeEventListener("resize", changeHeight);
    };
  }, [setChainsHeight, setRunePrice, setPools, setNodesData, setNetworkData]);

  return (
    <main
      id="dashboard-layout"
      className={`${styles.dashboardLayout} ${menu ? styles.longSidebar : ""} ${
        fullscreen ? styles.fullscreen : ""
      } ${sidebar ? styles.showSidebar : ""}`}
    >
      <header id="header" className={styles.header}>
        <Searchbar />
      </header>

      <nav id="navbar" className={styles.navbar}>
        <Navbar />
      </nav>

      <div className={styles.backgroundContainer}>
        <div className={styles.searchBar}>
          <div className={styles.titleSearch}>
            THORChain Blockchain Explorer
          </div>
          <div className={styles.searchContainer}>
            <div
              id="search-bar-container"
              className={`${styles.searchBarContainer} ${
                isSlashFocused ? styles.slashFocused : ""
              }`}
            >
              <SearchComponent
                useDefaultStyles={false}
                showSearchIcon={true}
                isDashboardLayout={true}
                onSearch={find}
                onSlashFocus={onSlashFocus}
                onSlashBlur={onSlashBlur}
              />
            </div>
          </div>
        </div>
      </div>

      <main id="main-content" className={styles.mainContent}>
        {children}
      </main>

      <footer id="footer">
        <Footer />
      </footer>
    </main>
  );
};
export default DashboardLayout;
