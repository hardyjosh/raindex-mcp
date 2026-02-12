import { describe, it, expect, vi } from "vitest";
import { listOrders, getOrder, getOrderTrades, getOrderQuotes, removeOrderCalldata } from "../../src/tools/orders.js";

function ok<T>(value: T) {
  return { value, error: undefined };
}
function err(msg: string) {
  return { value: undefined, error: { msg, readableMsg: msg } };
}

function makeClient(overrides: Record<string, unknown> = {}) {
  return {
    getOrders: vi.fn().mockResolvedValue(ok([
      { hash: "0xabc", owner: "0x1", active: true, inputs: [], outputs: [] },
    ])),
    getOrderByHash: vi.fn().mockResolvedValue(ok({
      hash: "0xabc",
      owner: "0x1",
      active: true,
      vaultsList: { items: [] },
      getTradesList: vi.fn().mockResolvedValue(ok([
        { id: "0xt1", amount: "100", timestamp: 1700000000 },
      ])),
      getQuotes: vi.fn().mockResolvedValue(ok([
        { maxOutput: "50", ioRatio: "1.5" },
      ])),
      getRemoveCalldata: vi.fn().mockResolvedValue(ok("0xcalldata")),
    })),
    ...overrides,
  } as never;
}

describe("raindex_list_orders", () => {
  it("returns orders with default params", async () => {
    const client = makeClient();
    const result = await listOrders(client, {});
    expect(result.content[0].text).toContain("0xabc");
    expect(client.getOrders).toHaveBeenCalledWith([], {}, 1);
  });

  it("passes filters correctly", async () => {
    const client = makeClient();
    await listOrders(client, {
      chain_ids: [8453],
      owner: "0xOwner",
      active: true,
      tokens: ["0xToken"],
      page: 2,
    });
    expect(client.getOrders).toHaveBeenCalledWith(
      [8453],
      { owners: ["0xOwner"], active: true, tokens: ["0xToken"] },
      2
    );
  });

  it("returns error on SDK failure", async () => {
    const client = makeClient({
      getOrders: vi.fn().mockResolvedValue(err("subgraph down")),
    });
    const result = await listOrders(client, {});
    expect((result as { isError?: boolean }).isError).toBe(true);
    expect(result.content[0].text).toContain("subgraph down");
  });
});

describe("raindex_get_order", () => {
  it("fetches order by hash", async () => {
    const client = makeClient();
    const result = await getOrder(client, {
      chain_id: 8453,
      orderbook_address: "0xOB",
      order_hash: "0xabc",
    });
    expect(result.content[0].text).toContain("0xabc");
    expect(client.getOrderByHash).toHaveBeenCalledWith(8453, "0xOB", "0xabc");
  });

  it("returns error on not found", async () => {
    const client = makeClient({
      getOrderByHash: vi.fn().mockResolvedValue(err("order not found")),
    });
    const result = await getOrder(client, {
      chain_id: 1,
      orderbook_address: "0x",
      order_hash: "0x0",
    });
    expect((result as { isError?: boolean }).isError).toBe(true);
  });
});

describe("raindex_get_order_trades", () => {
  it("fetches trades for an order", async () => {
    const client = makeClient();
    const result = await getOrderTrades(client, {
      chain_id: 8453,
      orderbook_address: "0xOB",
      order_hash: "0xabc",
    });
    expect(result.content[0].text).toContain("0xt1");
  });

  it("handles getTradesList error", async () => {
    const client = makeClient({
      getOrderByHash: vi.fn().mockResolvedValue(ok({
        getTradesList: vi.fn().mockResolvedValue(err("no trades")),
      })),
    });
    const result = await getOrderTrades(client, {
      chain_id: 1,
      orderbook_address: "0x",
      order_hash: "0x0",
    });
    expect((result as { isError?: boolean }).isError).toBe(true);
  });
});

describe("raindex_get_order_quotes", () => {
  it("fetches quotes for an order", async () => {
    const client = makeClient();
    const result = await getOrderQuotes(client, {
      chain_id: 8453,
      orderbook_address: "0xOB",
      order_hash: "0xabc",
    });
    expect(result.content[0].text).toContain("maxOutput");
  });
});

describe("raindex_remove_order_calldata", () => {
  it("generates remove calldata", async () => {
    const client = makeClient();
    const result = await removeOrderCalldata(client, {
      chain_id: 8453,
      orderbook_address: "0xOB",
      order_hash: "0xabc",
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.calldata).toBe("0xcalldata");
    expect(data.to).toBe("0xOB");
    expect(data.chainId).toBe(8453);
  });
});
