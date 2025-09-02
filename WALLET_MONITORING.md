# Wallet Monitoring Features

## Overview

The Polymarket Telegram bot now includes comprehensive wallet monitoring capabilities that allow users to track incoming transfers of ETH, USDC, and POL tokens across multiple blockchain networks.

## Supported Networks

The monitoring service supports the following blockchain networks:

### 1. Ethereum (Mainnet)
- **RPC**: `https://eth-mainnet.g.alchemy.com/v2/demo`
- **Chain ID**: 1
- **Supported Tokens**:
  - ETH (native)
  - USDC: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
  - POL: `0x83e6f1E41cdd28eAcEB20Cb649155049fac3D5Aa`

### 2. Polygon
- **RPC**: `https://polygon-rpc.com` (or `POLYGON_RPC_URL` env var)
- **Chain ID**: 137
- **Supported Tokens**:
  - MATIC (native)
  - USDC: `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359`
  - POL: `0x455e53CBB86018Ac2B8092FdCd39b8443aA31FE6`

### 3. Arbitrum
- **RPC**: `https://arb1.arbitrum.io/rpc`
- **Chain ID**: 42161
- **Supported Tokens**:
  - ETH (native)
  - USDC: `0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8`
  - POL: `0x455e53CBB86018Ac2B8092FdCd39b8443aA31FE6`

### 4. Base
- **RPC**: `https://mainnet.base.org`
- **Chain ID**: 8453
- **Supported Tokens**:
  - ETH (native)
  - USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
  - POL: `0x455e53CBB86018Ac2B8092FdCd39b8443aA31FE6`

## Bot Commands

### `/balance`
Check your wallet balances across all supported chains.

**Usage**: `/balance`

**Response Example**:
```
💰 Your Wallet Balances

🌐 ETHEREUM
   💎 ETH: 0.123456
   💵 USDC: 100.50
   🪙 POL: 50.000000

🌐 POLYGON
   💎 ETH: 0.000000
   💵 USDC: 25.00
   🪙 POL: 10.000000
```

### `/monitor`
Start or stop transfer monitoring for your wallet.

**Usage**: `/monitor`

**When Starting**:
```
🚀 Monitoring Started

Your wallet is now being monitored for incoming transfers!
You'll receive notifications for:
• ETH transfers
• USDC transfers
• POL transfers
• Across Ethereum, Polygon, Arbitrum, and Base
```

**When Stopping**:
```
🛑 Monitoring Stopped

Wallet monitoring has been stopped. You won't receive transfer notifications.
```

## Transfer Notifications

When monitoring is active, you'll receive real-time notifications for incoming transfers:

```
💰 Incoming Transfer Detected!

🪙 Token: USDC
🌐 Chain: Polygon
📥 Amount: 100.00 USDC
👤 From: 0x1234...5678
📋 TX: 0xabcd...efgh
⏰ Time: 12/25/2024, 3:45:30 PM
```

## Technical Implementation

### Monitoring Service (`WalletMonitorService`)

The monitoring service runs in the background and:

1. **Initializes Providers**: Creates ethers.js providers for each supported network
2. **Polling**: Checks for new transfers every 15 seconds
3. **Event Filtering**: Monitors Transfer events for each token contract
4. **Block Tracking**: Keeps track of last processed blocks to avoid duplicates
5. **Notifications**: Sends Telegram messages for detected transfers

### Key Features

- **Multi-Chain Support**: Monitors 4 different blockchain networks simultaneously
- **Token Tracking**: Tracks ETH, USDC, and POL transfers
- **Real-Time Notifications**: Sends immediate Telegram notifications
- **Duplicate Prevention**: Tracks processed blocks to avoid duplicate notifications
- **Error Handling**: Graceful error handling for network issues
- **Balance Monitoring**: Regular balance checks across all chains

### API Endpoints

#### `GET /api/monitor`
Get the current monitoring status.

**Response**:
```json
{
  "success": true,
  "status": "active|inactive",
  "message": "Wallet monitoring service status"
}
```

#### `POST /api/monitor`
Control the monitoring service.

**Request Body**:
```json
{
  "action": "start|stop|status"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Monitoring started/stopped successfully",
  "status": "active|inactive"
}
```

## Admin Dashboard

The admin dashboard (`/admin`) now includes:

- **Transfer Monitoring Status**: Shows if monitoring is active/inactive
- **Toggle Button**: Start/stop monitoring from the web interface
- **Real-Time Updates**: Status updates automatically

## Security Considerations

1. **Private Key Security**: All wallet private keys remain encrypted and secure
2. **Read-Only Access**: Monitoring only reads blockchain data, no write access
3. **User Isolation**: Each user's monitoring is isolated
4. **Rate Limiting**: Built-in delays prevent excessive API calls

## Performance

- **Polling Interval**: 15 seconds for transfer detection
- **Balance Check**: Every 60 seconds
- **Memory Efficient**: Tracks only necessary block numbers
- **Scalable**: Can handle multiple users and networks

## Environment Variables

Add these to your `.env.local` file for better performance:

```bash
# Optional: Custom Polygon RPC URL
POLYGON_RPC_URL=https://your-polygon-rpc-url

# Optional: Custom Ethereum RPC URL (replace demo URL)
ETHEREUM_RPC_URL=https://your-ethereum-rpc-url
```

## Troubleshooting

### Monitoring Not Working
1. Check if the bot is running: `curl http://localhost:3000/api/monitor`
2. Verify RPC endpoints are accessible
3. Check server logs for error messages

### No Transfer Notifications
1. Ensure monitoring is active: `/monitor`
2. Verify your wallet has received transfers
3. Check if the transfer amount is significant enough

### High API Usage
1. Consider using private RPC endpoints
2. Adjust polling intervals in the code
3. Monitor server resources

## Future Enhancements

Potential improvements for the monitoring system:

1. **Webhook Support**: Use blockchain webhooks instead of polling
2. **Custom Tokens**: Allow users to add custom token addresses
3. **Threshold Alerts**: Set minimum amounts for notifications
4. **Historical Data**: Store transfer history in database
5. **Analytics**: Provide transfer statistics and charts
6. **Mobile App**: Native mobile app for monitoring
7. **Email Notifications**: Alternative notification method
8. **SMS Alerts**: Critical transfer notifications via SMS

## Usage Examples

### Basic Setup
1. Start the bot: `/start`
2. Enable monitoring: `/monitor`
3. Check balances: `/balance`
4. Wait for transfer notifications

### Advanced Usage
1. Monitor specific chains only (future feature)
2. Set custom notification thresholds
3. Export transfer history
4. Integrate with trading strategies

The wallet monitoring system provides comprehensive coverage of your crypto assets across multiple networks, ensuring you never miss an important transfer!
