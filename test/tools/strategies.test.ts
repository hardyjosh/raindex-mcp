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
      ok({
        deployments: { base: { name: "Base" } },
      }),
    ),
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
  it("returns deployment details for a strategy", async () => {
    const registry = makeRegistry();
    const result = await getStrategyDetails(registry, {
      strategy_key: "fixed-limit",
    });
    expect(result.content[0].text).toContain("Base");
    expect(registry.getDeploymentDetails).toHaveBeenCalledWith("fixed-limit");
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
