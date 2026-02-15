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

/** Cache of resolved registries by URL. */
const registryCache = new Map<
  string,
  { registry: DotrainRegistry; orderbookYaml: OrderbookYaml }
>();

/**
 * Resolve a registry — uses the per-tool `registry_url` param if provided,
 * otherwise falls back to the context default. Caches by URL.
 */
export async function resolveRegistry(
  ctx: RaindexContext,
  registryUrl?: string,
): Promise<{
  registry: DotrainRegistry | null;
  orderbookYaml: OrderbookYaml | null;
}> {
  if (!registryUrl) {
    return { registry: ctx.registry, orderbookYaml: ctx.orderbookYaml };
  }

  const cached = registryCache.get(registryUrl);
  if (cached) return cached;

  const registryResult = await DotrainRegistry.new(registryUrl);
  const registry = unwrap(registryResult, "Failed to load registry");
  const yamlResult = registry.getOrderbookYaml();
  const orderbookYaml = unwrap(
    yamlResult,
    "Failed to get OrderbookYaml from registry",
  );

  const entry = { registry, orderbookYaml };
  registryCache.set(registryUrl, entry);
  return entry;
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
