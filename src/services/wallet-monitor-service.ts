import { ethers } from "ethers";
import { telegramBotService } from "./telegram-bot-service";
import { prismaStorageService } from "./prisma-storage-service";

// Token contract addresses and ABIs
const TOKEN_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

const USDC_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

// Chain configurations - Focus ONLY on Polygon for Polymarket trading
const CHAINS = {
  polygon: {
    name: "Polygon",
    rpc: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
    chainId: 137,
    tokens: {
      usdc: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // USDC on Polygon
      pol: "0x0000000000000000000000000000000000001010", // POL is the native token of Polygon
    },
  },
};

interface TransferEvent {
  from: string;
  to: string;
  value: string;
  token: string;
  chain: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
}

interface WalletBalance {
  chain: string;
  pol: string;
  usdc: string;
}

export class WalletMonitorService {
  private providers: Map<string, ethers.Provider> = new Map();
  private monitors: Map<string, NodeJS.Timeout> = new Map();
  private lastProcessedBlocks: Map<string, number> = new Map();
  private isMonitoring = false;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    Object.entries(CHAINS).forEach(([chainName, chainConfig]) => {
      try {
        const provider = new ethers.JsonRpcProvider(chainConfig.rpc);
        this.providers.set(chainName, provider);
        console.log(`✅ Provider initialized for ${chainName}`);
      } catch (error) {
        console.error(
          `❌ Failed to initialize provider for ${chainName}:`,
          error
        );
      }
    });
  }

  public async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log("Monitoring already active");
      return;
    }

    console.log("🚀 Starting wallet monitoring...");
    this.isMonitoring = true;

    // Start monitoring for each chain
    Object.keys(CHAINS).forEach((chainName) => {
      this.startChainMonitoring(chainName);
    });

    // Start balance checking
    this.startBalanceMonitoring();
  }

  public stopMonitoring(): void {
    console.log("🛑 Stopping wallet monitoring...");
    this.isMonitoring = false;

    // Clear all monitoring intervals
    this.monitors.forEach((interval) => clearInterval(interval));
    this.monitors.clear();
  }

  private startChainMonitoring(chainName: string): void {
    const provider = this.providers.get(chainName);
    if (!provider) {
      console.error(`No provider found for chain: ${chainName}`);
      return;
    }

    const monitorInterval = setInterval(async () => {
      try {
        await this.checkForTransfers(chainName, provider);
      } catch (error) {
        console.error(`Error monitoring ${chainName}:`, error);
      }
    }, 60000); // Check every 60 seconds to avoid rate limiting

    this.monitors.set(chainName, monitorInterval);
    console.log(`📡 Started monitoring ${chainName}`);
  }

  private async checkForTransfers(
    chainName: string,
    provider: ethers.Provider
  ): Promise<void> {
    try {
      // Get all user wallets
      const users = await prismaStorageService.getAllUsers();

      for (const user of users) {
        const wallet = await prismaStorageService.getWalletByTelegramId(
          user.telegramId
        );

        if (!wallet) continue;

        // Check for token transfers (skip ETH transfers for now)
        // await this.checkEthTransfers(
        //   chainName,
        //   provider,
        //   wallet.walletAddress,
        //   user.telegramId
        // );

        // Check for token transfers
        const chainConfig = CHAINS[chainName as keyof typeof CHAINS];
        if (chainConfig) {
          await this.checkTokenTransfers(
            chainName,
            provider,
            wallet.walletAddress,
            user.telegramId,
            chainConfig
          );
        }
      }
    } catch (error) {
      console.error(`Error checking transfers for ${chainName}:`, error);
    }
  }

  private async checkEthTransfers(
    chainName: string,
    provider: ethers.Provider,
    walletAddress: string,
    telegramId: string
  ): Promise<void> {
    try {
      const currentBlock = await provider.getBlockNumber();
      const lastBlock =
        this.lastProcessedBlocks.get(`${chainName}_${walletAddress}`) ||
        currentBlock - 10;

      // Get recent blocks for ETH transfers
      for (
        let blockNumber = lastBlock + 1;
        blockNumber <= currentBlock;
        blockNumber++
      ) {
        const block = await provider.getBlock(blockNumber, true);
        if (!block) continue;

        for (const txHash of block.transactions) {
          const tx = await provider.getTransaction(txHash);
          if (tx && tx.to?.toLowerCase() === walletAddress.toLowerCase()) {
            const transferEvent: TransferEvent = {
              from: tx.from,
              to: tx.to,
              value: ethers.formatEther(tx.value),
              token: "ETH",
              chain: chainName,
              blockNumber: blockNumber,
              transactionHash: tx.hash,
              timestamp: block.timestamp,
            };

            await this.notifyTransfer(transferEvent, telegramId);
          }
        }
      }

      this.lastProcessedBlocks.set(
        `${chainName}_${walletAddress}`,
        currentBlock
      );
    } catch (error) {
      console.error(
        `Error checking ETH transfers for ${walletAddress}:`,
        error
      );
    }
  }

  private async checkTokenTransfers(
    chainName: string,
    provider: ethers.Provider,
    walletAddress: string,
    telegramId: string,
    chainConfig: (typeof CHAINS)[keyof typeof CHAINS]
  ): Promise<void> {
    try {
      const currentBlock = await provider.getBlockNumber();
      const lastBlock =
        this.lastProcessedBlocks.get(`${chainName}_${walletAddress}_tokens`) ||
        currentBlock - 10;

      // Check USDC transfers
      if (chainConfig.tokens.usdc) {
        await this.checkTokenTransfer(
          chainName,
          provider,
          walletAddress,
          telegramId,
          chainConfig.tokens.usdc,
          "USDC",
          lastBlock,
          currentBlock
        );
      }

      // Check POL transfers
      if (chainConfig.tokens.pol) {
        await this.checkTokenTransfer(
          chainName,
          provider,
          walletAddress,
          telegramId,
          chainConfig.tokens.pol,
          "POL",
          lastBlock,
          currentBlock
        );
      }

      this.lastProcessedBlocks.set(
        `${chainName}_${walletAddress}_tokens`,
        currentBlock
      );
    } catch (error) {
      console.error(
        `Error checking token transfers for ${walletAddress}:`,
        error
      );
    }
  }

  private async checkTokenTransfer(
    chainName: string,
    provider: ethers.Provider,
    walletAddress: string,
    telegramId: string,
    tokenAddress: string,
    tokenSymbol: string,
    fromBlock: number,
    toBlock: number
  ): Promise<void> {
    try {
      const contract = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);

      // Get transfer events where the wallet is the recipient
      const filter = contract.filters.Transfer(null, walletAddress);
      const events = await contract.queryFilter(filter, fromBlock, toBlock);

      for (const event of events) {
        if (event instanceof ethers.EventLog && event.args) {
          const transferEvent: TransferEvent = {
            from: event.args[0],
            to: event.args[1],
            value: ethers.formatUnits(event.args[2], await contract.decimals()),
            token: tokenSymbol,
            chain: chainName,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            timestamp: (await event.getBlock()).timestamp,
          };

          await this.notifyTransfer(transferEvent, telegramId);
        }
      }
    } catch (error) {
      console.error(`Error checking ${tokenSymbol} transfers:`, error);
    }
  }

  private async notifyTransfer(
    transferEvent: TransferEvent,
    telegramId: string
  ): Promise<void> {
    try {
      const chainName =
        CHAINS[transferEvent.chain as keyof typeof CHAINS]?.name ||
        transferEvent.chain;

      const message =
        `💰 **Incoming Transfer Detected!**\n\n` +
        `🪙 Token: ${transferEvent.token}\n` +
        `🌐 Chain: ${chainName}\n` +
        `📥 Amount: ${parseFloat(transferEvent.value).toFixed(6)} ${
          transferEvent.token
        }\n` +
        `👤 From: \`${transferEvent.from}\`\n` +
        `📋 TX: \`${transferEvent.transactionHash}\`\n` +
        `⏰ Time: ${new Date(transferEvent.timestamp * 1000).toLocaleString()}`;

      await telegramBotService.sendMessage(telegramId, message);

      console.log(
        `✅ Transfer notification sent to ${telegramId}: ${transferEvent.value} ${transferEvent.token}`
      );
    } catch (error) {
      console.error("Error sending transfer notification:", error);
    }
  }

  private startBalanceMonitoring(): void {
    const balanceInterval = setInterval(async () => {
      try {
        await this.checkAllBalances();
      } catch (error) {
        console.error("Error checking balances:", error);
      }
    }, 60000); // Check every minute

    this.monitors.set("balances", balanceInterval);
    console.log("💰 Started balance monitoring");
  }

  public async checkAllBalances(): Promise<void> {
    try {
      const users = await prismaStorageService.getAllUsers();

      for (const user of users) {
        const wallet = await prismaStorageService.getWalletByTelegramId(
          user.telegramId
        );

        if (!wallet) continue;

        const balances = await this.getWalletBalances(wallet.walletAddress);
        await this.saveBalances(user.telegramId, balances);
      }
    } catch (error) {
      console.error("Error checking all balances:", error);
    }
  }

  public async getWalletBalances(
    walletAddress: string
  ): Promise<WalletBalance[]> {
    const balances: WalletBalance[] = [];

    for (const [chainName, chainConfig] of Object.entries(CHAINS)) {
      const provider = this.providers.get(chainName);
      if (!provider) continue;

      try {
        // Get POL balance (native token of Polygon)
        let polBalance = "0";
        if (chainConfig.tokens.pol) {
          try {
            const polContract = new ethers.Contract(
              chainConfig.tokens.pol,
              TOKEN_ABI,
              provider
            );
            const polAmount = await polContract.balanceOf(walletAddress);
            const decimals = await polContract.decimals();
            polBalance = ethers.formatUnits(polAmount, decimals);
          } catch (error) {
            console.error(`Error getting POL balance for ${chainName}:`, error);
            polBalance = "0";
          }
        }

        // Get USDC balance
        let usdcBalance = "0";
        if (chainConfig.tokens.usdc) {
          try {
            const usdcContract = new ethers.Contract(
              chainConfig.tokens.usdc,
              USDC_ABI,
              provider
            );
            const usdcAmount = await usdcContract.balanceOf(walletAddress);
            const decimals = await usdcContract.decimals();
            usdcBalance = ethers.formatUnits(usdcAmount, decimals);
          } catch (error) {
            console.error(
              `Error getting USDC balance for ${chainName}:`,
              error
            );
            usdcBalance = "0";
          }
        }

        balances.push({
          chain: chainName,
          pol: polBalance,
          usdc: usdcBalance,
        });
      } catch (error) {
        console.error(`Error getting balances for ${chainName}:`, error);
      }
    }

    return balances;
  }

  private async saveBalances(
    telegramId: string,
    balances: WalletBalance[]
  ): Promise<void> {
    // This could be extended to save balances to the database
    // For now, we'll just log them
    console.log(`Balances for ${telegramId}:`, balances);
  }

  public async getWalletBalanceForUser(
    telegramId: string
  ): Promise<WalletBalance[]> {
    const wallet = await prismaStorageService.getWalletByTelegramId(telegramId);
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    return await this.getWalletBalances(wallet.walletAddress);
  }

  public isActive(): boolean {
    return this.isMonitoring;
  }
}

export const walletMonitorService = new WalletMonitorService();
