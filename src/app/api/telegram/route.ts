import { NextRequest, NextResponse } from "next/server";
import { telegramBotService } from "@/services/telegram-bot-service";
import { initializeBot } from "@/services/bot-initializer";

export async function POST(request: NextRequest) {
  try {
    // Initialize bot if not already done
    initializeBot();

    const body = await request.json();

    // Handle Telegram webhook updates
    if (body.update_id && body.message) {
      // Process the message through our bot service
      await telegramBotService.processUpdate(body);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Initialize bot if not already done
  initializeBot();

  return NextResponse.json({
    message: "Telegram bot webhook endpoint",
    status: "active",
  });
}
