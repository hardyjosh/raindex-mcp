import { DotrainOrderGui } from "@rainlanguage/orderbook";
import { unwrap, toolResult, toolError } from "../lib/errors.js";

/**
 * Deploy a custom .rain file directly (not from registry).
 * Supports self-contained dotrain files with embedded configuration.
 */
export async function deployCustomDotrain(params: {
  dotrain_source: string;
  deployment_key: string;
  owner: string;
  fields: Record<string, string>;
  deposits?: Record<string, string>;
  select_tokens?: Record<string, string>;
  additional_settings?: string[];
}) {
  try {
    // Get deployment keys to validate the deployment exists
    const keysResult = await DotrainOrderGui.getDeploymentKeys(
      params.dotrain_source,
      params.additional_settings ?? [],
    );
    const keys = unwrap(keysResult, "Failed to get deployment keys from dotrain");

    if (!keys.includes(params.deployment_key)) {
      return toolError(
        `Deployment key '${params.deployment_key}' not found. Available keys: ${keys.join(", ")}`,
      );
    }

    // Create the GUI from the dotrain source
    const guiResult = await DotrainOrderGui.newWithDeployment(
      params.dotrain_source,
      params.additional_settings ?? [],
      params.deployment_key,
    );
    const gui = unwrap(guiResult, "Failed to create DotrainOrderGui");

    // Set select tokens
    if (params.select_tokens) {
      for (const [key, address] of Object.entries(params.select_tokens)) {
        const tokenResult = await gui.setSelectToken(key, address);
        unwrap(tokenResult, `Failed to set select token ${key}`);
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
        const depositResult = await gui.setDeposit(token, amount);
        unwrap(depositResult, `Failed to set deposit for ${token}`);
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
