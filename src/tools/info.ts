import type { RaindexClient, OrderbookYaml } from "@rainlanguage/orderbook";
import { unwrap, toolResult, toolError } from "../lib/errors.js";

export async function listTokens(orderbookYaml: OrderbookYaml | null) {
  if (!orderbookYaml) {
    return toolError("OrderbookYaml not available. Ensure registry is configured.");
  }
  try {
    const result = await orderbookYaml.getTokens();
    const tokens = unwrap(result, "Failed to list tokens");
    return toolResult(tokens);
  } catch (e) {
    return toolError(String(e));
  }
}

export async function listAccounts(client: RaindexClient) {
  try {
    const result = await client.getAllAccounts();
    const accounts = unwrap(result, "Failed to list accounts");
    return toolResult(accounts);
  } catch (e) {
    return toolError(String(e));
  }
}
