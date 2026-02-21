# Deploying Strategies with Custom Tokens

The raindex-mcp registry deployment supports **any valid ERC-20 token address**, not just tokens listed in CoinGecko token lists.

## How It Works

When using `raindex_deploy_strategy` with `select_tokens`, the SDK accepts any valid token address on the target chain. You don't need to add custom tokens to the settings file or registry.

## Example: Deploying with a Custom Token

```javascript
// Deploy an auction-dca strategy with a custom token (R1)
const result = await raindex_deploy_strategy({
  strategy_key: "auction-dca",
  deployment_key: "base",
  owner: "0xYourWalletAddress",
  select_tokens: {
    output: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC
    input: "0xf836a500910453a397084ade41321ee20a5aade1",  // Custom R1 token
  },
  fields: {
    "time-per-amount-epoch": "86400",     // Daily budget period
    "amount-per-epoch": "5",              // 5 USDC per day
    "min-trade-amount": "0.5",
    "max-trade-amount": "5",
    "time-per-trade-epoch": "3600",       // 1 hour auction period
    "baseline": "0.8",
    "initial-io": "1.5",
    "next-trade-multiplier": "1.05",
    "next-trade-baseline-multiplier": "0"
  }
});
```

## Field Values

**Important**: All field values must be passed as strings. The SDK handles numeric parsing internally.

✅ Correct:
```javascript
fields: {
  "baseline": "0.8",
  "initial-io": "1.5",
}
```

❌ Incorrect (may cause float precision errors):
```javascript
fields: {
  "baseline": 0.8,
  "initial-io": 1.5,
}
```

## Token Address Requirements

- Must be valid checksummed or lowercase Ethereum address (42 characters starting with `0x`)
- Must be deployed on the target chain (e.g., Base for `deployment_key: "base"`)
- Token decimals are automatically detected from the chain

## Troubleshooting

### "Token not found" errors
The SDK should accept any valid address. If you get this error:
1. Verify the token address is correct and checksummed
2. Confirm the token is deployed on the target chain
3. Check that your RPC endpoint is responsive

### "LossyConversionToFloat" errors
This typically means a field value wasn't passed as a string. Ensure all numeric values in `fields` are quoted strings.

### Deployment reverts
If the deploy transaction reverts:
1. Check that the owner address has enough ETH for gas
2. If deposits are included, verify token approvals are in place
3. Verify field values are within valid ranges (e.g., `initial-io` > `baseline`)

## See Also

- [Order Removal Guide](./ORDER-REMOVAL.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
