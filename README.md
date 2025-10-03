# Saxobank Client

[![npm version](https://badge.fury.io/js/@ch99q%2Fsxc.svg)](https://badge.fury.io/js/@ch99q%2Fsxc)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive TypeScript/JavaScript client for Saxobank's OpenAPI. This library provides easy access to trading, portfolio management, and account operations on the Saxobank platform.

## Features

- 🔐 **OAuth Authentication** - Secure authentication with Saxobank OpenAPI
- 💼 **Portfolio Management** - Access accounts, positions, balances, and exposure
- 📊 **Trading Operations** - Place, modify, and cancel orders (Market, Limit, Stop, Stop-Limit)
- 🎯 **Multi-Asset Support** - Trade FX, stocks, options, futures, ETFs, and more
- 📈 **Position Tracking** - Monitor open, closed, and net positions
- ⚡ **Order Pre-checking** - Validate orders before placement
- 📝 **TypeScript Support** - Full type definitions included
- 🌐 **Cross-Platform** - Works in browsers, Node.js, Bun, and Deno

## Installation

\`\`\`bash
# Using npm
npm install @ch99q/sxc

# Using yarn
yarn add @ch99q/sxc

# Using pnpm
pnpm add @ch99q/sxc

# Using bun
bun add @ch99q/sxc
\`\`\`

## Quick Start

### Authentication

\`\`\`typescript
import { createClient } from "@ch99q/sxc";

// Create client with username/password
const client = await createClient(
  {
    type: "account",
    username: "your-username",
    password: "your-password"
  },
  {
    appKey: "your-app-key",
    appSecret: "your-app-secret",
    redirectUri: "http://localhost:5000/callback"
  }
);

// Or use an existing token
const client = await createClient(
  {
    type: "token",
    token: "your-access-token"
  },
  {
    appKey: "your-app-key",
    appSecret: "your-app-secret",
    redirectUri: "http://localhost:5000/callback"
  }
);

console.log(\`Connected as: \${client.name} (\${client.id})\`);
\`\`\`

### Get Accounts and Balances

\`\`\`typescript
// Get all accounts
const accounts = await client.getAccounts();

// Get balance for an account
const account = accounts[0];
const balance = await account.getBalance();

console.log(\`Balance: \${balance.cashAvailable} \${balance.currency}\`);
console.log(\`Total Value: \${balance.totalValue} \${balance.currency}\`);
console.log(\`Margin Used: \${balance.marginUsed} \${balance.currency}\`);
console.log(\`Unrealized P&L: \${balance.unrealizedPnL} \${balance.currency}\`);
\`\`\`

### View Positions

\`\`\`typescript
// Get positions for an account
const positions = await account.getPositions();

positions.forEach(position => {
  console.log(\`Position \${position.id}:\`);
  console.log(\`  Instrument: \${position.uic}\`);
  console.log(\`  Quantity: \${position.quantity}\`);
  console.log(\`  Price: \${position.price}\`);
  console.log(\`  Value: \${position.value} \${position.currency}\`);
  console.log(\`  Status: \${position.status}\`);
});

// Get net positions (aggregated)
const netPositions = await client.getNetPositions();

// Get closed positions
const closedPositions = await client.getClosedPositions(
  account.key,
  new Date("2024-01-01"),
  new Date()
);
\`\`\`

### Place Orders

\`\`\`typescript
// Place a market buy order
const marketOrder = await account.buy(
  21,              // UIC (instrument ID)
  100000,          // Quantity
  "market",        // Order type
  undefined,       // Price (not needed for market)
  undefined,       // Stop limit (not needed)
  {
    assetType: "FxSpot",
    externalReference: "my-order-123",
    manualOrder: true
  }
);

// Place a limit sell order
const limitOrder = await account.sell(
  21,              // UIC for EUR/USD
  100000,          // Quantity
  "limit",         // Order type
  1.1500,          // Limit price
  undefined,
  {
    assetType: "FxSpot",
    duration: { durationType: "GoodTillCancel" },
    externalReference: "my-limit-order"
  }
);

// Place a stop order
const stopOrder = await account.sell(
  21,
  100000,
  "stop",
  1.0800,          // Order price
  1.0900,          // Stop limit price
  {
    assetType: "FxSpot",
    duration: { durationType: "DayOrder" }
  }
);
\`\`\`

### Manage Orders

\`\`\`typescript
// Get all orders
const orders = await account.getOrders();

orders.forEach(order => {
  console.log(\`Order \${order.id}:\`);
  console.log(\`  Type: \${order.type} \${order.order_type}\`);
  console.log(\`  Price: \${order.price}\`);
  console.log(\`  Quantity: \${order.quantity}\`);
  console.log(\`  Status: \${order.status}\`);
});

// Modify an existing order
await account.modifyOrder(
  "order-id",
  1.1600,          // New price
  150000           // New quantity
);

// Cancel a specific order
await account.cancelOrder("order-id");

// Cancel all orders for an instrument
await account.cancelAllOrders(21, "FxSpot");
\`\`\`

### Pre-check Orders

\`\`\`typescript
// Validate an order before placing it
const preCheckResult = await client.preCheckOrder({
  accountKey: account.key,
  uic: 21,
  assetType: "FxSpot",
  buySell: "Buy",
  orderType: "Market",
  amount: 100000,
  manualOrder: true
});

console.log("Order validation:", preCheckResult);
\`\`\`

## API Reference

### Client

#### \`createClient(credentials, config)\`

Creates a new Saxobank client.

**Parameters:**
- \`credentials\`: Either \`{ type: "account", username, password }\` or \`{ type: "token", token }\`
- \`config\`: Configuration object
  - \`appKey\`: Saxobank app key
  - \`appSecret\`: Saxobank app secret
  - \`redirectUri\`: OAuth redirect URI
  - \`apiEndpoint?\`: API gateway URL (defaults to simulation)
  - \`authEndpoint?\`: Auth server URL (defaults to simulation)

**Returns:** \`Promise<Client>\`

#### Client Methods

- \`getAccounts()\`: Get all accounts
- \`getPositions(accountKey?)\`: Get positions
- \`getOrders(accountKey?)\`: Get orders
- \`getNetPositions(accountKey?)\`: Get aggregated positions
- \`getClosedPositions(accountKey?, fromDate?, toDate?)\`: Get closed positions
- \`getExposure(accountKey?)\`: Get exposure information
- \`preCheckOrder(orderRequest)\`: Pre-validate an order

### Account

#### Account Properties

- \`id\`: Account identifier
- \`key\`: Account key
- \`active\`: Whether account is active
- \`currency\`: Account currency

#### Account Methods

- \`getBalance()\`: Get account balance
- \`getPositions()\`: Get account positions
- \`getOrders()\`: Get account orders
- \`buy(uic, quantity, type?, price?, stopLimit?, options?)\`: Place buy order
- \`sell(uic, quantity, type?, price?, stopLimit?, options?)\`: Place sell order
- \`cancelOrder(orderId)\`: Cancel specific order
- \`cancelAllOrders(uic, assetType?)\`: Cancel all orders for instrument
- \`modifyOrder(orderId, price?, quantity?)\`: Modify existing order

### Order Types

- \`"market"\`: Market order (executes immediately at current price)
- \`"limit"\`: Limit order (executes at specified price or better)
- \`"stop"\`: Stop order (triggers at stop price)
- \`"stop_limit"\`: Stop-limit order (combines stop and limit)

### Order Options

\`\`\`typescript
interface OrderOptions {
  assetType?: AssetType;
  duration?: OrderDuration;
  externalReference?: string;
  manualOrder?: boolean;
  isForceOpen?: boolean;
  trailingStopDistanceToMarket?: number;
  trailingStopStep?: number;
}
\`\`\`

### Asset Types

Supported asset types:
- FX: \`FxSpot\`, \`FxForward\`, \`FxVanillaOption\`, \`FxKnockInOption\`, \`FxKnockOutOption\`, \`FxOneTouchOption\`, \`FxNoTouchOption\`, \`FxBinaryOption\`
- Equities: \`Stock\`, \`StockOption\`, \`StockIndex\`, \`StockIndexOption\`
- Fixed Income: \`Bond\`
- CFDs: \`CfdOnStock\`, \`CfdOnIndex\`, \`CfdOnFutures\`
- Funds: \`Etc\`, \`Etf\`, \`Etn\`, \`Fund\`, \`MutualFund\`
- Derivatives: \`FuturesStrategy\`

### Order Duration Types

\`\`\`typescript
type OrderDuration = {
  durationType: "DayOrder" | "GoodTillCancel" | "FillOrKill" | "ImmediateOrCancel" | "GoodTillDate";
  expirationDateTime?: string; // Required for GoodTillDate
};
\`\`\`

## Examples

### Complete Trading Workflow

\`\`\`typescript
import { createClient } from "@ch99q/sxc";

async function tradingExample() {
  // Connect to Saxobank
  const client = await createClient(
    { type: "account", username: "user", password: "pass" },
    {
      appKey: "app-key",
      appSecret: "app-secret",
      redirectUri: "http://localhost:5000/callback"
    }
  );

  // Get first account
  const accounts = await client.getAccounts();
  const account = accounts[0];

  // Check balance
  const balance = await account.getBalance();
  console.log(\`Available: \${balance.cashAvailable} \${balance.currency}\`);

  // Pre-check an order
  const preCheck = await client.preCheckOrder({
    accountKey: account.key,
    uic: 21,
    assetType: "FxSpot",
    buySell: "Buy",
    orderType: "Market",
    amount: 100000
  });

  if (preCheck.estimatedCosts) {
    console.log("Estimated cost:", preCheck.estimatedCosts);
  }

  // Place a limit order
  const order = await account.buy(
    21,
    100000,
    "limit",
    1.1000,
    undefined,
    {
      assetType: "FxSpot",
      duration: { durationType: "GoodTillCancel" },
      externalReference: "trade-001"
    }
  );

  console.log("Order placed:", order.id);

  // Monitor positions
  const positions = await account.getPositions();
  positions.forEach(pos => {
    console.log(\`Position \${pos.id}: \${pos.quantity} @ \${pos.price}\`);
  });

  // Modify the order if needed
  if ('id' in order && 'type' in order) {
    await account.modifyOrder(order.id, 1.0950); // New price
  }

  // Cancel the order
  if ('id' in order && 'type' in order) {
    await account.cancelOrder(order.id);
  }
}

tradingExample().catch(console.error);
\`\`\`

### Portfolio Monitoring

\`\`\`typescript
async function monitorPortfolio() {
  const client = await createClient(/* credentials */, /* config */);
  const accounts = await client.getAccounts();

  for (const account of accounts) {
    console.log(\`\\nAccount: \${account.id} (\${account.currency})\`);

    const balance = await account.getBalance();
    console.log(\`  Cash Available: \${balance.cashAvailable}\`);
    console.log(\`  Total Value: \${balance.totalValue}\`);
    console.log(\`  Unrealized P&L: \${balance.unrealizedPnL}\`);

    const positions = await account.getPositions();
    console.log(\`  Open Positions: \${positions.length}\`);

    positions.forEach(pos => {
      console.log(\`    \${pos.uic}: \${pos.quantity} @ \${pos.price}\`);
    });

    const orders = await account.getOrders();
    console.log(\`  Active Orders: \${orders.length}\`);
  }
}
\`\`\`

## Error Handling

\`\`\`typescript
try {
  const client = await createClient(credentials, config);
  const accounts = await client.getAccounts();
  const account = accounts[0];

  // Place order
  const order = await account.buy(21, 100000, "market", undefined, undefined, {
    assetType: "FxSpot"
  });

} catch (error) {
  if (error instanceof Error) {
    console.error("Error:", error.message);

    // API errors include detailed information
    if (error.message.includes("API request failed")) {
      console.error("API Error Details:", error.message);
    }
  }
}
\`\`\`

## Environment Support

- **Browser:** Chrome, Firefox, Safari, Edge (latest versions)
- **Node.js:** 18.0.0+
- **Bun:** Latest version
- **Deno:** Latest version

## Configuration

### Simulation Environment (Default)

\`\`\`typescript
const client = await createClient(credentials, {
  appKey: "your-app-key",
  appSecret: "your-app-secret",
  redirectUri: "http://localhost:5000/callback",
  // These are the defaults:
  apiEndpoint: "https://gateway.saxobank.com/sim/openapi",
  authEndpoint: "https://sim.logonvalidation.net"
});
\`\`\`

### Live Environment

\`\`\`typescript
const client = await createClient(credentials, {
  appKey: "your-app-key",
  appSecret: "your-app-secret",
  redirectUri: "http://localhost:5000/callback",
  apiEndpoint: "https://gateway.saxobank.com/openapi",
  authEndpoint: "https://live.logonvalidation.net"
});
\`\`\`

## Best Practices

- **Error Handling:** Always wrap API calls in try-catch blocks
- **Order Validation:** Use \`preCheckOrder()\` before placing orders
- **Rate Limits:** Implement delays between requests in automated trading
- **Resource Management:** Properly handle positions and orders
- **Testing:** Use simulation environment for development and testing

\`\`\`typescript
// Good: Proper error handling
async function placeOrder(account: Account) {
  try {
    // Validate first
    const preCheck = await client.preCheckOrder({
      accountKey: account.key,
      uic: 21,
      assetType: "FxSpot",
      buySell: "Buy",
      orderType: "Market",
      amount: 100000
    });

    if (preCheck.errorInfo) {
      console.error("Order validation failed:", preCheck.errorInfo);
      return;
    }

    // Then place order
    const order = await account.buy(21, 100000, "market");
    console.log("Order placed:", order);

  } catch (error) {
    console.error("Failed to place order:", error);
  }
}
\`\`\`

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This library is not officially affiliated with Saxobank. Use at your own risk. The library is provided "as is" without warranty. Always verify trades and account operations. Never trade with funds you cannot afford to lose.

## Support

- 📖 [Documentation](https://github.com/ch99q/sxc)
- 🐛 [Issue Tracker](https://github.com/ch99q/sxc/issues)
- 💬 [Discussions](https://github.com/ch99q/sxc/discussions)

---

Made with ❤️ for the trading community
