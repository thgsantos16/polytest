import { PrismaClient } from "@/generated/prisma";

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
    createdAt: Date;
    updatedAt: Date;
    lastUsed: Date;
  }> {
    return await prisma.wallet.create({
      data: walletData,
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

  // Cleanup
  async disconnect() {
    await prisma.$disconnect();
  }
}

export const prismaStorageService = new PrismaStorageService();
