import { NextRequest, NextResponse } from "next/server";
import { getTxs } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const offset = parseInt(searchParams.get("offset") || "0");
    const limit = parseInt(searchParams.get("limit") || "10");
    const address = searchParams.get("address");
    const txid = searchParams.get("txid");

    let transactions;

    if (txid) {
      const { getTx } = await import("@/lib/api");
      transactions = await getTx(txid, limit);
    } else if (address) {
      const { getAddress } = await import("@/lib/api");
      transactions = await getAddress(address, offset, limit);
    } else {
      transactions = await getTxs(offset, limit);
    }

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        offset,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch transactions",
      },
      { status: 500 }
    );
  }
}
