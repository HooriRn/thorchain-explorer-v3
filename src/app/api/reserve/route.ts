import { NextRequest, NextResponse } from "next/server";
import { getReserveHistory } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const reserveData = await getReserveHistory();

    return NextResponse.json({
      success: true,
      data: reserveData,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch reserve data",
      },
      { status: 500 }
    );
  }
}
