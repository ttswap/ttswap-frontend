import { useTranslation } from "react-i18next";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Wallet, AlertCircle, Search } from "lucide-react";
export function PageState({ kind, onRetry }: { kind: "wallet" | "loading" | "error" | "empty"; onRetry?: () => void }) {
  const { t } = useTranslation();
  const { openConnectModal } = useConnectModal();
  const Icon = kind === "wallet" ? Wallet : kind === "error" ? AlertCircle : Search;
  return <div className="page-state" role={kind === "error" ? "alert" : "status"} aria-busy={kind === "loading"}>
    {kind !== "loading" && <Icon size={24} aria-hidden="true" />}
    <h2>{t(`appUx.${kind}Title`)}</h2><p>{t(`appUx.${kind}Description`)}</p>
    {kind === "wallet" && <button className="app-primary" onClick={openConnectModal}>{t("tradeUx.connect")}</button>}
    {kind === "error" && onRetry && <button className="app-secondary" onClick={onRetry}>{t("common.retry")}</button>}
  </div>;
}
