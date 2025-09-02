import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active") || "true";
    const closed = searchParams.get("closed") || "false";
    const limit = searchParams.get("limit") || "50";
    const ascending = searchParams.get("ascending") || "false";
    const order = searchParams.get("order") || "createdAt";

    const gammaApiUrl = "https://gamma-api.polymarket.com/markets";
    const params = new URLSearchParams({
      active,
      closed,
      limit,
      ascending,
      order,
    });

    const response = await fetch(`${gammaApiUrl}?${params}`);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch markets: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching markets:", error);
    return NextResponse.json(
      { error: "Failed to fetch markets" },
      { status: 500 }
    );
  }
}
