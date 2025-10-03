import { createClient, type Client, type Account, type AssetType } from "../src/index.js";

// Shared test configuration
export const SAXO_TOKEN = process.env.SAXO_SIM_TOKEN!;
export const SAXO_APP_KEY = process.env.SAXO_APP_KEY!;
export const SAXO_APP_SECRET = process.env.SAXO_APP_SECRET!;
export const SAXO_APP_REDIRECT_URI = process.env.SAXO_APP_REDIRECT_URI!;

// Test constants
export const TEST_UIC = 21; // EURUSD
export const TEST_ASSET_TYPE: AssetType = "FxSpot";
export const MIN_TRADE_AMOUNT = 10000; // 10,000 units (0.1 lot in forex)
export const SMALL_TRADE_AMOUNT = 5000;

// Helper functions
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Shared client setup
export const createTestClient = async (): Promise<{ client: Client; account: Account }> => {
  const client = await createClient(
    { type: "token", token: SAXO_TOKEN },
    {
      appKey: SAXO_APP_KEY,
      appSecret: SAXO_APP_SECRET,
      redirectUri: SAXO_APP_REDIRECT_URI,
    }
  );

  const accounts = await client.getAccounts();
  const account = accounts[0];
  
  return { client, account };
};

// Test environment validation
export const validateTestEnvironment = () => {
  if (!SAXO_TOKEN || !SAXO_APP_KEY || !SAXO_APP_SECRET || !SAXO_APP_REDIRECT_URI) {
    throw new Error("Missing required environment variables for testing");
  }
};
