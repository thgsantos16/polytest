import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env") });

// Log current environment
console.log("🔧 Environment setup complete");
console.log("NODE_ENV:", process.env.NODE_ENV || "Not set");
console.log("Database URL:", process.env.DATABASE_URL ? "Set" : "Not set");
