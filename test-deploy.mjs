import { DotrainRegistry } from "@rainlanguage/orderbook";

const registryUrl = "https://raw.githubusercontent.com/rainlanguage/rain.strategies/main/registry";
const result = await DotrainRegistry.new(registryUrl);
if (result.error) { console.error("Registry error:", result.error); process.exit(1); }
const registry = result.value;

// Get the fixed-limit strategy GUI for Base deployment
const guiResult = await registry.getGui("fixed-limit", "base");
if (guiResult.error) { console.error("GUI error:", guiResult.error); process.exit(1); }
const gui = guiResult.value;

// USDC on Base
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
// WETH on Base
const WETH = "0x4200000000000000000000000000000000000006";

const MY_ADDRESS = "0x5979fbD5E17bfE48964dACbeEa1adfad2f9a79F2";

// Set tokens: buy WETH, sell USDC
let r;
r = await gui.setSelectToken("token1", WETH);
if (r.error) { console.error("setSelectToken token1:", r.error); process.exit(1); }
r = await gui.setSelectToken("token2", USDC);
if (r.error) { console.error("setSelectToken token2:", r.error); process.exit(1); }

// Set the fixed-io: how much WETH per 1 USDC sold?
// If WETH is ~$2700, then 1 USDC buys ~0.00037 WETH
// Let's set a limit price of 0.0004 WETH per USDC (buying WETH at $2500 - a limit below market)
r = gui.setFieldValue("fixed-io", "0.0004");
if (r.error) { console.error("setFieldValue:", r.error); process.exit(1); }

// Deposit 1 USDC
r = await gui.setDeposit("token2", "1");
if (r.error) { console.error("setDeposit:", r.error); process.exit(1); }

// Generate deployment calldata
const argsResult = await gui.getDeploymentTransactionArgs(MY_ADDRESS);
if (argsResult.error) { console.error("getDeploymentTransactionArgs:", argsResult.error); process.exit(1); }
const args = argsResult.value;

console.log("Deployment args:");
console.log(JSON.stringify({
  orderbookAddress: args.orderbookAddress,
  chainId: args.chainId,
  approvals: args.approvals,
  deploymentCalldata: args.deploymentCalldata?.substring(0, 200) + "...",
  calldataLength: args.deploymentCalldata?.length,
}, null, 2));
