/**
 * Unwrap a WasmEncodedResult, throwing a clean error if it failed.
 */
export interface WasmEncodedResult<T> {
  value: T | undefined;
  error: { msg: string; readableMsg: string } | undefined;
}

export function unwrap<T>(result: WasmEncodedResult<T>, context?: string): T {
  if (result.error) {
    const prefix = context ? `${context}: ` : "";
    throw new Error(`${prefix}${result.error.readableMsg}`);
  }
  return result.value as T;
}

/**
 * Format a tool error response for MCP.
 */
export function toolError(message: string): { content: Array<{ type: "text"; text: string }>; isError: true } {
  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}

/**
 * Format a successful tool response for MCP.
 */
export function toolResult(data: unknown): { content: Array<{ type: "text"; text: string }> } {
  return {
    content: [{ type: "text", text: typeof data === "string" ? data : JSON.stringify(data, null, 2) }],
  };
}
