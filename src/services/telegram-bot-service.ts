import TelegramBot from "node-telegram-bot-api";
import { prismaStorageService } from "./prisma-storage-service";
import { polymarketService } from "./polymarket-service";
import { walletMonitorService } from "./wallet-monitor-service";
import { WalletClient } from "viem";
import { ethers } from "ethers";

interface TelegramUpdate {
  update_id: number;
  message?: TelegramBot.Message;
  callback_query?: TelegramBot.CallbackQuery;
}

export interface BotCommand {
  command: string;
  description: string;
  handler: (msg: TelegramBot.Message) => Promise<void>;
}

export class TelegramBotService {
  private bot: TelegramBot;
  private commands: Map<string, BotCommand> = new Map();

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error("TELEGRAM_BOT_TOKEN environment variable is required");
    }

    console.log(
      "Creating Telegram bot with token:",
      token.substring(0, 10) + "..."
    );

    try {
      // For serverless environments, don't start polling
      this.bot = new TelegramBot(token, {
        polling: false, // Disable polling for serverless
      });
      console.log("Telegram bot instance created successfully");

      this.initializeCommands();
      console.log("Commands initialized");

      this.setupBot();
      console.log("Bot setup completed");
    } catch (error) {
      console.error("Error in TelegramBotService constructor:", error);
      throw error;
    }
  }

  private initializeCommands(): void {
    this.commands.set("/start", {
      command: "/start",
      description: "Start the bot and create your wallet",
      handler: this.handleStart.bind(this),
    });

    this.commands.set("/wallet", {
      command: "/wallet",
      description: "Show your wallet address and balance",
      handler: this.handleWallet.bind(this),
    });

    this.commands.set("/markets", {
      command: "/markets",
      description: "List available markets",
      handler: this.handleMarkets.bind(this),
    });

    this.commands.set("/positions", {
      command: "/positions",
      description: "Show your current positions",
      handler: this.handlePositions.bind(this),
    });

    this.commands.set("/trade", {
      command: "/trade",
      description:
        "Place a trade (usage: /trade <market_id> <side> <amount> <price>)",
      handler: this.handleTrade.bind(this),
    });

    this.commands.set("/help", {
      command: "/help",
      description: "Show available commands",
      handler: this.handleHelp.bind(this),
    });

    this.commands.set("/delete", {
      command: "/delete",
      description: "Delete your account and wallet (irreversible)",
      handler: this.handleDelete.bind(this),
    });

    this.commands.set("/balance", {
      command: "/balance",
      description: "Check your wallet balances across all chains",
      handler: this.handleBalance.bind(this),
    });

    this.commands.set("/monitor", {
      command: "/monitor",
      description: "Start/stop wallet monitoring for transfers",
      handler: this.handleMonitor.bind(this),
    });

    this.commands.set("/cache", {
      command: "/cache",
      description: "Check markets cache status",
      handler: this.handleCache.bind(this),
    });

    this.commands.set("/cache_clear", {
      command: "/cache_clear",
      description: "Clear markets cache (admin only)",
      handler: this.handleCacheClear.bind(this),
    });
  }

  private setupBot(): void {
    // Handle commands
    this.bot.onText(/\/\w+/, async (msg) => {
      const command = msg.text?.split(" ")[0];
      if (command && this.commands.has(command)) {
        try {
          await this.commands.get(command)!.handler(msg);
        } catch (error) {
          console.error(`Error handling command ${command}:`, error);
          await this.bot.sendMessage(
            msg.chat.id,
            "❌ An error occurred. Please try again."
          );
        }
      }
    });

    // Handle callback queries (button clicks)
    this.bot.on("callback_query", async (callbackQuery) => {
      try {
        console.log("Callback query received:", callbackQuery);

        const data = callbackQuery.data;
        if (data?.startsWith("t_")) {
          await this.handleTradeButton(callbackQuery);
        } else if (data?.startsWith("amount_")) {
          await this.handleAmountButton(callbackQuery);
        } else if (data?.startsWith("confirm_")) {
          await this.handleConfirmTrade(callbackQuery);
        } else if (data === "markets") {
          await this.handleMarketsCallback(callbackQuery);
        } else if (data === "cancel") {
          await this.bot.answerCallbackQuery(callbackQuery.id, {
            text: "❌ Trade cancelled",
          });
        }
      } catch (error) {
        console.error("Error handling callback query:", error);
        await this.bot.answerCallbackQuery(callbackQuery.id, {
          text: "❌ An error occurred. Please try again.",
        });
      }
    });

    // Handle unknown commands
    this.bot.on("message", async (msg) => {
      if (
        msg.text &&
        msg.text.startsWith("/") &&
        !this.commands.has(msg.text.split(" ")[0])
      ) {
        await this.bot.sendMessage(
          msg.chat.id,
          "❌ Unknown command. Use /help to see available commands."
        );
      }
    });

    console.log("Telegram bot started successfully");

    // Add error handling for polling
    this.bot.on("polling_error", (error) => {
      console.error("Telegram polling error:", error);

      // Don't restart if it's a conflict error (multiple instances)
      if (error.message.includes("409 Conflict")) {
        console.log(
          "Multiple bot instances detected - stopping restart attempts"
        );
        return;
      }

      // Restart polling after a delay for other errors
      setTimeout(() => {
        console.log("Restarting Telegram polling...");
        this.bot.stopPolling().then(() => {
          this.bot.startPolling();
        });
      }, 10000); // Increased delay to 10 seconds
    });
  }

  private async handleStart(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();

    if (!telegramId) {
      await this.bot.sendMessage(chatId, "❌ Could not identify user.");
      return;
    }

    try {
      // Create or get user
      const userId = await prismaStorageService.createOrGetUser(telegramId, {
        telegramId,
        username: msg.from?.username,
        firstName: msg.from?.first_name,
        lastName: msg.from?.last_name,
      });

      // Check if user already has a wallet
      let wallet = await prismaStorageService.getWalletByTelegramId(telegramId);

      if (!wallet) {
        // Create new wallet with real keypair
        const ethersWallet = ethers.Wallet.createRandom();
        const walletAddress = ethersWallet.address;
        const privateKey = ethersWallet.privateKey;

        // Encrypt the private key
        const { encryptedPrivateKey, iv } =
          prismaStorageService.encryptPrivateKey(privateKey);

        wallet = await prismaStorageService.createWallet({
          userId,
          walletAddress,
          encryptedPrivateKey,
          encryptionIV: iv,
        });

        if (!wallet) {
          await this.bot.sendMessage(
            chatId,
            "❌ Failed to create wallet. Please try again."
          );
          return;
        }

        await this.bot.sendMessage(
          chatId,
          `🎉 Welcome! Your wallet has been created successfully.\n\n` +
            `📍 Wallet Address: ${wallet.walletAddress}\n\n` +
            `⚠️ **Important Security Notice:**\n` +
            `• Your private key is encrypted and stored securely\n` +
            `• Never share your wallet address with others\n` +
            `• Use /help to see available commands`
        );
      } else {
        await this.bot.sendMessage(
          chatId,
          `👋 Welcome back! Your wallet is ready.\n\n` +
            `📍 Wallet Address: \`${wallet.walletAddress}\`\n\n` +
            `Use /help to see available commands.`
        );
      }
    } catch (error) {
      console.error("Error in handleStart:", error);
      await this.bot.sendMessage(
        chatId,
        "❌ Failed to initialize wallet. Please try again."
      );
    }
  }

  private async handleWallet(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();

    if (!telegramId) {
      await this.bot.sendMessage(chatId, "❌ Could not identify user.");
      return;
    }

    try {
      const wallet = await prismaStorageService.getWalletByTelegramId(
        telegramId
      );

      if (!wallet) {
        await this.bot.sendMessage(
          chatId,
          "❌ No wallet found. Use /start to create your wallet first."
        );
        return;
      }

      // Get wallet balance (this would need to be implemented with actual blockchain queries)
      const balance = await this.getWalletBalance(wallet.walletAddress);

      await this.bot.sendMessage(
        chatId,
        `💰 **Wallet Information**\n\n` +
          `📍 Address: ${wallet.walletAddress}\n` +
          `💎 POL Balance: ${balance.pol.toFixed(6)}\n` +
          `💵 USDC Balance: $${balance.usdc.toFixed(2)}\n` +
          `📊 Token Positions: ${balance.tokens.length}\n\n` +
          `🕒 Last Used: ${new Date(wallet.lastUsed).toLocaleString()}`
      );
    } catch (error) {
      console.error("Error in handleWallet:", error);
      await this.bot.sendMessage(
        chatId,
        "❌ Failed to get wallet information."
      );
    }
  }

  private async handleMarkets(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;

    try {
      await this.bot.sendMessage(chatId, "📊 Fetching markets...");

      const markets = await polymarketService.fetchMarkets();

      if (markets.length === 0) {
        await this.bot.sendMessage(
          chatId,
          "❌ No markets available at the moment."
        );
        return;
      }

      // Send first 5 markets with interactive buttons
      const marketsList = markets
        .slice(0, 5)
        .map((market, index) => {
          const endDate = new Date(market.endDate).toLocaleDateString();
          return (
            `${index + 1}. **${market.question}**\n` +
            `   💰 Yes: $${market.yesPrice.toFixed(
              3
            )} | No: $${market.noPrice.toFixed(3)}\n` +
            `   📅 Ends: ${endDate}`
          );
        })
        .join("\n\n");

      // Create inline keyboard for each market
      const keyboard = markets.slice(0, 5).map((market) => [
        {
          text: `📈 Buy ${market.question.slice(0, 20)}...`,
          callback_data: `t_${market.cuid}_b`, // Use .cuid instead of .id
        },
        {
          text: `📉 Sell ${market.question.slice(0, 20)}...`,
          callback_data: `t_${market.cuid}_s`, // Use .cuid instead of .id
        },
      ]);

      await this.bot.sendMessage(
        chatId,
        `📊 **Available Markets**\n\n${marketsList}\n\n` +
          `Click the buttons below to trade quickly!`,
        {
          reply_markup: {
            inline_keyboard: keyboard,
          },
        }
      );
    } catch (error) {
      console.error("Error in handleMarkets:", error);
      await this.bot.sendMessage(chatId, "❌ Failed to fetch markets.");
    }
  }

  private async handlePositions(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();

    if (!telegramId) {
      await this.bot.sendMessage(chatId, "❌ Could not identify user.");
      return;
    }

    try {
      const positions = await prismaStorageService.getUserPositionsByTelegramId(
        telegramId
      );

      if (positions.length === 0) {
        await this.bot.sendMessage(chatId, "📊 You have no open positions.");
        return;
      }

      const positionsList = positions
        .map((pos, index) => {
          const date = new Date(pos.createdAt).toLocaleDateString();
          return (
            `${index + 1}. **${pos.side.toUpperCase()}** ${
              pos.amount
            } tokens\n` +
            `   💰 Price: $${pos.price.toFixed(3)}\n` +
            `   🆔 Market: \`${pos.marketId}\`\n` +
            `   📅 Date: ${date}`
          );
        })
        .join("\n\n");

      await this.bot.sendMessage(
        chatId,
        `📊 **Your Positions**\n\n${positionsList}`
      );
    } catch (error) {
      console.error("Error in handlePositions:", error);
      await this.bot.sendMessage(chatId, "❌ Failed to fetch positions.");
    }
  }

  private async handleTrade(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();

    if (!telegramId) {
      await this.bot.sendMessage(chatId, "❌ Could not identify user.");
      return;
    }

    const args = msg.text?.split(" ").slice(1);

    if (!args || args.length !== 4) {
      await this.bot.sendMessage(
        chatId,
        "❌ Invalid format. Use: /trade <market_id> <side> <amount> <price>\n" +
          "Example: `/trade abc123... buy 10 0.5`"
      );
      return;
    }

    const [marketId, side, amountStr, priceStr] = args;

    if (!["buy", "sell"].includes(side.toLowerCase())) {
      await this.bot.sendMessage(chatId, '❌ Side must be "buy" or "sell".');
      return;
    }

    const amount = parseFloat(amountStr);
    const price = parseFloat(priceStr);

    if (isNaN(amount) || isNaN(price) || amount <= 0 || price <= 0) {
      await this.bot.sendMessage(
        chatId,
        "❌ Amount and price must be positive numbers."
      );
      return;
    }

    try {
      await this.bot.sendMessage(chatId, "🔄 Processing your trade...");

      const wallet = await prismaStorageService.getWalletByTelegramId(
        telegramId
      );
      if (!wallet) {
        await this.bot.sendMessage(
          chatId,
          "❌ No wallet found. Use /start to create your wallet first."
        );
        return;
      }

      // Get market details from database using CUID
      const market = await prismaStorageService.getMarketById(marketId);

      if (!market) {
        await this.bot.sendMessage(chatId, "❌ Market not found.");
        return;
      }

      const tokenId =
        side.toLowerCase() === "buy" ? market.yesTokenId : market.noTokenId;

      if (!tokenId) {
        await this.bot.sendMessage(
          chatId,
          "❌ Could not determine token ID for this market."
        );
        return;
      }

      // Create wallet signer
      const signer = await prismaStorageService.getWalletSignerByTelegramId(
        telegramId
      );
      if (!signer) {
        await this.bot.sendMessage(chatId, "❌ Failed to access wallet.");
        return;
      }

      // Place order
      const orderDetails = {
        marketId,
        tokenId,
        side: side.toLowerCase() as "buy" | "sell",
        price,
        size: amount,
        walletAddress: wallet.walletAddress,
      };

      const result = await polymarketService.placeOrder(
        orderDetails,
        signer as unknown as WalletClient
      );

      if (result.success) {
        // Get user ID for saving position
        const user = await prismaStorageService.createOrGetUser(telegramId, {
          telegramId,
          username: undefined,
          firstName: undefined,
          lastName: undefined,
        });

        // Save position to database
        await prismaStorageService.savePosition(
          { id: user },
          {
            userId: user,
            marketId,
            tokenId,
            amount,
            side: side.toLowerCase() as "buy" | "sell",
            price,
          }
        );

        await this.bot.sendMessage(
          chatId,
          `✅ **Trade Successful!**\n\n` +
            `📊 Market: ${market.question}\n` +
            `🔄 Side: ${side.toUpperCase()}\n` +
            `💰 Amount: ${amount} tokens\n` +
            `💵 Price: $${price}\n` +
            `🆔 Order ID: \`${result.orderId}\``
        );
      } else {
        await this.bot.sendMessage(
          chatId,
          `❌ **Trade Failed**\n\n${result.message}`
        );
      }
    } catch (error) {
      console.error("Error in handleTrade:", error);
      await this.bot.sendMessage(
        chatId,
        "❌ Failed to place trade. Please try again."
      );
    }
  }

  private async handleHelp(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;

    const helpText =
      `🤖 **Polymarket Bot Commands**\n\n` +
      `📝 **Available Commands:**\n\n` +
      `/start - Create your wallet and get started\n` +
      `/wallet - View your wallet address and balance\n` +
      `/balance - Check balances across all chains\n` +
      `/markets - List available markets (with buttons!)\n` +
      `/positions - Show your current positions\n` +
      `/trade - Place a trade\n` +
      `/help - Show this help message\n` +
      `/delete - Delete your account (irreversible)\n\n` +
      `💡 **Quick Trading:**\n` +
      `Use /markets to see interactive buttons for fast trading!\n\n` +
      `🔔 **Transfer Monitoring:**\n` +
      ` **Markets Cache:**\n` +
      `Markets data is cached for 5 minutes and shared across all users for faster responses!\n\n` +
      `⚠️ **Security:**\n` +
      `• Your private keys are encrypted and stored securely\n` +
      `• Never share your wallet address with others\n` +
      `• Use /delete to remove your data if needed`;

    await this.bot.sendMessage(chatId, helpText, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "📊 View Markets",
              callback_data: "markets",
            },
          ],
        ],
      },
    });
  }

  private async handleDelete(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();

    if (!telegramId) {
      await this.bot.sendMessage(chatId, "❌ Could not identify user.");
      return;
    }

    try {
      await prismaStorageService.deleteUserByTelegramId(telegramId);
      await this.bot.sendMessage(
        chatId,
        "🗑️ **Account Deleted**\n\n" +
          "Your wallet and all associated data have been permanently deleted.\n" +
          "Use /start to create a new wallet if needed."
      );
    } catch (error) {
      console.error("Error in handleDelete:", error);
      await this.bot.sendMessage(chatId, "❌ Failed to delete account.");
    }
  }

  private async handleBalance(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();

    if (!telegramId) {
      await this.bot.sendMessage(chatId, "❌ Could not identify user.");
      return;
    }

    try {
      await this.bot.sendMessage(chatId, "💰 Fetching your balances...");

      const balances = await walletMonitorService.getWalletBalanceForUser(
        telegramId
      );

      if (balances.length === 0) {
        await this.bot.sendMessage(chatId, "❌ No balances found.");
        return;
      }

      const balanceText = balances
        .map((balance) => {
          return (
            `🌐 **${balance.chain.toUpperCase()}**\n` +
            `   💎 POL: ${parseFloat(balance.pol).toFixed(6)}\n` +
            `   💵 USDC: ${parseFloat(balance.usdc).toFixed(2)}`
          );
        })
        .join("\n\n");

      await this.bot.sendMessage(
        chatId,
        `💰 **Your Wallet Balances**\n\n${balanceText}`
      );
    } catch (error) {
      console.error("Error in handleBalance:", error);
      await this.bot.sendMessage(chatId, "❌ Failed to fetch balances.");
    }
  }

  private async handleMonitor(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();

    if (!telegramId) {
      await this.bot.sendMessage(chatId, "❌ Could not identify user.");
      return;
    }

    try {
      const isActive = walletMonitorService.isActive();

      if (isActive) {
        walletMonitorService.stopMonitoring();
        await this.bot.sendMessage(
          chatId,
          "🛑 **Monitoring Stopped**\n\n" +
            "Wallet monitoring has been stopped. You won't receive transfer notifications."
        );
      } else {
        await walletMonitorService.startMonitoring();
        await this.bot.sendMessage(
          chatId,
          "🚀 **Monitoring Started**\n\n" +
            "Your wallet is now being monitored for incoming transfers!\n" +
            "You'll receive notifications for:\n" +
            "• MATIC transfers\n" +
            "• USDC transfers\n" +
            "• POL transfers\n" +
            "• On Polygon network (Polymarket's primary chain)"
        );
      }
    } catch (error) {
      console.error("Error in handleMonitor:", error);
      await this.bot.sendMessage(chatId, "❌ Failed to toggle monitoring.");
    }
  }

  private async handleCache(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();

    if (!telegramId) {
      await this.bot.sendMessage(chatId, "❌ Could not identify user.");
      return;
    }

    try {
      const cacheStatus = await polymarketService.getCacheStatus();

      let statusText = "📊 **Markets Cache Status**\n\n";

      if (cacheStatus.hasCache) {
        const ageMinutes = Math.floor(cacheStatus.age / 1000 / 60);
        const ttlMinutes = Math.floor(cacheStatus.ttl / 1000 / 60);
        const remainingMinutes = ttlMinutes - ageMinutes;

        statusText += `✅ **Cache Status:** Active\n`;
        statusText += `🕒 **Cache Age:** ${ageMinutes} minutes\n`;
        statusText += `⏰ **Time Remaining:** ${remainingMinutes} minutes\n`;
        statusText += `🔄 **Next Refresh:** In ${remainingMinutes} minutes\n\n`;

        if (remainingMinutes <= 1) {
          statusText += `⚠️ Cache will expire soon!\n\n`;
        }
      } else {
        statusText += `❌ **Cache Status:** No cached data\n`;
        statusText += `🔄 **Next Request:** Will fetch fresh data\n\n`;
      }

      statusText += `💡 **Cache Benefits:**\n`;
      statusText += `• Faster response times for all users\n`;
      statusText += `• Reduced API calls to Polymarket\n`;
      statusText += `• Shared across all bot users\n`;
      statusText += `• Auto-refreshes every 5 minutes\n\n`;

      statusText += `🔧 **Cache Commands:**\n`;
      statusText += `• /cache - Show this status\n`;
      statusText += `• /cache_clear - Clear cache\n`;
      statusText += `• /markets - Uses cached data if available`;

      await this.bot.sendMessage(chatId, statusText);
    } catch (error) {
      console.error("Error in handleCache:", error);
      await this.bot.sendMessage(chatId, "❌ Failed to get cache status.");
    }
  }

  private async handleCacheClear(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();

    if (!telegramId) {
      await this.bot.sendMessage(chatId, "❌ Could not identify user.");
      return;
    }

    try {
      polymarketService.clearCache();

      await this.bot.sendMessage(
        chatId,
        "🗑️ **Cache Cleared Successfully**\n\n" +
          "The markets cache has been cleared.\n" +
          "The next /markets request will fetch fresh data from Polymarket."
      );
    } catch (error) {
      console.error("Error in handleCacheClear:", error);
      await this.bot.sendMessage(chatId, "❌ Failed to clear cache.");
    }
  }

  private async handleTradeButton(
    callbackQuery: TelegramBot.CallbackQuery
  ): Promise<void> {
    const chatId = callbackQuery.message?.chat.id;
    const telegramId = callbackQuery.from?.id.toString();

    if (!chatId || !telegramId) {
      await this.bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Could not identify user.",
      });
      return;
    }

    const data = callbackQuery.data;
    if (!data) return;

    const [, marketCuid, side] = data.split("_");

    // Give immediate feedback
    await this.bot.answerCallbackQuery(callbackQuery.id, {
      text: "🔄 Fetching market details...",
    });

    // Get market details from database using CUID
    const market = await prismaStorageService.getMarketById(marketCuid);

    if (!market) {
      await this.bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Market not found.",
      });
      return;
    }

    // Create amount selection keyboard
    const amounts = [1, 10, 50, 100, 500];
    const keyboard = amounts.map((amount) => [
      {
        text: `$${amount}`,
        callback_data: `amount_${marketCuid}_${side}_${amount}`,
      },
    ]);

    await this.bot.editMessageText(
      `💰 **Select Amount for ${side.toUpperCase()}**\n\n` +
        `📊 Market: ${market.question}\n` +
        `💵 Current Price: $${
          side === "buy" ? market.yesPrice : market.noPrice
        }\n\n` +
        `Choose your trade amount:`,
      {
        chat_id: chatId,
        message_id: callbackQuery.message?.message_id,
        reply_markup: {
          inline_keyboard: keyboard,
        },
      }
    );

    await this.bot.answerCallbackQuery(callbackQuery.id);
  }

  private async handleAmountButton(
    callbackQuery: TelegramBot.CallbackQuery
  ): Promise<void> {
    const chatId = callbackQuery.message?.chat.id;
    const telegramId = callbackQuery.from?.id.toString();

    if (!chatId || !telegramId) {
      await this.bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Could not identify user.",
      });
      return;
    }

    const data = callbackQuery.data;
    if (!data) return;

    const [, marketCuid, side, amount] = data.split("_");

    // Give immediate feedback
    await this.bot.answerCallbackQuery(callbackQuery.id, {
      text: "🔄 Processing amount selection...",
    });

    // Get market details from database using CUID
    const market = await prismaStorageService.getMarketById(marketCuid);

    if (!market) {
      await this.bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Market not found.",
      });
      return;
    }

    const price = side === "buy" ? market.yesPrice : market.noPrice;
    const totalCost = parseFloat(amount) * price;

    // Create confirmation keyboard
    const keyboard = [
      [
        {
          text: "✅ Confirm Trade",
          callback_data: `confirm_${marketCuid}_${side}_${amount}_${price}`,
        },
      ],
      [
        {
          text: "❌ Cancel",
          callback_data: "cancel",
        },
      ],
    ];

    await this.bot.editMessageText(
      `🤝 **Confirm Your Trade**\n\n` +
        `📊 Market: ${market.question}\n` +
        `🔄 Side: ${side.toUpperCase()}\n` +
        `💰 Amount: $${amount}\n` +
        `💵 Price: $${price.toFixed(4)}\n` +
        `💸 Total Cost: $${totalCost.toFixed(2)}\n\n` +
        `Please confirm your trade:`,
      {
        chat_id: chatId,
        message_id: callbackQuery.message?.message_id,
        reply_markup: {
          inline_keyboard: keyboard,
        },
      }
    );

    await this.bot.answerCallbackQuery(callbackQuery.id);
  }

  private async handleConfirmTrade(
    callbackQuery: TelegramBot.CallbackQuery
  ): Promise<void> {
    const chatId = callbackQuery.message?.chat.id;
    const telegramId = callbackQuery.from?.id.toString();

    if (!chatId || !telegramId) {
      await this.bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Could not identify user.",
      });
      return;
    }

    const data = callbackQuery.data;
    if (!data) return;

    const [, marketCuid, side, amount, price] = data.split("_");

    // Give immediate feedback
    await this.bot.answerCallbackQuery(callbackQuery.id, {
      text: "🔄 Processing trade confirmation...",
    });

    try {
      // Get wallet
      const wallet = await prismaStorageService.getWalletByTelegramId(
        telegramId
      );
      if (!wallet) {
        await this.bot.answerCallbackQuery(callbackQuery.id, {
          text: "❌ No wallet found. Use /start first.",
        });
        return;
      }

      // Get market details from database using CUID
      const market = await prismaStorageService.getMarketById(marketCuid);

      if (!market) {
        await this.bot.answerCallbackQuery(callbackQuery.id, {
          text: "❌ Market not found.",
        });
        return;
      }

      const tokenId = side === "buy" ? market.yesTokenId : market.noTokenId;

      if (!tokenId) {
        await this.bot.answerCallbackQuery(callbackQuery.id, {
          text: "❌ Could not determine token ID.",
        });
        return;
      }

      // Create wallet signer
      const signer = await prismaStorageService.getWalletSignerByTelegramId(
        telegramId
      );
      if (!signer) {
        await this.bot.answerCallbackQuery(callbackQuery.id, {
          text: "❌ Failed to access wallet.",
        });
        return;
      }

      // Place order
      const orderDetails = {
        marketId: marketCuid,
        tokenId,
        side: side as "buy" | "sell",
        price: parseFloat(price),
        size: parseFloat(amount),
        walletAddress: wallet.walletAddress,
      };

      const result = await polymarketService.placeOrder(
        orderDetails,
        signer as unknown as WalletClient
      );

      if (result.success) {
        // Save position to database
        const user = await prismaStorageService.createOrGetUser(telegramId, {
          telegramId,
          username: undefined,
          firstName: undefined,
          lastName: undefined,
        });
        await prismaStorageService.savePosition(
          { id: user },
          {
            userId: user,
            marketId: marketCuid,
            tokenId,
            amount: parseFloat(amount),
            side: side as "buy" | "sell",
            price: parseFloat(price),
          }
        );

        await this.bot.editMessageText(
          `✅ **Trade Successful!**\n\n` +
            `📊 Market: ${market.question}\n` +
            `🔄 Side: ${side.toUpperCase()}\n` +
            `💰 Amount: $${amount}\n` +
            `💵 Price: $${price}\n` +
            `🆔 Order ID: \`${result.orderId}\``,
          {
            chat_id: chatId,
            message_id: callbackQuery.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "📊 View Markets",
                    callback_data: "markets",
                  },
                ],
              ],
            },
          }
        );
      } else {
        await this.bot.editMessageText(
          `❌ **Trade Failed**\n\n${result.message}`,
          {
            chat_id: chatId,
            message_id: callbackQuery.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🔄 Try Again",
                    callback_data: "markets",
                  },
                ],
              ],
            },
          }
        );
      }

      await this.bot.answerCallbackQuery(callbackQuery.id, {
        text: result.success ? "✅ Trade completed!" : "❌ Trade failed",
      });
    } catch (error) {
      console.error("Error in handleConfirmTrade:", error);
      await this.bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Trade failed. Please try again.",
      });
    }
  }

  private async handleMarketsCallback(
    callbackQuery: TelegramBot.CallbackQuery
  ): Promise<void> {
    const chatId = callbackQuery.message?.chat.id;

    if (!chatId) {
      await this.bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Could not identify chat.",
      });
      return;
    }

    try {
      const markets = await polymarketService.fetchMarkets();

      if (markets.length === 0) {
        await this.bot.editMessageText(
          "❌ No markets available at the moment.",
          {
            chat_id: chatId,
            message_id: callbackQuery.message?.message_id,
          }
        );
        return;
      }

      // Send first 5 markets with interactive buttons
      const marketsList = markets
        .slice(0, 5)
        .map((market, index) => {
          const endDate = new Date(market.endDate).toLocaleDateString();
          return (
            `${index + 1}. **${market.question}**\n` +
            `   💰 Yes: $${market.yesPrice.toFixed(
              3
            )} | No: $${market.noPrice.toFixed(3)}\n` +
            `   📅 Ends: ${endDate}`
          );
        })
        .join("\n\n");

      // Create inline keyboard for each market
      const keyboard = markets.slice(0, 5).map((market) => [
        {
          text: `📈 Buy ${market.question.slice(0, 20)}...`,
          callback_data: `t_${market.cuid}_b`, // Use .cuid instead of .id
        },
        {
          text: `📉 Sell ${market.question.slice(0, 20)}...`,
          callback_data: `t_${market.cuid}_s`, // Use .cuid instead of .id
        },
      ]);

      await this.bot.editMessageText(
        `📊 **Available Markets**\n\n${marketsList}\n\n` +
          `Click the buttons below to trade quickly!`,
        {
          chat_id: chatId,
          message_id: callbackQuery.message?.message_id,
          reply_markup: {
            inline_keyboard: keyboard,
          },
        }
      );

      await this.bot.answerCallbackQuery(callbackQuery.id);
    } catch (error) {
      console.error("Error in handleMarketsCallback:", error);
      await this.bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Failed to fetch markets.",
      });
    }
  }

  private async getWalletBalance(walletAddress: string): Promise<{
    usdc: number;
    pol: number;
    tokens: Array<{ tokenId: string; amount: number; marketId: string }>;
  }> {
    try {
      // Get balances from the wallet monitor service
      const balances = await walletMonitorService.getWalletBalances(
        walletAddress
      );

      // Find Polygon balance (primary chain for Polymarket)
      const polygonBalance = balances.find((b) => b.chain === "polygon");
      const usdcBalance = polygonBalance ? parseFloat(polygonBalance.usdc) : 0;
      const polBalance = polygonBalance ? parseFloat(polygonBalance.pol) : 0;

      // For now, return empty tokens array since we need telegram ID to get positions
      // In a real implementation, you might want to store wallet address -> telegram ID mapping
      const tokens: Array<{
        tokenId: string;
        amount: number;
        marketId: string;
      }> = [];

      return {
        usdc: usdcBalance,
        pol: polBalance,
        tokens,
      };
    } catch (error) {
      console.error("Error getting wallet balance:", error);
      return {
        usdc: 0,
        pol: 0,
        tokens: [],
      };
    }
  }

  async processUpdate(update: TelegramUpdate): Promise<void> {
    console.log("Processing update:", JSON.stringify(update, null, 2));

    if (update.message) {
      const command = update.message.text?.split(" ")[0];
      console.log(`Received command: ${command}`);

      if (command && this.commands.has(command)) {
        try {
          console.log(`Executing command: ${command}`);
          await this.commands.get(command)!.handler(update.message);
        } catch (error) {
          console.error(`Error handling command ${command}:`, error);
          await this.bot.sendMessage(
            update.message.chat.id,
            "❌ An error occurred. Please try again."
          );
        }
      } else {
        console.log(`Unknown command: ${command}`);
        await this.bot.sendMessage(
          update.message.chat.id,
          "❌ Unknown command. Use /help to see available commands."
        );
      }
    } else if (update.callback_query) {
      // Handle callback queries (button clicks)
      try {
        console.log(
          "[Process Update] Callback query received:",
          update.callback_query
        );

        const data = update.callback_query.data;
        if (data?.startsWith("t_")) {
          await this.handleTradeButton(update.callback_query);
        } else if (data?.startsWith("amount_")) {
          await this.handleAmountButton(update.callback_query);
        } else if (data?.startsWith("confirm_")) {
          await this.handleConfirmTrade(update.callback_query);
        } else if (data === "markets") {
          await this.handleMarketsCallback(update.callback_query);
        } else if (data === "cancel") {
          await this.bot.answerCallbackQuery(update.callback_query.id, {
            text: "❌ Trade cancelled",
          });
        }
      } catch (error) {
        console.error("Error handling callback query:", error);
        await this.bot.answerCallbackQuery(update.callback_query.id, {
          text: "❌ An error occurred. Please try again.",
        });
      }
    }
  }

  async sendMessage(chatId: string, message: string): Promise<void> {
    try {
      await this.bot.sendMessage(chatId, message);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  stop(): void {
    this.bot.stopPolling();
    prismaStorageService.disconnect();
  }
}

export const telegramBotService = new TelegramBotService();
