import { PrismaClient } from "@/generated/prisma";
import { ethers } from "ethers";
import crypto from "crypto";

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
      const ethersWallet = new ethers.Wallet(privateKey);
      return ethersWallet;
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

  // Cleanup
  async disconnect() {
    await prisma.$disconnect();
  }
}

export const prismaStorageService = new PrismaStorageService();
