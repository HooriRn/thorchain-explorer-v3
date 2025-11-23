"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAppStore } from "@/lib/store";
import Searchbar from "./Searchbar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import styles from "./DefaultLayout.module.css";

interface DefaultLayoutProps {
  children: React.ReactNode;
}

interface ChainsHeight {
  [key: string]: number;
}

interface Pool {
  [key: string]: any;
}

const DefaultLayout: React.FC<DefaultLayoutProps> = ({ children }) => {
  const { theme, resolvedTheme } = useTheme();

  const setRunePrice = useAppStore((state) => state.setRunePrice);
  const setNodesData = useAppStore((state) => state.setNodesData);
  const setNetworkData = useAppStore((state) => state.setNetworkData);
  const setChainsHeight = useAppStore((state) => state.setChainsHeight);
  const setPools = useAppStore((state) => state.setPools);
  const chainsHeight = useAppStore((state) => state.chainsHeight);
  const menu = useAppStore((state) => state.showMenu);
  const fullscreen = useAppStore((state) => state.fullscreen);
  const sidebar = useAppStore((state) => state.showSidebar);
  const toggleMenu = useAppStore((state) => state.toggleMenu);
  const toggleFullscreen = useAppStore((state) => state.toggleFullscreen);
  const setSidebar = useAppStore((state) => state.setSidebar);

  const [updateIntervalRef, setUpdateIntervalRef] =
    useState<NodeJS.Timeout | null>(null);

  const api = {
    getNodes: async () => {
      const response = await fetch("/api/nodes");
      return response.json();
    },
    getNetwork: async () => {
      const response = await fetch("/api/network");
      return response.json();
    },
    getChainsHeight: async () => {
      const response = await fetch("/api/chains-height");
      return response.json();
    },
    getTHORLastBlock: async () => {
      const response = await fetch("/api/thor-last-block");
      return response.json();
    },
    getStats: async () => {
      const response = await fetch("/api/stats");
      return response.json();
    },
    getPools: async () => {
      const response = await fetch("/api/pools");
      return response.json();
    },
  };

  useEffect(() => {}, []);

  const getRunePrice = async () => {
    try {
      const res = await api.getStats();
      setRunePrice(Number.parseFloat(res.data.runePriceUSD));
    } catch (error) {}
  };

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

  const getPools = async () => {
    try {
      const { data } = await api.getPools();
      setPools(data);
    } catch (error) {}
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        const nodesResponse = await api.getNodes();
        if (nodesResponse.success && nodesResponse.data) {
          setNodesData(nodesResponse.data);
        }

        const networkResponse = await api.getNetwork();
        if (networkResponse.success && networkResponse.data) {
          setNetworkData(networkResponse.data);
        }

        await getChainsHeight();
        await getRunePrice();
        await getPools();
      } catch (error) {}
    };

    initializeData();

    const interval = setInterval(() => {
      getChainsHeight();
      getRunePrice();
      getPools();
    }, 20000);
    setUpdateIntervalRef(interval);

    const changeHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    changeHeight();
    window.addEventListener("resize", changeHeight);

    return () => {
      if (updateIntervalRef) {
        clearInterval(updateIntervalRef);
      }
      window.removeEventListener("resize", changeHeight);
    };
  }, []);

  return (
    <main
      id="default-layout"
      className={`
        ${styles.defaultLayout}
        ${menu ? styles.longSidebar : ""}
        ${fullscreen ? styles.fullscreen : ""}
        ${sidebar ? styles.showSidebar : ""}
      `}
    >
      <header id="header" className={styles.header}>
        <Searchbar />
      </header>

      <nav id="navbar" className={styles.navbar}>
        <Navbar />
      </nav>

      <main id="main-content" className={styles.mainContent}>
        {children}
      </main>

      <footer id="footer" className={styles.footer}>
        <Footer currentBlock={chainsHeight?.THOR || 0} />
      </footer>
    </main>
  );
};
export default DefaultLayout;
