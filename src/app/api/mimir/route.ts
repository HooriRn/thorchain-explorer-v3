import { NextRequest, NextResponse } from "next/server";
import { getMimir } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const data = await getMimir();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching mimir data:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch mimir data",
      },
      { status: 500 }
    );
  }
}
