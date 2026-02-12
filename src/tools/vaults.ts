import type { RaindexClient } from "@rainlanguage/orderbook";
import { Float } from "@rainlanguage/orderbook";
import { unwrap, toolResult, toolError } from "../lib/errors.js";

export async function listVaults(
  client: RaindexClient,
  params: {
    chain_ids?: number[];
    owner?: string;
    hide_zero_balance?: boolean;
    page?: number;
  }
) {
  try {
    const filters: Record<string, unknown> = {};
    if (params.owner) filters.owners = [params.owner];
    if (params.hide_zero_balance !== false) {
      filters.hideZeroBalance = true;
    }

    const result = await client.getVaults(
      params.chain_ids ?? [],
      filters,
      params.page ?? 1
    );
    const vaults = unwrap(result, "Failed to list vaults");
    return toolResult(vaults);
  } catch (e) {
    return toolError(String(e));
  }
}

export async function getVault(
  client: RaindexClient,
  params: {
    chain_id: number;
    orderbook_address: string;
    vault_id: string;
  }
) {
  try {
    const result = await client.getVault(
      params.chain_id,
      params.orderbook_address,
      params.vault_id
    );
    const vault = unwrap(result, "Failed to get vault");
    return toolResult(vault);
  } catch (e) {
    return toolError(String(e));
  }
}

export async function getVaultHistory(
  client: RaindexClient,
  params: {
    chain_id: number;
    orderbook_address: string;
    vault_id: string;
  }
) {
  try {
    const vaultResult = await client.getVault(
      params.chain_id,
      params.orderbook_address,
      params.vault_id
    );
    const vault = unwrap(vaultResult, "Failed to get vault");
    const historyResult = await vault.getBalanceChanges();
    const history = unwrap(historyResult, "Failed to get vault history");
    return toolResult(history);
  } catch (e) {
    return toolError(String(e));
  }
}

export async function depositCalldata(
  client: RaindexClient,
  params: {
    chain_id: number;
    orderbook_address: string;
    vault_id: string;
    amount: string;
  }
) {
  try {
    const vaultResult = await client.getVault(
      params.chain_id,
      params.orderbook_address,
      params.vault_id
    );
    const vault = unwrap(vaultResult, "Failed to get vault");

    const amountResult = Float.parse(params.amount);
    const amount = unwrap(amountResult, "Failed to parse amount");

    const depositResult = await vault.getDepositCalldata(amount);
    const calldata = unwrap(depositResult, "Failed to generate deposit calldata");

    // Check if approval is needed
    const allowanceResult = await vault.getAllowance();
    const allowance = unwrap(allowanceResult, "Failed to check allowance");

    const approvalResult = await vault.getApprovalCalldata(amount);
    const approvalCalldata = unwrap(approvalResult, "Failed to generate approval calldata");

    return toolResult({
      calldata,
      to: params.orderbook_address,
      chainId: params.chain_id,
      approval: approvalCalldata
        ? { calldata: approvalCalldata, currentAllowance: allowance }
        : null,
    });
  } catch (e) {
    return toolError(String(e));
  }
}

export async function withdrawCalldata(
  client: RaindexClient,
  params: {
    chain_id: number;
    orderbook_address: string;
    vault_id: string;
    amount: string;
  }
) {
  try {
    const vaultResult = await client.getVault(
      params.chain_id,
      params.orderbook_address,
      params.vault_id
    );
    const vault = unwrap(vaultResult, "Failed to get vault");

    const amountResult = Float.parse(params.amount);
    const amount = unwrap(amountResult, "Failed to parse amount");

    const withdrawResult = await vault.getWithdrawCalldata(amount);
    const calldata = unwrap(withdrawResult, "Failed to generate withdraw calldata");

    return toolResult({
      calldata,
      to: params.orderbook_address,
      chainId: params.chain_id,
    });
  } catch (e) {
    return toolError(String(e));
  }
}

export async function withdrawAllCalldata(
  client: RaindexClient,
  params: {
    chain_id: number;
    owner: string;
  }
) {
  try {
    const filters = { owners: [params.owner], hideZeroBalance: true };
    const result = await client.getVaults([params.chain_id], filters, 1);
    const vaultsList = unwrap(result, "Failed to list vaults");

    const calldataResult = await vaultsList.getWithdrawCalldata();
    const calldata = unwrap(calldataResult, "Failed to generate withdraw-all calldata");

    return toolResult({
      calldata,
      chainId: params.chain_id,
    });
  } catch (e) {
    return toolError(String(e));
  }
}
