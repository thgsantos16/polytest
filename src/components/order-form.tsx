"use client";

import { useState } from "react";
import { Market, polymarketService } from "@/services/polymarket-service";
import { useWalletClient } from "wagmi";

interface OrderFormProps {
  market: Market | null;
  walletAddress: string;
}

export default function OrderForm({ market, walletAddress }: OrderFormProps) {
  const { data: walletClient } = useWalletClient();
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy");
  const [tokenType, setTokenType] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState<string>("0");
  const [orderResult, setOrderResult] = useState<{
    success: boolean;
    message: string;
    orderId?: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureRequested, setSignatureRequested] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderResult(null);
    setIsSubmitting(true);
    setSignatureRequested(false);

    if (!market || !amount || parseFloat(amount) <= 0 || !walletClient) {
      setOrderResult({
        success: false,
        message: walletClient
          ? "Please enter a valid amount"
          : "Please connect your wallet first",
      });
      setIsSubmitting(false);
      return;
    }

    // Check if token IDs are available for this market
    const tokenId = tokenType === "yes" ? market.yesTokenId : market.noTokenId;
    if (!tokenId) {
      setOrderResult({
        success: false,
        message:
          "This market is not available for trading. Please select a different market.",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Show signature request message
      setSignatureRequested(true);

      // Initialize the Polymarket client
      await polymarketService.initializeClient(walletClient);

      const orderDetails = {
        marketId: market.id,
        tokenId: tokenType === "yes" ? market.yesTokenId : market.noTokenId,
        side: orderType,
        price: tokenType === "yes" ? yesPrice : noPrice,
        size: parseFloat(amount),
        walletAddress,
      };

      console.log("Placing order...");

      const result = await polymarketService.placeOrder(
        orderDetails,
        walletClient
      );
      setOrderResult(result);

      if (result.success) {
        // Reset form on success
        setAmount("0");
      }
    } catch (error) {
      console.error("Order placement error:", error);
      setOrderResult({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to place order. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
      setSignatureRequested(false);
    }
  };

  const quickAddAmount = (value: number) => {
    const currentAmount = parseFloat(amount) || 0;
    setAmount((currentAmount + value).toString());
  };

  const setMaxAmount = () => {
    // Mock max amount - in real implementation, get from wallet balance
    setAmount("1000");
  };

  if (!market) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
        <div className="text-center text-gray-500">
          <svg
            className="w-12 h-12 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p>Select a market to start trading</p>
        </div>
      </div>
    );
  }

  const getTeamIcon = (marketQuestion: string) => {
    // Extract meaningful abbreviation from the market question
    let abbreviation = "";

    // Try to find specific keywords first
    if (marketQuestion.includes("recession")) {
      abbreviation = "REC";
    } else if (marketQuestion.includes("Fed")) {
      abbreviation = "FED";
    } else if (marketQuestion.includes("rate")) {
      abbreviation = "RATE";
    } else if (marketQuestion.includes("NFL")) {
      abbreviation = "NFL";
    } else if (marketQuestion.includes("NBA")) {
      abbreviation = "NBA";
    } else if (marketQuestion.includes("UFC")) {
      abbreviation = "UFC";
    } else if (marketQuestion.includes("Biden")) {
      abbreviation = "POL";
    } else if (marketQuestion.includes("Ant-Man")) {
      abbreviation = "MOV";
    } else {
      // Fallback: use first two meaningful words
      const words = marketQuestion.split(" ");
      const meaningfulWords = words.filter(
        (word) =>
          word.length > 2 &&
          ![
            "the",
            "and",
            "for",
            "in",
            "on",
            "at",
            "to",
            "of",
            "with",
            "by",
            "a",
            "an",
          ].includes(word.toLowerCase())
      );

      if (meaningfulWords.length >= 2) {
        abbreviation = (
          meaningfulWords[0].charAt(0) + meaningfulWords[1].charAt(0)
        ).toUpperCase();
      } else if (meaningfulWords.length === 1) {
        abbreviation = meaningfulWords[0].substring(0, 3).toUpperCase();
      } else {
        abbreviation = marketQuestion.substring(0, 3).toUpperCase();
      }
    }

    // Debug log to see what abbreviation is being generated
    console.log(
      `Market: "${marketQuestion}" -> Abbreviation: "${abbreviation}"`
    );

    const colors = [
      "bg-blue-500",
      "bg-red-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-yellow-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-orange-500",
    ];
    const colorIndex = marketQuestion.length % colors.length;

    return (
      <div
        className={`w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold ${colors[colorIndex]}`}
      >
        {abbreviation.slice(0, 3)}
      </div>
    );
  };

  // Get real prices from market data if available
  const yesPrice = market.yesPrice;
  const noPrice = market.noPrice;

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
      {/* Market Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">
            {getTeamIcon(market.question)}
          </div>
          <div>
            <h3 className="text-gray-900 font-medium max-w-48">
              {market.question}
            </h3>
          </div>
        </div>
        <select className="bg-gray-100 text-gray-900 text-sm rounded px-2 py-1 border border-gray-300">
          <option>Market</option>
        </select>
      </div>

      {/* Trading Availability Warning */}
      {(!market.yesTokenId || !market.noTokenId) && (
        <div className="mb-6 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-orange-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-orange-800 text-sm">
              This market is not available for trading. Please select a
              different market.
            </span>
          </div>
        </div>
      )}

      {/* Trade Type Tabs */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => setOrderType("buy")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            orderType === "buy"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setOrderType("sell")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            orderType === "sell"
              ? "bg-red-600 text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Sell
        </button>
      </div>

      {/* Token Type Selection */}
      <div className="flex space-x-3 mb-6">
        <button
          onClick={() => setTokenType("yes")}
          className={`flex-1 py-3 px-4 rounded-lg text-center font-medium transition-colors ${
            tokenType === "yes"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-700 hover:text-gray-900 hover:bg-gray-200"
          }`}
        >
          Yes {Math.round(yesPrice * 100)}¢
        </button>
        <button
          onClick={() => setTokenType("no")}
          className={`flex-1 py-3 px-4 rounded-lg text-center font-medium transition-colors ${
            tokenType === "no"
              ? "bg-red-600 text-white"
              : "bg-gray-100 text-gray-700 hover:text-gray-900 hover:bg-gray-200"
          }`}
        >
          No {Math.round(noPrice * 100)}¢
        </button>
      </div>

      {/* Amount Input */}
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Amount
        </label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full bg-gray-50 text-gray-900 text-2xl font-bold px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            USD
          </div>
        </div>

        {/* Quick Add Buttons */}
        <div className="flex space-x-2 mt-3">
          <button
            onClick={() => quickAddAmount(1)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm transition-colors"
          >
            +$1
          </button>
          <button
            onClick={() => quickAddAmount(20)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm transition-colors"
          >
            +$20
          </button>
          <button
            onClick={() => quickAddAmount(100)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm transition-colors"
          >
            +$100
          </button>
          <button
            onClick={setMaxAmount}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm transition-colors"
          >
            Max
          </button>
        </div>
      </div>

      {/* Trade Button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !market.yesTokenId || !market.noTokenId}
        className={`w-full font-medium py-3 px-4 rounded-lg transition-colors mb-4 ${
          isSubmitting || !market.yesTokenId || !market.noTokenId
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>
              {signatureRequested ? "Signing Order..." : "Processing..."}
            </span>
          </div>
        ) : !market.yesTokenId || !market.noTokenId ? (
          "Market Not Available"
        ) : (
          "Trade"
        )}
      </button>

      {/* Signature Request Notification */}
      {signatureRequested && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-yellow-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-yellow-800 text-sm font-medium">
              Please check your wallet to sign the order
            </span>
          </div>
        </div>
      )}

      {/* Terms */}
      <p className="text-xs text-gray-500 text-center">
        By trading, you agree to the{" "}
        <a href="#" className="text-blue-600 hover:underline">
          Terms of Use
        </a>
        .
      </p>

      {/* Order Result */}
      {orderResult && (
        <div
          className={`mt-4 p-4 rounded-lg border ${
            orderResult.success
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-start space-x-3">
            {orderResult.success ? (
              <svg
                className="w-5 h-5 text-green-600 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-red-600 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <div className="flex-1">
              <p className="font-medium">
                {orderResult.success
                  ? "Order Placed Successfully!"
                  : "Order Failed"}
              </p>
              <p className="text-sm mt-1">{orderResult.message}</p>
              {orderResult.orderId && (
                <p className="text-xs mt-2 opacity-75">
                  Order ID: {orderResult.orderId}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
