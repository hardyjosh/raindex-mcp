import { DotrainRegistry } from "@rainlanguage/orderbook";

const registryUrl = "https://raw.githubusercontent.com/rainlanguage/rain.strategies/main/registry";
const result = await DotrainRegistry.new(registryUrl);
if (result.error) { console.error("Error:", result.error); process.exit(1); }
const registry = result.value;

// List all strategies
const allResult = registry.getAllOrderDetails();
if (allResult.error) { console.error("Error:", allResult.error); process.exit(1); }
const strategies = allResult.value;

console.log("Available strategies:");
console.log(JSON.stringify(strategies, null, 2));
