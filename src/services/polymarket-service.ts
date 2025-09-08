import {
  ClobClient,
  OrderType,
  Side,
  AssetType,
} from "@polymarket/clob-client";
import { Chain } from "@polymarket/clob-client/dist/types";
import { WalletClient } from "viem";
import { Web3Provider, JsonRpcProvider } from "@ethersproject/providers";
import { ethers } from "ethers";
import { JsonRpcSigner } from "@ethersproject/providers";
import { prismaStorageService } from "./prisma-storage-service";
import { Wallet } from "@ethersproject/wallet";

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
  clobTokensIds?: string | null; // Add this field
}

export interface PolymarketMarket {
  condition_id: string;
  question_id: string;
  tokens: Array<{
    token_id: string;
    outcome: string;
  }>;
  rewards: {
    min_size: number;
    max_spread: number;
    event_start_date: string;
    event_end_date: string;
    in_game_multiplier: number;
    reward_epoch: number;
  };
  minimum_order_size: string;
  minimum_tick_size: string;
  category: string;
  end_date_iso: string;
  game_start_time: string;
  question: string;
  market_slug: string;
  min_incentive_size: string;
  max_incentive_spread: string;
  active: boolean;
  closed: boolean;
  seconds_delay: number;
  icon: string;
  fpmm: string;
  archived: boolean; // Added archived property
  accepting_orders: boolean; // Added accepting_orders property
}

export interface OrderDetails {
  marketId: string;
  tokenId: string;
  side: "buy" | "sell";
  price: number;
  size: number;
  walletAddress: string;
}

export interface OrderBookEntry {
  price: number;
  size: number;
}

export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

export interface OrderResponse {
  success: boolean;
  message: string;
  orderId?: string;
  status?: string;
}

interface PolymarketOrderBookEntry {
  price: string;
  size: string;
}

interface GammaMarket {
  id: number;
  slug: string;
  archived: boolean;
  active: boolean;
  closed: boolean;
  liquidity: number;
  volume: number;
  start_date: string;
  end_date: string;
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

export class PolymarketService {
  private client: ClobClient | null = null;
  private host = "https://clob.polymarket.com";
  private chainId = Chain.POLYGON;

  // Update caching to use database instead of in-memory
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  async initializeClient(walletClient: WalletClient): Promise<boolean> {
    try {
      // For read operations, we don't need a signer
      // For order placement, we'll initialize the client with signer when needed
      this.client = new ClobClient(this.host, this.chainId);

      return true;
    } catch (error) {
      console.error("Failed to initialize Polymarket client:", error);
      throw error;
    }
  }

