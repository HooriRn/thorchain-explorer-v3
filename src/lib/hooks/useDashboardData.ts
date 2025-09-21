import { useState, useEffect, useCallback, useRef } from "react";

interface DashboardData {
  stats: any;
  networkData: any;
  runeSupply: any;
  txs: any;
}

interface UseDashboardDataReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  lastUpdated: Date | null;
}

const CACHE_DURATION = 30000; 

export const useDashboardData = (): UseDashboardDataReturn => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const cacheRef = useRef<{ data: DashboardData; timestamp: number } | null>(
    null
  );
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && cacheRef.current) {
      const now = Date.now();
      if (now - cacheRef.current.timestamp < CACHE_DURATION) {
        setData(cacheRef.current.data);
        setLoading(false);
        setError(null);
        return;
      }
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/dashboard", {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        const dashboardData: DashboardData = {
          stats: result.stats,
          networkData: result.networkData,
          runeSupply: result.runeSupply,
          txs: result.txs,
        };

        cacheRef.current = {
          data: dashboardData,
          timestamp: Date.now(),
        };

        setData(dashboardData);
        setLastUpdated(new Date());
      } else {
        throw new Error(result.error || "Failed to fetch dashboard data");
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        return;
      }

      setError(err.message || "An error occurred while fetching data");

      if (cacheRef.current) {
        setData(cacheRef.current.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    lastUpdated,
  };
};
