import { createClient } from './src/index.js';

// Example app configuration - these would typically come from your app's config
const appConfig = {
  appKey: 'your_app_key_here',
  appSecret: 'your_app_secret_here',
  redirectUri: 'your_redirect_uri_here',
  // Optional: specify custom endpoints (defaults to simulation)
  // apiEndpoint: 'https://gateway.saxobank.com/openapi', // Production
  // authEndpoint: 'https://live.logonvalidation.net', // Production
};

// Using with a token (browser/server)
const clientWithToken = await createClient(
  { type: 'token', token: 'your_access_token_here' },
  appConfig
);

// Using with username/password (server only - not recommended for browser)
const clientWithCredentials = await createClient(
  { type: 'account', username: 'your_username', password: 'your_password' },
  appConfig
);

// Use the client
const accounts = await clientWithToken.getAccounts();
console.log('Accounts:', accounts);

const positions = await clientWithToken.getPositions();
console.log('Positions:', positions);