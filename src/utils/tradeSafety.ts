import { formatUnits, parseUnits } from "ethers";

export const QUOTE_LIFETIME_MS = 30_000;
export const MAX_SLIPPAGE = 50;
export const MAX_UINT128 = (BigInt(1) << BigInt(128)) - BigInt(1);
export type SwapPhase = "preparing" | "signing" | "approving" | "approvalPending" | "submitting" | "pending" | "confirmed" | "failed";
export interface SwapProgress { phase: SwapPhase; hash?: string }

export function validSlippage(value: string): boolean {
  return /^\d+(?:\.\d{1,2})?$/.test(value) && Number(value) > 0 && Number(value) <= MAX_SLIPPAGE;
}
export function buildSwapAmounts(pay: string, receive: string, payDecimals: number, receiveDecimals: number, slippage: string, protection: boolean) {
  if (!validSlippage(slippage)) throw new Error("Invalid slippage");
  const amountIn = parseUnits(pay, Number(payDecimals));
  const amountOut = parseUnits(receive, Number(receiveDecimals));
  const basisPoints = BigInt(Math.round(Number(slippage) * 100));
  const minimum = protection ? amountOut * (BigInt(10_000) - basisPoints) / BigInt(10_000) : BigInt(0);
  if (amountIn <= BigInt(0) || amountIn > MAX_UINT128 || amountOut <= BigInt(0) || minimum > MAX_UINT128 || (protection && minimum === BigInt(0))) throw new Error("Invalid amount");
  return { amountIn, amountOut, minimum, minimumText: formatUnits(minimum, Number(receiveDecimals)), packed: (amountIn << BigInt(128)) | minimum };
}
export function isNativeAsset(address: string) {
  return /^0x0{39}[12]$/i.test(address);
}
export function matchesToken(token: { symbol?: string; name?: string; address?: string }, query: string) {
  const q = query.trim().toLowerCase();
  return [token.symbol, token.name, token.address].some(value => value?.toLowerCase().includes(q));
}
export function tokenIdentity(token: { address?: string; id?: string | number }) {
  return `${token.address?.toLowerCase() || ""}:${token.id ?? ""}`;
}
// Broadcasting is not confirmation. Replacement transactions retain their own hash and receipt.
export async function confirmSwapTransaction(transaction: any, progress?: (value: SwapProgress) => void): Promise<boolean> {
  progress?.({ phase: "pending", hash: transaction.hash });
  try {
    const receipt = await transaction.wait();
    if (!receipt) throw new Error("Receipt unavailable");
    const success = Number(receipt.status) === 1;
    progress?.({ phase: success ? "confirmed" : "failed", hash: receipt.hash || transaction.hash });
    return success;
  } catch (error: any) {
    if (error.code === "TRANSACTION_REPLACED" && error.receipt) {
      const success = !error.cancelled && Number(error.receipt.status) === 1;
      progress?.({ phase: success ? "confirmed" : "failed", hash: error.receipt.hash || error.replacement?.hash || transaction.hash });
      return success;
    }
    if (error.receipt) progress?.({ phase: "failed", hash: transaction.hash });
    throw error;
  }
}

export function assertQuoteLiquidity(data: any) {
  if (![data?.fromQuan, data?.toQuan, data?.fromValue, data?.toValue].every(value => Number.isFinite(Number(value)) && Number(value) > 0)) throw new Error("Insufficient liquidity");
}
export function assertQuoteStep(step: number, remaining: number, count: number) {
  if (count > 10000 || !Number.isFinite(step) || step <= 0 || remaining - step === remaining) throw new Error("Quote exceeds available liquidity");
}
