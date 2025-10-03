import { describe, test, expect, beforeAll } from "vitest";
import { validateTestEnvironment, createTestClient } from "../utils.js";
import type { Client, Account } from "../../src/index.js";

/**
 * Client authentication and connection tests
 * Validates basic client setup and API connectivity
 */
describe("Client Authentication", () => {
  let client: Client;
  let account: Account;

  beforeAll(async () => {
    validateTestEnvironment();
    const testSetup = await createTestClient();
    client = testSetup.client;
    account = testSetup.account;
    
    console.log(`Authentication test with client: ${client.name} (ID: ${client.id})`);
  });

  describe("Client Properties", () => {
    test("should have valid client identification", () => {
      expect(client.id).toBeDefined();
      expect(client.key).toBeDefined();
      expect(client.name).toBeDefined();
      
      expect(typeof client.id).toBe("string");
      expect(typeof client.key).toBe("string");
      expect(typeof client.name).toBe("string");
      
      expect(client.id.length).toBeGreaterThan(0);
      expect(client.key.length).toBeGreaterThan(0);
      expect(client.name.length).toBeGreaterThan(0);
    });

    test("should have all required client methods", () => {
      const expectedMethods = [
        'getAccounts', 'getPositions', 'getOrders', 'getNetPositions',
        'getClosedPositions', 'getExposure', 'preCheckOrder'
      ];
      
      expectedMethods.forEach(method => {
        expect(typeof client[method as keyof Client]).toBe('function');
      });
    });
  });

  describe("API Connection", () => {
    test("should successfully connect to Saxo API", async () => {
      // This test passes if client creation succeeded in beforeAll
      expect(client).toBeDefined();
      expect(account).toBeDefined();
      
      // Verify we can make a basic API call
      const accounts = await client.getAccounts();
      expect(Array.isArray(accounts)).toBe(true);
      expect(accounts.length).toBeGreaterThan(0);
    });

    test("should authenticate with valid credentials", async () => {
      // If we got here, authentication worked
      // Let's verify with a simple API call that requires auth
      const balance = await account.getBalance();
      
      expect(balance).toBeDefined();
      expect(typeof balance.cashAvailable).toBe("number");
      expect(typeof balance.currency).toBe("string");
    });
  });

  describe("Account Access", () => {
    test("should retrieve account information", async () => {
      const accounts = await client.getAccounts();
      
      expect(Array.isArray(accounts)).toBe(true);
      expect(accounts.length).toBeGreaterThan(0);
      
      const firstAccount = accounts[0];
      expect(firstAccount).toHaveProperty("id");
      expect(firstAccount).toHaveProperty("currency");
      expect(firstAccount).toHaveProperty("key");
      
      expect(typeof firstAccount.id).toBe("string");
      expect(typeof firstAccount.currency).toBe("string");
      expect(typeof firstAccount.key).toBe("string");
      
      expect(firstAccount.id.length).toBeGreaterThan(0);
      expect(firstAccount.currency.length).toBeGreaterThan(0);
    });

    test("should have account methods available", () => {
      const expectedAccountMethods = [
        'getBalance', 'getPositions', 'getOrders', 'buy', 'sell',
        'cancelOrder', 'modifyOrder', 'cancelAllOrders'
      ];
      
      expectedAccountMethods.forEach(method => {
        expect(typeof account[method as keyof Account]).toBe('function');
      });
    });
  });
});