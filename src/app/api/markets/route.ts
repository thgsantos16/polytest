import { NextRequest, NextResponse } from "next/server";

export const revalidate = 30; // 30 seconds cache between all users

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "5");

    // If no database markets, fallback to Gamma API
    const gammaApiUrl = "https://gamma-api.polymarket.com/markets";
    const params = new URLSearchParams({
      active: "true",
      closed: "false",
      limit: limit.toString(),
      ascending: "false",
      order: "createdAt",
    });

    const finalUrl = `${gammaApiUrl}?${params}`;
    console.log("Fallback to Gamma API:", finalUrl);

    const response = await fetch(finalUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch markets: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform Gamma API data to client Market interface
    const markets = data
      .filter(
        (market: { active: boolean; archived: boolean }) =>
          market.active && !market.archived
      )
      .slice(0, limit)
      .map(
        (market: {
          id: string | number;
          question?: string;
          slug?: string;
          description?: string;
          endDate?: string;
          end_date?: string;
          volume24hr?: number;
          volume?: number;
          liquidity?: number;
          oneDayPriceChange?: number | null;
          outcomePrices?: string | null;
          outcomes?: string | null;
          conditionId?: string | null;
        }) => ({
          id: market.id.toString(),
          cuid: market.id.toString(), // Use original ID as CUID for now
          question: market.question || market.slug || `Market ${market.id}`,
          description:
            market.description || market.slug || `Market ${market.id}`,
          endDate:
            market.endDate || market.end_date || new Date().toISOString(),
          volume24h: market.volume24hr || market.volume || 0,
          liquidity: Number(market.liquidity) || 0,
          yesPrice: 0.5, // Default fallback
          noPrice: 0.5, // Default fallback
          priceChange24h: market.oneDayPriceChange || null,
          yesTokenId: "", // Gamma API doesn't provide token IDs
          noTokenId: "", // Gamma API doesn't provide token IDs
          outcomePrices: market.outcomePrices || null,
          outcomes: market.outcomes || null,
          conditionId: market.conditionId || null,
        })
      );

    return NextResponse.json(markets);
  } catch (error) {
    console.error("Error fetching markets:", error);
    return NextResponse.json(
      { error: "Failed to fetch markets" },
      { status: 500 }
    );
  }
}
