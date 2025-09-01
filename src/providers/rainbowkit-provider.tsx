"use client";

import { RainbowKitProvider, getDefaultWallets } from "@rainbow-me/rainbowkit";
import { createConfig, WagmiConfig } from "wagmi";
import { polygon } from "wagmi/chains";
import { createPublicClient, http } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import "@rainbow-me/rainbowkit/styles.css";

// Create a client
const queryClient = new QueryClient();

export function RainbowKitProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only render the provider on the client side
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const { connectors } = getDefaultWallets({
    appName: "Polymarket Trader",
    projectId: "YOUR_PROJECT_ID", // You can get this from WalletConnect Cloud
  });

  const publicClient = createPublicClient({
    chain: polygon,
    transport: http(),
  });

  const wagmiConfig = createConfig({
    chains: [polygon],
    connectors,
    client: ({ chain }) => publicClient,
    ssr: false, // Disable SSR to prevent indexedDB errors
  });

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  );
}
