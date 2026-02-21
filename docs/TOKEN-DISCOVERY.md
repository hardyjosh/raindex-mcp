# Token Discovery Guide

How to find and verify token addresses for use with Raindex.

## Quick Start

```bash
# List all configured tokens
raindex_list_tokens

# Filter by chain
raindex_list_tokens --chain base
```

## Finding Token Addresses

### 1. Check your settings.yaml

Tokens are configured in your settings file:

```yaml
tokens:
  base-usdc:
    network: base
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
    decimals: 6
    symbol: USDC
    
  base-weth:
    network: base
    address: "0x4200000000000000000000000000000000000006"
    decimals: 18
    symbol: WETH
```

### 2. Verify on block explorers

Always verify addresses on the chain's official explorer:

| Chain | Explorer |
|-------|----------|
| Base | [basescan.org](https://basescan.org) |
| Polygon | [polygonscan.com](https://polygonscan.com) |
| Arbitrum | [arbiscan.io](https://arbiscan.io) |
| Ethereum | [etherscan.io](https://etherscan.io) |
| Flare | [flarescan.com](https://flarescan.com) |

### 3. Common token addresses

#### Base
| Token | Address |
|-------|---------|
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| WETH | `0x4200000000000000000000000000000000000006` |
| cbETH | `0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22` |

#### Polygon
| Token | Address |
|-------|---------|
| USDC | `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` |
| WETH | `0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619` |
| WMATIC | `0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270` |

#### Arbitrum
| Token | Address |
|-------|---------|
| USDC | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` |
| WETH | `0x82aF49447D8a07e3bd95BD0d56f35241523fBab1` |
| ARB | `0x912CE59144191C1204E64559FE8253a0e49E6548` |

## Adding Custom Tokens

To use a token not in your settings.yaml:

### Option 1: Add to settings.yaml

```yaml
tokens:
  base-mytoken:
    network: base
    address: "0x..."
    decimals: 18
    symbol: MYTOKEN
```

### Option 2: Use full address

Pass the full address instead of a symbol:

```json
{
  "inputToken": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "outputToken": "0x4200000000000000000000000000000000000006"
}
```

## Verifying Token Decimals

Token decimals are critical for amount calculations. Verify by:

1. **Block explorer** — Token contract → Read → `decimals()`
2. **raindex_list_tokens** — Shows decimals for configured tokens
3. **Common patterns:**
   - USDC/USDT: 6 decimals
   - Most ERC-20s: 18 decimals
   - WBTC: 8 decimals

## Troubleshooting

### "Token not found"

1. Check spelling matches exactly (case-sensitive)
2. Verify the token is in your settings.yaml
3. Try using the full address instead of symbol

### Wrong amounts after deposit/withdraw

Check decimal conversion:
- 1 USDC = `1000000` (6 decimals)
- 1 WETH = `1000000000000000000` (18 decimals)

The SDK handles conversion, but verify your input amounts use the correct decimal places.
