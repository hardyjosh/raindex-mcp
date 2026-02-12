/**
 * Type declarations for @rainlanguage/orderbook SDK.
 *
 * The published npm package (0.0.1) only exports getAddOrderCalldata.
 * The full API (RaindexClient, DotrainRegistry, etc.) is documented at
 * https://sdk.raindex.finance but not yet published. These declarations
 * match the documented API so the MCP server is ready when the SDK ships.
 */
declare module "@rainlanguage/orderbook" {
  // --- Result type ---
  export interface WasmEncodedError {
    msg: string;
    readableMsg: string;
  }

  export type WasmEncodedResult<T> =
    | { value: T; error: undefined }
    | { value: undefined; error: WasmEncodedError };

  // --- Float ---
  export class Float {
    static parse(value: string): WasmEncodedResult<Float>;
    static zero(): Float;
  }

  // --- Types ---
  export type ChainIds = number[];

  export interface GetOrdersFilters {
    owners?: string[];
    active?: boolean;
    tokens?: string[];
  }

  export interface GetVaultsFilters {
    owners?: string[];
    hideZeroBalance?: boolean;
  }

  // --- RaindexVault ---
  export interface RaindexVault {
    id: string;
    token: { address: string; symbol: string; decimals: number };
    balance: string;
    owner: string;
    getBalanceChanges(): Promise<WasmEncodedResult<unknown[]>>;
    getDepositCalldata(amount: Float): Promise<WasmEncodedResult<string>>;
    getWithdrawCalldata(amount: Float): Promise<WasmEncodedResult<string>>;
    getApprovalCalldata(amount: Float): Promise<WasmEncodedResult<string | null>>;
    getAllowance(): Promise<WasmEncodedResult<string>>;
  }

  // --- RaindexVaultsList ---
  export interface RaindexVaultsList {
    items: RaindexVault[];
    getWithdrawableVaults(): WasmEncodedResult<RaindexVault[]>;
    getWithdrawCalldata(): Promise<WasmEncodedResult<string>>;
  }

  // --- RaindexOrder ---
  export interface RaindexOrder {
    hash: string;
    owner: string;
    active: boolean;
    vaultsList: RaindexVaultsList;
    getTradesList(): Promise<WasmEncodedResult<unknown[]>>;
    getQuotes(): Promise<WasmEncodedResult<unknown[]>>;
    getRemoveCalldata(): Promise<WasmEncodedResult<string>>;
  }

  // --- RaindexClient ---
  export class RaindexClient {
    static new(settings: string[], strict?: boolean): WasmEncodedResult<RaindexClient>;
    getOrders(
      chainIds: ChainIds,
      filters: GetOrdersFilters | Record<string, unknown>,
      page: number
    ): Promise<WasmEncodedResult<RaindexOrder[]>>;
    getOrderByHash(
      chainId: number,
      orderbookAddress: string,
      orderHash: string
    ): Promise<WasmEncodedResult<RaindexOrder>>;
    getVaults(
      chainIds: ChainIds,
      filters: GetVaultsFilters | Record<string, unknown>,
      page: number
    ): Promise<WasmEncodedResult<RaindexVaultsList>>;
    getVault(
      chainId: number,
      orderbookAddress: string,
      vaultId: string
    ): Promise<WasmEncodedResult<RaindexVault>>;
    getTransaction(
      orderbookAddress: string,
      txHash: string
    ): Promise<WasmEncodedResult<unknown>>;
    getAllAccounts(): Promise<WasmEncodedResult<string[]>>;
    getAddOrdersForTransaction(
      chainId: number,
      orderbookAddress: string,
      txHash: string
    ): Promise<WasmEncodedResult<RaindexOrder[]>>;
  }

  // --- OrderbookYaml ---
  export class OrderbookYaml {
    getTokens(): Promise<WasmEncodedResult<unknown[]>>;
  }

  // --- DotrainRegistry ---
  export class DotrainRegistry {
    static new(url: string): Promise<WasmEncodedResult<DotrainRegistry>>;
    getAllOrderDetails(): WasmEncodedResult<{
      valid: Map<string, { name: string; description: string }>;
      invalid: Map<string, WasmEncodedError>;
    }>;
    getDeploymentDetails(key: string): WasmEncodedResult<unknown>;
    getOrderbookYaml(): WasmEncodedResult<OrderbookYaml>;
    getGui(orderKey: string, deploymentKey: string): Promise<WasmEncodedResult<DotrainOrderGui>>;
  }

  // --- DotrainOrder ---
  export class DotrainOrder {
    static create(
      source: string,
      additionalSettings: string[]
    ): Promise<WasmEncodedResult<DotrainOrder>>;
    composeDeploymentToRainlang(key: string): Promise<WasmEncodedResult<string>>;
    composeScenarioToRainlang(key: string): Promise<WasmEncodedResult<string>>;
  }

  // --- DeploymentTransactionArgs ---
  export interface DeploymentTransactionArgs {
    approvals: Array<{ token: string; calldata: string }>;
    deploymentCalldata: string;
    orderbookAddress: string;
    chainId: number;
  }

  // --- DotrainOrderGui ---
  export class DotrainOrderGui {
    static getDeploymentKeys(
      source: string,
      additionalSettings: string[]
    ): Promise<WasmEncodedResult<string[]>>;
    static newWithDeployment(
      source: string,
      additionalSettings: string[],
      deploymentKey: string
    ): Promise<WasmEncodedResult<DotrainOrderGui>>;
    setSelectToken(key: string, address: string): Promise<void>;
    setFieldValue(binding: string, value: string): WasmEncodedResult<void>;
    setDeposit(token: string, amount: string): Promise<void>;
    getDeploymentTransactionArgs(
      owner: string
    ): Promise<WasmEncodedResult<DeploymentTransactionArgs>>;
    getAllGuiConfig(): WasmEncodedResult<unknown>;
    getSelectTokens(): WasmEncodedResult<unknown>;
    getDeposits(): WasmEncodedResult<unknown>;
    getComposedRainlang(): Promise<WasmEncodedResult<string>>;
    serializeState(): WasmEncodedResult<string>;
  }

  // --- Published function ---
  export function getAddOrderCalldata(
    dotrain: string,
    deployment: string
  ): Promise<Uint8Array>;
}
