import { NextRequest, NextResponse } from "next/server";
import { getTopSwaps } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const topSwaps = await getTopSwaps();

    if (!topSwaps) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    if (typeof topSwaps === "object" && (topSwaps as any).actions) {
      return NextResponse.json({
        success: true,
        data: (topSwaps as any).actions,
      });
    }

    if (Array.isArray(topSwaps)) {
      return NextResponse.json({
        success: true,
        data: topSwaps,
      });
    }

    if (typeof topSwaps === "object") {
      if ((topSwaps as any).data && Array.isArray((topSwaps as any).data)) {
        return NextResponse.json({
          success: true,
          data: (topSwaps as any).data,
        });
      }
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    return NextResponse.json({
      success: true,
      data: [],
    });
  } catch (error) {
    console.error("Error fetching top swaps:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch top swaps",
      },
      { status: 500 }
    );
  }
}
