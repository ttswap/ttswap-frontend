import "@/styles/trade.css";
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import TokenInvest from './TokenInvest';
import TokenSwap from "./TokenSwap";
import { useValueGood, useGoodId } from "@/stores/valueGood";
import { useLocalStorage } from "@/utils/LocalStorageManager";
// import { useAccount } from 'wagmi';
import { Timestamp } from '@/services/graphql/util';
import { GoodsDatas } from '@/services/graphql/swap/index';
import { TokenSelectionDialog } from "@/components/dialogs/TokenSelectionDialog";
import useInvest from "@/hooks/useInvest";
import useSwap from "@/hooks/useSwap";
import { SwapTokenValue, initDefaultSwap, initDefaultinvest } from "@/types/token";
import { useInvestStore } from "@/stores/invest";
import { useSwapStore } from "@/stores/swap";


interface TradingPageProps {
    params?: { defaultTab?: string, tokenId?: string };
}

export default function Trade({ params }: TradingPageProps) {

    const { t } = useTranslation();

    const { info } = useValueGood();
    const { ssionChian } = useLocalStorage();
    // const { isConnected, address } = useAccount();
    const { swaps } = useSwap();
    const { invest } = useInvest();
    // const [spinning, setSpinning] = useState(false);
    const { goodId } = useGoodId();
    const [activeTab, setActiveTab] = useState("swap");
    const [getToken, setToken] = useState();
    const [showTokenSelection, setShowTokenSelection] =
        useState(false);
    const [tokenSelectionType, setTokenSelectionType] = useState<
        "sFrom" | "sTo" | "iFrom" | "iTo"
    >("sFrom");
    const [selectToken, setSelectToken] = useState(null);

    useEffect(() => {
        setActiveTab(params?.defaultTab || "swap");
        useInvestStore.setState({ invest: initDefaultinvest() });
        useSwapStore.setState({ swaps: initDefaultSwap() });
    }, []);

    useEffect(() => {
        let cancelled = false;
        setToken(undefined);
        if (info.id) {
            (async () => {
                let sel = "";
                if (goodId.swap.id !== "" && goodId.swap.id !== undefined) {
                    sel = goodId.swap.id;
                }

                let tokens: any = await GoodsDatas({
                    id: info.id,
                    sel: "",
                    gid: sel,
                    par: Timestamp()
                }, ssionChian);
                console.log(tokens, goodId, 99998888)
                if (!cancelled) setToken(tokens);
            })().catch(() => { if (!cancelled) setToken(undefined); });
        }
        return () => { cancelled = true; };
    }, [info.id, goodId.swap.id, ssionChian]);

    // 选择代币
    const handleTokenSelect = (token: SwapTokenValue) => {
        setSelectToken({ ...token, tokenSelectionType });
        setShowTokenSelection(false);
    };

    // 打开代币选择弹框
    const openTokenSelection = (type: any) => {
        setTokenSelectionType(type);
        setShowTokenSelection(true);
    };

    return (
        <div className="trade-widget">
            <div>
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                >
                    <TabsList className="trade-tabs">
                        <TabsTrigger value="swap">{t("common.swap")}</TabsTrigger>
                        <TabsTrigger value="invest">{t("common.invest")}</TabsTrigger>
                    </TabsList>
                    <TokenSwap token={getToken} selectToken={selectToken} openTokenSelection={openTokenSelection} />
                    <TokenInvest token={getToken} selectToken={selectToken} openTokenSelection={openTokenSelection} />
                </Tabs>
            </div>
            {/* 代币选择弹框 */}
            <TokenSelectionDialog
                open={showTokenSelection}
                onOpenChange={setShowTokenSelection}
                info={info}
                ssionChian={ssionChian}
                onSelectToken={handleTokenSelect}
                selectedToken={
                    tokenSelectionType === "sFrom"
                        ? swaps.from
                        : tokenSelectionType === "sTo"
                            ? swaps.to
                            : tokenSelectionType === "iFrom"
                                ? invest.from
                                : invest.to
                }
                title={t("trade.selection.title")}
            />
        </div>
    );
}