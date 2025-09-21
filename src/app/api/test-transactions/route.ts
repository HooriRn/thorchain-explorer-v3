import { NextRequest, NextResponse } from "next/server";
import { getTxs } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const txs = await getTxs(0, 10);

    return NextResponse.json({
      success: true,
      data: txs,
      message: `Fetched ${txs?.actions?.length || 0} transactions`,
    });
  } catch (error) {
    console.error("❌ Error testing getTxs:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to test getTxs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
