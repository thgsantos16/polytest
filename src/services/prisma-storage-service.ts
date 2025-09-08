import { PrismaClient } from "@/generated/prisma";
import crypto from "crypto";
import { Wallet } from "@ethersproject/wallet";

const prisma = new PrismaClient();

export interface CreateUserData {
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export interface CreateWalletData {
  userId: string;
  walletAddress: string;
  encryptedPrivateKey: string;
  encryptionIV: string;
}

export interface CreateTransferData {
  userId: string;
  transactionHash: string;
  from: string;
  to: string;
  value: string;
  token: string;
  chain: string;
  blockNumber: number;
  timestamp: Date;
}

export interface CreateBalanceData {
  userId: string;
  chain: string;
  pol: string;
  usdc: string;
}

export class PrismaStorageService {
  private readonly ENCRYPTION_KEY =
    process.env.ENCRYPTION_KEY || "default-key-change-in-production";
  private readonly ALGORITHM = "aes-256-cbc";

  private encrypt(text: string): { encryptedData: string; iv: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.ALGORITHM,
      Buffer.from(this.ENCRYPTION_KEY, "hex"),
      iv
    );
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return { encryptedData: encrypted, iv: iv.toString("hex") };
  }

  private decrypt(encryptedData: string, iv: string): string {
    const decipher = crypto.createDecipheriv(
      this.ALGORITHM,
      Buffer.from(this.ENCRYPTION_KEY, "hex"),
      Buffer.from(iv, "hex")
    );
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  public encryptPrivateKey(privateKey: string): {
    encryptedPrivateKey: string;
    iv: string;
  } {
    const { encryptedData, iv } = this.encrypt(privateKey);
    return { encryptedPrivateKey: encryptedData, iv };
  }

  // User management
  async createOrGetUser(
    telegramId: string,
    userData: CreateUserData
  ): Promise<string> {
    const existingUser = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (existingUser) {
      // Update last active
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { lastActive: new Date() },
      });
      return existingUser.id;
    }

    const newUser = await prisma.user.create({
      data: {
        telegramId,
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
      },
    });

