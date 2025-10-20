import { NextRequest, NextResponse } from "next/server";
import { getVotes } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";

    const votes = await getVotes(period);

    return NextResponse.json({
      success: true,
      data: votes,
    });
  } catch (error) {
    console.error("Error fetching votes:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch votes",
      },
      { status: 500 }
    );
  }
}
