# AGENTS.md — Raindex MCP Server

## Environment

This project uses **Nix flakes** for reproducible builds. Always enter the nix shell before running any commands.

```bash
nix develop              # Enter dev shell (provides node, npm, tsc, etc.)
```

**Never** install dependencies globally or use system node/npm. Everything goes through nix.

## Commands

All commands must be run inside `nix develop`:

```bash
nix develop -c npm install       # Install deps
nix develop -c npm run build     # Compile TypeScript
nix develop -c npm test          # Run all tests
nix develop -c npm run lint      # Lint
nix develop -c npm run fmt       # Format
nix develop -c npm run fmt:check # Check formatting
```

## Project Structure

```
src/
├── index.ts              # MCP server entrypoint
├── client.ts             # RaindexClient wrapper (singleton)
├── tools/
│   ├── orders.ts         # Order query + remove calldata tools
│   ├── vaults.ts         # Vault query + deposit/withdraw calldata tools
│   ├── strategies.ts     # Registry + compose tools
│   ├── deployment.ts     # Strategy deployment calldata tool
│   ├── transactions.ts   # Transaction inspection tool
│   └── info.ts           # Token list, accounts
└── lib/
    └── errors.ts         # Error handling utilities

test/
├── tools/
│   ├── orders.test.ts
│   ├── vaults.test.ts
│   ├── strategies.test.ts
│   ├── deployment.test.ts
│   ├── transactions.test.ts
│   └── info.test.ts
└── fixtures/             # Mock SDK responses
```

## Key Design Decisions

- **Calldata-only writes**: Write tools return `{ calldata, to, chainId }`. The server never holds keys or signs transactions.
- **No wallet management**: Zero key/wallet awareness. The consuming agent handles signing.
- **Single RaindexClient**: Created on startup from settings YAML, reused across all tool calls.
- **WASM**: The SDK uses Rust/WASM bindings (`@rainlanguage/orderbook`). Ensure async init completes before serving tools.

## Conventions

- TypeScript strict mode
- All tool handlers are pure functions (SDK client injected, easy to test)
- Tool names prefixed with `raindex_`
- Human-readable amounts in, raw calldata hex out
- Errors surfaced via MCP error responses, never thrown

## Testing

- Unit tests mock the SDK layer — no RPC calls needed
- Each tool has its own test file mirroring the source structure
- Test both happy path and error cases (bad addresses, zero amounts, paused oracles, etc.)
- Integration tests (optional) use `RPC_URL_BASE_FORK` env var for fork testing
