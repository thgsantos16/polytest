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
    try {
      // Use API route instead of direct Prisma calls
      const response = await fetch(`/api/markets?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch markets: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch markets:", error);
      throw error;
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
