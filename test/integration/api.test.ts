import { describe, test, expect, beforeAll } from "vitest";
import { validateTestEnvironment, createTestClient } from "../utils.js";
import type { Client, Account } from "../../src/index.js";

/**
 * Integration tests that verify the client can connect to Saxo's API
 * These tests require valid API credentials and network access
 */
describe("API Integration", () => {
  let client: Client;
  let account: Account;

  beforeAll(async () => {
    validateTestEnvironment();
    const testSetup = await createTestClient();
    client = testSetup.client;
    account = testSetup.account;
  });

  describe("Authentication & Connection", () => {
    test("should successfully authenticate with Saxo API", () => {
      expect(client.id).toBeDefined();
      expect(client.key).toBeDefined();
      expect(client.name).toBeDefined();
      expect(typeof client.id).toBe("string");
      expect(typeof client.key).toBe("string");
      expect(typeof client.name).toBe("string");
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

  describe("Account Access", () => {
    test("should retrieve account information", async () => {
      const accounts = await client.getAccounts();
      
      expect(Array.isArray(accounts)).toBe(true);
      expect(accounts.length).toBeGreaterThan(0);
      expect(accounts[0]).toBeDefined();
      expect(typeof accounts[0].id).toBe("string");
      expect(typeof accounts[0].currency).toBe("string");
    });

    test("should get account balance", async () => {
      const balance = await account.getBalance();
      
      expect(balance).toBeDefined();
      expect(typeof balance.cashBalance).toBe("number");
      expect(typeof balance.cashAvailable).toBe("number");
      expect(typeof balance.currency).toBe("string");
      expect(balance.cashAvailable).toBeGreaterThanOrEqual(0);
    });

    test("should have all required account methods", () => {
      const expectedMethods = [
        'getBalance', 'getPositions', 'getOrders', 'buy', 'sell',
        'cancelOrder', 'modifyOrder', 'cancelAllOrders'
      ];
      
      expectedMethods.forEach(method => {
        expect(typeof account[method as keyof Account]).toBe('function');
      });
    });
  });

  describe("Portfolio Data Access", () => {
    test("should retrieve positions (may be empty)", async () => {
      const positions = await account.getPositions();
      
      // Positions can be undefined or empty array
      if (positions !== undefined) {
        expect(Array.isArray(positions)).toBe(true);
        
        // If positions exist, validate structure
        if (positions.length > 0) {
          const position = positions[0];
          expect(typeof position.id).toBe("string");
          expect(typeof position.uic).toBe("number");
          expect(typeof position.quantity).toBe("number");
          expect(typeof position.price).toBe("number");
        }
      }
    });

    test("should retrieve orders (may be empty)", async () => {
      const orders = await account.getOrders();
      
      // Orders can be undefined or empty array
      if (orders !== undefined) {
        expect(Array.isArray(orders)).toBe(true);
        
        // If orders exist, validate structure
        if (orders.length > 0) {
          const order = orders[0];
          expect(typeof order.id).toBe("string");
          expect(typeof order.uic).toBe("number");
          expect(typeof order.quantity).toBe("number");
          expect(['buy', 'sell']).toContain(order.type);
          expect(['market', 'limit', 'stop', 'stop_limit']).toContain(order.order_type);
        }
      }
    });

    test("should retrieve net positions", async () => {
      const netPositions = await client.getNetPositions();
      
      // Net positions can be undefined or empty array
      if (netPositions !== undefined) {
        expect(Array.isArray(netPositions)).toBe(true);
        
        // If net positions exist, validate structure
        if (netPositions.length > 0) {
          const netPos = netPositions[0];
          expect(typeof netPos.id).toBe("string");
          expect(typeof netPos.uic).toBe("number");
          expect(typeof netPos.quantity).toBe("number");
        }
      }
    });

    test("should retrieve exposure information", async () => {
      const exposure = await client.getExposure();
      
      expect(exposure).toBeDefined();
      expect(typeof exposure).toBe("object");
      
      // API might return empty object if no exposure
      expect(exposure).not.toBeNull();
    });
  });
});