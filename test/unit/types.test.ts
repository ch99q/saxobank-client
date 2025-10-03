import { describe, test, expect } from "vitest";
import type { AssetType, OrderOptions, OrderDuration } from "../../src/index.js";

/**
 * Unit tests for TypeScript types and interfaces
 * These tests validate the type system without requiring API calls
 */
describe("Type System", () => {
  describe("AssetType", () => {
    test("should support all forex asset types", () => {
      const forexTypes: AssetType[] = [
        "FxSpot", "FxForward", "FxVanillaOption", "FxKnockInOption", 
        "FxKnockOutOption", "FxOneTouchOption", "FxNoTouchOption", "FxBinaryOption"
      ];
      
      forexTypes.forEach(assetType => {
        expect(typeof assetType).toBe("string");
      });
    });

    test("should support all equity asset types", () => {
      const equityTypes: AssetType[] = [
        "Stock", "StockOption", "StockIndex", "StockIndexOption"
      ];
      
      equityTypes.forEach(assetType => {
        expect(typeof assetType).toBe("string");
      });
    });

    test("should support all fund and derivative types", () => {
      const otherTypes: AssetType[] = [
        "Bond", "FuturesStrategy", "CfdOnStock", "CfdOnIndex", "CfdOnFutures",
        "Etc", "Etf", "Etn", "Fund", "MutualFund"
      ];
      
      otherTypes.forEach(assetType => {
        expect(typeof assetType).toBe("string");
      });
    });
  });

  describe("OrderOptions", () => {
    test("should create valid order options", () => {
      const orderOptions: OrderOptions = {
        assetType: "Stock",
        duration: { durationType: "GoodTillCancel" },
        externalReference: "test-ref",
        manualOrder: true,
        isForceOpen: false
      };
      
      expect(orderOptions.assetType).toBe("Stock");
      expect(orderOptions.duration?.durationType).toBe("GoodTillCancel");
      expect(orderOptions.externalReference).toBe("test-ref");
      expect(orderOptions.manualOrder).toBe(true);
      expect(orderOptions.isForceOpen).toBe(false);
    });

    test("should support minimal order options", () => {
      const minimalOptions: OrderOptions = {};
      expect(minimalOptions).toBeDefined();
    });
  });

  describe("OrderDuration", () => {
    test("should support all duration types", () => {
      const durations: OrderDuration[] = [
        { durationType: "DayOrder" },
        { durationType: "GoodTillCancel" },
        { durationType: "FillOrKill" },
        { durationType: "ImmediateOrCancel" },
        { 
          durationType: "GoodTillDate", 
          expirationDateTime: new Date().toISOString() 
        }
      ];
      
      durations.forEach(duration => {
        expect(typeof duration.durationType).toBe("string");
        if (duration.durationType === "GoodTillDate") {
          expect(duration.expirationDateTime).toBeDefined();
        }
      });
    });
  });
});