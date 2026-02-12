import type { RaindexClient, GetOrdersFilters, Address, Hex } from "@rainlanguage/orderbook";
import { unwrap, toolResult, toolError } from "../lib/errors.js";

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
      owners: params.owner ? [params.owner as Address] : [],
    };
    if (params.active !== undefined) filters.active = params.active;

    const result = await client.getOrders(
      params.chain_ids ?? null,
      filters as GetOrdersFilters,
      params.page ?? 1
    );
    const orders = unwrap(result, "Failed to list orders");
    return toolResult(orders);
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
    return toolResult(order);
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
    return toolResult(quotes);
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
