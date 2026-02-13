import type { RaindexClient, GetOrdersFilters, Address, Hex, RaindexOrder } from "@rainlanguage/orderbook";
import { unwrap, toolResult, toolError } from "../lib/errors.js";

const RAINDEX_BASE_URL = "https://v6.raindex.finance";

/**
 * Generate a Raindex UI URL for an order.
 */
function orderUrl(chainId: number, orderbook: string, orderHash: string): string {
  return `${RAINDEX_BASE_URL}/orders/${chainId}-${orderbook}-${orderHash}`;
}

/**
 * Generate a Raindex UI URL for a vault.
 */
export function vaultUrl(chainId: number, orderbook: string, vaultId: string): string {
  return `${RAINDEX_BASE_URL}/vaults/${chainId}-${orderbook}-${vaultId}`;
}

/**
 * Extract serializable order summary from a WASM RaindexOrder object.
 */
function orderSummary(o: RaindexOrder) {
  return {
    orderHash: o.orderHash,
    owner: o.owner,
    active: o.active,
    orderbook: o.orderbook,
    chainId: o.chainId,
    timestampAdded: o.timestampAdded?.toString(),
    tradesCount: o.tradesCount?.toString(),
    url: orderUrl(o.chainId, o.orderbook, o.orderHash),
  };
}

export async function listOrders(
  client: RaindexClient,
  params: {
    chain_ids?: number[];
    owner?: string;
    active?: boolean;
    tokens?: string[];
    page?: number;
  }
) {
  try {
    const filters: Partial<GetOrdersFilters> = {
      owners: params.owner ? [params.owner.toLowerCase() as Address] : [],
    };
    if (params.active !== undefined) filters.active = params.active;

    const result = await client.getOrders(
      params.chain_ids ?? null,
      filters as GetOrdersFilters,
      params.page ?? 1
    );
    const orders = unwrap(result, "Failed to list orders");

    // Extract plain data from WASM objects
    const summaries = orders.map(orderSummary);
    return toolResult(summaries);
  } catch (e) {
    return toolError(String(e));
  }
}

export async function getOrder(
  client: RaindexClient,
  params: {
    chain_id: number;
    orderbook_address: string;
    order_hash: string;
  }
) {
  try {
    const result = await client.getOrderByHash(
      params.chain_id,
      params.orderbook_address as Address,
      params.order_hash as Hex
    );
    const order = unwrap(result, "Failed to get order");
    return toolResult({
      ...orderSummary(order),
      rainlang: order.rainlang,
    });
  } catch (e) {
    return toolError(String(e));
  }
}

export async function getOrderTrades(
  client: RaindexClient,
  params: {
    chain_id: number;
    orderbook_address: string;
    order_hash: string;
  }
) {
  try {
    const orderResult = await client.getOrderByHash(
      params.chain_id,
      params.orderbook_address as Address,
      params.order_hash as Hex
    );
    const order = unwrap(orderResult, "Failed to get order");
    const tradesResult = await order.getTradesList();
    const trades = unwrap(tradesResult, "Failed to get trades");
    return toolResult(trades);
  } catch (e) {
    return toolError(String(e));
  }
}

/**
 * Quote format for clean output.
 */
interface QuoteResult {
  pair: string;
  success: boolean;
  error?: string;
  maxOutput?: string;
  ratio?: string;
  inverseRatio?: string;
}

export async function getOrderQuotes(
  client: RaindexClient,
  params: {
    chain_id: number;
    orderbook_address: string;
    order_hash: string;
  }
) {
  try {
    const orderResult = await client.getOrderByHash(
      params.chain_id,
      params.orderbook_address as Address,
      params.order_hash as Hex
    );
    const order = unwrap(orderResult, "Failed to get order");
    const quotesResult = await order.getQuotes();
    const quotes = unwrap(quotesResult, "Failed to get quotes");

    // Extract clean quote data
    const results: QuoteResult[] = quotes.map((q: any) => {
      const base: QuoteResult = {
        pair: q.pair?.pairName ?? "unknown",
        success: q.success,
      };
      if (!q.success) {
        base.error = q.error?.trim();
      } else if (q.data) {
        base.maxOutput = q.data.formattedMaxOutput;
        base.ratio = q.data.formattedRatio;
        base.inverseRatio = q.data.formattedInverseRatio;
      }
      return base;
    });
    return toolResult(results);
  } catch (e) {
    return toolError(String(e));
  }
}

/**
 * Quote all orders for an owner in a single call — avoids slow getOrderByHash lookups.
 * Orders from getOrders() already have getQuotes() available.
 */
export async function quoteAllOrders(
  client: RaindexClient,
  params: {
    chain_ids?: number[];
    owner: string;
    active_only?: boolean;
  }
) {
  try {
    const result = await client.getOrders(
      params.chain_ids ?? null,
      { owners: [params.owner.toLowerCase() as Address] } as GetOrdersFilters,
      1
    );
    const orders = unwrap(result, "Failed to list orders");

    const allQuotes: Array<{
      orderHash: string;
      quotes: QuoteResult[];
    }> = [];

    for (const o of orders) {
      if (params.active_only && !o.active) continue;

      const q = await o.getQuotes();
      if (!q.value || q.value.length === 0) continue;

      const quotes: QuoteResult[] = q.value.map((qi: any) => {
        const base: QuoteResult = {
          pair: qi.pair?.pairName ?? "unknown",
          success: qi.success,
        };
        if (!qi.success) {
          base.error = qi.error?.trim();
        } else if (qi.data) {
          base.maxOutput = qi.data.formattedMaxOutput;
          base.ratio = qi.data.formattedRatio;
          base.inverseRatio = qi.data.formattedInverseRatio;
        }
        return base;
      });

      allQuotes.push({ orderHash: o.orderHash, quotes });
    }

    return toolResult(allQuotes);
  } catch (e) {
    return toolError(String(e));
  }
}

export async function removeOrderCalldata(
  client: RaindexClient,
  params: {
    chain_id: number;
    orderbook_address: string;
    order_hash: string;
  }
) {
  try {
    const orderResult = await client.getOrderByHash(
      params.chain_id,
      params.orderbook_address as Address,
      params.order_hash as Hex
    );
    const order = unwrap(orderResult, "Failed to get order");
    const calldataResult = order.getRemoveCalldata();
    const calldata = unwrap(calldataResult, "Failed to generate remove calldata");
    return toolResult({
      calldata,
      to: params.orderbook_address,
      chainId: params.chain_id,
    });
  } catch (e) {
    return toolError(String(e));
  }
}
