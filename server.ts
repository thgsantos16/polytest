import { createServer } from "http";
import { parse } from "url";
import next from "next";
import dotenv from "dotenv";

// Load environment variables FIRST
dotenv.config({ path: ".env.local" });

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  console.log("🚀 Starting Polymarket Bot Server...");

  // Start the Telegram bot and monitoring after Next.js is ready
  console.log("🤖 Initializing Telegram bot...");

  try {
    // Dynamically import services after environment is loaded
    const { telegramBotService } = await import(
      "./src/services/telegram-bot-service"
    );
    console.log("✅ Telegram bot initialized successfully");

    const { walletMonitorService } = await import(
      "./src/services/wallet-monitor-service"
    );
    console.log("📡 Starting wallet monitoring...");

    await walletMonitorService.startMonitoring();
    console.log("✅ Wallet monitoring started successfully");
  } catch (error) {
    console.error("❌ Failed to initialize services:", error);
  }

  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url || "", true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  })
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
