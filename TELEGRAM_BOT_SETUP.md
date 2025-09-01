# Telegram Bot Setup Guide

This guide will help you set up the Telegram bot for your Polymarket trading application using Prisma for database management.

## Prerequisites

1. **Telegram Bot Token**: You need to create a bot through [@BotFather](https://t.me/botfather) on Telegram
2. **Node.js and pnpm**: Make sure you have the latest versions installed
3. **Environment Variables**: Set up the required environment variables

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# Wallet Security (Generate a secure 32-character key)
WALLET_ENCRYPTION_KEY=your_32_character_encryption_key_here

# Database Configuration
DATABASE_URL="file:./dev.db"

# Blockchain Configuration
POLYGON_RPC_URL=https://polygon-rpc.com

# Optional: Use a different RPC endpoint for better performance
# POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/your_alchemy_key
```

## Getting Your Telegram Bot Token

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Follow the instructions to create your bot
4. Copy the token provided by BotFather
5. Paste it in your `.env.local` file

## Generating Encryption Key

For the `WALLET_ENCRYPTION_KEY`, generate a secure 32-character key:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Or use an online generator (less secure)
# https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx
```

## Installation

1. Install dependencies:
```bash
pnpm install
```

2. Set up your environment variables (see above)

3. Generate Prisma client and set up database:
```bash
pnpm db:generate
pnpm db:push
```

4. Start the development server:
```bash
pnpm dev
```

## Bot Commands

Once the bot is running, users can interact with it using these commands:

- `/start` - Create your wallet and get started
- `/wallet` - View your wallet address and balance
- `/markets` - List available markets
- `/positions` - Show your current positions
- `/trade` - Place a trade (usage: `/trade <market_id> <side> <amount> <price>`)
- `/help` - Show available commands
- `/delete` - Delete your account (irreversible)

## Security Features

- **Encrypted Storage**: All private keys are encrypted using AES-256-CBC
- **Prisma ORM**: Type-safe database operations with SQLite
- **Secure Key Management**: Encryption keys are stored in environment variables
- **User Isolation**: Each user gets their own wallet and data

## Database Schema

The bot uses Prisma with three main models:

1. **User** - Telegram user information with relationships
2. **Wallet** - Encrypted wallet data with user relationship
3. **Position** - User trading positions with user relationship

## Database Management

- **Generate Client**: `pnpm db:generate` - Generate Prisma client
- **Push Schema**: `pnpm db:push` - Push schema changes to database
- **Create Migration**: `pnpm db:migrate` - Create and apply migrations
- **Open Studio**: `pnpm db:studio` - Open Prisma Studio for database management

## Production Deployment

For production deployment:

1. Use a strong, unique encryption key
2. Set up a proper database (PostgreSQL, MySQL) by changing the provider in `prisma/schema.prisma`
3. Use environment-specific RPC endpoints
4. Set up proper logging and monitoring
5. Consider using a webhook instead of polling for better performance
6. Run `pnpm db:migrate` to create and apply migrations

## Troubleshooting

### Bot Not Responding
- Check if `TELEGRAM_BOT_TOKEN` is set correctly
- Verify the bot is not blocked by users
- Check server logs for errors

### Wallet Creation Fails
- Ensure `WALLET_ENCRYPTION_KEY` is set
- Check database permissions
- Verify all dependencies are installed

### Trading Errors
- Check Polygon RPC endpoint connectivity
- Verify wallet has sufficient USDC balance
- Ensure market IDs are correct

## API Endpoints

The bot uses these API endpoints:

- `POST /api/telegram` - Telegram webhook handler
- `POST /api/wallet` - Wallet management operations
- `GET /api/markets` - Market data (existing)

## Support

For issues or questions:
1. Check the server logs
2. Verify environment variables
3. Test with a small amount first
4. Review the security considerations
