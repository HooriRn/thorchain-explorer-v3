import { NextRequest, NextResponse } from "next/server";
import { getSupply } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const supplyData = await getSupply();

    return NextResponse.json({
      success: true,
      data: supplyData,
    });
  } catch (error) {
    console.error("Error fetching supply data:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch supply data",
      },
      { status: 500 }
    );
  }
}
