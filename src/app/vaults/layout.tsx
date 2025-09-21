import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "THORChain Network Explorer | Vaults",
  description:
    "View THORChain vault information including bond, balance, and node membership details",
};

export default function VaultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
