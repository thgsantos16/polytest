import { PolymarketService } from "../../src/services/polymarket-service";
import { ClobClient, Chain } from "@polymarket/clob-client";
import { WalletClient } from "viem";

// Mock wallet client for testing
const mockWalletClient = {
  account: { address: "0x1234567890123456789012345678901234567890" },
  chain: { id: 137 },
  request: async () =>
    Promise.resolve("0x1234567890123456789012345678901234567890"),
} as unknown as WalletClient;

async function testPolymarketService() {
  console.log("🧪 Starting Polymarket Service Tests...\n");

  try {
    // Initialize service
    const service = new PolymarketService();
    await service.initializeClient(mockWalletClient);
    console.log("✅ Service initialized successfully");

    // Test 1: Direct CLOB API call
    console.log("\n📡 Test 1: Direct CLOB API Call");
    await testDirectClobApi();

    // Test 2: Service methods
    console.log("\n🔧 Test 2: Service Methods");
    await testServiceMethods(service);

    // Test 3: Market enhancement
    console.log("\n🚀 Test 3: Market Enhancement");
    await testMarketEnhancement(service);
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

async function testDirectClobApi() {
  try {
    const client = new ClobClient("https://clob.polymarket.com", Chain.POLYGON);

    // Test with a known market condition ID
    const testConditionId =
      "0xfdb4876008fc53d5d726dc331920d709f20afdd84eec4567f3b47cef7b1dffe4";

    console.log(`Testing CLOB API with condition ID: ${testConditionId}`);
    const market = await client.getMarket(testConditionId);

    console.log("Raw CLOB API Response:");
    console.log(JSON.stringify(market, null, 2));

    if (market.data?.tokens) {
      console.log("\nToken Analysis:");
      market.data.tokens.forEach((token: ClobToken, index: number) => {
        console.log(`Token ${index + 1}:`, {
          token_id: token.token_id || "MISSING",
          outcome: token.outcome || "MISSING",
          price: token.price,
          winner: token.winner,
        });
      });
    } else {
      console.log("❌ No tokens found in response");
    }
  } catch (error) {
    console.error("❌ Direct CLOB API test failed:", error);
  }
}

async function testServiceMethods(service: PolymarketService) {
  try {
    // Test fetching markets from API
    console.log("Testing market fetching...");
    const markets = await service.fetchMarkets(3);
    console.log(`✅ Fetched ${markets.length} markets`);

    if (markets.length > 0) {
      console.log("Sample market structure:");
      console.log(JSON.stringify(markets[0], null, 2));
    }
  } catch (error) {
    console.error("❌ Service methods test failed:", error);
  }
}

async function testMarketEnhancement(service: PolymarketService) {
  try {
    // Create mock markets for testing
    const mockMarkets = [
      {
        id: "0xfdb4876008fc53d5d726dc331920d709f20afdd84eec4567f3b47cef7b1dffe4",
        question: "Test Market 1",
        description: "Test Description",
        endDate: new Date().toISOString(),
        volume24h: 1000,
        liquidity: 500,
        yesPrice: 0.5,
        noPrice: 0.5,
        yesTokenId: "",
        noTokenId: "",
        conditionId:
          "0xfdb4876008fc53d5d726dc331920d709f20afdd84eec4567f3b47cef7b1dffe4",
      },
    ];

    console.log("Testing market enhancement with mock data...");
    const enhancedMarkets = await service.enhanceMarketsWithClobData(
      mockMarkets
    );

    console.log(`✅ Enhanced ${enhancedMarkets.length} markets`);

    if (enhancedMarkets.length > 0) {
      console.log("Enhanced market result:");
      console.log(JSON.stringify(enhancedMarkets[0], null, 2));
    }
  } catch (error) {
    console.error("❌ Market enhancement test failed:", error);
  }
}

interface ClobToken {
  token_id?: string;
  outcome?: string;
  price?: number;
  winner?: boolean;
}

// Run tests
testPolymarketService().catch(console.error);
