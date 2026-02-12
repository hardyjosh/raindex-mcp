import type { DotrainRegistry } from "@rainlanguage/orderbook";
import { unwrap, toolResult, toolError } from "../lib/errors.js";

export async function deployStrategy(
  registry: DotrainRegistry | null,
  params: {
    strategy_key: string;
    deployment_key: string;
    owner: string;
    fields: Record<string, string>;
    deposits?: Record<string, string>;
    select_tokens?: Record<string, string>;
  }
) {
  if (!registry) {
    return toolError("Registry not configured. Set RAINDEX_REGISTRY_URL to use deployment tools.");
  }
  try {
    // Get the GUI source from registry
    const guiResult = await registry.getGui(params.strategy_key, params.deployment_key);
    const gui = unwrap(guiResult, "Failed to get strategy GUI");

    // Set select tokens
    if (params.select_tokens) {
      for (const [key, address] of Object.entries(params.select_tokens)) {
        await gui.setSelectToken(key, address);
      }
    }

    // Set field values
    for (const [binding, value] of Object.entries(params.fields)) {
      const fieldResult = gui.setFieldValue(binding, value);
      unwrap(fieldResult, `Failed to set field ${binding}`);
    }

    // Set deposits
    if (params.deposits) {
      for (const [token, amount] of Object.entries(params.deposits)) {
        await gui.setDeposit(token, amount);
      }
    }

    // Generate deployment transaction args
    const argsResult = await gui.getDeploymentTransactionArgs(params.owner);
    const args = unwrap(argsResult, "Failed to generate deployment calldata");

    return toolResult({
      approvals: args.approvals,
      deploymentCalldata: args.deploymentCalldata,
      orderbookAddress: args.orderbookAddress,
      chainId: args.chainId,
    });
  } catch (e) {
    return toolError(String(e));
  }
}
