import { describe, test, expect, beforeAll } from "vitest";
import { validateTestEnvironment, createTestClient } from "../utils.js";
import type { Client, Account } from "../../src/index.js";

/**
 * Account management and balance tests
 * Validates account operations and balance retrieval
 */
describe("Account Management", () => {
  let client: Client;
  let account: Account;

  beforeAll(async () => {
    validateTestEnvironment();
    const testSetup = await createTestClient();
    client = testSetup.client;
    account = testSetup.account;
    
    console.log(`Account management test with account: ${account.id} (${account.currency})`);
  });

  describe("Balance Operations", () => {
    test("should get account balance with correct structure", async () => {
      const balance = await account.getBalance();
      
      expect(balance).toBeDefined();
      expect(balance).toHaveProperty("cashBalance");
      expect(balance).toHaveProperty("cashAvailable");
      expect(balance).toHaveProperty("currency");
      
      expect(typeof balance.cashBalance).toBe("number");
      expect(typeof balance.cashAvailable).toBe("number");
      expect(typeof balance.currency).toBe("string");
      
      // Should have some available cash for trading (simulation account)
      expect(balance.cashAvailable).toBeGreaterThan(0);
      
      console.log(`Balance: ${balance.cashAvailable} ${balance.currency}`);
    });

    test("should validate balance data consistency", async () => {
      const balance = await account.getBalance();
      
      // Cash available should not exceed total cash balance in normal scenarios
      expect(balance.cashAvailable).toBeLessThanOrEqual(balance.cashBalance + Math.abs(balance.cashBalance) * 0.1); // Allow 10% margin for leverage
      
      // Currency should be a valid 3-letter code
      expect(balance.currency).toMatch(/^[A-Z]{3}$/);
      
      // Amounts should be finite numbers
      expect(Number.isFinite(balance.cashBalance)).toBe(true);
      expect(Number.isFinite(balance.cashAvailable)).toBe(true);
    });
  });

  describe("Account Properties", () => {
    test("should have valid account properties", () => {
      expect(account.id).toBeDefined();
      expect(account.currency).toBeDefined();
      expect(account.key).toBeDefined();
      
      expect(typeof account.id).toBe("string");
      expect(typeof account.currency).toBe("string");
      expect(typeof account.key).toBe("string");
      
      expect(account.id.length).toBeGreaterThan(0);
      expect(account.currency.length).toBe(3); // Currency codes are 3 letters
      expect(account.key.length).toBeGreaterThan(0);
    });

    test("should have consistent account information across calls", async () => {
      // Get accounts multiple times to ensure consistency
      const accounts1 = await client.getAccounts();
      const accounts2 = await client.getAccounts();
      
      expect(accounts1.length).toBe(accounts2.length);
      expect(accounts1[0].id).toBe(accounts2[0].id);
      expect(accounts1[0].currency).toBe(accounts2[0].currency);
      expect(accounts1[0].key).toBe(accounts2[0].key);
    });
  });

  describe("Multiple Accounts", () => {
    test("should handle multiple accounts if available", async () => {
      const accounts = await client.getAccounts();
      
      expect(Array.isArray(accounts)).toBe(true);
      
      // Each account should have valid structure
      accounts.forEach((acc, index) => {
        expect(acc).toHaveProperty("id");
        expect(acc).toHaveProperty("currency");
        expect(acc).toHaveProperty("key");
        
        expect(typeof acc.id).toBe("string");
        expect(typeof acc.currency).toBe("string");
        expect(typeof acc.key).toBe("string");
        
        console.log(`Account ${index}: ${acc.id} (${acc.currency})`);
      });
    });

    test("should provide access to account-specific operations", async () => {
      const accounts = await client.getAccounts();
      const firstAccount = accounts[0];
      
      // Should be able to get balance for specific account
      const balance = await firstAccount.getBalance();
      expect(balance).toBeDefined();
      expect(typeof balance.cashAvailable).toBe("number");
      
      // Balance should be consistent with account currency
      expect(balance.currency).toBe(firstAccount.currency);
    });
  });
});