    return newUser.id;
  }

  async getUserByTelegramId(telegramId: string) {
    return await prisma.user.findUnique({
      where: { telegramId },
      include: { wallet: true },
    });
  }

  async getAllUsers() {
    return await prisma.user.findMany({
      include: { wallet: true },
    });
  }

  // Wallet management
  async createWallet(walletData: CreateWalletData): Promise<{
    id: string;
    userId: string;
    walletAddress: string;
    encryptedPrivateKey: string;
    encryptionIV: string;
    createdAt: Date;
    updatedAt: Date;
    lastUsed: Date;
  }> {
    return await prisma.wallet.create({
      data: walletData,
      select: {
        id: true,
        userId: true,
        walletAddress: true,
        encryptedPrivateKey: true,
        encryptionIV: true,
        createdAt: true,
        updatedAt: true,
        lastUsed: true,
      },
    });
  }

  async getWalletByTelegramId(telegramId: string) {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: { wallet: true },
    });

    return user?.wallet || null;
  }

  async updateWalletLastUsed(walletId: string) {
    return await prisma.wallet.update({
      where: { id: walletId },
      data: { lastUsed: new Date() },
    });
  }

  // Transfer tracking
  async createTransfer(transferData: CreateTransferData) {
    return await prisma.transfer.create({
      data: transferData,
    });
  }

  async getTransfersByUserId(userId: string) {
    return await prisma.transfer.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
    });
  }

  async getTransferByHash(transactionHash: string) {
    return await prisma.transfer.findUnique({
      where: { transactionHash },
    });
  }

  // Balance tracking
  async createBalance(balanceData: CreateBalanceData) {
    return await prisma.balance.create({
      data: balanceData,
    });
  }

  async getLatestBalanceByUserId(userId: string, chain: string) {
    return await prisma.balance.findFirst({
      where: { userId, chain },
      orderBy: { timestamp: "desc" },
    });
  }

  async getAllBalancesByUserId(userId: string) {
    return await prisma.balance.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
    });
  }

  // Position management
  async createPosition(positionData: {
    userId: string;
    marketId: string;
    tokenId: string;
    amount: number;
    side: string;
    price: number;
  }) {
    return await prisma.position.create({
      data: positionData,
    });
  }

  async getPositionsByUserId(userId: string) {
    return await prisma.position.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  // Additional methods needed by the bot
  async getUserPositionsByTelegramId(telegramId: string) {
    const user = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) return [];

    return await prisma.position.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
  }

  async getWalletSignerByTelegramId(telegramId: string) {
    const wallet = await this.getWalletByTelegramId(telegramId);
    if (!wallet) return null;

    try {
      // Decrypt the private key
      const privateKey = this.decrypt(
        wallet.encryptedPrivateKey,
        wallet.encryptionIV
      );

      const signer = new Wallet(privateKey);

      return signer;
    } catch (error) {
      console.error("Error creating wallet signer:", error);
      return null;
    }
  }

  async savePosition(
    user: { id: string },
    positionData: {
      userId: string;
      marketId: string;
      tokenId: string;
      amount: number;
      side: string;
      price: number;
    }
  ) {
    // This method would need to be implemented based on your position management
    // For now, using createPosition
    console.warn(
      "savePosition not implemented in Prisma service, using createPosition"
    );
    return await this.createPosition(positionData);
  }

  async deleteUserByTelegramId(telegramId: string) {
    const user = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (user) {
      // Delete user (cascades to wallet, positions, etc.)
      await prisma.user.delete({
        where: { id: user.id },
      });
    }
  }

  async getStats(): Promise<{
    totalUsers: number;
    totalWallets: number;
    totalPositions: number;
  }> {
    const [totalUsers, totalWallets, totalPositions] = await Promise.all([
      prisma.user.count(),
      prisma.wallet.count(),
      prisma.position.count(),
    ]);

    return {
      totalUsers,
      totalWallets,
      totalPositions,
    };
  }

  // Market-related methods
  async upsertMarket(marketData: {
    polymarketId: string;
    question: string;
    description?: string;
    endDate: Date;
    volume24h: number;
    liquidity: number;
    yesPrice: number;
    noPrice: number;
    priceChange24h?: number;
    yesTokenId: string;
    noTokenId: string;
    isActive: boolean;
    isArchived: boolean;
    conditionId: string;
    clobTokensIds?: string | null;
  }): Promise<string> {
    try {
      console.log("Upserting market:", marketData);

      const market = await prisma.market.upsert({
        where: { polymarketId: marketData.polymarketId },
        update: {
          question: marketData.question,
          description: marketData.description,
          endDate: marketData.endDate,
          volume24h: marketData.volume24h,
          liquidity: marketData.liquidity,
          yesPrice: marketData.yesPrice,
          noPrice: marketData.noPrice,
          priceChange24h: marketData.priceChange24h,
          yesTokenId: marketData.yesTokenId,
          noTokenId: marketData.noTokenId,
          isActive: marketData.isActive,
          isArchived: marketData.isArchived,
          lastUpdated: new Date(),
          conditionId: marketData.conditionId,
          clobTokensIds: marketData.clobTokensIds,
        },
        create: marketData,
      });

      console.log("Market upserted:", market);

      return market.id; // Return the CUID
    } catch (error) {
      console.error("Error upserting market:", error);
      throw error;
    }
  }

  async getMarketByPolymarketId(polymarketId: string) {
    try {
      return await prisma.market.findUnique({
        where: { polymarketId },
      });
    } catch (error) {
      console.error("Error getting market by Polymarket ID:", error);
      throw error;
    }
  }

  async getActiveMarkets(limit: number = 20): Promise<
    Array<{
      id: string;
      polymarketId: string;
      question: string;
      description: string | null;
      endDate: Date;
      volume24h: number;
      liquidity: number;
      yesPrice: number;
      noPrice: number;
      priceChange24h: number | null;
      yesTokenId: string;
      noTokenId: string;
      isActive: boolean;
      isArchived: boolean;
      lastUpdated: Date;
      createdAt: Date;
      clobTokensIds: string | null;
      conditionId: string | null;
    }>
  > {
    try {
      return await prisma.market.findMany({
        where: {
          isActive: true,
          isArchived: false,
        },
        orderBy: {
          endDate: "desc",
        },
        take: limit,
      });
    } catch (error) {
      console.error("Error getting active markets:", error);
      throw error;
    }
  }

  async updateMarketPrices(
    polymarketId: string,
    yesPrice: number,
    noPrice: number,
    volume24h?: number,
    liquidity?: number,
    priceChange24h?: number
  ): Promise<void> {
    try {
      await prisma.market.update({
        where: { polymarketId },
        data: {
          yesPrice,
          noPrice,
          volume24h: volume24h !== undefined ? volume24h : undefined,
          liquidity: liquidity !== undefined ? liquidity : undefined,
          priceChange24h:
            priceChange24h !== undefined ? priceChange24h : undefined,
          lastUpdated: new Date(),
        },
      });
    } catch (error) {
      console.error("Error updating market prices:", error);
      throw error;
    }
  }

  async getMarketById(marketId: string) {
    try {
      return await prisma.market.findUnique({
        where: { id: marketId },
      });
    } catch (error) {
      console.error("Error getting market by ID:", error);
      throw error;
    }
  }

  async enhanceAllMarketsWithTokenIds(): Promise<void> {
    try {
      console.log("Starting to enhance all markets with token IDs...");

      // Get all markets that have conditionId but missing token IDs
      const marketsToEnhance = await prisma.market.findMany({
        where: {
          AND: [
            { conditionId: { not: null } },
            { conditionId: { not: "" } },
            {
              OR: [{ yesTokenId: "" }, { noTokenId: "" }],
            },
          ],
        },
      });

      console.log(`Found ${marketsToEnhance.length} markets to enhance`);

      if (marketsToEnhance.length === 0) {
        console.log("No markets need enhancement");
        return;
      }

      // Import the polymarket service to use enhancement
      const { polymarketService } = await import("./polymarket-service");

      // Convert to Market interface for enhancement
      const marketsForEnhancement = marketsToEnhance.map((dbMarket) => ({
        id: dbMarket.polymarketId, // Keep the original polymarketId as the ID
        question: dbMarket.question,
        description: dbMarket.description || "",
        endDate: dbMarket.endDate.toISOString(),
        volume24h: dbMarket.volume24h,
        liquidity: dbMarket.liquidity,
        yesPrice: dbMarket.yesPrice,
        noPrice: dbMarket.noPrice,
        priceChange24h: dbMarket.priceChange24h,
        yesTokenId: dbMarket.yesTokenId || "",
        noTokenId: dbMarket.noTokenId || "",
        conditionId: dbMarket.conditionId || "",
        clobTokensIds: dbMarket.clobTokensIds,
      }));

      // Enhance markets with CLOB data
      const enhancedMarkets =
        await polymarketService.enhanceMarketsWithClobData(
          marketsForEnhancement
        );

      console.log(`Successfully enhanced ${enhancedMarkets.length} markets`);

      // Update enhanced markets in database
      for (const enhancedMarket of enhancedMarkets) {
        try {
          await this.upsertMarket({
            polymarketId: enhancedMarket.id, // This is now conditionId, not polymarketId!
            question: enhancedMarket.question,
            description: enhancedMarket.description,
            endDate: new Date(enhancedMarket.endDate),
            volume24h: enhancedMarket.volume24h,
            liquidity: enhancedMarket.liquidity,
            yesPrice: enhancedMarket.yesPrice,
            noPrice: enhancedMarket.noPrice,
            priceChange24h: enhancedMarket.priceChange24h || undefined,
            yesTokenId: enhancedMarket.yesTokenId,
            noTokenId: enhancedMarket.noTokenId,
            isActive: true,
            isArchived: false,
            conditionId: enhancedMarket.conditionId || "",
            clobTokensIds: enhancedMarket.clobTokensIds,
          });

          console.log(`Updated market ${enhancedMarket.id} with token IDs`);
        } catch (error) {
          console.warn(
            `Failed to update enhanced market ${enhancedMarket.id}:`,
            error
          );
        }
      }

      console.log("Market enhancement completed");
    } catch (error) {
      console.error("Error enhancing markets:", error);
      throw error;
    }
  }

  // Order management
  async createOrder(orderData: {
    userId: string;
    marketId: string;
    tokenId: string;
    side: string;
    amount: number;
    price: number;
    totalCost: number;
    orderHash?: string;
    transactionHash?: string;
    status: string;
    orderType: string;
  }) {
    return await prisma.order.create({
      data: orderData,
    });
  }

  async getOrdersByUserId(userId: string) {
    return await prisma.order.findMany({
      where: { userId },
      include: { market: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getOrderByHash(orderHash: string) {
    return await prisma.order.findFirst({
      where: { orderHash },
      include: { market: true, user: true },
    });
  }

  async updateOrderStatus(
    orderId: string,
    status: string,
    transactionHash?: string
  ) {
    return await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        transactionHash: transactionHash || undefined,
        updatedAt: new Date(),
      },
    });
  }

  async getMarketByTokenId(tokenId: string) {
    return await prisma.market.findFirst({
      where: {
        OR: [{ yesTokenId: tokenId }, { noTokenId: tokenId }],
      },
    });
  }

  // Cleanup
  async disconnect() {
    await prisma.$disconnect();
  }
}

export const prismaStorageService = new PrismaStorageService();
