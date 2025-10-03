# Saxobank Client

A TypeScript/JavaScript client for the Saxobank OpenAPI, compatible with both Node.js and browser environments.

## Installation

```bash
npm install @ch99q/sxc
```

## Usage

### Configuration

The client now requires explicit app configuration instead of environment variables, making it browser-compatible:

```typescript
import { createClient } from '@ch99q/sxc';

const appConfig = {
  appKey: 'your_saxo_app_key',
  appSecret: 'your_saxo_app_secret', 
  redirectUri: 'your_redirect_uri',
  // Optional: Custom endpoints (defaults to simulation environment)
  apiEndpoint: 'https://gateway.saxobank.com/sim/openapi', // Default
  authEndpoint: 'https://sim.logonvalidation.net', // Default
};
```

### Authentication

#### Using Access Token (Recommended for browsers)

```typescript
const client = await createClient(
  { type: 'token', token: 'your_access_token' },
  appConfig
);
```

#### Using Username/Password (Server-side only)

```typescript
const client = await createClient(
  { type: 'account', username: 'username', password: 'password' },
  appConfig
);
```

### Examples

```typescript
// Get client accounts
const accounts = await client.getAccounts();

// Get positions
const positions = await client.getPositions();

// Get orders  
const orders = await client.getOrders();

// Work with a specific account
const account = accounts[0];
const accountBalance = await account.getBalance();
const accountPositions = await account.getPositions();

// Place orders
const buyOrder = await account.buy(uic, quantity, 'market');
const sellOrder = await account.sell(uic, quantity, 'limit', price);
```

## Migration from v1.x (Deno)

The main changes in v2.x:

1. **Environment variables removed**: Pass configuration explicitly to `createClient()`
2. **Node.js/Browser compatible**: No more Deno-specific imports
3. **Updated function signature**: `createClient(auth, appConfig)` instead of `createClient(auth)`

### Before (v1.x)
```typescript
// Relied on environment variables
const client = await createClient({ type: 'token', token: 'xxx' });
```

### After (v2.x)
```typescript
// Explicit app configuration
const client = await createClient(
  { type: 'token', token: 'xxx' },
  { appKey: 'xxx', appSecret: 'xxx', redirectUri: 'xxx' }
);
```

## Production vs Simulation

For production environment, use:

```typescript
const appConfig = {
  appKey: 'your_app_key',
  appSecret: 'your_app_secret',
  redirectUri: 'your_redirect_uri',
  apiEndpoint: 'https://gateway.saxobank.com/openapi', // Production API
  authEndpoint: 'https://live.logonvalidation.net', // Production Auth
};
```

## License

MIT