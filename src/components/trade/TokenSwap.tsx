import { useState, useEffect, useRef, useMemo } from "react";
import BigNumber from "bignumber.js";
import { useTranslation } from "react-i18next";
import { useAccount, useChainId } from "wagmi";
import { useConnectModal, useChainModal } from "@rainbow-me/rainbowkit";
import { ArrowUpDown, Settings, ChevronDown, Loader2, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TokenIcon } from "@/components/common/TokenIcon";
import { TradeDialog } from "@/components/dialogs/TradeDialog";
import { SwapSeting } from "@/components/dialogs/SwapSetingDialog";
import { useValueGood, useGoodId } from "@/stores/valueGood";
import { useLocalStorage } from "@/utils/LocalStorageManager";
import { useSwapAmountStore } from "@/stores/swapAmount";
import { useMaxApprove } from "@/hooks/useMaxApprove";
import useSwap from "@/hooks/useSwap";
import useWallet from "@/hooks/useWallet";
import { newGoodsPrice, myRefer } from "@/services/graphql/swap/index";
import { DEFAULT_TOKEN, GRK_SIZES } from "@/types/common";
import { config } from "@/config/wagmi";
import { getContractAddress } from "@/data/contractConfig";
import { buildSwapAmounts, isNativeAsset, QUOTE_LIFETIME_MS, type SwapProgress } from "@/utils/tradeSafety";

