import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Search, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TradeDialog } from "./TradeDialog";
import { GoodsDatas } from "@/services/graphql/swap/index";
import { Timestamp } from "@/services/graphql/util";
import { TokenIcon } from "@/components/common/TokenIcon";
import { GRK_SIZES } from "@/types/common";
import type { SwapTokenValue, InvestToken } from "@/types/token";
import { matchesToken, tokenIdentity } from "@/utils/tradeSafety";
import { config } from "@/config/wagmi";

export function TokenSelectionDialog({ open, onOpenChange, onSelectToken, selectedToken, title, info, ssionChian }: {
  open: boolean; onOpenChange: (open: boolean) => void; onSelectToken: (token: SwapTokenValue) => void;
  selectedToken?: SwapTokenValue | InvestToken; title?: string; info: any; ssionChian: number;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [tokens, setTokens] = useState<SwapTokenValue[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [retry, setRetry] = useState(0);
  const chain = config.chains.find(chain => chain.id === ssionChian);
  useEffect(() => { setTokens([]); setRecent([]); setQuery(""); }, [ssionChian]);
  useEffect(() => {
    if (!open) return;
    setQuery("");
    let cancelled = false;
    setStatus("loading");
    if (!info?.id) return;
    GoodsDatas({ id: info.id, sel: "", gid: "", par: Timestamp() }, ssionChian).then((data: any) => {
      if (cancelled) return;
      const unique = new Map<string, SwapTokenValue>();
      [...(data?.tokenValue || []), ...(data?.tokens || [])].forEach(token => unique.set(tokenIdentity(token), token));
      setTokens(Array.from(unique.values())); setStatus("ready");
    }).catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
  }, [open, info?.id, ssionChian, retry]);
  const filtered = useMemo(() => tokens.filter(token => matchesToken(token, query)), [tokens, query]);
  const select = (token: SwapTokenValue) => {
    setRecent(previous => [tokenIdentity(token), ...previous.filter(id => id !== tokenIdentity(token))].slice(0, 5));
    onSelectToken(token); onOpenChange(false);
  };
  const copy = async (token: SwapTokenValue) => {
    try { await navigator.clipboard.writeText(token.address); toast.success(t("tradeUx.addressCopied")); }
    catch { toast.error(t("tradeUx.copyFailed")); }
  };
  return <TradeDialog open={open} onOpenChange={onOpenChange} title={title || t("tradeUx.selectToken")} description={`${chain?.name || ssionChian}${(chain && "testnet" in chain && chain.testnet) ? ` · ${t("tradeUx.testnet")}` : ""} · ${t("tradeUx.tokenIntro")}`} className="trade-token-dialog">
    <div className="trade-token-search"><Search size={18} aria-hidden="true" /><Input autoFocus aria-label={t("tradeUx.tokenSearch")} placeholder={t("trade.selection.input.tip")} value={query} onChange={e => setQuery(e.target.value)} /></div>
    {!query.trim() && recent.length > 0 && <div className="trade-recent-tokens"><span>{t("trade.selection.recently")}</span><div>{tokens.filter(token => recent.includes(tokenIdentity(token))).map(token => <Button key={tokenIdentity(token)} variant="outline" onClick={() => select(token)}>{token.symbol}</Button>)}</div></div>}
    <div className="trade-token-list" aria-live="polite" aria-busy={status === "loading"}>
      {status === "loading" && <div className="trade-empty"><Loader2 className="trade-spinner" size={20} /><p>{t("tradeUx.loadingTokens")}</p></div>}
      {status === "error" && <div className="trade-empty"><p role="alert">{t("tradeUx.tokensError")}</p><Button variant="outline" onClick={() => setRetry(n => n + 1)}>{t("tradeUx.retry")}</Button></div>}
      {status === "ready" && filtered.map(token => {
        const selected = tokenIdentity(selectedToken || {}) === tokenIdentity(token);
        return <div className="trade-token-row" key={tokenIdentity(token)}>
          <button className="trade-token-option" onClick={() => select(token)} aria-pressed={selected}>
            <TokenIcon icon={token.logo_url} isValueToken={token.isvaluegood} showPulse={false} size={GRK_SIZES.EXTRA_SMALL} />
            <span className="trade-token-identity"><strong>{token.symbol}{token.isvaluegood && <small>{t("tradeUx.valueAsset")}</small>}</strong><span title={token.name}>{token.name}</span><span className="trade-address" title={token.address}>{token.address.slice(0, 6)}…{token.address.slice(-4)}</span></span>
            {selected && <Check size={18} aria-hidden="true" />}
          </button>
          <button className="trade-icon-button" aria-label={t("tradeUx.copyAddress", { symbol: token.symbol })} onClick={() => copy(token)}><Copy size={16} /></button>
        </div>;
      })}
      {status === "ready" && !filtered.length && <div className="trade-empty"><p>{t("trade.selection.noS")}</p><span>{t("trade.selection.noS.tip")}</span>{query && <Button variant="outline" onClick={() => setQuery("")}>{t("tradeUx.clearSearch")}</Button>}</div>}
    </div>
  </TradeDialog>;
}
