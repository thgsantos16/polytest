import { ClobClient, Chain } from "@polymarket/clob-client";

interface ClobToken {
  token_id: string;
  outcome: string;
  price: string;
  winner: boolean;
}

async function debugTokenIssue() {
  console.log("�� Debugging Token ID Issue...\n");

  const client = new ClobClient("https://clob.polymarket.com", Chain.POLYGON);

  // Test multiple market types to see if it's a general issue
  const testConditionIds = [
    "0xfdb4876008fc53d5d726dc331920d709f20afdd84eec4567f3b47cef7b1dffe4", // Your weather market
    "0x6abae5e38c539acddcd9c58ea71d49d54f05df9d86861a548a12bb04c05c9c06", // From your data
  ];

  for (const conditionId of testConditionIds) {
    try {
      console.log(`\n📊 Testing condition ID: ${conditionId}`);

      const market = await client.getMarket(conditionId);

      if (market.data) {
        console.log("Market found:", {
          question: market.data.question,
          condition_id: market.data.condition_id,
          tokens_count: market.data.tokens?.length || 0,
        });

        if (market.data.tokens) {
          console.log("Token details:");
          market.data.tokens.forEach((token: ClobToken, index: number) => {
            console.log(`  Token ${index + 1}:`, {
              token_id: token.token_id || "EMPTY",
              outcome: token.outcome || "EMPTY",
              price: token.price,
              winner: token.winner,
            });
          });
        }
      } else {
        console.log("❌ No market data returned");
      }
    } catch (error) {
      console.error(`❌ Error testing ${conditionId}:`, error);
    }
  }
}

debugTokenIssue().catch(console.error);
