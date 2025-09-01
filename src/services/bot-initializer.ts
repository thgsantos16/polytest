import { telegramBotService } from "./telegram-bot-service";

let botInitialized = false;

export function initializeBot(): void {
  if (botInitialized) {
    console.log("Bot already initialized");
    return;
  }

  try {
    // Force the bot to start by accessing the service
    console.log("Initializing Telegram bot...");
    const bot = telegramBotService;
    console.log("Bot service accessed successfully");
    botInitialized = true;
  } catch (error) {
    console.error("Failed to initialize Telegram bot:", error);
    botInitialized = false;
  }
}

export function stopBot(): void {
  try {
    telegramBotService.stop();
    botInitialized = false;
    console.log("Telegram bot stopped");
  } catch (error) {
    console.error("Failed to stop Telegram bot:", error);
  }
}

// Initialize bot when this module is imported
initializeBot();
