"use client";

import React from "react";
import Card from "./ui/Card";
import styles from "./StatsPanel.module.css";

interface StatsMetric {
  label: string;
  value: number | string | undefined;
  filter: (value: any) => string;
  link?: string;
  subValue?: string;
  icon?: React.ReactNode;
}

interface StatsPanelProps {
  metrics: StatsMetric[];
  title?: string;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ metrics }) => {
  return (
    <Card>
      <div className={styles.statsSummary}>
        {metrics.map((metric, index) => (
          <div
            key={index}
            className={`${styles.metricItem} ${
              index > 0 ? styles.withSeparator : ""
            }`}
          >
            <h6 className={styles.metricLabel}>{metric.label}</h6>
            <div className={styles.metricValues}>
              <b className={styles.metricValue}>
                {metric.icon && <div className={styles.metricIcon}>{metric.icon}</div>}
                {metric.link ? (
                  <a href={metric.link}>{metric.filter(metric.value)}</a>
                ) : (
                  metric.filter(metric.value)
                )}
              </b>
              {metric.subValue && (
                <div className={styles.metricSubValue}>{metric.subValue}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default StatsPanel;
