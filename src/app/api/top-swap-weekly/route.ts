import { NextRequest, NextResponse } from "next/server";
import { getTopSwapsWeekly } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const topSwapsWeekly = await getTopSwapsWeekly();

    if (!topSwapsWeekly) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    if (typeof topSwapsWeekly === "object" && (topSwapsWeekly as any).actions) {
      return NextResponse.json({
        success: true,
        data: (topSwapsWeekly as any).actions,
      });
    }

    if (Array.isArray(topSwapsWeekly)) {
      return NextResponse.json({
        success: true,
        data: topSwapsWeekly,
      });
    }

    if (typeof topSwapsWeekly === "object") {
      if (
        (topSwapsWeekly as any).data &&
        Array.isArray((topSwapsWeekly as any).data)
      ) {
        return NextResponse.json({
          success: true,
          data: (topSwapsWeekly as any).data,
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
    console.error("Error fetching top swaps weekly:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch top swaps weekly",
      },
      { status: 500 }
    );
  }
}
