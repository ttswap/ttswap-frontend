import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TokenTable } from "@/components/tables/TokenTable";
import { SwapDialog } from "@/components/dialogs";
import { useValueGood } from "@/stores/valueGood";
import { useLocalStorage } from "@/utils/LocalStorageManager";
import { useMuneName } from "@/stores/menu";
import type { TokenV2Volume } from "@/types/XykServiceTypes";

export default function Tokens() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { info } = useValueGood();
  const { ssionChian } = useLocalStorage();
  const [isSwapDialogOpen, setIsSwapDialogOpen] = useState(false);
  const [swapDialogTab, setSwapDialogTab] = useState<"swap" | "invest">("swap");
  const { setName } = useMuneName();
  const [selectedToken, setSelectedToken] = useState<TokenV2Volume | null>(null);

  useEffect(() => {
    setName("tokens");
  }, [setName]);

  const handleTokenSwap = useCallback((token: TokenV2Volume) => {
    setSelectedToken(token);
    setSwapDialogTab("swap");
    setIsSwapDialogOpen(true);
  }, []);

  const handleTokenInvest = useCallback((token: TokenV2Volume) => {
    setSelectedToken(token);
    setSwapDialogTab("invest");
    setIsSwapDialogOpen(true);
  }, []);

  const handleTokenRowClick = useCallback(
    (token: string) => {
      navigate(`/tokens/${token}`);
    },
    [navigate]
  );

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setIsSwapDialogOpen(open);
    if (!open) {
      setTimeout(() => setSelectedToken(null), 200);
    }
  }, []);

  return (
    <div className="app-page tokens-page">
      <div className="app-page-heading">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 mb-1">
          {t("tokens.title")}
        </h1>
        <p className="text-sm text-zinc-600 max-w-[65ch]">
          {t("tokens.description")}
        </p>
      </div>

      <TokenTable
        onSwapClick={handleTokenSwap}
        onInvestClick={handleTokenInvest}
        onTokenClick={handleTokenRowClick}
        showUpdateButton={false}
        valueId={info.id}
        chainId={ssionChian}
        wallet_address="0"
      />
      <SwapDialog
        open={isSwapDialogOpen}
        onOpenChange={handleDialogOpenChange}
        defaultTab={swapDialogTab}
        tokenId={selectedToken?.id}
      />
    </div>
  );
}
