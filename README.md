# Polymarket Trading Interface

A modern, elegant trading interface for Polymarket prediction markets built with Next.js and Tailwind CSS.

## Features

- 🔗 **Wallet Connection**: Connect MetaMask or other Web3 wallets
- 📊 **Market Listing**: Browse available prediction markets
- 💰 **Order Placement**: Place buy/sell orders for Yes/No tokens
- 🎨 **Elegant UI**: Modern design with Tailwind CSS
- 📱 **Responsive**: Works on desktop and mobile devices

## Prerequisites

- Node.js 18+ 
- MetaMask or other Web3 wallet
- USDC on Polygon network for trading

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd polymarket-test
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### 1. Connect Wallet
- Click "Connect MetaMask" to connect your Web3 wallet
- Ensure you're connected to the Polygon network
- Make sure you have USDC for trading

### 2. Browse Markets
- View available prediction markets
- See market details including volume, liquidity, and end dates
- Click on a market to select it for trading

### 3. Place Orders
- Select buy or sell order type
- Choose Yes or No token side
- Enter price (0.00 - 1.00) and size
- Review order summary
- Submit order

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── wallet-connect.tsx    # Wallet connection component
│   │   ├── market-list.tsx       # Market listing component
│   │   └── order-form.tsx        # Order placement form
│   ├── services/
│   │   └── polymarket-service.ts # Polymarket API service
│   ├── types/
│   │   └── global.d.ts          # Global type declarations
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main page component
```

## Configuration

### Environment Variables
Create a `.env.local` file for production settings:

```env
NEXT_PUBLIC_POLYMARKET_HOST=https://clob.polymarket.com
NEXT_PUBLIC_CHAIN_ID=137
```

### API Integration
The current implementation uses mock data for demonstration. To integrate with real Polymarket APIs:

1. Update `polymarket-service.ts` to use actual API endpoints
2. Implement proper error handling for API calls
3. Add real market data fetching
4. Configure proper authentication

## Development

### Adding New Features
1. Create new components in `src/components/`
2. Add services in `src/services/`
3. Update types in `src/types/`
4. Follow the existing code patterns and styling

### Styling
- Uses Tailwind CSS v4 for styling
- Follows responsive design principles
- Maintains consistent color scheme and spacing

## Security Notes

⚠️ **Important**: This is a demo application. For production use:

- Implement proper private key management
- Add input validation and sanitization
- Use environment variables for sensitive data
- Add proper error handling
- Implement rate limiting
- Add transaction confirmation dialogs

## Dependencies

- **Next.js 15**: React framework
- **Tailwind CSS 4**: Utility-first CSS framework
- **@polymarket/clob-client**: Official Polymarket trading client
- **ethers**: Ethereum library for wallet interaction

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the [Polymarket documentation](https://docs.polymarket.com/)
- Review the [CLOB client documentation](https://docs.polymarket.com/quickstart/orders/first-order)
- Open an issue in this repository
