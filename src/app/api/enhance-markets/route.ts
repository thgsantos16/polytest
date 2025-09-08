import { NextRequest, NextResponse } from "next/server";
import { prismaStorageService } from "@/services/prisma-storage-service";

export async function POST(request: NextRequest) {
  try {
    console.log("Starting market enhancement process...");

    await prismaStorageService.enhanceAllMarketsWithTokenIds();

    return NextResponse.json({
      success: true,
      message: "Markets enhanced successfully with token IDs",
    });
  } catch (error) {
    console.error("Error enhancing markets:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to enhance markets",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
