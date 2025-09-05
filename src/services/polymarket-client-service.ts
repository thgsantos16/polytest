import { Chain, ClobClient } from "@polymarket/clob-client";
import { WalletClient } from "viem";

export interface Market {
  id: string;
  cuid?: string;
  question: string;
  description: string;
  endDate: string;
  volume24h: number;
  liquidity: number;
  yesPrice: number;
  noPrice: number;
  priceChange24h?: number | null;
  yesTokenId: string;
  noTokenId: string;
  conditionId?: string;
  outcomes?: string | null;
  outcomePrices?: string | null;
  lastTradePrice?: number;
  clobTokensIds?: string | null; // Add this field
}

interface GammaApiMarket {
  id: string | number;
  question?: string;
  slug?: string;
  description?: string;
  endDate?: string;
  end_date?: string;
  volume24hr?: number;
  volume?: number;
  liquidity?: number;
  active: boolean;
  archived: boolean;
  outcomePrices?: string;
  outcomes?: string;
  lastTradePrice?: number;
  bestBid?: number;
  bestAsk?: number;
  conditionId?: string;
  oneDayPriceChange?: number | null;
  oneHourPriceChange?: number | null;
  oneWeekPriceChange?: number | null;
  oneMonthPriceChange?: number | null;
}

export class PolymarketClientService {
  private client: ClobClient | null = null;
  private host = "https://clob.polymarket.com";
  private chainId = Chain.POLYGON;

  async initializeClient(walletClient: WalletClient): Promise<boolean> {
    try {
      this.client = new ClobClient(this.host, this.chainId);
      return true;
    } catch (error) {
      console.error("Failed to initialize Polymarket client:", error);
      throw error;
    }
  }

