# Troubleshooting Guide

Common errors and their solutions when using the Raindex MCP server.

## Deployment Errors

### `LossyConversionToFloat`

**Error:** `"LossyConversionToFloat"` when calling `raindex_deploy_strategy`

**Cause:** A numeric field value cannot be precisely represented as a float.

**Solution:** Use string values for large numbers or precise decimals:
```json
{
  "fields": {
    "amount-per-epoch": "1000000000000000000",
    "baseline": "1.0"
  }
}
```

### `Missing deployment-block`

**Error:** `"deployment-block is required"` when deploying custom dotrain

**Cause:** The dotrain frontmatter is missing required metadata.

**Solution:** Include all required frontmatter fields:
```yaml
deployments:
  base-r1-usdc:
    order: base-r1-usdc
    scenario: default
    deployment-block: 12345678
    description: "My strategy description"
```

## Subgraph Errors

### `error decoding response body`

**Error:** `"error decoding response body"` when querying orders or vaults

**Causes:**
1. Subgraph is syncing or temporarily unavailable
2. Query returned malformed data
3. Network connectivity issues

**Solutions:**
1. Wait 30 seconds and retry
2. Try a different chain's subgraph to isolate the issue
3. Check [The Graph status page](https://thegraph.com/status) for outages
4. Verify the subgraph URL in your settings.yaml is correct

### Empty results when orders exist

**Error:** Query returns empty array but orders exist on-chain

**Cause:** Subgraph indexing delay (usually 1-2 blocks behind)

**Solution:** Wait 30-60 seconds after a transaction before querying.

## Registry Errors

### `Strategy not found`

**Error:** `"Strategy 'xyz' not found in registry"`

**Cause:** Strategy name doesn't match registry entries exactly.

**Solution:** 
1. Call `raindex_list_strategies` to see available strategies
2. Use exact strategy name (e.g., `auction-dca`, not `auctionDCA`)

### `GUI configuration incomplete`

**Error:** `"Missing required field: X"`

**Cause:** Not all required strategy fields were provided.

**Solution:**
1. Call `raindex_get_strategy_details` to see all required fields
2. Provide all fields listed in the `fieldMeta` response

## Token Errors

### `Token not found`

**Error:** `"Token 'ABC' not found for chain X"`

**Cause:** Token symbol or address not in settings.yaml

**Solution:** 
1. Call `raindex_list_tokens` to see configured tokens
2. Add the token to your settings.yaml, or
3. Use the full token address instead of symbol

## Transaction Errors

### `execution reverted`

**Error:** Transaction reverts when executing generated calldata

**Common causes:**
1. Insufficient token approval for deposits
2. Insufficient vault balance for withdrawals
3. Order already removed
4. Stale calldata (nonces changed)

**Solution:** Regenerate calldata immediately before execution. For deposits, ensure token approval first.

## Getting Help

If you encounter an error not listed here:

1. Check the [Raindex SDK docs](https://sdk.raindex.finance)
2. Search [GitHub issues](https://github.com/hardyjosh/raindex-mcp/issues)
3. Open a new issue with the full error message and reproduction steps
