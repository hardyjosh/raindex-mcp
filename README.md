# Raindex MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server that wraps the [Raindex SDK](https://sdk.raindex.finance) (`@rainlanguage/orderbook`), enabling AI agents to query, manage, and interact with Raindex onchain orderbook positions.

## Features

- **17 MCP tools** covering orders, vaults, strategies, deployment, transactions, and token info
- **Calldata-only writes** — never holds keys or signs transactions
- **Multi-chain** — queries all configured chains from a single settings file
- **Registry integration** — browse and deploy strategies from a dotrain registry

## Prerequisites

- [Nix](https://nixos.org/download.html) with flakes enabled
- A Raindex settings YAML file (see [example](https://github.com/rainlanguage/rain.strategies/blob/main/settings.yaml))

## Setup

```bash
# Enter dev shell (provides Node.js 22)
nix develop

# Install dependencies
npm ci

# Build
npm run build

# Run tests
npm test
```

## Configuration

Set environment variables before starting the server:

| Variable | Required | Description |
|---|---|---|
| `RAINDEX_SETTINGS_PATH` | Yes* | Path to a YAML settings file |
| `RAINDEX_SETTINGS_YAML` | Yes* | Inline YAML settings string |
| `RAINDEX_REGISTRY_URL` | No | URL to a dotrain registry manifest |

*One of `RAINDEX_SETTINGS_PATH` or `RAINDEX_SETTINGS_YAML` is required.

## Usage

### As an MCP server (stdio transport)

```bash
RAINDEX_SETTINGS_PATH=./settings.yaml node dist/index.js
```

### MCP client configuration (e.g. Claude Desktop)

```json
{
  "mcpServers": {
    "raindex": {
      "command": "node",
      "args": ["/path/to/raindex-mcp/dist/index.js"],
      "env": {
        "RAINDEX_SETTINGS_PATH": "/path/to/settings.yaml",
        "RAINDEX_REGISTRY_URL": "https://example.com/registry.txt"
      }
    }
  }
}
```

## Tools

### Orders
| Tool | Description |
|---|---|
| `raindex_list_orders` | List orders with optional chain/owner/token filters |
| `raindex_get_order` | Fetch a single order by hash |
| `raindex_get_order_trades` | Trade history for an order |
| `raindex_get_order_quotes` | Live quotes for an order's pairs |
| `raindex_remove_order_calldata` | Generate calldata to remove an order |

### Vaults
| Tool | Description |
|---|---|
| `raindex_list_vaults` | List vaults with optional filters |
| `raindex_get_vault` | Fetch a single vault by ID |
| `raindex_get_vault_history` | Balance change history for a vault |
| `raindex_deposit_calldata` | Generate deposit calldata |
| `raindex_withdraw_calldata` | Generate withdraw calldata |
| `raindex_withdraw_all_calldata` | Multicall to withdraw all balances |

### Strategies & Deployment
| Tool | Description |
|---|---|
| `raindex_list_strategies` | List strategies from registry |
| `raindex_get_strategy_details` | Deployment details for a strategy |
| `raindex_compose_rainlang` | Compose Rainlang from dotrain source |
| `raindex_deploy_strategy` | Generate deployment calldata (supports custom tokens) |

> **Tip:** `raindex_deploy_strategy` accepts any valid ERC-20 token address in `select_tokens`, not just tokens from CoinGecko lists. See [docs/CUSTOM-TOKEN-DEPLOYMENT.md](docs/CUSTOM-TOKEN-DEPLOYMENT.md) for details.

### Info
| Tool | Description |
|---|---|
| `raindex_get_transaction` | Inspect an orderbook transaction |
| `raindex_list_tokens` | List all configured tokens |
| `raindex_list_accounts` | List known accounts from subgraph |

## Architecture

- **Transport:** stdio (standard MCP pattern)
- **Client:** Single `RaindexClient` instance from settings YAML
- **Write ops:** Return `{ calldata, to, chainId }` — agent signs externally
- **SDK:** `@rainlanguage/orderbook` (Rust/WASM bindings)

## Development

```bash
nix develop -c npm test          # Run tests
nix develop -c npm run lint      # Lint
nix develop -c npm run fmt       # Format
nix develop -c npm run fmt:check # Check formatting
nix develop -c npm run build     # Compile TypeScript
```

## License

MIT
