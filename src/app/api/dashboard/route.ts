import { NextRequest, NextResponse } from "next/server";
import { getStats, getNetwork, getSupply, getDashboardData } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const [stats, network, runeSupply, txsData] = await Promise.allSettled([
      getStats(),
      getNetwork(),
      getSupply(),
      getDashboardData(),
    ]);

    const responseData: any = {
      success: true,
      stats:
        txsData.status === "fulfilled"
          ? txsData.value?.stats
          : stats.status === "fulfilled"
          ? stats.value
          : null,
      networkData:
        txsData.status === "fulfilled"
          ? txsData.value?.networkData
          : network.status === "fulfilled"
          ? network.value
          : null,
      runeSupply: runeSupply.status === "fulfilled" ? runeSupply.value : null,
      txs: txsData.status === "fulfilled" ? txsData.value?.txs : null,
    };

    const hasEssentialData =
      responseData.stats || responseData.networkData || responseData.runeSupply;

    if (!hasEssentialData) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch essential dashboard data",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch dashboard data",
      },
      { status: 500 }
    );
  }
}
