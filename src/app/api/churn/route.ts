import { NextRequest, NextResponse } from "next/server";
import { getChurn } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const churnData = await getChurn();

    return NextResponse.json({
      success: true,
      data: churnData,
    });
  } catch (error) {
    console.error("Error fetching churn data:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch churn data",
      },
      { status: 500 }
    );
  }
}
