import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from "react";
import { TokenIcon } from "../common/TokenIcon";
import useWallet from "@/hooks/useWallet";
import { marketToken } from '@/services/graphql/account';
import { useLocalStorage } from "@/utils/LocalStorageManager";
// import { useValueGood } from "@/stores/valueGood";
// import Message from '@/components/MessModal/index';
// import { useErrorMess } from '@/hooks/useErrorMess';
import { GRK_SIZES } from "@/types/common";
import { Spin, message } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
// import { useGlobalLoading } from '@/stores/globalLoading';
import CreatModal from "./creatModal";
import { Settings, Store, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

interface UpdateTokenDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    token: any | null;
    walletAddress: string | null;
}

interface TokenConfig {
    liquidFee: number;
    operatorFee: number;
    gateFee: number;
    referFee: number;
    customerFee: number;
    platformFee: number;
    limitPower: number;
    isValueGood: number;
    isFreeze: number;
    isPromise: number;
    safeLineLower: number;
    safeLineUpper: number;
}

export function TokensSetingDialog({
    open,
    onOpenChange,
    token,
    walletAddress
}: UpdateTokenDialogProps) {
    const { t } = useTranslation();
    const { ssionChian } = useLocalStorage();

    const { setingToken, setingTokenAdmin } = useWallet();

    const [isLoading, setIsLoading] = useState(false);
    const [configState,setConfigState] = useState("loading");
    const [loadedContext,setLoadedContext] = useState("");
    const [spinning, setSpinning] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    const [activeTab, setActiveTab] = useState<"commission" | "administration">("commission");

    // 市场配置状态
    const [isValueToken, setIsValueToken] = useState(false); // 是否为价值代币
    const [isFrozen, setIsFrozen] = useState(false); // 是否冻结
    const [isApply, setIsApply] = useState(false); // 是否申请
    const [liquidityCommission, setLiquidityCommission] = useState(30); // 投资者分佣比例 - 一格10%，共7格
    const [operatorCommission, setOperatorCommission] = useState(20); // 代币运营者分佣比例 - 一格2%，共15格
    const [portalCommission, setPortalCommission] = useState(16); // 门户分佣比例 - 一格4%，共7格
    const [referrerCommission, setReferrerCommission] = useState(15); // 推荐者分佣比例 - 一格1%，最多31格
    const [userCommission, setUserCommission] = useState(10); // 用户分佣比例 - 一格1%，最多31格
    const [protocolCommission, setProtocolCommission] = useState(9); // 协议分佣比例 - 一格1%，最多31格
    const [limitPower, setlimitPower] = useState(1); // 最大流动性加强倍数 - 一格1倍，最多31格
    const [safeLineUpper, setsafeLineUpper] = useState(100); // 最大流动性加强倍数 - 一格1倍，最多31格
    const [safeLineLower, setsafeLineLower] = useState(60); // 最大流动性加强倍数 - 一格1倍，最多31格

    // 计算总分佣比例
    const totalCommission = liquidityCommission + operatorCommission + portalCommission +
        referrerCommission + userCommission + protocolCommission;

    useEffect(() => {
        setActiveTab("commission");
        if (!open) return;
        let active=true;setConfigState("loading");setLoadedContext("");
        (async () => {
          try {
            if (ssionChian && token) {
                const result: TokenConfig = await marketToken(token.id, ssionChian) as TokenConfig;
                if(!active)return;
                setLiquidityCommission(result.investor);
                setOperatorCommission(result.operator);
                setPortalCommission(result.portal);
                setReferrerCommission(result.recommender);
                setUserCommission(result.user);
                setProtocolCommission(result.agreement);
                setMaxLeverageMultiplier(result.MaxLiquidity);
                setsafeLineUpper(result.safeLineUpper);
                setsafeLineLower(result.safeLineLower);
                setIsValueToken(result.isvalue === 1 ? true : false);
                setIsFrozen(result.islock === 1 ? true : false);
                setIsApply(result.isapply === 1 ? true : false);
                setConfigState("ready");setLoadedContext(`${ssionChian}:${token.id}`);
            }
          } catch {if(active)setConfigState("error");}
        })();
        return()=>{active=false;};
    }, [ssionChian, token, open]);

    // 更新市场配置
    const handleUpdateMarket = async () => {
        if (!token || spinning || configState !== "ready" || loadedContext !== `${ssionChian}:${token.id}`) return;

        setSpinning(true);
        try {
            const config = (BigInt(liquidityCommission / 10) << BigInt(247))
                | (BigInt(operatorCommission / 2) << BigInt(243))
                | (BigInt(portalCommission / 4) << BigInt(240))
                | (BigInt(referrerCommission) << BigInt(235))
                | (BigInt(userCommission) << BigInt(230))
                | (BigInt(protocolCommission) << BigInt(225))
                | (BigInt(maxLeverageMultiplier) << BigInt(220))
                | (BigInt(isApply ? 1 : 0) << BigInt(250))
                | (BigInt(isFrozen ? 1 : 0) << BigInt(252))
                | (BigInt(safeLineUpper) << BigInt(212))
                | (BigInt(safeLineLower) << BigInt(204));
            console.log("---==444=", BigInt(config).toString());
            const a = await setingToken(token.id, walletAddress, BigInt(config).toString());
            if (a === true) {
                messageApi.open({
                    type: 'success',
                    content: t('common.mess.success'),
                });
                onOpenChange(false);
            } else {
                messageApi.open({
                    type: 'error',
                    content: t('common.mess.error'),
                });
            }
        } catch (error) {
            messageApi.open({
                type: 'error',
                content: t('common.mess.error'),
            });
        } finally {
            setSpinning(false);
        }
    };

    const handleAdminMarket = async () => {
        if (!token || spinning || configState !== "ready" || loadedContext !== `${ssionChian}:${token.id}`) return;

        setSpinning(true);
        try {
            const config = BigInt(isValueToken ? 1 : 0) << BigInt(255);
            console.log("---==444=", BigInt(config).toString());
            const a = await setingTokenAdmin(token.id, walletAddress, BigInt(config).toString());
            if (a === true) {
                messageApi.open({
                    type: 'success',
                    content: t('common.mess.success'),
                });
                onOpenChange(false);
            } else {
                messageApi.open({
                    type: 'error',
                    content: t('common.mess.error'),
                });
            }
        } catch (error) {
            messageApi.open({
                type: 'error',
                content: t('common.mess.error'),
            });
        } finally {
            setSpinning(false);
        }
    };
    // 如果没有选中代币，不渲染对话框
    if (!token) return null;

    return (
        <>
            {contextHolder}
            <CreatModal open={open} setOpen={onOpenChange} title={t("appUx.configTitle")}>
                <Spin spinning={spinning} fullscreen indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} size="large" />

                {configState !== "ready" && <p role={configState === "error" ? "alert" : "status"}>{t(configState === "error" ? "appUx.configError" : "appUx.configLoading")}</p>}
                <div className="flex flex-col h-full">
                    <div className="pb-2">{t("appConfig.label1")}</div>
                    <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 flex-shrink-0 animate-slide-in-up">
                        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                            <div
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
                                style={{ backgroundColor: token.color ? token.color : "" }}
                            >
                                <TokenIcon
                                    isValueToken={token.isvaluegood}
                                    icon={token.logo_url}
                                    color=""
                                    size={GRK_SIZES.SMALL}
                                    showPulse={token.isvaluegood}
                                />
                            </div>
                            <div className="min-w-0">
                                <h2 className="font-medium truncate">{token.symbol}</h2>
                                <p className="text-xs sm:text-sm text-muted-foreground truncate">{token.name}</p>
                            </div>
                        </div>
                    </div>

                    <Tabs
                        value={activeTab}
                        onValueChange={(v) => setActiveTab(v as "commission" | "administration")}
                        className="w-full flex flex-col h-full overflow-hidden"
                    >
                        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                            <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
                                <TabsTrigger value="commission" className="text-xs sm:text-sm">
                                    <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                    <span className="hidden xs:inline">{t("appConfig.label2")}</span>
                                    <span className="xs:hidden">{t("appConfig.label3")}</span>
                                </TabsTrigger>
                                <TabsTrigger value="administration" className="text-xs sm:text-sm">
                                    <Store className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                    <span className="hidden xs:inline">{t("appConfig.label4")}</span>
                                    <span className="xs:hidden">{t("appConfig.label5")}</span>
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        <div className="flex-1 h-0">
                            <div className="px-4 sm:px-6">
                                <TabsContent value="commission" className="mt-0 focus-visible:outline-none">
                                    {/* 市场配置标签页 */}
                                    <div className="pb-4 sm:pb-6 pt-0 space-y-3 sm:space-y-4">
                                        {/* 说明 */}
                                        <div className="p-2.5 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-xs sm:text-sm text-blue-900">
                                                配置代币市场参数
                                            </p>
                                            <p className="text-[10px] sm:text-xs text-blue-700 mt-0.5 sm:mt-1">
                                                使用拉杆调整各项分佣比例，建议总和为100%
                                            </p>
                                        </div>

                                        {/* 分割线 */}
                                        <div className="border-t pt-3 sm:pt-4">
                                            <div className="flex items-center justify-between mb-2 sm:mb-3">
                                                <p className="text-xs sm:text-sm">{t("appConfig.label6")}</p>
                                                <div className="flex items-center gap-1 sm:gap-2">
                                                    <span className="text-[10px] sm:text-xs text-muted-foreground">{t("appConfig.label7")}</span>
                                                    <span
                                                        className={`text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 rounded whitespace-nowrap ${totalCommission === 100
                                                            ? 'bg-[#0fb981]/10 text-[#0fb981]'
                                                            : 'bg-amber-50 text-amber-700'
                                                            }`}
                                                    >
                                                        {totalCommission}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 投资者分佣比例 */}
                                        <div className="space-y-2 sm:space-y-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                                                    <Label htmlFor="liquidityCommission" className="text-xs sm:text-sm whitespace-nowrap">{t("appConfig.label8")}</Label>
                                                    <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                                        一格10%，共7格
                                                    </span>
                                                </div>
                                                <span className="text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 bg-[#0fb981]/10 text-[#0fb981] rounded whitespace-nowrap flex-shrink-0">
                                                    {liquidityCommission}%
                                                </span>
                                            </div>
                                            <Slider
                                                id="liquidityCommission"
                                                value={[liquidityCommission]}
                                                onValueChange={(value) => setLiquidityCommission(value[0])}
                                                min={0}
                                                max={70}
                                                step={10}
                                                className="w-full"
                                            />
                                        </div>

                                        {/* 代币运营者分佣比例 */}
                                        <div className="space-y-2 sm:space-y-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                                                    <Label htmlFor="operatorCommission" className="text-xs sm:text-sm whitespace-nowrap">{t("appConfig.label9")}</Label>
                                                    <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                                        一格2%，共15格
                                                    </span>
                                                </div>
                                                <span className="text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 bg-[#0fb981]/10 text-[#0fb981] rounded whitespace-nowrap flex-shrink-0">
                                                    {operatorCommission}%
                                                </span>
                                            </div>
                                            <Slider
                                                id="operatorCommission"
                                                value={[operatorCommission]}
                                                onValueChange={(value) => setOperatorCommission(value[0])}
                                                min={0}
                                                max={30}
                                                step={2}
                                                className="w-full"
                                            />
                                        </div>

                                        {/* 门户分佣比例 */}
                                        <div className="space-y-2 sm:space-y-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                                                    <Label htmlFor="portalCommission" className="text-xs sm:text-sm whitespace-nowrap">{t("appConfig.label10")}</Label>
                                                    <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                                        一格4%，共7格
                                                    </span>
                                                </div>
                                                <span className="text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 bg-[#0fb981]/10 text-[#0fb981] rounded whitespace-nowrap flex-shrink-0">
                                                    {portalCommission}%
                                                </span>
                                            </div>
                                            <Slider
                                                id="portalCommission"
                                                value={[portalCommission]}
                                                onValueChange={(value) => setPortalCommission(value[0])}
                                                min={0}
                                                max={28}
                                                step={4}
                                                className="w-full"
                                            />
                                        </div>

                                        {/* 推荐者分佣比例 */}
                                        <div className="space-y-2 sm:space-y-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                                                    <Label htmlFor="referrerCommission" className="text-xs sm:text-sm whitespace-nowrap">{t("appConfig.label11")}</Label>
                                                    <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                                        一格1%，最多31格
                                                    </span>
                                                </div>
                                                <span className="text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 bg-[#0fb981]/10 text-[#0fb981] rounded whitespace-nowrap flex-shrink-0">
                                                    {referrerCommission}%
                                                </span>
                                            </div>
                                            <Slider
                                                id="referrerCommission"
                                                value={[referrerCommission]}
                                                onValueChange={(value) => setReferrerCommission(value[0])}
                                                min={0}
                                                max={31}
                                                step={1}
                                                className="w-full"
                                            />
                                        </div>

                                        {/* 用户分佣比例 */}
                                        <div className="space-y-2 sm:space-y-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                                                    <Label htmlFor="userCommission" className="text-xs sm:text-sm whitespace-nowrap">{t("appConfig.label12")}</Label>
                                                    <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                                        一格1%，最多31格
                                                    </span>
                                                </div>
                                                <span className="text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 bg-[#0fb981]/10 text-[#0fb981] rounded whitespace-nowrap flex-shrink-0">
                                                    {userCommission}%
                                                </span>
                                            </div>
                                            <Slider
                                                id="userCommission"
                                                value={[userCommission]}
                                                onValueChange={(value) => setUserCommission(value[0])}
                                                min={0}
                                                max={31}
                                                step={1}
                                                className="w-full"
                                            />
                                        </div>

                                        {/* 协议分佣比例 */}
                                        <div className="space-y-2 sm:space-y-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                                                    <Label htmlFor="protocolCommission" className="text-xs sm:text-sm whitespace-nowrap">{t("appConfig.label13")}</Label>
                                                    <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                                        一格1%，最多31格
                                                    </span>
                                                </div>
                                                <span className="text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 bg-[#0fb981]/10 text-[#0fb981] rounded whitespace-nowrap flex-shrink-0">
                                                    {protocolCommission}%
                                                </span>
                                            </div>
                                            <Slider
                                                id="protocolCommission"
                                                value={[protocolCommission]}
                                                onValueChange={(value) => setProtocolCommission(value[0])}
                                                min={0}
                                                max={31}
                                                step={1}
                                                className="w-full"
                                            />
                                        </div>

                                        {/* 分割线 */}
                                        <div className="border-t pt-3 sm:pt-4">
                                            <p className="text-xs sm:text-sm mb-2 sm:mb-3">{t("appConfig.label14")}</p>
                                        </div>

                                        {/* 最大流动性加强倍数 */}
                                        <div className="space-y-2 sm:space-y-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                                                    <Label htmlFor="maxLeverageMultiplier" className="text-xs sm:text-sm whitespace-nowrap">{t("appConfig.label15")}</Label>
                                                    <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                                        一格1倍，最多31格
                                                    </span>
                                                </div>
                                                <span className="text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 bg-[#0fb981]/10 text-[#0fb981] rounded whitespace-nowrap flex-shrink-0">
                                                    {limitPower}倍
                                                </span>
                                            </div>
                                            <Slider
                                                id="limitPower"
                                                value={[limitPower]}
                                                onValueChange={(value) => setlimitPower(value[0])}
                                                min={0}
                                                max={31}
                                                step={1}
                                                className="w-full"
                                            />
                                        </div>


                                        {/* 分割线 */}
                                        <div className="border-t pt-3 sm:pt-4">
                                            <p className="text-xs sm:text-sm mb-2 sm:mb-3">{t("appConfig.label16")}</p>
                                        </div>

                                        {/* 最大安全阈值 */}
                                        <div className="space-y-2 sm:space-y-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                                                    <Label htmlFor="maxLeverageMultiplier" className="text-xs sm:text-sm whitespace-nowrap">{t("appConfig.label17")}</Label>
                                                    {/* <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                                        一格1倍，最多31格
                                                    </span> */}
                                                </div>
                                                <span className="text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 bg-[#0fb981]/10 text-[#0fb981] rounded whitespace-nowrap flex-shrink-0">
                                                    {safeLineUpper}
                                                </span>
                                            </div>
                                            <Slider
                                                id="maxLeverageMultiplier"
                                                value={[safeLineUpper]}
                                                onValueChange={(value) => setsafeLineUpper(value[0])}
                                                min={0}
                                                max={200}
                                                step={1}
                                                className="w-full"
                                            />
                                        </div>
                                        {/* 最小安全阈值 */}
                                        <div className="space-y-2 sm:space-y-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                                                    <Label htmlFor="maxLeverageMultiplier" className="text-xs sm:text-sm whitespace-nowrap">{t("appConfig.label18")}</Label>
                                                    {/* <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                                        一格1倍，最多31格
                                                    </span> */}
                                                </div>
                                                <span className="text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 bg-[#0fb981]/10 text-[#0fb981] rounded whitespace-nowrap flex-shrink-0">
                                                    {safeLineLower}
                                                </span>
                                            </div>
                                            <Slider
                                                id="maxLeverageMultiplier"
                                                value={[safeLineLower]}
                                                onValueChange={(value) => setsafeLineLower(value[0])}
                                                min={0}
                                                max={100}
                                                step={1}
                                                className="w-full"
                                            />
                                        </div>
                                        {/* 是否申请 */}
                                        <div className="flex items-center justify-between py-2">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="isApply" className="cursor-pointer">
                                                    是否申请
                                                </Label>
                                                <p className="text-xs text-muted-foreground">
                                                    申请操作
                                                </p>
                                            </div>
                                            <Switch
                                                id="isApply"
                                                checked={isApply}
                                                onCheckedChange={setIsApply}
                                            />
                                        </div>

                                        {/* 是否冻结 */}
                                        <div className="flex items-center justify-between py-2">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="isFrozen" className="cursor-pointer">
                                                    是否冻结
                                                </Label>
                                                <p className="text-xs text-muted-foreground">
                                                    冻结后将暂停所有交易操作
                                                </p>
                                            </div>
                                            <Switch
                                                id="isFrozen"
                                                checked={isFrozen}
                                                onCheckedChange={setIsFrozen}
                                            />
                                        </div>

                                        {/* 更新按钮 */}
                                        <div className="pt-3 sm:pt-4">
                                            <Button
                                                className="w-full h-10 sm:h-12 bg-[#0fb981] hover:bg-[#22c55e] text-white border-0 shadow-sm transition-all duration-200 text-sm sm:text-base"
                                                onClick={handleUpdateMarket}
                                                disabled={totalCommission !== 100 || spinning || configState !== "ready" || loadedContext !== `${ssionChian}:${token.id}`}
                                            >
                                                更新配置
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="administration" className="mt-0 focus-visible:outline-none">
                                    {/* 市场配置标签页 */}
                                    <div className="pb-4 sm:pb-6 pt-0 space-y-3 sm:space-y-4">

                                        {/* 是否为价值代币 */}
                                        <div className="flex items-center justify-between py-2">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="isValueToken" className="cursor-pointer">
                                                    是否为价值代币
                                                </Label>
                                                <p className="text-xs text-muted-foreground">
                                                    价值代币具有特殊的交易和奖励机制
                                                </p>
                                            </div>
                                            <Switch
                                                id="isValueToken"
                                                checked={isValueToken}
                                                onCheckedChange={setIsValueToken}
                                            />
                                        </div>

                                        {/* 分割线 */}
                                        <div className="border-t pt-3 sm:pt-4">
                                            <p className="text-xs sm:text-sm mb-2 sm:mb-3">安全阈值</p>
                                        </div>

                                        {/* 最大安全阈值 */}
                                        <div className="space-y-2 sm:space-y-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                                                    <Label htmlFor="safeLineUpper" className="text-xs sm:text-sm whitespace-nowrap">最大安全阈值</Label>
                                                    {/* <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                                        一格1倍，最多31格
                                                    </span> */}
                                                </div>
                                                <span className="text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 bg-[#0fb981]/10 text-[#0fb981] rounded whitespace-nowrap flex-shrink-0">
                                                    {safeLineUpper}
                                                </span>
                                            </div>
                                            <Slider
                                                id="safeLineUpper"
                                                value={[safeLineUpper]}
                                                onValueChange={(value) => setsafeLineUpper(value[0])}
                                                min={0}
                                                max={200}
                                                step={1}
                                                className="w-full"
                                            />
                                        </div>
                                        {/* 最小安全阈值 */}
                                        <div className="space-y-2 sm:space-y-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                                                    <Label htmlFor="safeLineLower" className="text-xs sm:text-sm whitespace-nowrap">最小安全阈值</Label>
                                                    {/* <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                                        一格1倍，最多31格
                                                    </span> */}
                                                </div>
                                                <span className="text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 bg-[#0fb981]/10 text-[#0fb981] rounded whitespace-nowrap flex-shrink-0">
                                                    {safeLineLower}
                                                </span>
                                            </div>
                                            <Slider
                                                id="safeLineLower"
                                                value={[safeLineLower]}
                                                onValueChange={(value) => setsafeLineLower(value[0])}
                                                min={0}
                                                max={100}
                                                step={1}
                                                className="w-full"
                                            />
                                        </div>
                                        {/* 更新按钮 */}
                                        <div className="pt-3 sm:pt-4">
                                            <Button
                                                className="w-full h-10 sm:h-12 bg-[#0fb981] hover:bg-[#22c55e] text-white border-0 shadow-sm transition-all duration-200 text-sm sm:text-base"
                                                onClick={handleAdminMarket}
                                                disabled={totalCommission !== 100 || spinning || configState !== "ready" || loadedContext !== `${ssionChian}:${token.id}`}
                                            >
                                                更新配置
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>

                            </div>
                        </div>
                    </Tabs>
                </div>
            </CreatModal>
        </>
    );
}