import { assertEquals } from "jsr:@std/assert";
import { createClient } from "./mod.ts";

const SAXO_USERNAME = Deno.env.get("SAXO_SIM_USERNAME")!;
const SAXO_PASSWORD = Deno.env.get("SAXO_SIM_PASSWORD")!;

const client = await createClient(SAXO_USERNAME, SAXO_PASSWORD);
Deno.test("Client connection", () => {
  assertEquals(client.id, SAXO_USERNAME);
});

const accounts = await client.getAccounts();
console.table(accounts);

Deno.test("Get accounts", () => {
  assertEquals(accounts.length > 0, true);
});

const positions = await client.getPositions();
Deno.test("Get positions", () => {
  assertEquals(Array.isArray(positions), true);
});

const orders = await client.getOrders();
Deno.test("Get orders", () => {
  assertEquals(Array.isArray(orders), true);
});