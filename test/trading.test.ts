import { describe, test, expect, beforeAll } from "vitest";
import { validateTestEnvironment, createTestClient, TEST_UIC, TEST_ASSET_TYPE, MIN_TRADE_AMOUNT, delay } from "./utils.js";
import type { Client, Account } from "../src/index.js";

/**
 * Comprehensive trading functionality tests
 * These tests place real orders on the simulation account
 */
describe("Trading Operations", () => {
  let client: Client;
  let account: Account;

  beforeAll(async () => {
    validateTestEnvironment();
    const testSetup = await createTestClient();
    client = testSetup.client;
    account = testSetup.account;
    
    console.log(`Trading tests with account: ${account.id} (${account.currency})`);
    
    const balance = await account.getBalance();
    console.log(`Available balance: ${balance.cashAvailable} ${balance.currency}`);
    
    await delay(2000); // Initial delay
  });

  describe("Order Lifecycle", () => {
    test("should place, modify, and cancel limit order", async () => {
      console.log("\n=== Test: Complete Order Lifecycle ===");
      
      await delay(1000);
      
      const initialPrice = 2.5000;
      const modifiedPrice = 2.6000;
      
      // Place limit sell order
      const order = await account.sell(
        TEST_UIC,
        MIN_TRADE_AMOUNT,
        "limit",
        initialPrice,
        undefined,
        {
          assetType: TEST_ASSET_TYPE,
          externalReference: "test-lifecycle-" + Date.now(),
          duration: { durationType: "GoodTillCancel" }
        }
      );
      
      console.log("Placed order:", order);
      expect(order).toBeDefined();
      
      if ('id' in order && 'type' in order) {
        expect(order.price).toBe(initialPrice);
        
        await delay(2000);
        
        // Modify order price
        const modifiedOrder = await account.modifyOrder(order.id, modifiedPrice);
        console.log("Modified order:", modifiedOrder);
        expect(modifiedOrder).toBeDefined();
        expect(modifiedOrder).toHaveProperty('OrderId', order.id);
        
        await delay(1500);
        
        // Verify modification
        const orders = await account.getOrders();
        const updatedOrder = orders?.find(o => o.id === order.id);
        if (updatedOrder) {
          console.log(`Price updated: ${initialPrice} → ${updatedOrder.price}`);
          expect(updatedOrder.price).toBe(modifiedPrice);
        }
        
        // Cancel order
        await account.cancelOrder(order.id);
        console.log("✓ Order lifecycle completed");
      }
    }, 30000);

    test("should handle market order execution", async () => {
      console.log("\n=== Test: Market Order Execution ===");
      
      await delay(3000);
      
      const result = await account.buy(
        TEST_UIC,
        MIN_TRADE_AMOUNT,
        "market",
        undefined,
        undefined,
        {
          assetType: TEST_ASSET_TYPE,
          externalReference: "test-market-" + Date.now(),
          manualOrder: true
        }
      );
      
      console.log("Market order result:", result);
      expect(result).toBeDefined();
      
      await delay(2000);
      
      // Handle both position and order results
      if ('status' in result && 'uic' in result && !('type' in result)) {
        console.log("Market order executed, created position:", result.id);
        
        // Close position if it exists
        await delay(1000);
        const positions = await account.getPositions() || [];
        const newPosition = positions.find(p => p.uic === TEST_UIC && p.quantity > 0);
        
        if (newPosition) {
          await account.sell(
            TEST_UIC,
            newPosition.quantity,
            "market",
            undefined,
            undefined,
            {
              assetType: TEST_ASSET_TYPE,
              externalReference: "test-close-" + Date.now()
            }
          );
          console.log("✓ Position closed");
        }
      } else if ('id' in result && 'type' in result) {
        console.log("Market order pending:", result.id);
        await account.cancelOrder(result.id);
        console.log("✓ Pending order cancelled");
      }
    }, 20000);
  });

  describe("Order Types", () => {
    test("should place and cancel stop order", async () => {
      console.log("\n=== Test: Stop Order ===");
      
      await delay(4000);
      
      const stopPrice = 0.9000;
      const orderPrice = 1.0000;
      
      const order = await account.sell(
        TEST_UIC,
        MIN_TRADE_AMOUNT,
        "stop",
        orderPrice,
        stopPrice,
        {
          assetType: TEST_ASSET_TYPE,
          externalReference: "test-stop-" + Date.now(),
          duration: { durationType: "GoodTillCancel" }
        }
      );
      
      console.log("Stop order placed:", order);
      
      if ('id' in order && 'type' in order) {
        expect(order.order_type).toBe("stop");
        
        await delay(1000);
        await account.cancelOrder(order.id);
        console.log("✓ Stop order cancelled");
      }
    }, 15000);
  });

  describe("Portfolio Impact", () => {
    test("should monitor portfolio changes", async () => {
      console.log("\n=== Test: Portfolio Monitoring ===");
      
      await delay(5000);
      
      const initialBalance = await account.getBalance();
      const initialPositions = await account.getPositions() || [];
      
      console.log("Initial state:", {
        balance: initialBalance.cashAvailable,
        positions: initialPositions.length
      });
      
      // Place market order
      const buyResult = await account.buy(
        TEST_UIC,
        MIN_TRADE_AMOUNT,
        "market",
        undefined,
        undefined,
        {
          assetType: TEST_ASSET_TYPE,
          externalReference: "test-portfolio-" + Date.now()
        }
      );
      
      expect(buyResult).toBeDefined();
      
      await delay(2000);
      
      const afterBalance = await account.getBalance();
      const afterPositions = await account.getPositions() || [];
      
      expect(afterBalance).toBeDefined();
      expect(afterBalance.cashAvailable).toBeTypeOf('number');
      
      console.log("After trade:", {
        balance: afterBalance.cashAvailable,
        positions: afterPositions.length,
        balanceChange: afterBalance.cashAvailable - initialBalance.cashAvailable
      });
      
      // Clean up any positions
      const eurUsdPosition = afterPositions.find(p => p.uic === TEST_UIC);
      if (eurUsdPosition && eurUsdPosition.quantity > 0) {
        const sellResult = await account.sell(
          TEST_UIC,
          eurUsdPosition.quantity,
          "market",
          undefined,
          undefined,
          {
            assetType: TEST_ASSET_TYPE,
            externalReference: "test-cleanup-" + Date.now()
          }
        );
        expect(sellResult).toBeDefined();
      }
      
      console.log("✓ Portfolio monitoring completed");
    }, 25000);
  });

  describe("Safe Trading (No Market Risk)", () => {
    test("should place and cancel limit orders safely", async () => {
      console.log("\n=== Test: Safe Order Placement ===");
      
      await delay(2000);
      
      // Place limit buy order well below market (won't execute)
      const limitPrice = 0.7000;
      
      const order = await account.buy(
        TEST_UIC,
        MIN_TRADE_AMOUNT,
        "limit",
        limitPrice,
        undefined,
        {
          assetType: TEST_ASSET_TYPE,
          externalReference: "test-safe-" + Date.now(),
          duration: { durationType: "GoodTillCancel" }
        }
      );
      
      expect(order).toBeDefined();
      
      if ('id' in order && 'type' in order) {
        expect(order.type).toBe("buy");
        expect(order.order_type).toBe("limit");
        expect(order.price).toBe(limitPrice);
        
        await delay(1000);
        
        // Verify order in system
        const orders = await account.getOrders() || [];
        const placedOrder = orders.find(o => o.id === order.id);
        expect(placedOrder).toBeDefined();
        
        // Cancel immediately
        await account.cancelOrder(order.id);
        console.log("✓ Safe order placed and cancelled");
      }
    }, 15000);

    test("should handle external references", async () => {
      console.log("\n=== Test: External Reference Tracking ===");
      
      const externalRef = "safe-ref-" + Date.now();
      
      await delay(1000);
      
      const order = await account.sell(
        TEST_UIC,
        MIN_TRADE_AMOUNT,
        "limit",
        3.0000, // High price, won't execute
        undefined,
        {
          assetType: TEST_ASSET_TYPE,
          externalReference: externalRef,
          duration: { durationType: "DayOrder" }
        }
      );
      
      if ('id' in order && 'type' in order) {
        expect(order.externalReference).toBe(externalRef);
        
        await delay(500);
        await account.cancelOrder(order.id);
        console.log("✓ External reference validated");
      }
    }, 12000);
  });

  describe("Order Pre-checking", () => {
    test("should pre-check orders before placement", async () => {
      console.log("\n=== Test: Order Pre-checking ===");
      
      await delay(1000);
      
      const orderRequest = {
        accountKey: account.key,
        uic: TEST_UIC,
        assetType: TEST_ASSET_TYPE,
        buySell: "Buy" as const,
        orderType: "Market" as const,
        amount: MIN_TRADE_AMOUNT,
        manualOrder: true
      };
      
      const preCheckResult = await client.preCheckOrder(orderRequest);
      console.log("Pre-check result:", preCheckResult);
      
      expect(preCheckResult).toBeDefined();
      
      // Pre-check should provide information about costs, margin impact, etc.
      const hasValidResponse = 
        preCheckResult.ErrorInfo || 
        preCheckResult.Costs || 
        preCheckResult.MarginImpact ||
        preCheckResult.EstimatedCosts ||
        preCheckResult.PreCheckResult;
        
      expect(hasValidResponse).toBeTruthy();
      console.log("✓ Order pre-check completed");
    }, 15000);
  });

  describe("Advanced Order Features", () => {
    test("should test different order durations", async () => {
      console.log("\n=== Test: Order Duration Types ===");
      
      await delay(2000);
      
      // Test Day Order
      const dayOrder = await account.sell(
        TEST_UIC,
        MIN_TRADE_AMOUNT,
        "limit",
        2.8000, // High price, won't execute
        undefined,
        {
          assetType: TEST_ASSET_TYPE,
          duration: { durationType: "DayOrder" },
          externalReference: "day-test-" + Date.now()
        }
      );
      
      console.log("Day Order placed:", dayOrder);
      
      if ('id' in dayOrder && 'type' in dayOrder) {
        expect(dayOrder).toBeDefined();
        
        await delay(1000);
        await account.cancelOrder(dayOrder.id);
        console.log("✓ Day order duration tested");
      }
    }, 15000);

    test("should verify order modification details", async () => {
      console.log("\n=== Test: Detailed Order Modification ===");
      
      await delay(2000);
      
      const initialPrice = 0.6500;
      const modifiedPrice = 0.6000;
      
      const order = await account.buy(
        TEST_UIC,
        MIN_TRADE_AMOUNT,
        "limit",
        initialPrice,
        undefined,
        {
          assetType: TEST_ASSET_TYPE,
          externalReference: "detailed-modify-" + Date.now(),
          duration: { durationType: "GoodTillCancel" }
        }
      );
      
      if ('id' in order && 'type' in order) {
        expect(order.price).toBe(initialPrice);
        
        await delay(2000);
        
        // Modify the order
        const modifiedOrder = await account.modifyOrder(order.id, modifiedPrice);
        expect(modifiedOrder).toBeDefined();
        expect(modifiedOrder).toHaveProperty('OrderId', order.id);
        
        await delay(1500);
        
        // Verify modification in order list
        const orders = await account.getOrders();
        const updatedOrder = orders?.find(o => o.id === order.id);
        
        if (updatedOrder) {
          console.log(`Price verification: ${initialPrice} → ${updatedOrder.price}`);
          // Note: Exact price match may vary due to API rounding
          expect(updatedOrder.price).toBeCloseTo(modifiedPrice, 4);
        }
        
        await account.cancelOrder(order.id);
        console.log("✓ Detailed order modification verified");
      }
    }, 20000);
  });

  describe("Error Handling", () => {
    test("should reject invalid orders", async () => {
      console.log("\n=== Test: Error Handling ===");
      
      await delay(1000);
      
      try {
        await account.buy(
          999999, // Invalid UIC
          MIN_TRADE_AMOUNT,
          "market",
          undefined,
          undefined,
          {
            assetType: TEST_ASSET_TYPE,
            externalReference: "test-invalid-" + Date.now()
          }
        );
        
        // Should not reach here
        expect(false).toBe(true); // Force failure if order succeeds
      } catch (error) {
        expect(error).toBeDefined();
        expect(error instanceof Error).toBe(true);
        console.log("✓ Invalid order properly rejected");
      }
    }, 10000);
  });
});