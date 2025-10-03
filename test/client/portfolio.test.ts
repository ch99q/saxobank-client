import { describe, test, expect, beforeAll } from "vitest";
import { validateTestEnvironment, createTestClient } from "../utils.js";
import type { Client, Account } from "../../src/index.js";

/**
 * Portfolio data retrieval tests
 * Tests positions, orders, and portfolio queries (read-only operations)
 */
describe("Portfolio Data", () => {
  let client: Client;
  let account: Account;

  beforeAll(async () => {
    validateTestEnvironment();
    const testSetup = await createTestClient();
    client = testSetup.client;
    account = testSetup.account;
    
    console.log(`Portfolio data test with account: ${account.id}`);
  });

  describe("Positions", () => {
    test("should retrieve positions gracefully", async () => {
      const positions = await account.getPositions();
      
      // Positions can be undefined or empty array
      if (positions !== undefined) {
        expect(Array.isArray(positions)).toBe(true);
        
        console.log(`Found ${positions.length} positions`);
        
        // If positions exist, validate their structure
        positions.forEach((position, index) => {
          expect(position).toHaveProperty("id");
          expect(position).toHaveProperty("uic");
          expect(position).toHaveProperty("quantity");
          expect(position).toHaveProperty("price");
          expect(position).toHaveProperty("currency");
          
          expect(typeof position.id).toBe("string");
          expect(typeof position.uic).toBe("number");
          expect(typeof position.quantity).toBe("number");
          expect(typeof position.price).toBe("number");
          expect(typeof position.currency).toBe("string");
          
          expect(position.id.length).toBeGreaterThan(0);
          expect(position.uic).toBeGreaterThan(0);
          expect(Number.isFinite(position.quantity)).toBe(true);
          expect(Number.isFinite(position.price)).toBe(true);
          
          console.log(`Position ${index}: ${position.quantity} units of UIC ${position.uic} at ${position.price}`);
        });
      } else {
        console.log("No positions found (undefined response)");
      }
    });

    test("should handle positions data consistency", async () => {
      const positions = await account.getPositions();
      
      if (positions && positions.length > 0) {
        // Test multiple calls return consistent data
        const positions2 = await account.getPositions();
        expect(positions).toEqual(positions2);
        
        // Validate position values make sense
        positions.forEach(position => {
          expect(position.quantity).not.toBe(0); // Open positions shouldn't have zero quantity
          expect(position.price).toBeGreaterThan(0); // Prices should be positive
          expect(position.currency).toMatch(/^[A-Z]{3}$/); // Valid currency code
        });
      }
    });
  });

  describe("Orders", () => {
    test("should retrieve orders gracefully", async () => {
      const orders = await account.getOrders();
      
      // Orders can be undefined or empty array
      if (orders !== undefined) {
        expect(Array.isArray(orders)).toBe(true);
        
        console.log(`Found ${orders.length} active orders`);
        
        // If orders exist, validate their structure
        orders.forEach((order, index) => {
          expect(order).toHaveProperty("id");
          expect(order).toHaveProperty("uic");
          expect(order).toHaveProperty("type");
          expect(order).toHaveProperty("order_type");
          expect(order).toHaveProperty("quantity");
          expect(order).toHaveProperty("status");
          
          expect(typeof order.id).toBe("string");
          expect(typeof order.uic).toBe("number");
          expect(["buy", "sell"]).toContain(order.type);
          expect(["market", "limit", "stop", "stop_limit"]).toContain(order.order_type);
          expect(typeof order.quantity).toBe("number");
          
          expect(order.id.length).toBeGreaterThan(0);
          expect(order.uic).toBeGreaterThan(0);
          expect(order.quantity).toBeGreaterThan(0);
          
          console.log(`Order ${index}: ${order.type} ${order.quantity} units of UIC ${order.uic} (${order.order_type})`);
        });
      } else {
        console.log("No active orders found (undefined response)");
      }
    });

    test("should validate order data integrity", async () => {
      const orders = await account.getOrders();
      
      if (orders && orders.length > 0) {
        orders.forEach(order => {
          // Order quantities should be positive
          expect(order.quantity).toBeGreaterThan(0);
          
          // UIC should be a valid positive integer
          expect(Number.isInteger(order.uic)).toBe(true);
          expect(order.uic).toBeGreaterThan(0);
          
          // Status should be a working order (since these are active orders)
          expect(["working", "parked"]).toContain(order.status);
          
          // Time should be a valid date
          expect(order.time).toBeInstanceOf(Date);
          expect(order.time.getTime()).toBeGreaterThan(0);
        });
      }
    });
  });

  describe("Net Positions", () => {
    test("should retrieve net positions", async () => {
      const netPositions = await client.getNetPositions();
      
      if (netPositions !== undefined) {
        expect(Array.isArray(netPositions)).toBe(true);
        
        console.log(`Found ${netPositions.length} net positions`);
        
        netPositions.forEach((netPos, index) => {
          expect(netPos).toHaveProperty("id");
          expect(netPos).toHaveProperty("uic");
          expect(netPos).toHaveProperty("quantity");
          
          expect(typeof netPos.id).toBe("string");
          expect(typeof netPos.uic).toBe("number");
          expect(typeof netPos.quantity).toBe("number");
          
          expect(netPos.uic).toBeGreaterThan(0);
          expect(Number.isFinite(netPos.quantity)).toBe(true);
          
          // Price might be undefined for some net positions
          if (netPos.price !== undefined) {
            expect(typeof netPos.price).toBe("number");
            expect(Number.isFinite(netPos.price)).toBe(true);
          }
          
          console.log(`Net Position ${index}: ${netPos.quantity} units of UIC ${netPos.uic}`);
        });
      } else {
        console.log("No net positions found");
      }
    });
  });

  describe("Exposure Information", () => {
    test("should get portfolio exposure", async () => {
      const exposure = await client.getExposure();
      
      expect(exposure).toBeDefined();
      console.log("Exposure data:", exposure);
      
      // API might return empty object if no exposure
      expect(typeof exposure).toBe("object");
      
      // Empty object is a valid response for accounts with no exposure
      expect(exposure).not.toBeNull();
    });

    test("should have consistent exposure data", async () => {
      const exposure1 = await client.getExposure();
      const exposure2 = await client.getExposure();
      
      // Should be consistent across calls (allowing for small timing differences)
      expect(exposure1.baseCurrency).toBe(exposure2.baseCurrency);
      expect(typeof exposure1.netExposure).toBe(typeof exposure2.netExposure);
      expect(typeof exposure1.currencyExposures).toBe(typeof exposure2.currencyExposures);
    });
  });
});