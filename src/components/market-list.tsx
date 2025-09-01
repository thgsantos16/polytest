"use client";

import { useState, useEffect } from "react";
import { Market, polymarketService } from "@/services/polymarket-service";

interface MarketListProps {
  onMarketSelect: (market: Market) => void;
  selectedMarket: Market | null;
}

export default function MarketList({
  onMarketSelect,
  selectedMarket,
}: MarketListProps) {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        setLoading(true);
        const fetchedMarkets = await polymarketService.fetchMarkets();
        setMarkets(fetchedMarkets);
        setError("");
      } catch (err) {
        console.error("Failed to fetch markets:", err);
        setError("Failed to load markets. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
  }, []);

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

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(0)}K`;
    }
    return `$${volume}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = date.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return "Ended";
      } else if (diffDays === 0) {
        return "Today";
      } else if (diffDays === 1) {
        return "Tomorrow";
      } else if (diffDays < 7) {
        return `${diffDays} days`;
      } else {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year:
            date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
        });
      }
    } catch {
      return "Unknown";
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
        <div className="animate-pulse space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2 mt-2"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
        <div className="text-red-600 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Markets</h2>
          <div className="flex space-x-2">
            <button className="text-gray-500 hover:text-gray-700">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </button>
            <button className="text-gray-500 hover:text-gray-700">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Market List */}
      <div className="divide-y divide-gray-200">
        {markets.map((market) => {
          // Use real market data for prices
          const yesPrice = market.yesPrice;
          const noPrice = market.noPrice;
          const volume = market.volume24h || 0;
          // Use real price change data from the API
          const change =
            market.priceChange24h !== undefined &&
            market.priceChange24h !== null
              ? market.priceChange24h * 100 // Convert to percentage
              : 0; // Default to 0 if no change data available

          return (
            <div
              key={market.id}
              className={`p-4 hover:bg-gray-100 cursor-pointer transition-colors ${
                selectedMarket?.id === market.id ? "bg-gray-100" : ""
              }`}
              onClick={() => onMarketSelect(market)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getTeamIcon(market.question)}
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-900 font-medium break-words">
                      {market.question}
                    </div>
                    <div className="text-gray-500 text-sm flex items-center space-x-2 mt-1">
                      <span>{formatVolume(volume)} Vol.</span>
                      <span className="text-gray-400">•</span>
                      <span>{formatDate(market.endDate)}</span>
                      <svg
                        className="w-4 h-4"
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
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-gray-900 font-medium">
                      {Math.round(yesPrice * 100)}%
                    </div>
                    <div
                      className={`text-xs flex items-center ${
                        change > 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {change > 0 ? (
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L12 10.586z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L12 9.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {Math.abs(change).toFixed(1)}%
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors whitespace-nowrap">
                      Buy Yes {Math.round(yesPrice * 100)}¢
                    </button>
                    <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors whitespace-nowrap">
                      Buy No {Math.round(noPrice * 100)}¢
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
