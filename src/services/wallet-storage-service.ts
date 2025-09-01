import crypto from "crypto";
import { ethers } from "ethers";
import { PrismaClient } from "@/generated/prisma";
import { Position } from "@/generated/prisma";

const prisma = new PrismaClient();

export interface UserWallet {
  userId: string;
  walletAddress: string;
  encryptedPrivateKey: string;
  createdAt: string;
  lastUsed: string;
}

export interface WalletBalance {
  usdc: number;
  tokens: Array<{
    tokenId: string;
    amount: number;
    marketId: string;
  }>;
}

export class WalletStorageService {
  private encryptionKey: string;

  constructor() {
    this.encryptionKey =
      process.env.WALLET_ENCRYPTION_KEY || "default-key-change-in-production";
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher("aes-256-cbc", this.encryptionKey);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  }

  private decrypt(encryptedText: string): string {
    const parts = encryptedText.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];
    const decipher = crypto.createDecipher("aes-256-cbc", this.encryptionKey);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  async createOrGetUser(
    telegramId: string,
    userData: {
      username?: string;
      firstName?: string;
      lastName?: string;
    }
  ): Promise<string> {
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        lastActive: new Date(),
      },
      create: {
        telegramId,
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
      },
    });

    return user.id;
  }

  async createWallet(userId: string): Promise<UserWallet> {
    // Generate new wallet
    const wallet = ethers.Wallet.createRandom();

    // Encrypt private key
    const encryptedPrivateKey = this.encrypt(wallet.privateKey);

    // Store in database
    const dbWallet = await prisma.wallet.create({
      data: {
        userId,
        walletAddress: wallet.address,
        encryptedPrivateKey,
      },
    });

    return {
      userId: dbWallet.userId,
      walletAddress: dbWallet.walletAddress,
      encryptedPrivateKey: dbWallet.encryptedPrivateKey,
      createdAt: dbWallet.createdAt.toISOString(),
      lastUsed: dbWallet.lastUsed.toISOString(),
    };
  }

  async getUserWallet(userId: string): Promise<UserWallet | null> {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      return null;
    }

    return {
      userId: wallet.userId,
      walletAddress: wallet.walletAddress,
      encryptedPrivateKey: wallet.encryptedPrivateKey,
      createdAt: wallet.createdAt.toISOString(),
      lastUsed: wallet.lastUsed.toISOString(),
    };
  }

  async getWalletByTelegramId(telegramId: string): Promise<UserWallet | null> {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      return null;
    }

    return {
      userId: user.wallet.userId,
      walletAddress: user.wallet.walletAddress,
      encryptedPrivateKey: user.wallet.encryptedPrivateKey,
      createdAt: user.wallet.createdAt.toISOString(),
      lastUsed: user.wallet.lastUsed.toISOString(),
    };
  }

  async getWalletSigner(userId: string): Promise<ethers.Wallet | null> {
    const wallet = await this.getUserWallet(userId);

    if (!wallet) {
      return null;
    }

    try {
      const privateKey = this.decrypt(wallet.encryptedPrivateKey);
      return new ethers.Wallet(privateKey);
    } catch (error) {
      console.error("Failed to decrypt wallet:", error);
      return null;
    }
  }

  async getWalletSignerByTelegramId(
    telegramId: string
  ): Promise<ethers.Wallet | null> {
    const wallet = await this.getWalletByTelegramId(telegramId);

    if (!wallet) {
      return null;
    }

    try {
      const privateKey = this.decrypt(wallet.encryptedPrivateKey);
      return new ethers.Wallet(privateKey);
    } catch (error) {
      console.error("Failed to decrypt wallet:", error);
      return null;
    }
  }

  async updateLastUsed(userId: string): Promise<void> {
    await prisma.wallet.update({
      where: { userId },
      data: { lastUsed: new Date() },
    });
  }

  async savePosition(
    userId: string,
    position: {
      marketId: string;
      tokenId: string;
      amount: number;
      side: "buy" | "sell";
      price: number;
    }
  ): Promise<void> {
    await prisma.position.create({
      data: {
        userId,
        marketId: position.marketId,
        tokenId: position.tokenId,
        amount: position.amount,
        side: position.side,
        price: position.price,
      },
    });
  }

  async getUserPositions(userId: string): Promise<
    Array<{
      marketId: string;
      tokenId: string;
      amount: number;
      side: "buy" | "sell";
      price: number;
      createdAt: string;
    }>
  > {
    const positions = await prisma.position.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return positions.map((pos: Position) => ({
      marketId: pos.marketId,
      tokenId: pos.tokenId,
      amount: pos.amount,
      side: pos.side as "buy" | "sell",
      price: pos.price,
      createdAt: pos.createdAt.toISOString(),
    }));
  }

  async getUserPositionsByTelegramId(telegramId: string): Promise<
    Array<{
      marketId: string;
      tokenId: string;
      amount: number;
      side: "buy" | "sell";
      price: number;
      createdAt: string;
    }>
  > {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: { positions: true },
    });

    if (!user) {
      return [];
    }

    return user.positions.map((pos: Position) => ({
      marketId: pos.marketId,
      tokenId: pos.tokenId,
      amount: pos.amount,
      side: pos.side as "buy" | "sell",
      price: pos.price,
      createdAt: pos.createdAt.toISOString(),
    }));
  }

  async deleteUser(userId: string): Promise<void> {
    // Delete all user data (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId },
    });
  }

  async deleteUserByTelegramId(telegramId: string): Promise<void> {
    await prisma.user.delete({
      where: { telegramId },
    });
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

  async getAllUsers(): Promise<Array<{ telegramId: string }>> {
    try {
      const users = await prisma.user.findMany({
        select: {
          telegramId: true,
        },
      });
      return users;
    } catch (error) {
      console.error("Error getting all users:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}

export const walletStorageService = new WalletStorageService();
