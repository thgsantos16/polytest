"use client";

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';

interface RainbowKitConnectProps {
  onConnect: (address: string, privateKey?: string) => void;
}

export default function RainbowKitConnect({ onConnect }: RainbowKitConnectProps) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // When wallet is connected, call the onConnect callback
  if (isConnected && address) {
    // Note: RainbowKit doesn't expose private keys for security reasons
    // For Polymarket trading, you'll need to handle this differently
    onConnect(address);
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Wallet</h2>
      
      <div className="flex justify-center mb-4">
        <ConnectButton />
      </div>

      <p className="text-sm text-gray-600 text-center">
        Connect your wallet to start trading on Polymarket
      </p>
      
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Supported Wallets</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• MetaMask</p>
          <p>• WalletConnect</p>
          <p>• Coinbase Wallet</p>
          <p>• Rainbow</p>
          <p>• And many more...</p>
        </div>
      </div>
    </div>
  );
}
