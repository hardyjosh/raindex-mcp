import { describe, it, expect, vi } from "vitest";
import { listVaults, getVault, getVaultHistory, depositCalldata, withdrawCalldata, withdrawAllCalldata } from "../../src/tools/vaults.js";

// Mock Float.parse at module level
vi.mock("@rainlanguage/orderbook", () => ({
  Float: {
    parse: vi.fn((v: string) => ({ value: v, error: undefined })),
  },
}));

function ok<T>(value: T) {
  return { value, error: undefined };
}
function err(msg: string) {
  return { value: undefined, error: { msg, readableMsg: msg } };
}

function makeVault() {
  return {
    id: "0x01",
    token: { symbol: "USDC" },
    balance: "1000",
    getBalanceChanges: vi.fn().mockResolvedValue(ok([
      { amount: "500", timestamp: 1700000000, txHash: "0xtx1" },
    ])),
    getDepositCalldata: vi.fn().mockResolvedValue(ok("0xdeposit")),
    getWithdrawCalldata: vi.fn().mockResolvedValue(ok("0xwithdraw")),
    getApprovalCalldata: vi.fn().mockResolvedValue(ok("0xapprove")),
    getAllowance: vi.fn().mockResolvedValue(ok("0")),
  };
}

function makeClient(overrides: Record<string, unknown> = {}) {
  const vault = makeVault();
  return {
    getVaults: vi.fn().mockResolvedValue(ok({
      items: [vault],
      getWithdrawCalldata: vi.fn().mockResolvedValue(ok("0xwithdrawAll")),
    })),
    getVault: vi.fn().mockResolvedValue(ok(vault)),
    ...overrides,
  } as never;
}

describe("raindex_list_vaults", () => {
  it("returns vaults with default params", async () => {
    const client = makeClient();
    const result = await listVaults(client, {});
    expect(result.content[0].text).toContain("0x01");
    expect(client.getVaults).toHaveBeenCalledWith([], { hideZeroBalance: true }, 1);
  });

  it("passes owner filter", async () => {
    const client = makeClient();
    await listVaults(client, { owner: "0xOwner", hide_zero_balance: false });
    expect(client.getVaults).toHaveBeenCalledWith(
      [],
      { owners: ["0xOwner"] },
      1
    );
  });

  it("returns error on failure", async () => {
    const client = makeClient({
      getVaults: vi.fn().mockResolvedValue(err("failed")),
    });
    const result = await listVaults(client, {});
    expect((result as { isError?: boolean }).isError).toBe(true);
  });
});

describe("raindex_get_vault", () => {
  it("fetches vault by ID", async () => {
    const client = makeClient();
    const result = await getVault(client, {
      chain_id: 8453,
      orderbook_address: "0xOB",
      vault_id: "0x01",
    });
    expect(result.content[0].text).toContain("USDC");
  });
});

describe("raindex_get_vault_history", () => {
  it("fetches balance changes", async () => {
    const client = makeClient();
    const result = await getVaultHistory(client, {
      chain_id: 8453,
      orderbook_address: "0xOB",
      vault_id: "0x01",
    });
    expect(result.content[0].text).toContain("0xtx1");
  });
});

describe("raindex_deposit_calldata", () => {
  it("generates deposit + approval calldata", async () => {
    const client = makeClient();
    const result = await depositCalldata(client, {
      chain_id: 8453,
      orderbook_address: "0xOB",
      vault_id: "0x01",
      amount: "10.5",
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.calldata).toBe("0xdeposit");
    expect(data.to).toBe("0xOB");
    expect(data.chainId).toBe(8453);
    expect(data.approval.calldata).toBe("0xapprove");
  });

  it("handles vault not found", async () => {
    const client = makeClient({
      getVault: vi.fn().mockResolvedValue(err("vault not found")),
    });
    const result = await depositCalldata(client, {
      chain_id: 1,
      orderbook_address: "0x",
      vault_id: "0x0",
      amount: "1",
    });
    expect((result as { isError?: boolean }).isError).toBe(true);
  });
});

describe("raindex_withdraw_calldata", () => {
  it("generates withdraw calldata", async () => {
    const client = makeClient();
    const result = await withdrawCalldata(client, {
      chain_id: 8453,
      orderbook_address: "0xOB",
      vault_id: "0x01",
      amount: "2.0",
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.calldata).toBe("0xwithdraw");
  });
});

describe("raindex_withdraw_all_calldata", () => {
  it("generates withdraw-all multicall", async () => {
    const client = makeClient();
    const result = await withdrawAllCalldata(client, {
      chain_id: 8453,
      owner: "0xOwner",
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.calldata).toBe("0xwithdrawAll");
    expect(data.chainId).toBe(8453);
  });
});
