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
      getTransaction: vi.fn().mockResolvedValue(ok({
        hash: "0xtx",
        sender: "0xSender",
        block: 12345,
        timestamp: 1700000000,
      })),
    } as never;

    const result = await getTransaction(client, {
      orderbook_address: "0xOB",
      tx_hash: "0xtx",
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.hash).toBe("0xtx");
    expect(data.sender).toBe("0xSender");
    expect(client.getTransaction).toHaveBeenCalledWith("0xOB", "0xtx");
  });

  it("returns error on failure", async () => {
    const client = {
      getTransaction: vi.fn().mockResolvedValue(err("tx not found")),
    } as never;

    const result = await getTransaction(client, {
      orderbook_address: "0xOB",
      tx_hash: "0x0",
    });
    expect((result as { isError?: boolean }).isError).toBe(true);
    expect(result.content[0].text).toContain("tx not found");
  });
});