type Side = "from" | "to";
type QuoteStatus = "idle" | "loading" | "ready" | "error";
type TransactionState = { phase: SwapProgress["phase"] | "unknown"; hash?: string; chainId: number; pay: string; receive: string; from: string; to: string };
export default function TokenSwap({ token, selectToken, openTokenSelection }: {
  token?: any; selectToken?: any; timeKey?: number; openTokenSelection: (type: string) => void;
}) {
  const { t } = useTranslation();
  const { swaps, swapsAmount, setAmount, setToken, handleFlip } = useSwap();
  const { balanceMap, swapBalanceStatus, refreshSwapBalances, swapBuyGood } = useWallet();
  const { info } = useValueGood();
  const { goodId } = useGoodId();
  const { ssionChian } = useLocalStorage();
  const { address, isConnected } = useAccount();
  const walletChain = useChainId();
  const { openConnectModal } = useConnectModal();
  const { openChainModal } = useChainModal();
  const { maxApprove, setMaxApprove } = useMaxApprove();
  const [slippage, setSlippage] = useState("0.5");
  const [protection, setProtection] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [edit, setEdit] = useState<{ side: Side; value: string }>({ side: "from", value: "" });
  const [quoteStatus, setQuoteStatus] = useState<QuoteStatus>("idle");
  const [quoteTime, setQuoteTime] = useState(0);
  const [quoteKey, setQuoteKey] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [transaction, setTransaction] = useState<TransactionState | null>(null);
  const [busy, setBusy] = useState(false);
  const request = useRef(0);
  const submitting = useRef(false);
  const quoteContext = `${ssionChian}:${swaps.from.id}:${swaps.to.id}:${edit.side}:${edit.value}`;
  const validQuote = quoteStatus === "ready" && quoteKey === quoteContext;
  const currentContext = `${ssionChian}:${walletChain}:${address || ""}:${swaps.from.id}:${swaps.to.id}:${edit.side}:${edit.value}:${slippage}:${protection}:${maxApprove}`;
  const contextRef = useRef(currentContext);
  contextRef.current = currentContext;
  const chain = config.chains.find(chain => chain.id === ssionChian);
  const wrongNetwork = isConnected && (walletChain !== ssionChian || !chain);
  const hasTokens = swaps.from.symbol !== DEFAULT_TOKEN && swaps.to.symbol !== DEFAULT_TOKEN;
  const expired = now - quoteTime >= QUOTE_LIFETIME_MS;
  const pay = String(swapsAmount.from.amount || "");
  const receive = String(swapsAmount.to.amount || "");
  const display = (value: string | number) => {
    const number = new BigNumber(value || 0);
    if (!number.isFinite()) return "—";
    if (number.gt(0) && number.lt("0.000001")) return "<0.000001";
    return number.toFormat(6, BigNumber.ROUND_DOWN).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  };
  useEffect(() => {
    if (!token) return;
    setToken("from", goodId.swap.id ? token.tokens?.[0] : token.tokenValue?.[0]);
  }, [token]);
  useEffect(() => {
    if (selectToken?.tokenSelectionType === "sFrom") setToken("from", selectToken);
    if (selectToken?.tokenSelectionType === "sTo") setToken("to", selectToken);
  }, [selectToken]);
  useEffect(() => {
    setReviewOpen(false);
    setEdit({ side: "from", value: "" });
    refreshSwapBalances();
  }, [ssionChian, address]);
  useEffect(() => {
    const id = ++request.current;
    let cancelled = false;
    setReviewOpen(false);
    setAmount(edit.side, edit.value, 0);
    if (!hasTokens || !info.id || !new BigNumber(edit.value || 0).isFinite() || new BigNumber(edit.value || 0).lte(0)) {
      setQuoteStatus("idle"); return;
    }
    setQuoteStatus("loading");
    const timer = setTimeout(async () => {
      try {
        const data = await newGoodsPrice({ id: info.id, from: String(swaps.from.id), to: String(swaps.to.id) }, ssionChian);
        if (cancelled || id !== request.current) return;
        setAmount(edit.side, edit.value, data);
        const result = useSwapAmountStore.getState().swapsAmount;
        if (![result.from.amount, result.to.amount].every(value => new BigNumber(value || 0).isFinite() && new BigNumber(value || 0).gt(0))) throw new Error("Quote unavailable");
        const time = Date.now(); setQuoteTime(time); setQuoteKey(quoteContext); setNow(time); setQuoteStatus("ready");
      } catch {
        if (!cancelled && id === request.current) { setAmount(edit.side, edit.value, 0); setQuoteStatus("error"); }
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [edit.side, edit.value, swaps.from.id, swaps.to.id, ssionChian, info.id, refresh]);
  useEffect(() => {
    if (quoteStatus !== "ready") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [quoteStatus]);
  useEffect(() => { setReviewOpen(false); }, [slippage, protection, maxApprove]);
  const amounts = useMemo(() => {
    try { return buildSwapAmounts(pay, receive, swaps.from.decimals, swaps.to.decimals, slippage, protection); }
    catch { return null; }
  }, [pay, receive, swaps.from.decimals, swaps.to.decimals, slippage, protection]);
  const insufficient = swapBalanceStatus === "ready" && new BigNumber(pay || 0).gt(balanceMap.from);
  const unresolved = transaction?.phase === "pending" || transaction?.phase === "approvalPending" || transaction?.phase === "unknown";
  const canReview = hasTokens && validQuote && !expired && !!amounts && isConnected && !wrongNetwork && swapBalanceStatus === "ready" && !insufficient && !busy && !unresolved;
  const impact = useMemo(() => {
    const f = new BigNumber(swapsAmount.from.currentValue || 0).div(swapsAmount.from.currentQuantity || 0).times(new BigNumber(10).pow(swaps.from.decimals));
    const r = new BigNumber(swapsAmount.to.currentValue || 0).div(swapsAmount.to.currentQuantity || 0).times(new BigNumber(10).pow(swaps.to.decimals));
    const expected = new BigNumber(pay || 0).times(f).div(r);
    const loss = expected.minus(receive || 0).div(expected).times(100);
    return loss.isFinite() && expected.gt(0) ? BigNumber.maximum(0, loss).toFixed(2) : null;
  }, [swapsAmount, swaps, pay, receive]);
  let action = t("tradeUx.review");
  if (!isConnected) action = t("tradeUx.connect");
  else if (wrongNetwork) action = t("tradeUx.switchNetwork");
  else if (!hasTokens) action = t("tradeUx.selectReceive");
  else if (!edit.value || new BigNumber(edit.value).lte(0)) action = t("tradeUx.enterAmount");
  else if (quoteStatus === "loading") action = t("tradeUx.fetchingQuote");
  else if (quoteStatus === "error") action = t("tradeUx.retryQuote");
  else if (quoteStatus === "ready" && expired) action = t("tradeUx.refreshQuote");
  else if (swapBalanceStatus === "error") action = t("tradeUx.retryBalance");
  else if (swapBalanceStatus !== "ready") action = t("tradeUx.loadingBalance");
  else if (insufficient) action = t("tradeUx.insufficient", { symbol: swaps.from.symbol });
  else if (!amounts) action = t("tradeUx.invalidPrecision");
  const primaryAction = () => {
    if (!isConnected) { openConnectModal?.(); return; }
    if (wrongNetwork) { openChainModal?.(); return; }
    if (!hasTokens) { openTokenSelection(swaps.from.symbol === DEFAULT_TOKEN ? "sFrom" : "sTo"); return; }
    if (quoteStatus === "error" || expired) { setRefresh(n => n + 1); return; }
    if (swapBalanceStatus === "error") { refreshSwapBalances(); return; }
    if (canReview) setReviewOpen(true);
  };
  const submit = async () => {
    if (!canReview || !amounts || submitting.current) return;
    submitting.current = true; setBusy(true); setReviewOpen(false);
    const expectedContext = contextRef.current;
    const snapshot = { chainId: ssionChian, pay, receive, from: swaps.from.symbol, to: swaps.to.symbol };
    let latest: TransactionState = { ...snapshot, phase: "preparing" };
    setTransaction(latest);
    const progress = (value: SwapProgress) => {
      if (["preparing", "signing", "approving", "submitting"].includes(value.phase) && (contextRef.current !== expectedContext || Date.now() - quoteTime >= QUOTE_LIFETIME_MS)) throw new Error("Quote changed or expired");
      latest = { ...latest, ...value }; setTransaction(latest);
    };
    try {
      const referral: any = await myRefer(address, ssionChian);
      if (contextRef.current !== expectedContext || Date.now() - quoteTime >= QUOTE_LIFETIME_MS) throw new Error("Quote expired");
      const result = await swapBuyGood([swaps.from.address, swaps.to.address, amounts.packed, 1], amounts.amountIn, swaps.from.address, swaps.from.symbol, maxApprove, referral.refer, progress);
      if (result === true && latest.phase === "confirmed") {
        refreshSwapBalances(); window.dispatchEvent(new Event("ttswap:trade-confirmed"));
      } else if (latest.phase === "pending" || latest.phase === "approvalPending") {
        setTransaction({ ...latest, phase: "unknown" });
      } else setTransaction({ ...latest, phase: "failed" });
    } catch { setTransaction({ ...latest, phase: latest.hash && latest.phase === "pending" ? "unknown" : "failed" }); }
    finally { submitting.current = false; setBusy(false); }
  };
  const summary = <dl className="trade-summary">
    <div><dt>{t("tradeUx.minimum")}</dt><dd title={amounts?.minimumText}>{protection && amounts ? `${amounts.minimumText} ${swaps.to.symbol}` : t("tradeUx.unprotected")}</dd></div>
    <div><dt>{t("tradeUx.fees")}</dt><dd>{display(new BigNumber(pay || 0).times(swaps.from.sellFee || 0).toFixed())} {swaps.from.symbol} + {display(new BigNumber(receive || 0).div(new BigNumber(1).minus(swaps.to.buyFee || 0)).times(swaps.to.buyFee || 0).toFixed())} {swaps.to.symbol}</dd></div>
    <div><dt>{t("tradeUx.networkFee")}</dt><dd>{t("tradeUx.walletEstimate")}</dd></div>
  </dl>;
  const actionable = !isConnected || wrongNetwork || !hasTokens || quoteStatus === "error" || (quoteStatus === "ready" && expired) || swapBalanceStatus === "error" || canReview;
  const transactionChain = config.chains.find(chain => chain.id === transaction?.chainId);
  const explorer = transactionChain?.blockExplorers?.default.url;
  const tokenField = (side: Side) => {
    const selected = swaps[side];
    const value = edit.side === side ? edit.value : quoteStatus === "ready" ? String(swapsAmount[side].amount || "") : "";
    const balance = !isConnected || swapBalanceStatus !== "ready" || selected.symbol === DEFAULT_TOKEN ? "—" : display(balanceMap[side]);
    return <section className="trade-asset-field">
      <div className="trade-field-label"><label htmlFor={`swap-${side}`}>{t(side === "from" ? "tradeUx.pay" : "tradeUx.receive")}</label>{side === "to" && quoteStatus === "loading" && <Loader2 size={16} className="trade-spinner" aria-label={t("tradeUx.fetchingQuote")} />}</div>
      <div className="trade-amount-row">
        <input id={`swap-${side}`} inputMode="decimal" autoComplete="off" spellCheck={false} placeholder="0" value={value} disabled={busy || !!unresolved} aria-describedby={`swap-${side}-balance`} onChange={e => {
          const next = e.target.value.replace(",", ".");
          if (/^\d*(?:\.\d*)?$/.test(next) && next.length <= 80) setEdit({ side, value: next });
        }} />
        <button className="trade-asset-button" disabled={busy || !!unresolved} aria-label={t("tradeUx.selectAsset", { side: t(side === "from" ? "tradeUx.pay" : "tradeUx.receive") })} onClick={() => openTokenSelection(side === "from" ? "sFrom" : "sTo")}>
          {selected.symbol !== DEFAULT_TOKEN && <TokenIcon icon={selected.logo_url} isValueToken={selected.isvaluegood} showPulse={false} size={GRK_SIZES.EXTRA_SMALL} />}
          <span title={selected.name}>{selected.symbol === DEFAULT_TOKEN ? t("tradeUx.selectToken") : selected.symbol}</span><ChevronDown size={16} />
        </button>
      </div>
      <div className="trade-field-footer"><span id={`swap-${side}-balance`}>{t("trade.balance")}: {balance}{side === "from" && isConnected && !isNativeAsset(selected.address) && selected.symbol !== DEFAULT_TOKEN && <button className="trade-max" disabled={busy || !!unresolved || swapBalanceStatus !== "ready"} onClick={() => setEdit({ side: "from", value: balanceMap.from })}>{t("trade.max")}</button>}</span><span>{quoteStatus === "ready" ? `≈ ${display(swapsAmount[side].price)} ${info.symbol}` : "—"}</span></div>
      {side === "from" && isNativeAsset(selected.address) && <p className="trade-field-note">{t("tradeUx.nativeMax")}</p>}
    </section>;
  };
  return <TabsContent value="swap" className="trade-swap">
    <div className="trade-swap-heading"><h1>{t("tradeUx.swapTitle")}</h1><button className="trade-icon-button" aria-label={t("tradeUx.settings")} onClick={() => setSettingsOpen(true)} disabled={busy || !!unresolved}><Settings size={20} /></button></div>
    <div className="trade-network"><span>{chain?.name || ssionChian}{(chain && "testnet" in chain && chain.testnet) ? ` · ${t("tradeUx.testnet")}` : ""}</span><span>{t("tradeUx.slippage")}: {slippage}%</span></div>
    {tokenField("from")}
    <div className="trade-flip-row"><button className="trade-icon-button trade-flip" aria-label={t("tradeUx.flip")} disabled={!hasTokens || busy || !!unresolved} onClick={() => { setEdit({ side: "from", value: receive }); handleFlip(); }}><ArrowUpDown size={18} /></button></div>
    {tokenField("to")}
    {quoteStatus === "error" && <p className="trade-inline-alert" role="alert">{t("tradeUx.quoteError")}<button onClick={() => setRefresh(n => n + 1)}>{t("tradeUx.retry")}</button></p>}
    {quoteStatus === "ready" && amounts && <>
      {summary}
      {!protection && <p className="trade-warning" role="alert">{t("tradeUx.noProtection")}</p>}
      {expired && <p className="trade-warning" role="status">{t("tradeUx.quoteExpired")}</p>}
      {impact !== null && Number(impact) > 3 && <p className="trade-warning" role="alert">{t("tradeUx.impactWarning", { impact })}</p>}
      <details className="trade-details"><summary>{t("tradeUx.details")}<ChevronDown size={16} /></summary><dl>
        <div><dt>{t("tradeUx.rate")}</dt><dd>1 {swaps.from.symbol} ≈ {display(new BigNumber(receive).div(pay).toFixed(8))} {swaps.to.symbol}</dd></div>
        <div><dt>{t("tradeUx.sellFee")}</dt><dd>{display(new BigNumber(pay).times(swaps.from.sellFee || 0).toFixed())} {swaps.from.symbol} ({new BigNumber(swaps.from.sellFee || 0).times(100).toFixed()}%)</dd></div>
        <div><dt>{t("tradeUx.buyFee")}</dt><dd>{display(new BigNumber(receive).div(new BigNumber(1).minus(swaps.to.buyFee || 0)).times(swaps.to.buyFee || 0).toFixed())} {swaps.to.symbol} ({new BigNumber(swaps.to.buyFee || 0).times(100).toFixed()}%)</dd></div>
        <div><dt>{t("tradeUx.impact")}</dt><dd>{impact === null ? "—" : `${impact}%`}</dd></div>
      </dl><p>{t("tradeUx.impactHelp")}</p></details>
    </>}
    {swapBalanceStatus === "error" && isConnected && <p className="trade-error" role="alert">{t("tradeUx.balanceError")}</p>}
    <Button className="trade-primary trade-submit" disabled={!actionable || busy || !!unresolved} onClick={primaryAction}>{busy && <Loader2 size={18} className="trade-spinner" />}{busy ? t(`tradeUx.phase.${transaction?.phase || "preparing"}`) : action}</Button>
    {!isConnected && <p className="trade-connect-note">{t("tradeUx.connectNote")}</p>}
    {transaction && <div className={`trade-transaction trade-transaction-${transaction.phase}`} role="status" aria-live="polite">
      {transaction.phase === "confirmed" ? <CheckCircle2 size={20} /> : transaction.phase === "failed" || transaction.phase === "unknown" ? <AlertCircle size={20} /> : <Loader2 size={20} className="trade-spinner" />}
      <div><strong>{t(`tradeUx.phase.${transaction.phase}`)}</strong><p>{transaction.pay} {transaction.from} → {transaction.phase === "confirmed" ? t("tradeUx.viewActualResult") : `${transaction.receive} ${transaction.to} (${t("tradeUx.estimated")})`}</p>
        {(transaction.phase === "failed" || transaction.phase === "unknown") && <p>{t(transaction.phase === "unknown" ? "tradeUx.unknownHelp" : "tradeUx.failedHelp")}</p>}
        {transaction.hash && explorer && <a href={`${explorer}/tx/${transaction.hash}`} target="_blank" rel="noopener noreferrer">{t("tradeUx.viewTransaction")}<ExternalLink size={14} /></a>}
        {(transaction.phase === "failed" || transaction.phase === "confirmed") && <button onClick={() => { setTransaction(null); setRefresh(n => n + 1); }}>{t(transaction.phase === "confirmed" ? "tradeUx.newSwap" : "tradeUx.retryQuote")}</button>}
      </div>
    </div>}
    <SwapSeting open={settingsOpen} onOpenChange={setSettingsOpen} values={{ slippage, protection, maxApprove }} onChange={(s, p, a) => { setSlippage(s); setProtection(p); setMaxApprove(a); }} />
    <TradeDialog open={reviewOpen} onOpenChange={setReviewOpen} title={t("tradeUx.reviewTitle")} description={t("tradeUx.reviewIntro")}>
      <dl className="trade-review"><div><dt>{t("tradeUx.network")}</dt><dd>{chain?.name}{(chain && "testnet" in chain && chain.testnet) ? ` · ${t("tradeUx.testnet")}` : ""}</dd></div><div><dt>{t("tradeUx.pay")}</dt><dd>{pay} {swaps.from.symbol}</dd></div><div className="trade-review-receive"><dt>{t("tradeUx.receive")}</dt><dd>{receive} {swaps.to.symbol}</dd></div></dl>
      {summary}
      <div className="trade-review-approval"><strong>{t("tradeUx.authorization")}</strong><p>{isNativeAsset(swaps.from.address) ? t("tradeUx.nativeAuthorization") : t(maxApprove ? "tradeUx.extendedAuthorization" : "tradeUx.exactAuthorization", { amount: pay, symbol: swaps.from.symbol })}</p><span>{t("tradeUx.contract")}</span><code>{getContractAddress(ssionChian)}</code><p>{t("tradeUx.approvalSteps")}</p></div>
      {!protection && <p className="trade-warning" role="alert">{t("tradeUx.noProtection")}</p>}
      {impact !== null && Number(impact) > 3 && <p className="trade-warning">{t("tradeUx.impactWarning", { impact })}</p>}
      {expired && <p className="trade-error" role="alert">{t("tradeUx.quoteExpired")}</p>}
      <div className="trade-dialog-actions"><Button variant="outline" onClick={() => setReviewOpen(false)}>{t("tradeUx.cancel")}</Button><Button className="trade-primary" disabled={!canReview} onClick={submit}>{t("tradeUx.confirmSwap")}</Button></div>
    </TradeDialog>
  </TabsContent>;
}
