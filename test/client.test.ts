import { describe, test, expect } from "vitest";
import { createClient } from "../src/index.ts";

const SAXO_TOKEN = process.env.SAXO_SIM_TOKEN!;
const SAXO_APP_KEY = process.env.SAXO_APP_KEY!;
const SAXO_APP_SECRET = process.env.SAXO_APP_SECRET!;
const SAXO_APP_REDIRECT_URI = process.env.SAXO_APP_REDIRECT_URI!;

describe("Client Tests", async () => {
  const client = await createClient(
    { type: "token", token: SAXO_TOKEN },
    {
      appKey: SAXO_APP_KEY,
      appSecret: SAXO_APP_SECRET,
      redirectUri: SAXO_APP_REDIRECT_URI,
    }
  );

  test("Client connection", () => {
    expect(client.id).toBeDefined();
  });

  test("Get accounts", async () => {
    const accounts = await client.getAccounts();
    expect(accounts.length).toBeGreaterThan(0);
  });

  test("Get positions", async () => {
    const positions = await client.getPositions();
    expect(Array.isArray(positions)).toBe(true);
  });

  test("Get orders", async () => {
    const orders = await client.getOrders();
    expect(Array.isArray(orders)).toBe(true);
  });
});