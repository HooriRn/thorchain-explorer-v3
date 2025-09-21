import { NextRequest, NextResponse } from "next/server";
import { getTcyInfo } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const tcyInfo = await getTcyInfo();

    return NextResponse.json({
      success: true,
      data: tcyInfo,
    });
  } catch (error) {
    console.error("Error fetching TCY info:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch TCY info",
      },
      { status: 500 }
    );
  }
}