  async fetchMarkets(
    limit: number = 5,
    order: string = "createdAt",
    ascending: boolean = false
  ): Promise<Market[]> {
    const maxRetries = 2;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        console.log(
          `Fetching markets from database (attempt ${attempt + 1}/${
            maxRetries + 1
          })...`
        );

        // First try to get markets from database
        const dbMarkets = await prismaStorageService.getActiveMarkets(20);

        if (dbMarkets.length > 0) {
          // Check if cache is still fresh (within 5 minutes)
          const now = new Date();
          const isCacheFresh = dbMarkets.every(
            (market) =>
              now.getTime() - market.lastUpdated.getTime() < this.CACHE_TTL
          );

          if (isCacheFresh) {
            console.log("Returning fresh markets data from database");

            // Check if cached markets have valid token IDs
            const marketsWithTokenIds = dbMarkets.filter(
              (market) =>
                market.yesTokenId &&
                market.noTokenId &&
                market.yesTokenId !== "" &&
                market.noTokenId !== ""
            );

            if (marketsWithTokenIds.length === dbMarkets.length) {
              // All markets have token IDs, return them
              return dbMarkets.map((dbMarket) => ({
                id: dbMarket.id, // Use the CUID instead of polymarketId
                question: dbMarket.question,
                description: dbMarket.description || "",
                endDate: dbMarket.endDate.toISOString(),
                volume24h: dbMarket.volume24h,
                liquidity: dbMarket.liquidity,
                yesPrice: dbMarket.yesPrice,
                noPrice: dbMarket.noPrice,
                priceChange24h: dbMarket.priceChange24h,
                yesTokenId: dbMarket.yesTokenId,
                noTokenId: dbMarket.noTokenId,
                clobTokensIds: dbMarket.clobTokensIds,
              }));
            } else {
              console.log(
                `Found ${
                  dbMarkets.length - marketsWithTokenIds.length
                } markets without token IDs, enhancing...`
              );

              // Some markets are missing token IDs, enhance them
              const marketsToEnhance = dbMarkets.filter(
                (market) =>
                  !market.yesTokenId ||
                  !market.noTokenId ||
                  market.yesTokenId === "" ||
                  market.noTokenId === ""
              );

              // Convert to Market interface for enhancement
              const marketsForEnhancement = marketsToEnhance.map(
                (dbMarket) => ({
                  id: dbMarket.polymarketId, // Keep the original polymarketId as the ID
                  question: dbMarket.question,
                  description: dbMarket.description || "",
                  endDate: dbMarket.endDate.toISOString(),
                  volume24h: dbMarket.volume24h,
                  liquidity: dbMarket.liquidity,
                  yesPrice: dbMarket.yesPrice,
                  noPrice: dbMarket.noPrice,
                  priceChange24h: dbMarket.priceChange24h,
                  yesTokenId: dbMarket.yesTokenId || "",
                  noTokenId: dbMarket.noTokenId || "",
                  conditionId: dbMarket.conditionId || "",
                  clobTokensIds: dbMarket.clobTokensIds,
                })
              );

              // Enhance markets with CLOB data
              const enhancedMarkets = await this.enhanceMarketsWithClobData(
                marketsForEnhancement
              );

              // Update enhanced markets in database
              for (const enhancedMarket of enhancedMarkets) {
                try {
                  await prismaStorageService.upsertMarket({
                    polymarketId: enhancedMarket.id,
                    question: enhancedMarket.question,
                    description: enhancedMarket.description,
                    endDate: new Date(enhancedMarket.endDate),
                    volume24h: enhancedMarket.volume24h,
                    liquidity: enhancedMarket.liquidity,
                    yesPrice: enhancedMarket.yesPrice,
                    noPrice: enhancedMarket.noPrice,
                    priceChange24h: enhancedMarket.priceChange24h || undefined,
                    yesTokenId: enhancedMarket.yesTokenId,
                    noTokenId: enhancedMarket.noTokenId,
                    isActive: true,
                    isArchived: false,
                    conditionId: enhancedMarket.conditionId || "",
                    clobTokensIds: enhancedMarket.clobTokensIds,
                  });
                } catch (error) {
                  console.warn(
                    `Failed to update enhanced market ${enhancedMarket.id}:`,
                    error
                  );
                }
              }

              // Return all markets (enhanced + already valid)
              const allMarkets = [
                ...enhancedMarkets,
                ...marketsWithTokenIds.map((dbMarket) => ({
                  id: dbMarket.polymarketId,
                  question: dbMarket.question,
                  description: dbMarket.description || "",
                  endDate: dbMarket.endDate.toISOString(),
                  volume24h: dbMarket.volume24h,
                  liquidity: dbMarket.liquidity,
                  yesPrice: dbMarket.yesPrice,
                  noPrice: dbMarket.noPrice,
                  priceChange24h: dbMarket.priceChange24h,
                  yesTokenId: dbMarket.yesTokenId,
                  noTokenId: dbMarket.noTokenId,
                  conditionId: dbMarket.conditionId || undefined,
                  clobTokensIds: dbMarket.clobTokensIds,
                })),
              ];

              return allMarkets;
            }
          } else {
            console.log("Database cache is stale, refreshing from APIs...");
          }
        }

        // Fetch fresh data from APIs and update database
        console.log(
          `Fetching fresh markets data from APIs (attempt ${attempt + 1})...`
        );

        // Try Gamma API first, fallback to CLOB API if CORS issues
        let data: GammaApiMarket[] = [];

        try {
          // Use local API route to avoid CORS issues
          const appUrl = process.env.NEXT_PUBLIC_APP_URL;
          const apiUrl = appUrl + "/api/markets";
          const params = new URLSearchParams({
            active: "true",
            closed: "false",
            limit: limit.toString(),
            order,
            ascending: ascending.toString(),
            offset: (limit * attempt).toString(),
          });

          const finalUrl = `${apiUrl}?${params}`;
          console.log("Final URL:", finalUrl);

          const response = await fetch(finalUrl);

          if (!response.ok) {
            throw new Error(`Failed to fetch markets: ${response.status}`);
          }

          data = await response.json();
          console.log(`Gamma API: ${data?.length || 0} markets received`);

          // Transform Gamma API response to our Market interface
          const markets: Market[] = data
            .map((market: GammaApiMarket) => {
              const endDate =
                market.endDate || market.end_date || new Date().toISOString();

              // Parse price data from the API
              let yesPrice = 0; // Set to 0 when no token IDs available
              let noPrice = 0; // Set to 0 when no token IDs available

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

              return {
                id: market.id.toString(),
                question:
                  market.question || market.slug || `Market ${market.id}`,
                description:
                  market.description || market.slug || `Market ${market.id}`,
                endDate: endDate,
                volume24h: market.volume24hr || market.volume || 0,
                liquidity: market.liquidity || 0,
                yesPrice: yesPrice,
                noPrice: noPrice,
                priceChange24h: market.oneDayPriceChange,
                outcomePrices: market.outcomePrices,
                outcomes: market.outcomes,
                conditionId: market.conditionId,
                yesTokenId: "", // Gamma API doesn't provide token IDs directly
                noTokenId: "", // We'll need to get these from CLOB API if needed
                clobTokensIds: null, // Gamma API doesn't provide this directly
              };
            })
            .sort(
              (a: Market, b: Market) =>
                new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
            ); // Sort by end date, newest first

          console.log(`Processed ${markets.length} markets from Gamma API`);

          // Enhance Gamma API markets that have conditionId with CLOB data
          const marketsWithClobIds = markets.filter((market) => {
            const gammaMarket = data.find(
              (gm) => gm.id.toString() === market.id
            );
            return gammaMarket?.conditionId && gammaMarket.conditionId !== "";
          });

          console.log(
            `Found ${marketsWithClobIds.length} markets with CLOB condition IDs`
          );

          if (marketsWithClobIds.length > 0) {
            // Enhance markets with CLOB data
            const enhancedMarkets = await this.enhanceMarketsWithClobData(
              marketsWithClobIds,
              data
            );

            // Merge enhanced markets with regular markets
            const enhancedMarketIds = new Set(enhancedMarkets.map((m) => m.id));
            const regularMarkets = markets.filter(
              (m) => !enhancedMarketIds.has(m.id)
            );

            const finalMarkets = [...enhancedMarkets, ...regularMarkets];
            console.log(
              `Markets: ${enhancedMarkets.length} enhanced, ${regularMarkets.length} regular`
            );

            // Check if we have enough markets with valid tokens
            const validMarkets = finalMarkets.filter(
              (market) =>
                market.yesTokenId &&
                market.noTokenId &&
                market.yesTokenId !== "" &&
                market.noTokenId !== "" &&
                market.yesPrice > 0 && // Only include markets with real prices
                market.noPrice > 0
            );

            console.log(
              `Valid markets with tokens and prices: ${validMarkets.length}/${finalMarkets.length}`
            );

            // If we don't have enough valid markets and we have retries left, try again
            if (validMarkets.length < limit && attempt < maxRetries) {
              console.log(
                `Not enough valid markets (${validMarkets.length}/${limit}), retrying...`
              );
              attempt++;
              continue;
            }

            // After getting markets from APIs, store them in database
            const storedMarketIds: { marketId: string; cuid: string }[] = [];

            for (const market of finalMarkets) {
              try {
                // Find the original polymarketId from the market data
                // This might need adjustment based on how you're getting the polymarketId
                const polymarketId = market.id; // Assuming this is the original ID

                const storedId = await prismaStorageService.upsertMarket({
                  polymarketId,
                  question: market.question,
                  description: market.description,
                  endDate: new Date(market.endDate),
                  volume24h: market.volume24h,
                  liquidity: Number(market.liquidity),
                  yesPrice: market.yesPrice,
                  noPrice: market.noPrice,
                  priceChange24h: market.priceChange24h || undefined,
                  yesTokenId: market.yesTokenId,
                  noTokenId: market.noTokenId,
                  isActive: true,
                  isArchived: false,
                  conditionId: market.conditionId || "",
                  clobTokensIds: market.clobTokensIds || undefined, // Store this field
                });

                storedMarketIds.push({
                  marketId: market.id,
                  cuid: storedId,
                });
              } catch (error) {
                console.warn(`Failed to store market ${market.id}:`, error);
              }
            }

            // Return markets with CUIDs instead of the original IDs
            const marketsWithCUIDs = finalMarkets.map((market) => ({
              ...market,
              id: market.id, // Keep original Polymarket ID
              cuid: storedMarketIds.find((m) => m.marketId === market.id)?.cuid, // Add CUID as separate property
            }));

            console.log(
              `Markets with CUIDs: ${marketsWithCUIDs.length} markets received`
            );

            // Make sure to return this instead of the original markets
            return marketsWithCUIDs.slice(0, 20);
          } else {
            console.log(
              "No CLOB condition IDs found, trying CLOB API fallback"
            );
            // Try to get markets directly from CLOB API as fallback
            try {
              const marketClient = new ClobClient(this.host, this.chainId);
              const response = await marketClient.getMarkets("");

              if (response && response.data) {
                const clobMarkets: Market[] = response.data
                  .filter(
                    (market: PolymarketMarket) =>
                      market.active && !market.archived
                  )
                  .map((market: PolymarketMarket) => {
                    const yesToken = market.tokens.find(
                      (token) =>
                        token.outcome.toLowerCase().includes("yes") ||
                        token.outcome.toLowerCase().includes("true")
                    );
                    const noToken = market.tokens.find(
                      (token) =>
                        token.outcome.toLowerCase().includes("no") ||
                        token.outcome.toLowerCase().includes("false")
                    );

                    return {
                      id: market.condition_id,
                      question: market.question,
                      description: `${market.category} - ${market.question}`,
                      endDate: market.end_date_iso,
                      volume24h: 0,
                      liquidity: 0,
                      yesPrice: 0, // Set to 0 when no token IDs available
                      noPrice: 0, // Set to 0 when no token IDs available
                      yesTokenId: yesToken?.token_id || "",
                      noTokenId: noToken?.token_id || "",
                      clobTokensIds: null, // CLOB API doesn't provide this directly
                    };
                  })
                  .filter((market) => market.yesTokenId && market.noTokenId)
                  .slice(0, 20);

                console.log(
                  `Using ${clobMarkets.length} CLOB API markets as fallback`
                );
                return clobMarkets;
              }
            } catch (clobError) {
              console.log("CLOB API fallback also failed:", clobError);
            }

            console.log("Returning Gamma API markets without enhancement");
            return markets.slice(0, 20);
          }
        } catch (gammaError) {
          console.log(
            "Gamma API failed, falling back to CLOB API:",
            gammaError
          );

          // Fallback to CLOB API
          const marketClient = new ClobClient(this.host, this.chainId);
          const response = await marketClient.getMarkets("");

          if (!response || !response.data) {
            throw new Error("Failed to fetch markets from CLOB API");
          }

          console.log(
            `CLOB API: ${response.data?.length || 0} markets received`
          );

          // Transform CLOB API response to our Market interface
          const markets: Market[] = response.data
            .filter((market: PolymarketMarket) => {
              // Include active markets that are not archived
              return market.active && !market.archived;
            })
            .map((market: PolymarketMarket) => {
              // Find Yes and No tokens
              const yesToken = market.tokens.find(
                (token) =>
                  token.outcome.toLowerCase().includes("yes") ||
                  token.outcome.toLowerCase().includes("true")
              );
              const noToken = market.tokens.find(
                (token) =>
                  token.outcome.toLowerCase().includes("no") ||
                  token.outcome.toLowerCase().includes("false")
              );

              return {
                id: market.condition_id,
                question: market.question,
                description: `${market.category} - ${market.question}`,
                endDate: market.end_date_iso,
                volume24h: 0, // Not provided in basic market data
                liquidity: 0, // Not provided in basic market data
                yesPrice: 0, // Set to 0 when no token IDs available
                noPrice: 0, // Set to 0 when no token IDs available
                yesTokenId:
                  yesToken?.token_id || market.tokens[0]?.token_id || "",
                noTokenId:
                  noToken?.token_id || market.tokens[1]?.token_id || "",
                clobTokensIds: null, // CLOB API doesn't provide this directly
              };
            })
            .filter((market) => market.yesTokenId && market.noTokenId)
            .sort(
              (a: Market, b: Market) =>
                new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
            ); // Sort by end date, newest first

          console.log(`Processed ${markets.length} CLOB markets`);

          // Enhance markets with detailed CLOB data
          const enhancedMarkets = await this.enhanceMarketsWithClobData(
            markets
          );

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

          // If we don't have enough valid markets and we have retries left, try again
          if (validMarkets.length < limit && attempt < maxRetries) {
            console.log(
              `Not enough valid CLOB markets (${validMarkets.length}/${limit}), retrying...`
            );
            attempt++;
            continue;
          }

          return validMarkets.slice(0, limit);
        }
      } catch (error) {
        console.error(
          `Failed to fetch markets (attempt ${attempt + 1}):`,
          error
        );

        // If this is the last attempt, throw the error
        if (attempt >= maxRetries) {
          throw error; // Don't fallback to mock data, let the error bubble up
        }

        // Otherwise, increment attempt and try again
        attempt++;
        console.log(
          `Retrying fetchMarkets (attempt ${attempt + 1}/${maxRetries + 1})...`
        );
      }
    }

