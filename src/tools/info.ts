import type { RaindexClient, OrderbookYaml } from "@rainlanguage/orderbook";
import { unwrap, toolResult, toolError } from "../lib/errors.js";

export async function listTokens(orderbookYaml: OrderbookYaml | null) {
  if (!orderbookYaml) {
    return toolError(
      "OrderbookYaml not available. Ensure registry is configured.",
    );
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
    const result = client.getAllAccounts();
    const accounts = unwrap(result, "Failed to list accounts");
    // Convert Map to serializable object
    const accountsObj: Record<string, unknown> = {};
    for (const [name, cfg] of accounts) {
      accountsObj[name] = cfg;
    }
    return toolResult(accountsObj);
  } catch (e) {
    return toolError(String(e));
  }
}
