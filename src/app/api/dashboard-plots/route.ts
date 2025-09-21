import { NextRequest, NextResponse } from "next/server";
import { getDashboardPlots } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const plots = await getDashboardPlots();

    return NextResponse.json({
      success: true,
      ...plots,
    });
  } catch (error) {
    console.error("Error fetching dashboard plots:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch dashboard plots",
      },
      { status: 500 }
    );
  }
}
