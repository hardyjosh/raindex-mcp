import type { RaindexClient } from "@rainlanguage/orderbook";
import { unwrap, toolResult, toolError } from "../lib/errors.js";

export async function getTransaction(
  client: RaindexClient,
  params: {
    chain_id: number;
    orderbook_address: string;
    tx_hash: string;
  }
) {
  try {
    const result = await client.getTransaction(
      params.chain_id,
      params.orderbook_address as `0x${string}`,
      params.tx_hash as `0x${string}`
    );
    const tx = unwrap(result, "Failed to get transaction");
    return toolResult(tx);
  } catch (e) {
    return toolError(String(e));
  }
}
