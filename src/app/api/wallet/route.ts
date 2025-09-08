import { NextRequest, NextResponse } from "next/server";
import { prismaStorageService } from "@/services/prisma-storage-service";

import { ethers } from "ethers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, telegramId, userData } = body;

    switch (action) {
      case "create_user":
        const userId = await prismaStorageService.createOrGetUser(
          telegramId,
          userData
        );
        return NextResponse.json({ success: true, userId });

      case "create_wallet":
        const wallet = await prismaStorageService.createWallet(telegramId);
        return NextResponse.json({ success: true, wallet });

      case "get_wallet":
        const userWallet = await prismaStorageService.getWalletByTelegramId(
          telegramId
        );
        if (!userWallet) {
          return NextResponse.json(
            { success: false, error: "Wallet not found" },
            { status: 404 }
          );
        }
        return NextResponse.json({ success: true, wallet: userWallet });

      case "get_balance":
        const walletForBalance =
          await prismaStorageService.getWalletByTelegramId(telegramId);
        if (!walletForBalance) {
          return NextResponse.json(
            { success: false, error: "Wallet not found" },
            { status: 404 }
          );
        }

        // Get actual balance from blockchain
        const balance = await getWalletBalance(walletForBalance.walletAddress);
        return NextResponse.json({ success: true, balance });

      case "save_position":
        const { position } = body;
        const user = await prismaStorageService.createOrGetUser(telegramId, {
          telegramId,
          username: undefined,
          firstName: undefined,
          lastName: undefined,
        });
        await prismaStorageService.savePosition({ id: user }, position);
        return NextResponse.json({ success: true });

      case "get_positions":
        const positions =
          await prismaStorageService.getUserPositionsByTelegramId(telegramId);
        return NextResponse.json({ success: true, positions });

      case "delete_user":
        await prismaStorageService.deleteUserByTelegramId(telegramId);
        return NextResponse.json({ success: true });

      case "get_stats":
        const stats = await prismaStorageService.getStats();
        return NextResponse.json({ success: true, stats });

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Wallet API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function getWalletBalance(walletAddress: string): Promise<{
  usdc: number;
  tokens: Array<{ tokenId: string; amount: number; marketId: string }>;
}> {
  try {
    // Connect to Polygon network
    const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);

    // USDC contract address on Polygon
    const usdcAddress = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
    const usdcAbi = [
      "function balanceOf(address owner) view returns (uint256)",
      "function decimals() view returns (uint8)",
    ];

    const usdcContract = new ethers.Contract(usdcAddress, usdcAbi, provider);

    // Get USDC balance
    const usdcBalance = await usdcContract.balanceOf(walletAddress);
    const usdcDecimals = await usdcContract.decimals();
    const usdcAmount = parseFloat(
      ethers.formatUnits(usdcBalance, usdcDecimals)
    );

    // For now, return placeholder token data
    // In a full implementation, you would query CTF token balances
    const tokens: Array<{ tokenId: string; amount: number; marketId: string }> =
      [];

    return {
      usdc: usdcAmount,
      tokens,
    };
  } catch (error) {
    console.error("Error getting wallet balance:", error);
    return {
      usdc: 0,
      tokens: [],
    };
  }
}
