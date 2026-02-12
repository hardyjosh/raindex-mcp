import { describe, it, expect, vi } from "vitest";
import { deployStrategy } from "../../src/tools/deployment.js";

vi.mock("@rainlanguage/orderbook", () => ({
  DotrainOrderGui: {
    newWithDeployment: vi.fn(),
  },
}));

function ok<T>(value: T) {
  return { value, error: undefined };
}

function makeRegistry() {
  const gui = {
    setSelectToken: vi.fn().mockResolvedValue(undefined),
    setFieldValue: vi.fn().mockReturnValue({ value: undefined, error: undefined }),
    setDeposit: vi.fn().mockResolvedValue(undefined),
    getDeploymentTransactionArgs: vi.fn().mockResolvedValue(ok({
      approvals: [{ token: "0xUSDC", calldata: "0xapprove1" }],
      deploymentCalldata: "0xdeploy",
      orderbookAddress: "0xOB",
      chainId: 8453,
    })),
  };

  return {
    getGui: vi.fn().mockResolvedValue(ok(gui)),
  } as never;
}

describe("raindex_deploy_strategy", () => {
  it("generates deployment calldata with fields and deposits", async () => {
    const registry = makeRegistry();
    const result = await deployStrategy(registry, {
      strategy_key: "fixed-limit",
      deployment_key: "base",
      owner: "0xOwner",
      fields: { "fixed-io": "1850", "amount-per-trade": "250" },
      deposits: { usdc: "5000" },
      select_tokens: { "input-token": "0xUSDC" },
    });

    const data = JSON.parse(result.content[0].text);
    expect(data.deploymentCalldata).toBe("0xdeploy");
    expect(data.orderbookAddress).toBe("0xOB");
    expect(data.chainId).toBe(8453);
    expect(data.approvals).toHaveLength(1);
  });

  it("returns error when registry not configured", async () => {
    const result = await deployStrategy(null, {
      strategy_key: "x",
      deployment_key: "y",
      owner: "0x",
      fields: {},
    });
    expect((result as { isError?: boolean }).isError).toBe(true);
  });

  it("handles field validation error", async () => {
    const gui = {
      setSelectToken: vi.fn(),
      setFieldValue: vi.fn().mockReturnValue({
        value: undefined,
        error: { msg: "invalid", readableMsg: "Invalid field value" },
      }),
      setDeposit: vi.fn(),
      getDeploymentTransactionArgs: vi.fn(),
    };
    const registry = {
      getGui: vi.fn().mockResolvedValue(ok(gui)),
    } as never;

    const result = await deployStrategy(registry, {
      strategy_key: "x",
      deployment_key: "y",
      owner: "0x",
      fields: { "bad-field": "abc" },
    });
    expect((result as { isError?: boolean }).isError).toBe(true);
    expect(result.content[0].text).toContain("Invalid field value");
  });
});
