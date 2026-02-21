# Order Removal Guide

How to query existing orders and remove them before redeploying.

## Overview

When updating a strategy, you typically:
1. Query existing orders
2. Generate removal calldata
3. Execute removal transaction
4. Deploy new strategy

## Step 1: Find Existing Orders

### By owner address

```bash
raindex_list_orders --owner 0xYourWalletAddress
```

Returns all orders owned by that address across configured chains.

### By order hash

If you know the order hash:

```bash
raindex_get_order --orderHash 0x9a1ba49e0cab7b3d6b530b696efb5162c21bc727e8f4f00890649e3aac4e1223
```

### By token pair

Find orders involving specific tokens:

```bash
raindex_list_orders --inputToken USDC --outputToken WETH --chain base
```

## Step 2: Generate Removal Calldata

Once you have the order hash:

```bash
raindex_remove_order_calldata --orderHash 0x9a1ba49e...
```

Returns:
```json
{
  "calldata": "0x...",
  "to": "0xe522cB4a5fCb2eb31a52Ff41a4653d85A4fd7C9D",
  "chainId": 8453
}
```

## Step 3: Execute the Transaction

The MCP server returns unsigned calldata. Execute using your preferred method:

### Using cast (Foundry)

```bash
cast send 0xe522cB4a5fCb2eb31a52Ff41a4653d85A4fd7C9D \
  --rpc-url https://mainnet.base.org \
  --private-key $PRIVATE_KEY \
  --data 0x...calldata...
```

### Using a wallet/dapp

1. Go to your wallet or a contract interaction UI
2. Set the `to` address (orderbook contract)
3. Paste the calldata
4. Execute

## Step 4: Redeploy

After removal confirms, deploy the new strategy:

```bash
raindex_deploy_strategy \
  --strategy auction-dca \
  --chain base \
  --inputToken USDC \
  --outputToken R1 \
  --fields '{"amount-per-epoch": "1000000", ...}'
```

## Complete Workflow Example

```javascript
// 1. Query existing order
const order = await raindex_get_order({
  orderHash: "0x9a1ba49e..."
});

// 2. Check if active
if (order.active) {
  // 3. Get removal calldata
  const removal = await raindex_remove_order_calldata({
    orderHash: order.orderHash
  });
  
  // 4. Execute removal (external - agent signs/sends)
  // await wallet.sendTransaction(removal);
  
  // 5. Wait for confirmation
  // await tx.wait();
}

// 6. Deploy new strategy
const deployment = await raindex_deploy_strategy({
  strategy: "auction-dca",
  chain: "base",
  // ...config
});

// 7. Execute deployment (external)
// await wallet.sendTransaction(deployment);
```

## Tips

### Check vault balances first

Before removing an order, check if vaults have remaining balances:

```bash
raindex_list_vaults --owner 0xYourAddress
```

Withdraw any remaining balances before or after removal.

### Batch removals

If removing multiple orders, generate all calldata first, then execute sequentially or use a multicall contract.

### Verify removal succeeded

After executing:

```bash
raindex_get_order --orderHash 0x...
```

The order should show `active: false` or not be found.

## Common Issues

### "Order not found"

- Order may already be removed
- Check you're querying the right chain
- Subgraph may have indexing delay (wait 30-60s)

### "Execution reverted"

- Order already removed
- Caller is not the order owner
- Wrong chain/contract

### Stale calldata

Generate removal calldata immediately before executing. If other transactions occur between generation and execution, the calldata may become invalid.
