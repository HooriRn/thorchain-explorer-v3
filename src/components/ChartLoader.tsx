import React, { useState, useEffect } from "react";
import styles from "./ChartLoader.module.css";

interface ChartLoaderProps {
  height?: number;
  width?: string;
  barCount?: number;
}

const ChartLoader: React.FC<ChartLoaderProps> = ({
  height = 400,
  width = "100%",
  barCount = 20,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1200);
  const [randomHeights, setRandomHeights] = useState<number[]>([]);

  useEffect(() => {
    const checkScreenSize = () => {
      if (typeof window !== "undefined") {
        const width = window.innerWidth;
        setWindowWidth(width);
        setIsMobile(width < 990);
      }
    };

    checkScreenSize();

    if (typeof window !== "undefined") {
      window.addEventListener("resize", checkScreenSize);
      return () => {
        window.removeEventListener("resize", checkScreenSize);
      };
    }
  }, []);

  useEffect(() => {
    const generateRandomHeights = () => {
      const heights: number[] = [];
      for (let i = 0; i < barCount; i++) {
        heights.push(Math.floor(Math.random() * 60) + 30);
      }
      setRandomHeights(heights);
    };

    generateRandomHeights();
  }, [barCount]);

  const responsiveBarCount = () => {
    if (isMobile) {
      return Math.max(Math.floor(barCount / 2), 8);
    }
    if (windowWidth < 1200) {
      return Math.max(Math.floor(barCount * 0.7), 10);
    }
    return barCount;
  };

  return (
    <div className={styles.chartLoaderContainer}>
      <div className={styles.chartSkeleton}>
        <div className={styles.chartContentSkeleton}>
          <div className={styles.chartAreaSkeleton}>
            <div className={styles.chartBars}>
              {Array.from({ length: responsiveBarCount() }).map((_, index) => {
                const barHeight =
                  randomHeights[index] || ((index * 7 + 13) % 60) + 30;
                return (
                  <div
                    key={`bar-${index}`}
                    className={`${styles.barSkeleton} bg-gradient-to-t from-gray-300 to-gray-400 rounded-t`}
                    style={{
                      height: `${barHeight}%`,
                      width: isMobile ? "7px" : "12px",
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartLoader;
