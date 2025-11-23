import { NextRequest, NextResponse } from "next/server";
import { getPools } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "180d";

    try {
      const pools = await getPools(period);

      return NextResponse.json({
        success: true,
        data: pools,
      });
    } catch (externalError) {
      console.warn(
        "External API failed, trying Midgard fallback:",
        externalError
      );

      try {
        const midgardResponse = await fetch(
          `https://midgard.ninerealms.com/v2/pools?period=${period}`
        );
        if (midgardResponse.ok) {
          const midgardData = await midgardResponse.json();

          return NextResponse.json({
            success: true,
            data: midgardData,
            source: "midgard-fallback",
          });
        }
      } catch (midgardError) {
        console.error("Midgard fallback also failed:", midgardError);
      }

      throw externalError;
    }
  } catch (error) {
    console.error("Error fetching pools:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch pools from all sources",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