  async fetchMarkets(limit: number = 5): Promise<Market[]> {
    const maxRetries = 100; // Maximum attempts to find enough valid markets
    let attempt = 0;
    const allValidMarkets: Market[] = [];

    while (attempt < maxRetries && allValidMarkets.length < limit) {
      try {
        console.log(
          `Fetching markets via API (attempt ${attempt + 1}/${maxRetries})...`
        );

        // Use API route to get markets
        const response = await fetch(
          `/api/markets?limit=${limit}&offset=${attempt * limit}`
        ); // Fetch more to increase chances
        if (!response.ok) {
          throw new Error(`Failed to fetch markets: ${response.status}`);
        }

        const markets: Market[] = await response.json();
        console.log(`Received ${markets.length} markets from API`);

        const firstMarket = markets[0];

        console.log("First market:", firstMarket.question);

        if (markets.length > 0) {
          // Parse clobTokensIds and outcomePrices for each market
          const enhancedMarkets = markets.map((market) => {
            let yesTokenId = market.yesTokenId;
            let noTokenId = market.noTokenId;
            let yesPrice = market.yesPrice;
            let noPrice = market.noPrice;

            console.log("Market:", market);

            // Parse clobTokensIds if available
            if (market.clobTokensIds) {
              try {
                const tokenIds = JSON.parse(market.clobTokensIds);
                console.log("Token IDs:", tokenIds);
                if (Array.isArray(tokenIds) && tokenIds.length >= 2) {
                  yesTokenId = tokenIds[0];
                  noTokenId = tokenIds[1];
                }
              } catch (e) {
                console.warn(
                  `Failed to parse clobTokensIds for market ${market.id}:`,
                  e
                );
              }
            }

            // Parse outcomePrices if available
            if (market.outcomePrices) {
              try {
                const prices = JSON.parse(market.outcomePrices);
                if (Array.isArray(prices) && prices.length >= 2) {
                  yesPrice = parseFloat(prices[0]) || 0;
                  noPrice = parseFloat(prices[1]) || 0;
                }
              } catch (e) {
                console.warn(
                  `Failed to parse outcomePrices for market ${market.id}:`,
                  e
                );
              }
            }

            return {
              ...market,
              yesTokenId,
              noTokenId,
              yesPrice,
              noPrice,
            };
          });

          // Filter out markets that don't have valid token IDs or prices
          const validMarkets = enhancedMarkets.filter(
            (market) =>
              market.yesTokenId &&
              market.noTokenId &&
              market.yesTokenId !== "" &&
              market.noTokenId !== "" &&
              market.yesPrice > 0 && // Only include markets with real prices
              market.noPrice > 0
          );

          console.log(
            `Valid markets for trading: ${validMarkets.length}/${markets.length}`
          );

          // Add new valid markets to our collection (avoid duplicates)
          const newValidMarkets = validMarkets.filter(
            (market) =>
              !allValidMarkets.some((existing) => existing.id === market.id)
          );

          allValidMarkets.push(...newValidMarkets);

          console.log(
            `Total valid markets collected: ${allValidMarkets.length}/${limit}`
          );

          // If we have enough valid markets, return them
          if (allValidMarkets.length >= limit) {
            console.log(
              `Successfully collected ${allValidMarkets.length} valid markets for trading`
            );
            return allValidMarkets.slice(0, limit);
          }
        }

        // If we don't have enough valid markets, try again
        attempt++;
        console.log(
          `Not enough valid markets yet, retrying... (${attempt}/${maxRetries})`
        );

        // Add a small delay before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(
          `Failed to fetch markets (attempt ${attempt + 1}):`,
          error
        );

        attempt++;
        console.log(
          `Retrying fetchMarkets (attempt ${attempt + 1}/${maxRetries})...`
        );

        // Add a delay before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Return what we have, even if it's less than the limit
    console.log(
      `Returning ${allValidMarkets.length} valid markets after ${attempt} attempts`
    );
    return allValidMarkets.slice(0, limit);
  }

  async enhanceMarketsWithClobData(
    markets: Market[],
    originalGammaData?: GammaApiMarket[]
  ): Promise<Market[]> {
    try {
      const marketClient = new ClobClient(this.host, this.chainId);
      const enhancedMarkets: Market[] = [];

      // Process markets in batches to avoid overwhelming the API
      const batchSize = 5;
      for (let i = 0; i < markets.length; i += batchSize) {
        const batch = markets.slice(i, i + batchSize);
        const batchPromises = batch.map(async (market) => {
          try {
            // Find the original Gamma API data to get the conditionId
            let conditionId = market.id;
            if (originalGammaData) {
              const gammaMarket = originalGammaData.find(
                (gm) => gm.id.toString() === market.id
              );
              if (gammaMarket?.conditionId) {
                conditionId = gammaMarket.conditionId;
              }
            }

            // Get detailed market data from CLOB API using conditionId
            const detailedMarket = await marketClient.getMarket(conditionId);

            console.log("Detailed market:", detailedMarket);

            if (detailedMarket.data && detailedMarket.data.tokens) {
              const marketData = detailedMarket.data;
              const tokens = marketData.tokens;

              console.log("Market data:", marketData);
              console.log("Tokens:", tokens);

              // Extract real-time prices from order book or last trade
              let yesPrice = 0; // Set to 0 when no token IDs available
              let noPrice = 0; // Set to 0 when no token IDs available

              // Try to get prices from order book
              if (
                marketData.orderBook &&
                marketData.orderBook.bids &&
                marketData.orderBook.asks
              ) {
                const bestBid = marketData.orderBook.bids[0]?.price;
                const bestAsk = marketData.orderBook.asks[0]?.price;

                if (bestBid && bestAsk) {
                  // Use midpoint for fair price
                  yesPrice = (parseFloat(bestBid) + parseFloat(bestAsk)) / 2;
                  noPrice = 1 - yesPrice;
                }
              }

              // Parse price data from the API
              if (market.outcomePrices) {
                try {
                  // outcomePrices is a JSON string like "[\"0.04\", \"0.96\"]"
                  const prices = JSON.parse(market.outcomePrices);
                  if (prices && prices.length >= 2) {
                    yesPrice = parseFloat(prices[0]) || 0;
                    noPrice = parseFloat(prices[1]) || 0;
                  }
                } catch (e) {
                  console.warn(
                    `Failed to parse outcomePrices for market ${market.id}:`,
                    e
                  );
                }
              } else if (
                market.lastTradePrice !== undefined &&
                market.lastTradePrice > 0
              ) {
                yesPrice = market.lastTradePrice;
                noPrice = 1 - yesPrice;
              }

              // Extract token IDs from CLOB API response
              let yesTokenId = market.yesTokenId; // Changed from market.tokens.yes
              let noTokenId = market.noTokenId; // Changed from market.tokens.no

              if (tokens && Array.isArray(tokens)) {
                const yesToken = tokens.find(
                  (token: { outcome?: string; token_id?: string }) =>
                    token.outcome?.toLowerCase().includes("yes") ||
                    token.outcome?.toLowerCase().includes("true")
                );
                const noToken = tokens.find(
                  (token: { outcome?: string; token_id?: string }) =>
                    token.outcome?.toLowerCase().includes("no") ||
                    token.outcome?.toLowerCase().includes("false")
                );

                if (yesToken?.token_id) yesTokenId = yesToken.token_id;
                if (noToken?.token_id) noTokenId = noToken.token_id;
              }

              // Only return enhanced market if we have valid token IDs and prices
              if (
                yesTokenId &&
                noTokenId &&
                yesTokenId !== "" &&
                noTokenId !== "" &&
                yesPrice > 0 && // Only include markets with real prices
                noPrice > 0
              ) {
                return {
                  ...market,
                  yesPrice: yesPrice,
                  noPrice: noPrice,
                  volume24h: marketData.volume24h || market.volume24h,
                  liquidity: marketData.liquidity || market.liquidity,
                  yesTokenId: yesTokenId,
                  noTokenId: noTokenId,
                };
              } else {
                console.log(
                  `✗ Failed to enhance market ${market.id} - missing token IDs or invalid prices`
                );
                return null; // Return null to filter out failed enhancements
              }
            }

            // Return original market if no detailed data
            return market;
          } catch (error) {
            console.warn(`Failed to enhance market ${market.id}:`, error);
            // Return original market if enhancement fails
            return market;
          }
        });

        const enhancedBatch = await Promise.all(batchPromises);
        const validEnhancedMarkets = enhancedBatch.filter(
          (market) => market !== null
        ) as Market[];
        enhancedMarkets.push(...validEnhancedMarkets);

        // Add a small delay between batches to be respectful to the API
        if (i + batchSize < markets.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // Check if we have enough valid markets with tokens
      const validMarkets = enhancedMarkets.filter(
        (market) =>
          market.yesTokenId &&
          market.noTokenId &&
          market.yesTokenId !== "" &&
          market.noTokenId !== "" &&
          market.yesPrice > 0 && // Only include markets with real prices
          market.noPrice > 0
      );

      console.log(
        `Valid CLOB markets with tokens and prices: ${validMarkets.length}/${enhancedMarkets.length}`
      );

      return validMarkets;
    } catch (error) {
      console.error("Failed to enhance markets with CLOB data:", error);
      // Return original markets if enhancement fails
      return markets;
    }
  }

  async placeOrder(): Promise<{ success: boolean; message: string }> {
    return {
      success: false,
      message:
        "Trading is only available through the telegram bot. Use /trade command.",
    };
  }
}

export const polymarketClientService = new PolymarketClientService();
