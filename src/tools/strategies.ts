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
    const deploymentMap = unwrap(result, "Failed to get strategy details");

    // Enrich each deployment with field definitions from the GUI
    const deployments: Record<string, unknown> = {};
    for (const [deploymentKey, meta] of deploymentMap) {
      const entry: Record<string, unknown> = {
        name: meta.name,
        description: meta.description,
        short_description: meta.short_description,
      };

      try {
        const guiResult = await registry.getGui(
          params.strategy_key,
          deploymentKey,
        );
        const gui = unwrap(guiResult, "Failed to get GUI");

        const fieldDefs = unwrap(
          gui.getAllFieldDefinitions(),
          "Failed to get field definitions",
        );
        const fields: Record<string, unknown> = {};
        for (const f of fieldDefs) {
          fields[f.binding] = {
            name: f.name,
            description: f.description,
            ...(f.default !== undefined ? { default: f.default } : {}),
            ...(f.presets?.length
              ? {
                  presets: f.presets.map((p) => ({
                    id: p.id,
                    name: p.name,
                    value: p.value,
                  })),
                }
              : {}),
          };
        }
        if (Object.keys(fields).length > 0) entry.fields = fields;

        const selectTokens = unwrap(
          gui.getSelectTokens(),
          "Failed to get select tokens",
        );
        if (selectTokens.length > 0) {
          const st: Record<string, unknown> = {};
          for (const t of selectTokens) {
            st[t.key] = {
              name: t.name,
              description: t.description,
            };
          }
          entry.selectTokens = st;
        }

        const depositsCfg = unwrap(
          gui.getDeposits(),
          "Failed to get deposits",
        );
        if (depositsCfg.length > 0) {
          entry.deposits = depositsCfg.map((d) => d.token);
        }

        gui.free();
      } catch (err) {
        console.error(
          `[strategies] GUI introspection failed for ${params.strategy_key}/${deploymentKey}:`,
          err instanceof Error ? err.message : String(err),
        );
        entry.fields = {};
        entry._guiError = err instanceof Error ? err.message : String(err);
      }

      deployments[deploymentKey] = entry;
    }

    return toolResult({ deployments });
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
