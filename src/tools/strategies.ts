import type { DotrainRegistry } from "@rainlanguage/orderbook";
import { DotrainOrder } from "@rainlanguage/orderbook";
import { unwrap, toolResult, toolError } from "../lib/errors.js";

export async function listStrategies(registry: DotrainRegistry | null) {
  if (!registry) {
    return toolError(
      "Registry not configured. Set RAINDEX_REGISTRY_URL to use strategy tools.",
    );
  }
  try {
    const result = registry.getAllOrderDetails();
    const details = unwrap(result, "Failed to list strategies");
    return toolResult(details);
  } catch (e) {
    return toolError(String(e));
  }
}

export async function getStrategyDetails(
  registry: DotrainRegistry | null,
  params: { strategy_key: string },
) {
  if (!registry) {
    return toolError(
      "Registry not configured. Set RAINDEX_REGISTRY_URL to use strategy tools.",
    );
  }
  try {
    const result = registry.getDeploymentDetails(params.strategy_key);
    const details = unwrap(result, "Failed to get strategy details");
    return toolResult(details);
  } catch (e) {
    return toolError(String(e));
  }
}

export async function composeRainlang(params: {
  dotrain_source: string;
  deployment_key: string;
}) {
  try {
    const dotrainResult = await DotrainOrder.create(params.dotrain_source, []);
    const dotrain = unwrap(dotrainResult, "Failed to create DotrainOrder");

    const result = await dotrain.composeDeploymentToRainlang(
      params.deployment_key,
    );
    const rainlang = unwrap(result, "Failed to compose Rainlang");
    return toolResult({ rainlang });
  } catch (e) {
    return toolError(String(e));
  }
}
