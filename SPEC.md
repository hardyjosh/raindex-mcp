# Raindex MCP Server — Specification

## Overview

A TypeScript MCP (Model Context Protocol) server that wraps the [Raindex SDK](https://sdk.raindex.finance) (`@rainlanguage/orderbook`), enabling AI agents to query, manage, and interact with Raindex onchain orderbook positions through standard MCP tooling.

Raindex is a programmable onchain orderbook/DEX built by Rain. Users deploy perpetual trading strategies written in Rainlang, backed by an onchain vault system. This MCP server exposes the most useful day-to-day operations for managing positions.

## Architecture

### Transport
- **stdio** transport (standard MCP pattern for local tool servers)
- Single long-lived `RaindexClient` instance created on startup

### Configuration
The server requires a YAML settings string (or path to a settings file) that defines networks, RPCs, subgraphs, orderbooks, and tokens. This is the same format used by the Raindex web app.

**Environment variables:**
| Variable | Required | Description |
|---|---|---|
| `RAINDEX_SETTINGS_PATH` | Yes* | Path to a YAML settings file |
| `RAINDEX_SETTINGS_YAML` | Yes* | Inline YAML settings string (alternative to path) |
| `RAINDEX_REGISTRY_URL` | No | URL to a dotrain registry manifest (default: `https://raw.githubusercontent.com/rainlanguage/rain.strategies/main/registry`) |

*One of `RAINDEX_SETTINGS_PATH` or `RAINDEX_SETTINGS_YAML` is required.

### Dependencies
- `@rainlanguage/orderbook` — Raindex SDK (Rust/WASM bindings)
- `@modelcontextprotocol/sdk` — MCP server framework
### Auth & Wallet
- **No wallet management** — the MCP server never holds keys or signs transactions
- **Read tools** (queries, quotes) work with no wallet config
- **Write tools** (deposit, withdraw, remove order, deploy) return calldata + target address + chainId only
- The MCP client/agent is fully responsible for signing and submitting transactions via its own wallet
- Calldata is returned as hex strings ready to be signed externally

---

## Proposed MCP Tools

### Orders

#### `raindex_list_orders`
List orders across configured chains with optional filters.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `chain_ids` | `number[]` | No | Filter by chain IDs (defaults to all configured) |
| `owner` | `string` | No | Filter by owner address |
| `active` | `boolean` | No | Filter active/inactive orders |
| `tokens` | `string[]` | No | Filter by token addresses |
| `page` | `number` | No | Page number (default 1) |

**Returns:** Array of order summaries (hash, owner, active status, input/output tokens, vault IDs)

**SDK:** `client.getOrders(chainIds, filters, page)`

---

#### `raindex_get_order`
Fetch a single order by hash with full detail.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `chain_id` | `number` | Yes | Chain ID |
| `orderbook_address` | `string` | Yes | Orderbook contract address |
| `order_hash` | `string` | Yes | Order hash |

**Returns:** Full order detail including vaults, inputs, outputs, Rainlang expression

**SDK:** `client.getOrderByHash(chainId, orderbookAddress, orderHash)`

---

#### `raindex_get_order_trades`
Fetch trade history for a specific order.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `chain_id` | `number` | Yes | Chain ID |
| `orderbook_address` | `string` | Yes | Orderbook contract address |
| `order_hash` | `string` | Yes | Order hash |

**Returns:** Array of trades with amounts, timestamps, counterparties

**SDK:** `order.getTradesList()`

---

#### `raindex_get_order_quotes`
Get live quotes for an order's trading pairs — what it would fill at right now.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `chain_id` | `number` | Yes | Chain ID |
| `orderbook_address` | `string` | Yes | Orderbook contract address |
| `order_hash` | `string` | Yes | Order hash |

**Returns:** Quote data with max output amounts and IO ratios per pair

**SDK:** `order.getQuotes()`

---

#### `raindex_remove_order_calldata`
Generate calldata to remove an order from the orderbook.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `chain_id` | `number` | Yes | Chain ID |
| `orderbook_address` | `string` | Yes | Orderbook contract address |
| `order_hash` | `string` | Yes | Order hash |

**Returns:** `{ calldata: string, to: string, chainId: number }` — ready to sign and submit externally

**SDK:** `order.getRemoveCalldata()`

---

### Vaults

#### `raindex_list_vaults`
List vaults across configured chains with optional filters.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `chain_ids` | `number[]` | No | Filter by chain IDs |
| `owner` | `string` | No | Filter by owner address |
| `hide_zero_balance` | `boolean` | No | Hide empty vaults (default true) |
| `page` | `number` | No | Page number |

**Returns:** Array of vault summaries (vault ID, token, balance, owner, orderbook)

**SDK:** `client.getVaults(chainIds, filters, page)`

---

#### `raindex_get_vault`
Fetch a single vault by ID.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `chain_id` | `number` | Yes | Chain ID |
| `orderbook_address` | `string` | Yes | Orderbook contract address |
| `vault_id` | `string` | Yes | Vault ID |

**Returns:** Vault details including balance, token info, owner

**SDK:** `client.getVault(chainId, orderbookAddress, vaultId)`

---

#### `raindex_get_vault_history`
Fetch balance change history for a vault.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `chain_id` | `number` | Yes | Chain ID |
| `orderbook_address` | `string` | Yes | Orderbook contract address |
| `vault_id` | `string` | Yes | Vault ID |

**Returns:** Array of balance changes with amounts, timestamps, transaction hashes

**SDK:** `vault.getBalanceChanges()`

---

#### `raindex_deposit_calldata`
Generate calldata to deposit tokens into a vault.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `chain_id` | `number` | Yes | Chain ID |
| `orderbook_address` | `string` | Yes | Orderbook contract address |
| `vault_id` | `string` | Yes | Vault ID |
| `amount` | `string` | Yes | Human-readable amount (e.g. "10.5") |

**Returns:** `{ calldata: string, to: string, chainId: number }` and optional approval calldata if allowance is insufficient

**SDK:** `vault.getDepositCalldata(Float.parse(amount))`, `vault.getApprovalCalldata(amount)`, `vault.getAllowance()`

---

#### `raindex_withdraw_calldata`
Generate calldata to withdraw tokens from a vault.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `chain_id` | `number` | Yes | Chain ID |
| `orderbook_address` | `string` | Yes | Orderbook contract address |
| `vault_id` | `string` | Yes | Vault ID |
| `amount` | `string` | Yes | Human-readable amount (e.g. "2.0") |

**Returns:** `{ calldata: string, to: string, chainId: number }`

**SDK:** `vault.getWithdrawCalldata(Float.parse(amount))`

---

#### `raindex_withdraw_all_calldata`
Generate multicall calldata to withdraw all balances from multiple vaults at once.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `chain_id` | `number` | Yes | Chain ID |
| `owner` | `string` | Yes | Owner address |

**Returns:** `{ calldata: string, to: string, chainId: number }` — multicall withdrawing every non-zero vault

**SDK:** `vaultsList.getWithdrawCalldata()`

---

### Strategies & Registry

#### `raindex_list_strategies`
List available strategies from the configured registry.

| Parameter | Type | Required | Description |
|---|---|---|---|
| — | — | — | No parameters |

**Returns:** Array of strategy summaries (key, name, description)

**SDK:** `registry.getAllOrderDetails()`

---

#### `raindex_get_strategy_details`
Get deployment details for a specific strategy.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `strategy_key` | `string` | Yes | Strategy key from registry |

**Returns:** Deployment options with networks, fields, presets, deposit tokens

**SDK:** `registry.getDeploymentDetails(key)`, `registry.getGui(key, deployment)`

---

#### `raindex_compose_rainlang`
Compose Rainlang for a deployment or scenario from a dotrain source.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `dotrain_source` | `string` | Yes | Full dotrain source (settings + Rainlang) |
| `deployment_key` | `string` | Yes | Deployment key to compose |

**Returns:** Composed Rainlang string

**SDK:** `DotrainOrder.create(source).composeDeploymentToRainlang(key)`

---

### Deployment (GUI-driven)

#### `raindex_deploy_strategy`
Configure and generate deployment calldata for a strategy from the registry. This is the main "deploy a new order" flow.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `strategy_key` | `string` | Yes | Strategy key from registry |
| `deployment_key` | `string` | Yes | Deployment/network key |
| `owner` | `string` | Yes | Deployer/owner wallet address |
| `fields` | `Record<string, string>` | Yes | Binding values (e.g. `{"fixed-io": "1850"}`) |
| `deposits` | `Record<string, string>` | No | Token deposits (e.g. `{"usdc": "5000"}`) |
| `select_tokens` | `Record<string, string>` | No | Token selections (e.g. `{"input-token": "0x..."}`) |

**Returns:** `{ approvals: Array<{token, calldata}>, deploymentCalldata: string, orderbookAddress: string, chainId: number }`

**SDK:** `DotrainOrderGui` workflow — `newWithDeployment()`, `setFieldValue()`, `setDeposit()`, `setSelectToken()`, `getDeploymentTransactionArgs(owner)`

---

#### `raindex_deploy_custom`
Deploy a custom .rain file directly without requiring a registry. Supports self-contained dotrain files with embedded configuration.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `dotrain_source` | `string` | Yes | Full dotrain source including YAML config and Rainlang |
| `deployment_key` | `string` | Yes | Deployment key defined in the dotrain file |
| `owner` | `string` | Yes | Deployer/owner wallet address |
| `fields` | `Record<string, string>` | Yes | Binding values for GUI fields |
| `deposits` | `Record<string, string>` | No | Token deposits |
| `select_tokens` | `Record<string, string>` | No | Token selections |
| `additional_settings` | `string[]` | No | Additional YAML to merge (empty for self-contained files) |

**Returns:** `{ approvals: Array<{token, calldata}>, deploymentCalldata: string, orderbookAddress: string, chainId: number }`

**SDK:** `DotrainOrderGui.getDeploymentKeys()`, `DotrainOrderGui.newWithDeployment()`, `gui.setFieldValue()`, `gui.setDeposit()`, `gui.getDeploymentTransactionArgs(owner)`

**Notes:**
- For self-contained files, pass `[]` for `additional_settings`
- The dotrain must include `deployment-block` in orderbook config
- GUI deployments require `description` and `fields` (even if empty)

---

### Transactions

#### `raindex_get_transaction`
Inspect a transaction on the orderbook.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `orderbook_address` | `string` | Yes | Orderbook contract address |
| `tx_hash` | `string` | Yes | Transaction hash |

**Returns:** Transaction details (sender, block, timestamp, orders added/removed)

**SDK:** `client.getTransaction(orderbookAddress, txHash)`

---

### Info

#### `raindex_list_tokens`
List all tokens defined in the current settings/registry.

| Parameter | Type | Required | Description |
|---|---|---|---|
| — | — | — | No parameters |

**Returns:** Array of tokens (address, symbol, name, decimals, chain_id)

**SDK:** `orderbookYaml.getTokens()`

---

#### `raindex_list_accounts`
List all known accounts/owners from subgraph data.

| Parameter | Type | Required | Description |
|---|---|---|---|
| — | — | — | No parameters |

**Returns:** Array of account addresses

**SDK:** `client.getAllAccounts()`

---

## Tool Grouping Summary

| Group | Tools | Read/Write |
|---|---|---|
| **Orders** | `list_orders`, `get_order`, `get_order_trades`, `get_order_quotes`, `remove_order_calldata` | Read + Calldata |
| **Vaults** | `list_vaults`, `get_vault`, `get_vault_history`, `deposit_calldata`, `withdraw_calldata`, `withdraw_all_calldata` | Read + Calldata |
| **Strategies** | `list_strategies`, `get_strategy_details`, `compose_rainlang` | Read |
| **Deployment** | `deploy_strategy`, `deploy_custom` | Calldata |
| **Transactions** | `get_transaction` | Read |
| **Info** | `list_tokens`, `list_accounts` | Read |

## Build & Toolchain

### Nix Flakes
All builds and commands use Nix flakes for reproducibility. The flake provides Node.js, TypeScript, and all dev tooling.

```bash
nix develop          # Enter dev shell
nix develop -c npm test   # Run tests via nix
```

No global installs required — everything comes from the flake.

### Testing
Full unit test coverage for every tool:
- **Read tools**: Mock SDK responses, verify correct parameter passing and response formatting
- **Write tools**: Verify calldata generation matches SDK output, test error cases
- **Edge cases**: Missing params, invalid addresses, unreachable subgraphs, WASM init failures
- **Integration tests**: Against a local fork (optional, for CI with RPC access)

Test framework: vitest

### CI/CD (GitHub Actions)
- **On push**: `nix develop -c npm test` (lint + unit tests)
- **On PR**: Same + formatting check
- All CI runs through nix for reproducibility

### Documentation
- **README.md**: Human-facing setup guide, configuration, usage examples, tool reference
- **AGENTS.md**: AI agent guide — use `nix develop` for all commands, project structure, conventions

## Implementation Notes

1. **Error handling**: The SDK uses `WasmEncodedResult<T>` everywhere. The MCP server should unwrap these and return clean error messages via MCP's error response mechanism.

2. **Pagination**: `getOrders` and `getVaults` support page numbers. The MCP tools should expose this and indicate when more pages are available.

3. **Float precision**: Use the SDK's `Float.parse()` for all human-readable amount inputs to avoid precision issues.

4. **Calldata-only writes**: All write operations return `{ calldata, to, chainId }` — never submitted transactions. The MCP server has zero wallet/key awareness. The consuming agent signs and submits via its own wallet infrastructure.

5. **Registry is optional**: Strategy/registry tools only work when `RAINDEX_REGISTRY_URL` is configured. They should return a clear message if the registry is not set up.

6. **WASM initialization**: The SDK uses Rust/WASM bindings. Ensure proper async initialization on server startup.

7. **Multi-chain**: The client naturally supports multiple chains from a single settings file. Tools should default to querying all configured chains unless filtered.
