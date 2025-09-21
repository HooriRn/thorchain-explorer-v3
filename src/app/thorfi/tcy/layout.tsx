import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "THORChain Network Explorer | TCY",
  description:
    "View THORChain TCY (THORChain Yield) information including allocation, earnings, and distribution details",
};

export default function TcyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
