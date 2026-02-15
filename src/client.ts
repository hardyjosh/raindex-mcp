import {
  RaindexClient,
  DotrainRegistry,
  OrderbookYaml,
} from "@rainlanguage/orderbook";
import { unwrap } from "./lib/errors.js";

export interface RaindexContext {
  client: RaindexClient;
  registry: DotrainRegistry | null;
  orderbookYaml: OrderbookYaml | null;
}

/**
 * Initialize the Raindex client and optional registry from environment variables.
 */
export async function createContext(): Promise<RaindexContext> {
  const settingsPath = process.env.RAINDEX_SETTINGS_PATH;
  const settingsYaml = process.env.RAINDEX_SETTINGS_YAML;
  const registryUrl = process.env.RAINDEX_REGISTRY_URL;

  if (!settingsPath && !settingsYaml) {
    throw new Error(
      "Either RAINDEX_SETTINGS_PATH or RAINDEX_SETTINGS_YAML must be set",
    );
  }

  let yaml: string;
  if (settingsPath) {
    const { readFile } = await import("node:fs/promises");
    yaml = await readFile(settingsPath, "utf-8");
  } else {
    yaml = settingsYaml!;
  }

  const clientResult = RaindexClient.new([yaml]);
  const client = unwrap(clientResult, "Failed to create RaindexClient");

  let registry: DotrainRegistry | null = null;
  let orderbookYaml: OrderbookYaml | null = null;

  if (registryUrl) {
    const registryResult = await DotrainRegistry.new(registryUrl);
    registry = unwrap(registryResult, "Failed to load registry");
    const yamlResult = registry.getOrderbookYaml();
    orderbookYaml = unwrap(
      yamlResult,
      "Failed to get OrderbookYaml from registry",
    );
  }

  return { client, registry, orderbookYaml };
}
