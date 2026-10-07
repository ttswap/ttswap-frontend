import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAccount } from "wagmi";
import { Link } from "react-router-dom";
import { ChevronDown, Loader2, ArrowUpRight } from "lucide-react";
import Trade from "@/components/trade/trade";
import { Button } from "@/components/ui/button";
import { useValueGood } from "@/stores/valueGood";
import { useLocalStorage } from "@/utils/LocalStorageManager";
import { useTokensBalance as fetchAccountTransactions } from "@/services/graphql/account";
import { useMuneName } from "@/stores/menu";
import { timestampParser } from "@/utils/timestamp-parser";
import "@/styles/trade.css";

export default function TradingPage() {
  const { t } = useTranslation();
  const { isConnected, address } = useAccount();
  const { info } = useValueGood();
  const { ssionChian } = useLocalStorage();
  const { setName } = useMuneName();
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [revision, setRevision] = useState(0);
  useEffect(() => { setName("trade"); }, [setName]);
  useEffect(() => { setHistory([]); setExpanded(false); setStatus("idle"); }, [address, ssionChian]);
  useEffect(() => {
    const refresh = () => setRevision(n => n + 1);
    window.addEventListener("ttswap:trade-confirmed", refresh);
    return () => window.removeEventListener("ttswap:trade-confirmed", refresh);
  }, []);
  useEffect(() => {
    if (!expanded || !isConnected || !address || !info.id) return;
    let cancelled = false;
    setStatus("loading");
    fetchAccountTransactions({ id: info.id, wallet: address }, ssionChian).then((data: any) => {
      if (!cancelled) { setHistory(data.transactions || []); setStatus("ready"); }
    }).catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
  }, [expanded, isConnected, address, info.id, ssionChian, revision]);
  return <main className="trade-page">
    <div className="trade-card"><Trade params={{ defaultTab: "swap" }} /></div>
    {isConnected && <section className="trade-history">
      <button className="trade-history-toggle" aria-expanded={expanded} aria-controls="trade-history-list" onClick={() => setExpanded(v => !v)}>{t("trade.transactions.title")}<ChevronDown size={16} /></button>
      {expanded && <div id="trade-history-list">
        {status === "loading" && <p className="trade-empty" role="status"><Loader2 size={18} className="trade-spinner" />{t("tradeUx.loadingHistory")}</p>}
        {status === "error" && <div className="trade-empty"><p role="alert">{t("tradeUx.historyError")}</p><Button variant="outline" onClick={() => setRevision(n => n + 1)}>{t("tradeUx.retry")}</Button></div>}
        {status === "ready" && !history.length && <p className="trade-empty">{t("tradeUx.noHistory")}</p>}
        {status === "ready" && history.slice(0, 5).map(trade => <div className="trade-history-row" key={trade.id}><div><strong>{trade.symbol1}{trade.symbol2 ? ` → ${trade.symbol2}` : ""}</strong><span>{timestampParser(trade.time, "relative")}</span></div><span>{trade.fromgoodQuanity} {trade.symbol1}</span></div>)}
        <Link to="/profile">{t("tradeUx.viewAccount")}<ArrowUpRight size={14} /></Link>
      </div>}
    </section>}
  </main>;
}
