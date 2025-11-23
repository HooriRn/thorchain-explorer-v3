import { NextRequest, NextResponse } from "next/server";
import { getTopSwapsMonthly } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const topSwapsMonthly = await getTopSwapsMonthly();

    if (!topSwapsMonthly) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    if (
      typeof topSwapsMonthly === "object" &&
      (topSwapsMonthly as any).actions
    ) {
      return NextResponse.json({
        success: true,
        data: (topSwapsMonthly as any).actions,
      });
    }

    if (Array.isArray(topSwapsMonthly)) {
      return NextResponse.json({
        success: true,
        data: topSwapsMonthly,
      });
    }

    if (typeof topSwapsMonthly === "object") {
      if (
        (topSwapsMonthly as any).data &&
        Array.isArray((topSwapsMonthly as any).data)
      ) {
        return NextResponse.json({
          success: true,
          data: (topSwapsMonthly as any).data,
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
    console.error("Error fetching top swaps monthly:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch top swaps monthly",
      },
      { status: 500 }
    );
  }
}
