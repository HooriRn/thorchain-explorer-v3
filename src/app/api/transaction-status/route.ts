import { NextRequest, NextResponse } from "next/server";
import { getTxStatus } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const txid = searchParams.get("txid");

    if (!txid) {
      return NextResponse.json(
        {
          success: false,
          error: "Transaction ID (txid) is required",
        },
        { status: 400 }
      );
    }

    const txStatus = await getTxStatus(txid);

    return NextResponse.json({
      success: true,
      data: txStatus,
    });
  } catch (error) {
    console.error("Error fetching transaction status:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch transaction status",
      },
      { status: 500 }
    );
  }
}
