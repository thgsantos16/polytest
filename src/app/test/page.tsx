"use client";

import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import {
  PolymarketClientService,
  Market,
} from "@/services/polymarket-client-service";
import { ClobClient, Chain } from "@polymarket/clob-client";

interface TestResult {
  test: string;
  status: "success" | "error" | "warning";
  message: string;
  data?: unknown;
}

interface ClobToken {
  token_id?: string;
  outcome?: string;
  price?: number;
  winner?: boolean;
}

export default function TestPage() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [polymarketService] = useState(() => new PolymarketClientService());
  const [clobClient] = useState(
    () => new ClobClient("https://clob.polymarket.com", Chain.POLYGON)
  );

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);

  // Telegram bot testing state
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramMessage, setTelegramMessage] = useState("");
  const [selectedTelegramMarket, setSelectedTelegramMarket] =
    useState<Market | null>(null);

  const addTestResult = (
    test: string,
    status: TestResult["status"],
    message: string,
    data?: unknown
  ) => {
    setTestResults((prev) => [...prev, { test, status, message, data }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    clearResults();

    try {
      // Test 1: Service Initialization
      addTestResult(
        "Service Init",
        "success",
        "Starting service initialization..."
      );
      await polymarketService.initializeClient(walletClient!);
      addTestResult(
        "Service Init",
        "success",
        "✅ Service initialized successfully"
      );

      // Test 2: Fetch Markets
      addTestResult("Fetch Markets", "success", "Fetching markets...");
      const fetchedMarkets = await polymarketService.fetchMarkets(5);
      setMarkets(fetchedMarkets);
      addTestResult(
        "Fetch Markets",
        "success",
        `✅ Fetched ${fetchedMarkets.length} markets`,
        fetchedMarkets
      );

      // Test 3: Market Enhancement
      if (fetchedMarkets.length > 0) {
        addTestResult(
          "Market Enhancement",
          "success",
          "Testing market enhancement..."
        );
        const enhancedMarkets =
          await polymarketService.enhanceMarketsWithClobData(
            fetchedMarkets.slice(0, 2)
          );
        addTestResult(
          "Market Enhancement",
          "success",
          `✅ Enhanced ${enhancedMarkets.length} markets`,
          enhancedMarkets
        );

        if (enhancedMarkets.length > 0) {
          setSelectedMarket(enhancedMarkets[0]);
          setSelectedTelegramMarket(enhancedMarkets[0]);
        }
      }

      // Test 4: Direct CLOB API Test
      addTestResult(
        "CLOB API Direct",
        "success",
        "Testing direct CLOB API calls..."
      );
      const testConditionId =
        "0xfdb4876008fc53d5d726dc331920d709f20afdd84eec4567f3b47cef7b1dffe4";
      const clobMarket = await clobClient.getMarket(testConditionId);
      addTestResult(
        "CLOB API Direct",
        "success",
        "✅ CLOB API call successful",
        clobMarket
      );

      // Test 5: Token ID Analysis
      if (clobMarket.data?.tokens) {
        addTestResult("Token Analysis", "success", "Analyzing token data...");
        const tokenAnalysis = clobMarket.data.tokens.map(
          (token: ClobToken, index: number) => ({
            index: index + 1,
            token_id: token.token_id || "EMPTY",
            outcome: token.outcome || "EMPTY",
            price: token.price,
            winner: token.winner,
          })
        );
        addTestResult(
          "Token Analysis",
          "warning",
          "Token data analysis complete",
          tokenAnalysis
        );
      }
    } catch (error) {
      addTestResult(
        "Test Suite",
        "error",
        `❌ Test failed: ${(error as Error).message}`
      );
    } finally {
      setIsRunning(false);
    }
  };

  const testOrderPlacement = async () => {
    if (!selectedMarket || !walletClient) {
      addTestResult(
        "Order Placement",
        "error",
        "❌ No market selected or wallet not connected"
      );
      return;
    }

    setIsRunning(true);
    addTestResult("Order Placement", "success", "Testing order placement...");

    try {
      const orderDetails = {
        marketId: selectedMarket.id,
        tokenId: selectedMarket.yesTokenId,
        side: "buy" as const,
        price: selectedMarket.yesPrice,
        size: 1, // Small test amount
        walletAddress: address!,
      };

      addTestResult(
        "Order Placement",
        "success",
        "Order details prepared",
        orderDetails
      );

      const result = await polymarketService.placeOrder();
      addTestResult(
        "Order Placement",
        result.success ? "success" : "error",
        result.success ? "✅ Order placed successfully" : "❌ Order failed",
        result
      );
    } catch (error) {
      addTestResult(
        "Order Placement",
        "error",
        `❌ Order placement failed: ${(error as Error).message}`
      );
    } finally {
      setIsRunning(false);
    }
  };

  const testSpecificMarket = async (marketId: string) => {
    setIsRunning(true);
    addTestResult("Specific Market", "success", `Testing market: ${marketId}`);

    try {
      const market = await clobClient.getMarket(marketId);
      addTestResult(
        "Specific Market",
        "success",
        "✅ Market data retrieved",
        market
      );
    } catch (error) {
      addTestResult(
        "Specific Market",
        "error",
        `❌ Failed to fetch market: ${(error as Error).message}`
      );
    } finally {
      setIsRunning(false);
    }
  };

  // Telegram bot testing functions
  const sendTelegramMessage = async () => {
    if (!telegramChatId || !telegramMessage) {
      addTestResult(
        "Telegram Message",
        "error",
        "❌ Chat ID and message are required"
      );
      return;
    }

    setIsRunning(true);
    addTestResult(
      "Telegram Message",
      "success",
      "Sending message to Telegram bot..."
    );

    try {
      const response = await fetch("/api/telegram/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: telegramChatId,
          message: telegramMessage,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        addTestResult(
          "Telegram Message",
          "success",
          "✅ Message sent successfully to Telegram bot",
          result
        );
      } else {
        addTestResult(
          "Telegram Message",
          "error",
          `❌ Failed to send message: ${result.error}`,
          result
        );
      }
    } catch (error) {
      addTestResult(
        "Telegram Message",
        "error",
        `❌ Telegram message failed: ${(error as Error).message}`
      );
    } finally {
      setIsRunning(false);
    }
  };

  const testTelegramTradeButton = async (side: "buy" | "sell") => {
    if (!telegramChatId || !selectedTelegramMarket) {
      addTestResult(
        "Telegram Trade Button",
        "error",
        "❌ Chat ID and market selection are required"
      );
      return;
    }

    setIsRunning(true);
    addTestResult(
      "Telegram Trade Button",
      "success",
      `Testing ${side} button for market: ${selectedTelegramMarket.question}`
    );

    try {
      const response = await fetch("/api/telegram/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: telegramChatId,
          marketCuid: selectedTelegramMarket.cuid,
          side: side,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        addTestResult(
          "Telegram Trade Button",
          "success",
          `✅ ${side.toUpperCase()} button test sent successfully`,
          result
        );
      } else {
        addTestResult(
          "Telegram Trade Button",
          "error",
          `❌ Failed to send ${side} button test: ${result.error}`,
          result
        );
      }
    } catch (error) {
      addTestResult(
        "Telegram Trade Button",
        "error",
        `❌ Telegram ${side} button test failed: ${(error as Error).message}`
      );
    } finally {
      setIsRunning(false);
    }
  };

  // Add this function to load markets independently
  const loadMarkets = async () => {
    try {
      addTestResult(
        "Load Markets",
        "success",
        "Loading markets for Telegram testing..."
      );
      const fetchedMarkets = await polymarketService.fetchMarkets(10);
      setMarkets(fetchedMarkets);
      if (fetchedMarkets.length > 0) {
        setSelectedTelegramMarket(fetchedMarkets[0]);
      }
      addTestResult(
        "Load Markets",
        "success",
        `✅ Loaded ${fetchedMarkets.length} markets for testing`,
        fetchedMarkets
      );
    } catch (error) {
      addTestResult(
        "Load Markets",
        "error",
        `❌ Failed to load markets: ${(error as Error).message}`
      );
    }
  };

  // Load markets when component mounts
  useEffect(() => {
    loadMarkets();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 Polymarket Service Tester
        </h1>

        {/* Connection Status */}
        <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Connection Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className={`p-4 rounded-lg ${
                isConnected
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="font-medium text-gray-900">Wallet</div>
              <div className="text-sm text-gray-800">
                {isConnected ? `✅ Connected: ${address}` : "❌ Not connected"}
              </div>
            </div>
            <div
              className={`p-4 rounded-lg ${
                walletClient
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="font-medium text-gray-900">Wallet Client</div>
              <div className="text-sm text-gray-800">
                {walletClient ? "✅ Available" : "❌ Not available"}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="font-medium text-gray-900">Service</div>
              <div className="text-sm text-gray-800">
                ✅ PolymarketClientService Ready
              </div>
            </div>
          </div>
        </div>

        {/* Telegram Bot Testing */}
        <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            🤖 Telegram Bot Testing
          </h2>

          {/* Add a button to reload markets */}
          <div className="mb-4">
            <button
              onClick={loadMarkets}
              disabled={isRunning}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {isRunning ? "Loading..." : "Load Markets"}
            </button>
            <span className="ml-2 text-sm text-gray-600">
              {markets.length > 0
                ? `${markets.length} markets loaded`
                : "No markets loaded"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Message Testing */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Send Test Message
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telegram Chat ID
                </label>
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="Enter your Telegram chat ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Message
                </label>
                <textarea
                  value={telegramMessage}
                  onChange={(e) => setTelegramMessage(e.target.value)}
                  placeholder="Enter test message"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={sendTelegramMessage}
                disabled={isRunning || !telegramChatId || !telegramMessage}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Send Message
              </button>
            </div>

            {/* Trade Button Testing */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Test Trade Buttons
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Market for Testing
                </label>
                <select
                  value={selectedTelegramMarket?.id || ""}
                  onChange={(e) => {
                    const market = markets.find((m) => m.id === e.target.value);
                    setSelectedTelegramMarket(market || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={markets.length === 0}
                >
                  <option value="">
                    {markets.length === 0
                      ? "Loading markets..."
                      : "Select a market..."}
                  </option>
                  {markets.map((market) => (
                    <option key={market.id} value={market.id}>
                      {market.question.substring(0, 50)}...
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => testTelegramTradeButton("buy")}
                  disabled={
                    isRunning || !telegramChatId || !selectedTelegramMarket
                  }
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Test Buy Button
                </button>
                <button
                  onClick={() => testTelegramTradeButton("sell")}
                  disabled={
                    isRunning || !telegramChatId || !selectedTelegramMarket
                  }
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Test Sell Button
                </button>
              </div>
              {selectedTelegramMarket && (
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium">Selected Market:</div>
                  <div>{selectedTelegramMarket.question}</div>
                  <div className="mt-1">
                    CUID: {selectedTelegramMarket.cuid}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Test Controls
          </h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={runAllTests}
              disabled={isRunning || !isConnected}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {isRunning ? "Running Tests..." : "Run All Tests"}
            </button>

            <button
              onClick={testOrderPlacement}
              disabled={isRunning || !selectedMarket || !isConnected}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Test Order Placement
            </button>

            <button
              onClick={clearResults}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Clear Results
            </button>
          </div>
        </div>

        {/* Market Selection */}
        {markets.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Market Selection
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {markets.slice(0, 4).map((market, index) => (
                <div
                  key={market.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedMarket?.id === market.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedMarket(market)}
                >
                  <div className="font-medium text-sm mb-2 text-gray-900">
                    {market.question.substring(0, 60)}...
                  </div>
                  <div className="text-xs text-gray-700 space-y-1">
                    <div>Yes: {Math.round(market.yesPrice * 100)}¢</div>
                    <div>No: {Math.round(market.noPrice * 100)}¢</div>
                    <div>Yes Token: {market.yesTokenId ? "✅" : "❌"}</div>
                    <div>No Token: {market.noTokenId ? "✅" : "❌"}</div>
                    <div>CUID: {market.cuid}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Market Tests */}
        <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Quick Market Tests
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                testSpecificMarket(
                  "0xfdb4876008fc53d5d726dc331920d709f20afdd84eec4567f3b47cef7b1dffe4"
                )
              }
              disabled={isRunning}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm transition-colors"
            >
              Test Weather Market
            </button>
            <button
              onClick={() =>
                testSpecificMarket(
                  "0x6abae5e38c539acddcd9c58ea71d49d54f05df9d86861a548a12bb04c05c9c06"
                )
              }
              disabled={isRunning}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm transition-colors"
            >
              Test Question Market
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Test Results
          </h2>
          {testResults.length === 0 ? (
            <div className="text-gray-700 text-center py-8 text-base">
              No tests run yet. Click &quot;Run All Tests&quot; to start.
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.status === "success"
                      ? "bg-green-100 border-green-300"
                      : result.status === "error"
                      ? "bg-red-100 border-red-300"
                      : "bg-yellow-100 border-yellow-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-gray-900 text-base">
                      {result.test}
                    </div>
                    <div
                      className={`text-lg ${
                        result.status === "success"
                          ? "text-green-700"
                          : result.status === "error"
                          ? "text-red-700"
                          : "text-yellow-700"
                      }`}
                    >
                      {result.status === "success"
                        ? "✅"
                        : result.status === "error"
                        ? "❌"
                        : "⚠️"}
                    </div>
                  </div>
                  <div className="text-base text-gray-800 mb-2 font-medium">
                    {result.message}
                  </div>
                  {result.data ? (
                    <div className="text-sm">
                      <div className="cursor-pointer text-gray-700 hover:text-gray-900 font-medium mb-2">
                        View Data
                      </div>
                      <pre className="mt-2 p-3 bg-gray-200 rounded text-sm overflow-x-auto text-gray-900 font-mono">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
