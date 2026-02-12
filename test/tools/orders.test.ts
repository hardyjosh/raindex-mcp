import { describe, it, expect, vi } from "vitest";
import { listOrders, getOrder, getOrderTrades, getOrderQuotes, quoteAllOrders, removeOrderCalldata } from "../../src/tools/orders.js";

function ok<T>(value: T) {
  return { value, error: undefined };
}
function err(msg: string) {
  return { value: undefined, error: { msg, readableMsg: msg } };
}

function makeOrderObj(overrides: Record<string, unknown> = {}) {
  return {
    orderHash: "0xabc",
    owner: "0x1",
    active: true,
    orderbook: "0xOB",
    chainId: 8453,
    timestampAdded: 1700000000n,
    tradesCount: 5n,
    rainlang: "_ _: 1 2;",
    getTradesList: vi.fn().mockResolvedValue(ok([
      { id: "0xt1", amount: "100", timestamp: 1700000000 },
    ])),
    getQuotes: vi.fn().mockResolvedValue(ok([
      {
        pair: { pairName: "USDC/wtCOIN", inputIndex: 0, outputIndex: 0 },
        blockNumber: 42000000,
        success: true,
        data: {
          formattedMaxOutput: "87.844971445",
          formattedRatio: "154.73985",
          formattedInverseRatio: "0.0064624594",
        },
      },
    ])),
    getRemoveCalldata: vi.fn().mockReturnValue(ok("0xcalldata")),
    ...overrides,
  };
}

function makeClient(overrides: Record<string, unknown> = {}) {
  const orderObj = makeOrderObj();
  return {
    getOrders: vi.fn().mockResolvedValue(ok([orderObj])),
    getOrderByHash: vi.fn().mockResolvedValue(ok(orderObj)),
    ...overrides,
  } as never;
}

describe("raindex_list_orders", () => {
  it("returns order summaries with extracted fields", async () => {
    const client = makeClient();
    const result = await listOrders(client, {});
    const data = JSON.parse(result.content[0].text);
    expect(data[0].orderHash).toBe("0xabc");
    expect(data[0].owner).toBe("0x1");
    expect(data[0].active).toBe(true);
    expect(data[0].chainId).toBe(8453);
    expect(client.getOrders).toHaveBeenCalledWith(null, { owners: [] }, 1);
  });

  it("lowercases owner address in filter", async () => {
    const client = makeClient();
    await listOrders(client, { owner: "0xABCDEF" });
    expect(client.getOrders).toHaveBeenCalledWith(
      null,
      { owners: ["0xabcdef"] },
      1
    );
  });

  it("passes filters correctly", async () => {
    const client = makeClient();
    await listOrders(client, {
      chain_ids: [8453],
      owner: "0xOwner",
      active: true,
      page: 2,
    });
    expect(client.getOrders).toHaveBeenCalledWith(
      [8453],
      { owners: ["0xowner"], active: true },
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
  it("fetches order by hash with rainlang", async () => {
    const client = makeClient();
    const result = await getOrder(client, {
      chain_id: 8453,
      orderbook_address: "0xOB",
      order_hash: "0xabc",
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.orderHash).toBe("0xabc");
    expect(data.rainlang).toBe("_ _: 1 2;");
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
      getOrderByHash: vi.fn().mockResolvedValue(ok(
        makeOrderObj({
          getTradesList: vi.fn().mockResolvedValue(err("no trades")),
        })
      )),
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
  it("returns formatted quote data with pair, maxOutput, ratio", async () => {
    const client = makeClient();
    const result = await getOrderQuotes(client, {
      chain_id: 8453,
      orderbook_address: "0xOB",
      order_hash: "0xabc",
    });
    const data = JSON.parse(result.content[0].text);
    expect(data[0].pair).toBe("USDC/wtCOIN");
    expect(data[0].success).toBe(true);
    expect(data[0].maxOutput).toBe("87.844971445");
    expect(data[0].ratio).toBe("154.73985");
    expect(data[0].inverseRatio).toBe("0.0064624594");
  });

  it("returns error field for failed quotes", async () => {
    const client = makeClient({
      getOrderByHash: vi.fn().mockResolvedValue(ok(
        makeOrderObj({
          getQuotes: vi.fn().mockResolvedValue(ok([
            {
              pair: { pairName: "USDC/wtTSLA" },
              blockNumber: 42000000,
              success: false,
              error: "Execution reverted with error: StalePrice\n",
            },
          ])),
        })
      )),
    });
    const result = await getOrderQuotes(client, {
      chain_id: 8453,
      orderbook_address: "0xOB",
      order_hash: "0xabc",
    });
    const data = JSON.parse(result.content[0].text);
    expect(data[0].pair).toBe("USDC/wtTSLA");
    expect(data[0].success).toBe(false);
    expect(data[0].error).toContain("StalePrice");
  });
});

describe("raindex_quote_all_orders", () => {
  it("quotes all orders for an owner", async () => {
    const client = makeClient();
    const result = await quoteAllOrders(client, {
      owner: "0xABCD",
      active_only: true,
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.length).toBe(1);
    expect(data[0].orderHash).toBe("0xabc");
    expect(data[0].quotes[0].pair).toBe("USDC/wtCOIN");
    expect(data[0].quotes[0].maxOutput).toBe("87.844971445");
    // Verify lowercase
    expect(client.getOrders).toHaveBeenCalledWith(
      null,
      { owners: ["0xabcd"] },
      1
    );
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
