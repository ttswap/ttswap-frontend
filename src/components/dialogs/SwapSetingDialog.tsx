import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TradeDialog } from "./TradeDialog";
import { validSlippage, MAX_SLIPPAGE } from "@/utils/tradeSafety";

export interface SwapSettings { slippage: string; protection: boolean; maxApprove: boolean }
export function SwapSeting({ open, onOpenChange, onChange, values = { slippage: "0.5", protection: true, maxApprove: false } }: {
  open: boolean; onOpenChange: (open: boolean) => void; onChange: (slippage: string, protection: boolean, maxApprove: boolean) => void; values?: SwapSettings;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(values);
  useEffect(() => { if (open) setDraft(values); }, [open]);
  const valid = validSlippage(draft.slippage);
  return <TradeDialog open={open} onOpenChange={onOpenChange} title={t("tradeUx.settings")} description={t("tradeUx.settingsIntro")}>
    <div className="trade-settings">
      <div className="trade-setting-group">
        <label htmlFor="swap-slippage">{t("tradeUx.slippage")}</label>
        <p>{t("tradeUx.slippageHelp")}</p>
        <div className="trade-presets">{["0.1", "0.5", "1"].map(value => <Button key={value} variant="ghost" aria-pressed={draft.slippage === value} onClick={() => setDraft({ ...draft, slippage: value })}>{value}%</Button>)}</div>
        <div className="trade-custom-slippage"><Input id="swap-slippage" inputMode="decimal" value={draft.slippage} onChange={e => setDraft({ ...draft, slippage: e.target.value })} aria-invalid={!valid} aria-describedby="slippage-help" /><span>%</span></div>
        <p id="slippage-help" className={!valid ? "trade-error" : Number(draft.slippage) > 3 ? "trade-warning" : ""} role={!valid ? "alert" : undefined}>{!valid ? t("tradeUx.slippageInvalid", { max: MAX_SLIPPAGE }) : Number(draft.slippage) > 3 ? t("tradeUx.highSlippage") : t("tradeUx.customSlippage")}</p>
      </div>
      <div className="trade-setting-toggle"><div><label htmlFor="swap-protection">{t("tradeUx.priceProtection")}</label><p>{t("tradeUx.protectionHelp")}</p></div><Switch id="swap-protection" checked={draft.protection} onCheckedChange={protection => setDraft({ ...draft, protection })} /></div>
      {!draft.protection && <p className="trade-warning" role="alert">{t("tradeUx.noProtection")}</p>}
      <div className="trade-setting-toggle"><div><label htmlFor="swap-max-approve">{t("tradeUx.extendedApproval")}</label><p>{t("tradeUx.approvalHelp")}</p></div><Switch id="swap-max-approve" checked={draft.maxApprove} onCheckedChange={maxApprove => setDraft({ ...draft, maxApprove })} /></div>
      <div className="trade-dialog-actions"><Button variant="ghost" onClick={() => setDraft({ slippage: "0.5", protection: true, maxApprove: false })}>{t("tradeUx.reset")}</Button><Button variant="outline" onClick={() => onOpenChange(false)}>{t("tradeUx.cancel")}</Button><Button className="trade-primary" disabled={!valid} onClick={() => { onChange(draft.slippage, draft.protection, draft.maxApprove); onOpenChange(false); }}>{t("tradeUx.apply")}</Button></div>
    </div>
  </TradeDialog>;
}
