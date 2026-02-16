import { describe, it, expect, vi } from "vitest";
import { getTransaction } from "../../src/tools/transactions.js";

function ok<T>(value: T) {
  return { value, error: undefined };
}
function err(msg: string) {
  return { value: undefined, error: { msg, readableMsg: msg } };
}

describe("raindex_get_transaction", () => {
  it("fetches transaction details", async () => {
    const client = {
      getTransaction: vi.fn().mockResolvedValue(
        ok({
          id: "0xtx",
          from: "0xSender",
          blockNumber: 12345n,
          timestamp: 1700000000n,
        }),
      ),
    } as never;

    const result = await getTransaction(client, {
      chain_id: 8453,
      orderbook_address: "0xOB",
      tx_hash: "0xtx",
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.id).toBe("0xtx");
    expect(data.from).toBe("0xSender");
    expect(data.blockNumber).toBe("12345");
    expect(client.getTransaction).toHaveBeenCalledWith(8453, "0xOB", "0xtx");
  });

  it("returns error on failure", async () => {
    const client = {
      getTransaction: vi.fn().mockResolvedValue(err("tx not found")),
    } as never;

    const result = await getTransaction(client, {
      chain_id: 1,
      orderbook_address: "0xOB",
      tx_hash: "0x0",
    });
    expect((result as { isError?: boolean }).isError).toBe(true);
    expect(result.content[0].text).toContain("tx not found");
  });
});
