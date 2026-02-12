import type { RaindexClient } from "@rainlanguage/orderbook";
import { unwrap, toolResult, toolError } from "../lib/errors.js";

export async function getTransaction(
  client: RaindexClient,
  params: {
    orderbook_address: string;
    tx_hash: string;
  }
) {
  try {
    const result = await client.getTransaction(
      params.orderbook_address,
      params.tx_hash
    );
    const tx = unwrap(result, "Failed to get transaction");
    return toolResult(tx);
  } catch (e) {
    return toolError(String(e));
  }
}
