import { NextRequest, NextResponse } from "next/server";
import { telegramBotService } from "@/services/telegram-bot-service";
import { initializeBot } from "@/services/bot-initializer";

export async function POST(request: NextRequest) {
  try {
    // Initialize bot if not already done
    initializeBot();

    const body = await request.json();
    const { chatId, message, marketCuid, side } = body;

    if (!chatId) {
      return NextResponse.json(
        { error: "chatId is required" },
        { status: 400 }
      );
    }

    if (message) {
      // Send a simple text message
      await telegramBotService.sendMessage(chatId, message);
    } else if (marketCuid && side) {
      // Simulate a trade button click
      const callbackData = `t_${marketCuid}_${side}`;

      // Create a mock callback query to simulate button click
      const mockCallbackQuery = {
        id: `test_${Date.now()}`,
        from: { id: parseInt(chatId), is_bot: false, first_name: "Test User" },
        message: {
          message_id: 1,
          from: {
            id: parseInt(chatId),
            is_bot: false,
            first_name: "Test User",
          },
          chat: { id: parseInt(chatId), type: "private" as const },
          date: Math.floor(Date.now() / 1000),
          text: "Test message",
        },
        data: callbackData,
        chat_instance: "test_instance", // Add this required property
      };

      // Process the mock callback query
      await telegramBotService.processUpdate({
        update_id: Date.now(),
        callback_query: mockCallbackQuery,
      });
    } else {
      return NextResponse.json(
        { error: "Either message or marketCuid+side is required" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Telegram send message error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