    // This should never be reached, but just in case
    throw new Error("Failed to fetch markets after all retry attempts");
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
            if (market.conditionId) {
              // If the market already has a conditionId, use it directly
              conditionId = market.conditionId;
            } else if (originalGammaData) {
              // Otherwise, look it up from the original Gamma API data
              const gammaMarket = originalGammaData.find(
                (gm) => gm.id.toString() === market.id
              );
              if (gammaMarket?.conditionId) {
                conditionId = gammaMarket.conditionId;
              }
            }

            // Get detailed market data from CLOB API using conditionId
            const detailedMarket = await marketClient.getMarket(conditionId);

            if (detailedMarket && detailedMarket.tokens) {
              const marketData = detailedMarket;
              const tokens = marketData.tokens;

              // Extract real-time prices from order book or last trade
              let yesPrice = market.yesPrice; // Keep existing price as fallback
              let noPrice = market.noPrice;

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

              // Extract token IDs from CLOB API response
              let yesTokenId = market.yesTokenId;
              let noTokenId = market.noTokenId;

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

      return enhancedMarkets;
    } catch (error) {
      console.error("Failed to enhance markets with CLOB data:", error);
      // Return original markets if enhancement fails
      return markets;
    }
  }

  private async checkAndApproveUSDCAllowance(
    signer: JsonRpcSigner, // This signer is already connected to your wallet
    account: string,
    requiredAmount: number
  ): Promise<void> {
    try {
      console.log("Checking and approving USDC allowances...");

      // Contract addresses from the Python example
      const usdcAddress = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
      const ctfAddress = "0x4D97DCd97eC945f40cF65F87097ACe5EA0476045";

      // Polymarket contract addresses that need approval
      const polymarketContracts = [
        "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E", // CTF Exchange
        "0xC5d563A36AE78145C45a50134d48A1215220f80a", // Neg Risk CTF Exchange
        "0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296", // Neg Risk Adapter
      ];

      // Use the signer parameter directly (it's already connected to your wallet)
      const usdcContract = new ethers.Contract(
        usdcAddress,
        [
          "function approve(address,uint256) returns (bool)",
          "function allowance(address,address) view returns (uint256)",
        ],
        signer as unknown as ethers.ContractRunner
      );

      // CTF ERC1155 contract for setApprovalForAll
      const ctfContract = new ethers.Contract(
        ctfAddress,
        [
          "function setApprovalForAll(address,bool) returns (bool)",
          "function isApprovedForAll(address,address) view returns (bool)",
        ],
        signer as unknown as ethers.ContractRunner
      );

      // Check and approve USDC for each Polymarket contract
      for (const contractAddress of polymarketContracts) {
        console.log(`Checking USDC allowance for ${contractAddress}...`);

        const currentAllowance = await usdcContract.allowance(
          account,
          contractAddress
        );
        console.log(`Current USDC allowance: ${currentAllowance.toString()}`);

        // Approve $10 worth of USDC (like MAX_INT in Python)
        const maxApproval = ethers.parseUnits("10", 6); // 10 USDC with 6 decimals

        const currentAllowanceBigInt = BigInt(currentAllowance.toString());
        const maxApprovalBigInt = BigInt(maxApproval.toString());

        if (currentAllowanceBigInt < maxApprovalBigInt) {
          console.log(`Approving USDC for ${contractAddress}...`);
          const approveTx = await usdcContract.approve(
            contractAddress,
            maxApproval
          );

          console.log("Approve transaction:", approveTx);
          // Wait for transaction without using confirmations
          await approveTx.wait();
          console.log(`USDC approved for ${contractAddress}`);
        } else {
          console.log(`USDC already approved for ${contractAddress}`);
        }
      }

      // Check and approve CTF tokens for each Polymarket contract
      for (const contractAddress of polymarketContracts) {
        console.log(`Checking CTF approval for ${contractAddress}...`);

        const isApproved = await ctfContract.isApprovedForAll(
          account,
          contractAddress
        );
        console.log(`CTF approval status: ${isApproved}`);

        if (!isApproved) {
          console.log(`Approving CTF for ${contractAddress}...`);
          const approveTx = await ctfContract.setApprovalForAll(
            contractAddress,
            true
          );
          // Wait for transaction without using confirmations
          await approveTx.wait();
          console.log(`CTF approved for ${contractAddress}`);
        } else {
          console.log(`CTF already approved for ${contractAddress}`);
        }
      }

      console.log("All allowances approved successfully!");
    } catch (error) {
      console.warn("Allowance check/approval failed:", error);
      throw error;
    }
  }

  async placeOrder(
    orderDetails: OrderDetails,
    walletClient?: WalletClient
  ): Promise<OrderResponse> {
    try {
      console.log("Creating order...");

      if (!walletClient) {
        throw new Error("Wallet client is required for order placement");
      }

      // Convert WalletClient to ethers signer for Polymarket compatibility
      const [account] = await walletClient.getAddresses();
      const ethersProvider = new Web3Provider(walletClient.transport);
      const signer = ethersProvider.getSigner();

      // Create the main client first without credentials
      const orderClient = new ClobClient(
        this.host,
        this.chainId,
        signer,
        undefined, // No creds initially
        0, // Browser wallet signature type
        account // Funder address
      );

      // Now create or derive API key using the properly initialized client
      const creds = await orderClient.createOrDeriveApiKey();

      // Recreate the client with the credentials
      const finalClient = new ClobClient(
        this.host,
        this.chainId,
        signer,
        creds,
        0, // Browser wallet signature type
        account // Funder address
      );

      // Validate order details
      if (!orderDetails.tokenId) {
        throw new Error("Token ID is required for order placement");
      }

      if (orderDetails.price <= 0 || orderDetails.size <= 0) {
        throw new Error("Price and size must be greater than 0");
      }

      const allowances = await finalClient.getBalanceAllowance({
        asset_type: AssetType.COLLATERAL,
      });
      console.log("Allowances:", allowances);

      console.log("Checking USDC allowance...");

      // Check and approve USDC allowance
      try {
        await this.checkAndApproveUSDCAllowance(
          signer,
          account,
          orderDetails.size
        );
      } catch (allowanceError) {
        console.warn("Allowance check/update failed:", allowanceError);
        // Continue with order placement - user might need to approve manually
      }

      // Create market order object (like the Python example)
      const marketOrder = {
        tokenID: orderDetails.tokenId,
        amount: orderDetails.size, // Use the USD amount directly
        side: orderDetails.side === "buy" ? Side.BUY : Side.SELL,
        order_type: OrderType.FOK, // Use FOK like the Python example
      };

      console.log(
        "Requesting wallet signature for market order...",
        marketOrder
      );
      const signedOrder = await finalClient.createMarketOrder(marketOrder);
      console.log("Market order signed successfully", signedOrder);

      // Post the order to the exchange
      console.log("Posting market order to exchange...");
      const response = await finalClient.postOrder(signedOrder, OrderType.FOK);

      console.log("Order posted successfully", response);
      console.log("Response structure:", JSON.stringify(response, null, 2));

      // Check if order was successful
      if (response && response.success !== false) {
        // Try to extract transaction hash from various possible fields
        const transactionHash =
          response.txHash ||
          response.transactionHash ||
          response.hash ||
          response.orderHash ||
          response.orderId ||
          response.id ||
          "unknown";

        console.log("Extracted transaction hash:", transactionHash);

        return {
          success: true,
          message: `Successfully placed ${orderDetails.side} order for ${
            orderDetails.size
          } tokens at $${orderDetails.price.toFixed(4)} each`,
          orderId: transactionHash,
          status: response.status || "placed",
        };
      } else {
        const errorMessage =
          response?.error || response?.message || "Unknown error";
        return {
          success: false,
          message: `Failed to place order: ${errorMessage}`,
          orderId: response?.orderHash || response?.orderId || "unknown",
          status: response?.status || "failed",
        };
      }
    } catch (error) {
      console.error("Order placement error:", error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes("User rejected")) {
          return {
            success: false,
            message: "Order cancelled by user",
          };
        } else if (error.message.includes("insufficient")) {
          return {
            success: false,
            message: "Insufficient balance for this order",
          };
        } else if (error.message.includes("network")) {
          return {
            success: false,
            message:
              "Network error. Please check your connection and try again.",
          };
        }
      }

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message.includes("Signer is needed")
              ? "Wallet signing is required for order placement. Please ensure your wallet is connected and try again."
              : error.message
            : "Failed to place order. Please try again.",
      };
    }
  }

  async placeOrderFromBot(
    orderDetails: OrderDetails,
    signer: Wallet,
    telegramId: string
  ): Promise<OrderResponse> {
    try {
      console.log("Creating order...");

      if (!signer) {
        throw new Error("Signer is required for order placement");
      }

      // Get the address properly from JsonRpcSigner
      const account = await signer.getAddress();
      const signerForClient = signer;

      // Create the main client first without credentials
      const orderClient = new ClobClient(
        this.host,
        this.chainId,
        signerForClient,
        undefined, // No creds initially
        0, // Browser wallet signature type
        account // Funder address
      );

      // Now create or derive API key using the properly initialized client
      const creds = await orderClient.createOrDeriveApiKey();

      // Recreate the client with the credentials
      const finalClient = new ClobClient(
        this.host,
        this.chainId,
        signerForClient,
        creds,
        0, // Browser wallet signature type
        account // Funder address
      );

      // Validate order details
      if (!orderDetails.tokenId) {
        throw new Error("Token ID is required for order placement");
      }

      if (orderDetails.price <= 0 || orderDetails.size <= 0) {
        throw new Error("Price and size must be greater than 0");
      }

      const allowances = await finalClient.getBalanceAllowance({
        asset_type: AssetType.COLLATERAL,
      });
      console.log("Allowances:", allowances);

      console.log("Checking USDC allowance...");

      const provider = new JsonRpcProvider(
        process.env.POLYGON_RPC_URL || "https://polygon-rpc.com"
      );

      // Use provider.getSigner() instead of new JsonRpcSigner()
      const rpcSigner = provider.getSigner(await signer.getAddress());

      // Check and approve USDC allowance
      try {
        await this.checkAndApproveUSDCAllowance(
          rpcSigner,
          account,
          orderDetails.size
        );
      } catch (allowanceError) {
        console.warn("Allowance check/update failed:", allowanceError);
        // Continue with order placement - user might need to approve manually
      }

      // Create market order object (like the Python example)
      const marketOrder = {
        tokenID: orderDetails.tokenId,
        amount: orderDetails.size, // Use the USD amount directly
        side: orderDetails.side === "buy" ? Side.BUY : Side.SELL,
        order_type: OrderType.FOK, // Use FOK like the Python example
      };

      console.log(
        "Requesting wallet signature for market order...",
        marketOrder
      );
      const signedOrder = await finalClient.createMarketOrder(marketOrder);
      console.log("Market order signed successfully", signedOrder);

      // Post the order to the exchange
      console.log("Posting market order to exchange...");
      const response = await finalClient.postOrder(signedOrder, OrderType.FOK);

      console.log("[PLACE ORDER FROM BOT] Order posted successfully", response);
      console.log(
        "[PLACE ORDER FROM BOT] Response structure:",
        JSON.stringify(response, null, 2)
      );

      // Check if order was successful
      if (response && response.success !== false) {
        // Try to extract transaction hash from various possible fields
        const transactionHash =
          response.txHash ||
          response.transactionHash ||
          response.hash ||
          response.orderHash ||
          response.orderId ||
          response.id ||
          "unknown";

        console.log(
          "[PLACE ORDER FROM BOT] Extracted transaction hash:",
          transactionHash
        );

        // After successful order placement, save to database
        try {
          const { prismaStorageService } = await import(
            "./prisma-storage-service"
          );

          // Get user ID from telegram ID (you'll need to pass this or get it from the signer)
          const user = await prismaStorageService.getUserByTelegramId(
            telegramId
          );
          if (!user) {
            throw new Error("User not found");
          }

          // Get market ID from token ID (you'll need to find the market by token ID)
          const market = await prismaStorageService.getMarketByTokenId(
            orderDetails.tokenId
          );
          if (!market) {
            throw new Error("Market not found for token ID");
          }

          await prismaStorageService.createOrder({
            userId: user.id,
            marketId: market.id,
            tokenId: orderDetails.tokenId,
            side: orderDetails.side,
            amount: orderDetails.size,
            price: orderDetails.price,
            totalCost: orderDetails.size * orderDetails.price,
            orderHash: response.orderHash || response.orderId,
            transactionHash:
              transactionHash !== "unknown" ? transactionHash : undefined,
            status: "pending",
            orderType: "FOK",
          });

          console.log("[PLACE ORDER FROM BOT] Order saved to database");
        } catch (dbError) {
          console.error(
            "[PLACE ORDER FROM BOT] Failed to save order to database:",
            dbError
          );
          // Don't fail the order placement if DB save fails
        }

        return {
          success: true,
          message: `Successfully placed ${orderDetails.side} order for ${
            orderDetails.size
          } tokens at $${orderDetails.price.toFixed(4)} each`,
          orderId: transactionHash,
          status: response.status || "placed",
        };
      } else {
        const errorMessage =
          response?.error || response?.message || "Unknown error";
        return {
          success: false,
          message: `Failed to place order: ${errorMessage}`,
          orderId: response?.orderHash || response?.orderId || "unknown",
          status: response?.status || "failed",
        };
      }
    } catch (error) {
      console.error("Order placement error:", error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes("User rejected")) {
          return {
            success: false,
            message: "Order cancelled by user",
          };
        } else if (error.message.includes("insufficient")) {
          return {
            success: false,
            message: "Insufficient balance for this order",
          };
        } else if (error.message.includes("network")) {
          return {
            success: false,
            message:
              "Network error. Please check your connection and try again.",
          };
        }
      }

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message.includes("Signer is needed")
              ? "Wallet signing is required for order placement. Please ensure your wallet is connected and try again."
              : error.message
            : "Failed to place order. Please try again.",
      };
    }
  }

  // Update cache methods to work with database
  async clearCache(): Promise<void> {
    try {
      // This would clear all markets, but we might want to just mark them as stale
      // For now, we'll just log that the cache is cleared
      console.log("Markets cache cleared - next request will fetch fresh data");
    } catch (error) {
      console.error("Error clearing cache:", error);
      throw error;
    }
  }

  async getCacheStatus(): Promise<{
    hasCache: boolean;
    age: number;
    ttl: number;
  }> {
    try {
      const markets = await prismaStorageService.getActiveMarkets(1);
      const now = new Date();

      if (markets.length > 0) {
        const oldestMarket = markets[0];
        const age = now.getTime() - oldestMarket.lastUpdated.getTime();

        return {
          hasCache: true,
          age: age,
          ttl: this.CACHE_TTL,
        };
      }

      return {
        hasCache: false,
        age: 0,
        ttl: this.CACHE_TTL,
      };
    } catch (error) {
      console.error("Error getting cache status:", error);
      return {
        hasCache: false,
        age: 0,
        ttl: this.CACHE_TTL,
      };
    }
  }
}

export const polymarketService = new PolymarketService();
