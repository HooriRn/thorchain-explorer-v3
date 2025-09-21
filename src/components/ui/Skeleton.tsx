import React from "react";
import styles from "./Skeleton.module.css";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "rounded";
  animation?: "pulse" | "wave" | "none";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  className = "",
  variant = "text",
  animation = "pulse",
}) => {
  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  const skeletonClasses = [
    styles.skeleton,
    styles[variant],
    styles[animation],
    className,
  ].join(" ");

  return <div className={skeletonClasses} style={style} />;
};

interface SkeletonGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const SkeletonGroup: React.FC<SkeletonGroupProps> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`${styles.skeletonGroup} ${className}`}>{children}</div>
  );
};

export const DashboardSkeleton: React.FC = () => (
  <div className={styles.dashboardSkeleton}>
    <div className={styles.header}>
      <Skeleton variant="rectangular" height={60} />
    </div>
    <div className={styles.charts}>
      <Skeleton variant="rectangular" height={300} />
      <Skeleton variant="rectangular" height={300} />
    </div>
    <div className={styles.cards}>
      <Skeleton variant="rectangular" height={200} />
      <Skeleton variant="rectangular" height={200} />
      <Skeleton variant="rectangular" height={200} />
      <Skeleton variant="rectangular" height={200} />
    </div>
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className={styles.chartSkeleton}>
    <Skeleton variant="rectangular" height={250} />
  </div>
);

export const CardSkeleton: React.FC = () => (
  <div className={styles.cardSkeleton}>
    <Skeleton variant="text" height={24} width="60%" />
    <Skeleton variant="text" height={16} width="40%" />
    <Skeleton variant="text" height={16} width="80%" />
    <Skeleton variant="text" height={16} width="70%" />
  </div>
);

export default Skeleton;
