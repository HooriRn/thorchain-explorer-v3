import { NextRequest, NextResponse } from "next/server";
import { getBalance } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        {
          success: false,
          error: "Address parameter is required",
        },
        { status: 400 }
      );
    }

    const balanceData = await getBalance(address);

    return NextResponse.json({
      success: true,
      data: balanceData,
    });
  } catch (error) {
    console.error("Error fetching balance data:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch balance data",
      },
      { status: 500 }
    );
  }
}
