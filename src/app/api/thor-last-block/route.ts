import { NextRequest, NextResponse } from "next/server";
import { getTHORLastBlock } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const thorLastBlock = await getTHORLastBlock();

    return NextResponse.json({
      success: true,
      data: thorLastBlock,
    });
  } catch (error) {
    console.error("Error fetching THOR last block:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch THOR last block",
      },
      { status: 500 }
    );
  }
}
