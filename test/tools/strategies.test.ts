import { describe, it, expect, vi } from "vitest";
import {
  listStrategies,
  getStrategyDetails,
  composeRainlang,
} from "../../src/tools/strategies.js";

vi.mock("@rainlanguage/orderbook", () => ({
  DotrainOrder: {
    create: vi.fn().mockResolvedValue({
      value: {
        composeDeploymentToRainlang: vi.fn().mockResolvedValue({
          value: "composed-rainlang-output",
          error: undefined,
        }),
      },
      error: undefined,
    }),
  },
}));

function ok<T>(value: T) {
  return { value, error: undefined };
}

function makeGui(overrides: Record<string, unknown> = {}) {
  return {
    getAllFieldDefinitions: vi.fn().mockReturnValue(
      ok([
        {
          binding: "fixed-io",
          name: "Fixed IO Ratio",
          description: "The fixed IO ratio for the order",
          default: undefined,
          presets: [{ id: "p1", name: "Low", value: "0.0003" }],
        },
      ]),
    ),
    getSelectTokens: vi.fn().mockReturnValue(
      ok([
        { key: "token1", name: "Input Token", description: "Token to buy" },
        { key: "token2", name: "Output Token", description: "Token to sell" },
      ]),
    ),
    getDeposits: vi.fn().mockReturnValue(
      ok([{ token: "usdc", amount: "0", address: "0xUSDC" }]),
    ),
    free: vi.fn(),
    ...overrides,
  };
}

function makeRegistry(overrides: Record<string, unknown> = {}) {
  return {
    getAllOrderDetails: vi.fn().mockReturnValue(
      ok({
        valid: {
          "fixed-limit": { name: "Fixed Limit", description: "A limit order" },
        },
        invalid: {},
      }),
    ),
    getDeploymentDetails: vi.fn().mockReturnValue(
      ok(
        new Map([
          [
            "base",
            {
              name: "Base",
              description: "Base network deployment",
              short_description: undefined,
            },
          ],
        ]),
      ),
    ),
    getGui: vi.fn().mockResolvedValue(ok(makeGui())),
    ...overrides,
  } as never;
}

describe("raindex_list_strategies", () => {
  it("returns strategies from registry", async () => {
    const registry = makeRegistry();
    const result = await listStrategies(registry);
    expect(result.content[0].text).toContain("fixed-limit");
  });

  it("returns error when registry not configured", async () => {
    const result = await listStrategies(null);
    expect((result as { isError?: boolean }).isError).toBe(true);
    expect(result.content[0].text).toContain("Registry not configured");
  });
});

describe("raindex_get_strategy_details", () => {
  it("returns enriched deployment details with fields as keyed objects", async () => {
    const registry = makeRegistry();
    const result = await getStrategyDetails(registry, {
      strategy_key: "fixed-limit",
    });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.deployments.base.name).toBe("Base");

    // Fields keyed by binding name
    expect(parsed.deployments.base.fields["fixed-io"]).toEqual({
      name: "Fixed IO Ratio",
      description: "The fixed IO ratio for the order",
      presets: [{ id: "p1", name: "Low", value: "0.0003" }],
    });

    // Select tokens keyed by token key
    expect(parsed.deployments.base.selectTokens.token1).toEqual({
      name: "Input Token",
      description: "Token to buy",
    });
    expect(parsed.deployments.base.selectTokens.token2).toEqual({
      name: "Output Token",
      description: "Token to sell",
    });

    // Deposits as array of token keys
    expect(parsed.deployments.base.deposits).toEqual(["usdc"]);

    expect(registry.getDeploymentDetails).toHaveBeenCalledWith("fixed-limit");
    expect(registry.getGui).toHaveBeenCalledWith("fixed-limit", "base");
  });

  it("falls back gracefully when GUI introspection fails", async () => {
    const registry = makeRegistry({
      getGui: vi.fn().mockResolvedValue(
        ok({
          getAllFieldDefinitions: vi.fn().mockReturnValue({
            value: undefined,
            error: { msg: "wasm error", readableMsg: "GUI failed" },
          }),
          getSelectTokens: vi.fn().mockReturnValue(ok([])),
          getDeposits: vi.fn().mockReturnValue(ok([])),
          free: vi.fn(),
        }),
      ),
    });
    const result = await getStrategyDetails(registry, {
      strategy_key: "fixed-limit",
    });
    const parsed = JSON.parse(result.content[0].text);
    // Should still have the basic deployment metadata
    expect(parsed.deployments.base.name).toBe("Base");
    // Should surface the error and return empty fields
    expect(parsed.deployments.base.fields).toEqual({});
    expect(parsed.deployments.base._guiError).toBe("Failed to get field definitions: GUI failed");
    expect((result as { isError?: boolean }).isError).toBeUndefined();
  });

  it("returns error when registry not configured", async () => {
    const result = await getStrategyDetails(null, { strategy_key: "x" });
    expect((result as { isError?: boolean }).isError).toBe(true);
  });
});

describe("raindex_compose_rainlang", () => {
  it("composes rainlang from dotrain source", async () => {
    const result = await composeRainlang({
      dotrain_source: "some-dotrain-source",
      deployment_key: "base",
    });
    expect(result.content[0].text).toContain("composed-rainlang-output");
  });
});
