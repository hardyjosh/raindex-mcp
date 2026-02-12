#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createContext } from "./client.js";
import { listOrders, getOrder, getOrderTrades, getOrderQuotes, quoteAllOrders, removeOrderCalldata } from "./tools/orders.js";
import { listVaults, getVault, getVaultHistory, depositCalldata, withdrawCalldata, withdrawAllCalldata } from "./tools/vaults.js";
import { listStrategies, getStrategyDetails, composeRainlang } from "./tools/strategies.js";
import { deployStrategy } from "./tools/deployment.js";
import { getTransaction } from "./tools/transactions.js";
import { listTokens, listAccounts } from "./tools/info.js";

async function main() {
  const ctx = await createContext();
  const server = new McpServer({
    name: "raindex-mcp",
    version: "0.1.0",
  });

  // --- Orders ---

  server.tool(
    "raindex_list_orders",
    "List orders across configured chains with optional filters",
    {
      chain_ids: z.array(z.number()).optional().describe("Filter by chain IDs (defaults to all configured)"),
      owner: z.string().optional().describe("Filter by owner address"),
      active: z.boolean().optional().describe("Filter active/inactive orders"),
      tokens: z.array(z.string()).optional().describe("Filter by token addresses"),
      page: z.number().optional().describe("Page number (default 1)"),
    },
    async (params) => listOrders(ctx.client, params)
  );

  server.tool(
    "raindex_get_order",
    "Fetch a single order by hash with full detail",
    {
      chain_id: z.number().describe("Chain ID"),
      orderbook_address: z.string().describe("Orderbook contract address"),
      order_hash: z.string().describe("Order hash"),
    },
    async (params) => getOrder(ctx.client, params)
  );

  server.tool(
    "raindex_get_order_trades",
    "Fetch trade history for a specific order",
    {
      chain_id: z.number().describe("Chain ID"),
      orderbook_address: z.string().describe("Orderbook contract address"),
      order_hash: z.string().describe("Order hash"),
    },
    async (params) => getOrderTrades(ctx.client, params)
  );

  server.tool(
    "raindex_get_order_quotes",
    "Get live quotes for an order's trading pairs",
    {
      chain_id: z.number().describe("Chain ID"),
      orderbook_address: z.string().describe("Orderbook contract address"),
      order_hash: z.string().describe("Order hash"),
    },
    async (params) => getOrderQuotes(ctx.client, params)
  );

  server.tool(
    "raindex_quote_all_orders",
    "Quote all orders for an owner — returns live prices for every active order without needing individual order hashes",
    {
      chain_ids: z.array(z.number()).optional().describe("Filter by chain IDs (defaults to all configured)"),
      owner: z.string().describe("Owner address"),
      active_only: z.boolean().optional().describe("Only quote active orders (default false)"),
    },
    async (params) => quoteAllOrders(ctx.client, params)
  );

  server.tool(
    "raindex_remove_order_calldata",
    "Generate calldata to remove an order from the orderbook",
    {
      chain_id: z.number().describe("Chain ID"),
      orderbook_address: z.string().describe("Orderbook contract address"),
      order_hash: z.string().describe("Order hash"),
    },
    async (params) => removeOrderCalldata(ctx.client, params)
  );

  // --- Vaults ---

  server.tool(
    "raindex_list_vaults",
    "List vaults across configured chains with optional filters",
    {
      chain_ids: z.array(z.number()).optional().describe("Filter by chain IDs"),
      owner: z.string().optional().describe("Filter by owner address"),
      hide_zero_balance: z.boolean().optional().describe("Hide empty vaults (default true)"),
      page: z.number().optional().describe("Page number"),
    },
    async (params) => listVaults(ctx.client, params)
  );

  server.tool(
    "raindex_get_vault",
    "Fetch a single vault by ID",
    {
      chain_id: z.number().describe("Chain ID"),
      orderbook_address: z.string().describe("Orderbook contract address"),
      vault_id: z.string().describe("Vault ID"),
    },
    async (params) => getVault(ctx.client, params)
  );

  server.tool(
    "raindex_get_vault_history",
    "Fetch balance change history for a vault",
    {
      chain_id: z.number().describe("Chain ID"),
      orderbook_address: z.string().describe("Orderbook contract address"),
      vault_id: z.string().describe("Vault ID"),
    },
    async (params) => getVaultHistory(ctx.client, params)
  );

  server.tool(
    "raindex_deposit_calldata",
    "Generate calldata to deposit tokens into a vault",
    {
      chain_id: z.number().describe("Chain ID"),
      orderbook_address: z.string().describe("Orderbook contract address"),
      vault_id: z.string().describe("Vault ID"),
      amount: z.string().describe("Human-readable amount (e.g. '10.5')"),
    },
    async (params) => depositCalldata(ctx.client, params)
  );

  server.tool(
    "raindex_withdraw_calldata",
    "Generate calldata to withdraw tokens from a vault",
    {
      chain_id: z.number().describe("Chain ID"),
      orderbook_address: z.string().describe("Orderbook contract address"),
      vault_id: z.string().describe("Vault ID"),
      amount: z.string().describe("Human-readable amount (e.g. '2.0')"),
    },
    async (params) => withdrawCalldata(ctx.client, params)
  );

  server.tool(
    "raindex_withdraw_all_calldata",
    "Generate multicall calldata to withdraw all balances from multiple vaults at once",
    {
      chain_id: z.number().describe("Chain ID"),
      owner: z.string().describe("Owner address"),
    },
    async (params) => withdrawAllCalldata(ctx.client, params)
  );

  // --- Strategies ---

  server.tool(
    "raindex_list_strategies",
    "List available strategies from the configured registry",
    async () => listStrategies(ctx.registry)
  );

  server.tool(
    "raindex_get_strategy_details",
    "Get deployment details for a specific strategy",
    {
      strategy_key: z.string().describe("Strategy key from registry"),
    },
    async (params) => getStrategyDetails(ctx.registry, params)
  );

  server.tool(
    "raindex_compose_rainlang",
    "Compose Rainlang for a deployment from a dotrain source",
    {
      dotrain_source: z.string().describe("Full dotrain source (settings + Rainlang)"),
      deployment_key: z.string().describe("Deployment key to compose"),
    },
    async (params) => composeRainlang(params)
  );

  // --- Deployment ---

  server.tool(
    "raindex_deploy_strategy",
    "Configure and generate deployment calldata for a strategy from the registry",
    {
      strategy_key: z.string().describe("Strategy key from registry"),
      deployment_key: z.string().describe("Deployment/network key"),
      owner: z.string().describe("Deployer/owner wallet address"),
      fields: z.record(z.string(), z.string()).describe("Binding values (e.g. {\"fixed-io\": \"1850\"})"),
      deposits: z.record(z.string(), z.string()).optional().describe("Token deposits (e.g. {\"usdc\": \"5000\"})"),
      select_tokens: z.record(z.string(), z.string()).optional().describe("Token selections (e.g. {\"input-token\": \"0x...\"})"),
    },
    async (params) => deployStrategy(ctx.registry, params)
  );

  // --- Transactions ---

  server.tool(
    "raindex_get_transaction",
    "Inspect a transaction on the orderbook",
    {
      chain_id: z.number().describe("Chain ID"),
      orderbook_address: z.string().describe("Orderbook contract address"),
      tx_hash: z.string().describe("Transaction hash"),
    },
    async (params) => getTransaction(ctx.client, params)
  );

  // --- Info ---

  server.tool(
    "raindex_list_tokens",
    "List all tokens defined in the current settings/registry",
    async () => listTokens(ctx.orderbookYaml)
  );

  server.tool(
    "raindex_list_accounts",
    "List all known accounts/owners from subgraph data",
    async () => listAccounts(ctx.client)
  );

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
