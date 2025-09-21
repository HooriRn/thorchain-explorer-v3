import { NextRequest, NextResponse } from "next/server";
import { getAddresses } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const addresses = await getAddresses();

    return NextResponse.json({
      success: true,
      data: {
        addresses,
        pagination: {
          total: addresses.length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching addresses:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch addresses",
      },
      { status: 500 }
    );
  }
}
