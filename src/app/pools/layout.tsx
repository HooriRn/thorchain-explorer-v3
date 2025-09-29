import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "THORChain Network Explorer | Pools",
  description:
    "View THORChain pool information including depth, volume, earnings, and liquidity details",
};

export default function PoolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
