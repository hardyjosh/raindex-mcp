import { describe, it, expect, vi } from "vitest";
import { listTokens, listAccounts } from "../../src/tools/info.js";

function ok<T>(value: T) {
  return { value, error: undefined };
}
function err(msg: string) {
  return { value: undefined, error: { msg, readableMsg: msg } };
}

describe("raindex_list_tokens", () => {
  it("returns tokens from OrderbookYaml", async () => {
    const yaml = {
      getTokens: vi.fn().mockResolvedValue(ok([
        { address: "0xUSDC", symbol: "USDC", decimals: 6, chain_id: 8453 },
        { address: "0xWETH", symbol: "WETH", decimals: 18, chain_id: 8453 },
      ])),
    } as never;

    const result = await listTokens(yaml);
    expect(result.content[0].text).toContain("USDC");
    expect(result.content[0].text).toContain("WETH");
  });

  it("returns error when yaml not available", async () => {
    const result = await listTokens(null);
    expect((result as { isError?: boolean }).isError).toBe(true);
    expect(result.content[0].text).toContain("OrderbookYaml not available");
  });

  it("handles SDK error", async () => {
    const yaml = {
      getTokens: vi.fn().mockResolvedValue(err("parse error")),
    } as never;
    const result = await listTokens(yaml);
    expect((result as { isError?: boolean }).isError).toBe(true);
  });
});

describe("raindex_list_accounts", () => {
  it("returns accounts from client", async () => {
    const client = {
      getAllAccounts: vi.fn().mockResolvedValue(ok(["0xAccount1", "0xAccount2"])),
    } as never;

    const result = await listAccounts(client);
    expect(result.content[0].text).toContain("0xAccount1");
  });

  it("returns error on failure", async () => {
    const client = {
      getAllAccounts: vi.fn().mockResolvedValue(err("subgraph error")),
    } as never;

    const result = await listAccounts(client);
    expect((result as { isError?: boolean }).isError).toBe(true);
  });
});
