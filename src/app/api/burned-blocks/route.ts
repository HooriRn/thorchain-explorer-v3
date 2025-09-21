import { NextRequest, NextResponse } from "next/server";
import { getBurnedBlocks } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const data = await getBurnedBlocks();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching burned blocks data:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch burned blocks data",
      },
      { status: 500 }
    );
  }
}
