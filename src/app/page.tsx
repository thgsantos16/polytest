"use client";

import { useState, useEffect } from "react";
import { useAccount, useDisconnect } from "wagmi";
import RainbowKitConnect from "@/components/rainbowkit-connect";
import MarketList from "@/components/market-list";
import OrderForm from "@/components/order-form";
import { Market } from "@/services/polymarket-service";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleWalletConnect = (address: string) => {
    console.log("Wallet connected:", address);
  };

  const disconnectWallet = () => {
    disconnect();
  };

  // Prevent hydration mismatch by not rendering wallet-dependent content until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Polymarket Trader
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center min-h-96">
            <div className="animate-pulse">
              <div className="w-64 h-32 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-gray-900">
                  Polymarket Trader
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {isConnected && address && (
                <div className="flex items-center space-x-3">
                  <div className="text-gray-600 text-sm">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isConnected ? (
          <div className="flex justify-center items-center min-h-96">
            <RainbowKitConnect onConnect={handleWalletConnect} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Market List - Takes up 2/3 of the space */}
            <div className="lg:col-span-2">
              <MarketList
                onMarketSelect={setSelectedMarket}
                selectedMarket={selectedMarket}
              />
            </div>

            {/* Order Form and Related Markets - Takes up 1/3 of the space */}
            <div className="space-y-6">
              <OrderForm
                market={selectedMarket}
                walletAddress={address || ""}
              />

              {/* Related Markets */}
              <div className="bg-white rounded-lg p-4 shadow-lg border border-gray-200">
                <h3 className="text-gray-900 font-medium mb-4">
                  Other Markets
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">
                        N
                      </div>
                      <span className="text-gray-700 text-sm">
                        NFC Champion
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-900 text-sm">21%</div>
                      <div className="text-gray-500 text-xs">Philadelphia</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">
                        A
                      </div>
                      <span className="text-gray-700 text-sm">
                        AFC Champion
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-900 text-sm">23%</div>
                      <div className="text-gray-500 text-xs">Buffalo</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-gray-500 rounded flex items-center justify-center text-white text-xs">
                        🏆
                      </div>
                      <span className="text-gray-700 text-sm">
                        2026 NHL Stanley Cup
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-900 text-sm">21%</div>
                      <div className="text-gray-500 text-xs">
                        Florida Panthers
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
