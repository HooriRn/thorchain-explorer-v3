import { Metadata } from "next";
import SynthsPage from "./synths";

export const metadata: Metadata = {
  title: "THORChain Network Explorer | Synths",
};

export default function Synths() {
  return <SynthsPage />;
}
