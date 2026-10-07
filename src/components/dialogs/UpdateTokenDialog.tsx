import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from "react";
import { TokenIcon } from "../common/TokenIcon";
import useWallet from "@/hooks/useWallet";
import { upToken } from '@/services/graphql/account';
import { useLocalStorage } from "@/utils/LocalStorageManager";
import { useValueGood } from "@/stores/valueGood";
import Message from '@/components/MessModal/index';
import { useErrorMess as formatErrorMessage } from '@/hooks/useErrorMess';
import { GRK_SIZES } from "@/types/common";
import { Spin, message } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useGlobalLoading } from '@/stores/globalLoading';
import CreatModal from "./creatModal";
import { Slider } from "@/components/ui/slider";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

interface UpdateTokenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // setSpinning?: (open: boolean) => void;
  token: any | null;
  walletAddress: string | null;
}

interface TokenConfig {
  investFee: number;
  divestFee: number;
  buyFee: number;
  sellFee: number;
  investM: number;
  divestChips: number;
  limitPower: number;
  isFreeze: number;
  investThreshold: number;
}
export function UpdateTokenDialog({
  open,
  onOpenChange,
  // setSpinning,
  token, walletAddress
}: UpdateTokenDialogProps) {

  const { t } = useTranslation();
  const { ssionChian } = useLocalStorage();

  const [isLoading, setIsLoading] = useState(false);
  const [dis, setDis] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const { upTokenSet, lockToken } = useWallet();
  const { setLoading } = useGlobalLoading();
  const [activeTab, setActiveTab] = useState<"token" | "lock">("token");
  const [isFrozen, setIsFrozen] = useState(false); // 是否冻结


  // 代币配置状态（使用万分号‱）
  const [buyFeeRate, setBuyFeeRate] = useState(0); // 买费率 - 8‱ = 0.08%
  const [sellFeeRate, setSellFeeRate] = useState(0); // 卖费率 - 8‱ = 0.08%
  const [investFeeRate, setInvestFeeRate] = useState(0); // ��资费率 - 3‱ = 0.03%
  const [withdrawFeeRate, setWithdrawFeeRate] = useState(0); // 撤资费率 - 5‱ = 0.05%
  const [leverageMultiplier, setLeverageMultiplier] = useState(1); // 放大倍数
  const [withdrawSlices, setWithdrawSlices] = useState(1); // 撤资切片数
  const [maxM, setMaxM] = useState(1); // 撤资切片数
  const [investThreshold, setinvestThreshold] = useState(1); // 投资系数（70-100）

  useEffect(() => {

    if (buyFeeRate >= 0 && sellFeeRate >= 0 && investFeeRate >= 0 && withdrawFeeRate >= 0
      && buyFeeRate <= 127 && sellFeeRate <= 127 && investFeeRate <= 63 && withdrawFeeRate <= 63
      && leverageMultiplier >= 1 && leverageMultiplier <= maxM && withdrawSlices >= 1 && withdrawSlices <= 1023
    ) {
      setDis(false);
    } else
      setDis(true);

  }, [leverageMultiplier, withdrawSlices, buyFeeRate, sellFeeRate, investFeeRate, withdrawFeeRate])

  useEffect(() => {
    setActiveTab("token");
    setIsFrozen(false);
    if (!open) return;
    (async () => {
      if (ssionChian && token) {
        // 修改类型注解为 TokenConfig
        const result: TokenConfig = await upToken(token.id, ssionChian) as TokenConfig;
        console.log("---===", result);
        // 确保将数字转换为字符串以匹配状态变量类型
        setBuyFeeRate(result.buyFee);
        setSellFeeRate(result.sellFee);
        setInvestFeeRate(result.investFee);
        setWithdrawFeeRate(result.divestFee);
        setLeverageMultiplier(result.investM);
        setWithdrawSlices(result.divestChips);
        setMaxM(result.limitPower);
        setIsFrozen(result.isFreeze === 1 ? true : false);
        setinvestThreshold(result.investThreshold);
      }
    })();
  }, [ssionChian, token, open]);

  // 更新代币配置
  const handleUpdateToken = async () => {
    if (!token) return;
    setSpinning(true)
    setLoading(true, "更新代币配置中...");
    console.log("---===", leverageMultiplier, withdrawSlices, buyFeeRate, sellFeeRate, investFeeRate, withdrawFeeRate);
    try {

      // @ts-ignore
      const config = investFeeRate * 2 ** 148 + withdrawFeeRate * 2 ** 142 + buyFeeRate * 2 ** 135
        + sellFeeRate * 2 ** 128 + leverageMultiplier * 2 ** 168 + (withdrawSlices / 4) * 2 ** 160
        + (100 - investThreshold) * 2 ** 154;

      // @ts-ignore
      const isSuccess = await upTokenSet(token.id, walletAddress, BigInt(config).toString());
      console.log("isSuccess:", isSuccess, formatErrorMessage(isSuccess, t))
      if (isSuccess === true) {
        messageApi.open({
          type: 'success',
          content: t('common.mess.create') + t('common.mess.success'),
        });
        onOpenChange(false);
      } else if (isSuccess === false) {
        messageApi.open({
          type: 'error',
          content: t('common.mess.create') + t('common.mess.error'),
        });
      } else {
        let yz = "";
        if (isSuccess === 35) {
          yz = "; >=" + 0;
        }
        messageApi.open({
          type: 'error',
          content: formatErrorMessage(isSuccess, t) + yz,
        });
      }
    } catch (error) {
      messageApi.open({
        type: 'error',
        content: t('common.mess.create') + t('common.mess.error'),
      });
      console.error("更新失败，请重试");
    } finally {
      setSpinning(false);
      setLoading(false);
    }
  };

  const handleFreeze = async () => {
    if (!token) return;
    setSpinning(true)
    try {
      const isSuccess = await lockToken(token.id, walletAddress);
      if (isSuccess === true) {
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
      <CreatModal open={open} setOpen={onOpenChange} title={t("account.update.title")}>
        <Spin spinning={spinning} fullscreen indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} size="large" />


        <div className="pb-2">{t("account.update.title.desc")}</div>
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

        {/* </DialogHeader> */}
        {/* <ScrollArea className="flex-1 h-0"> */}

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "token" | "lock")}
          className="w-full flex flex-col h-full overflow-hidden"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
              <TabsTrigger value="token" className="text-xs sm:text-sm">
                {/* <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> */}
                <span className="hidden xs:inline">{t("account.update.config")}</span>
                <span className="xs:hidden">{t("account.update.config")}</span>
              </TabsTrigger>
              <TabsTrigger value="lock" className="text-xs sm:text-sm">
                {/* <Store className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> */}
                <span className="hidden xs:inline">{t("account.update.freeze")}</span>
                <span className="xs:hidden">{t("account.update.freeze")}</span>
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="px-4 sm:px-6">
            <TabsContent value="token" className="mt-0 focus-visible:outline-none">

              {/* 代币配置标签页 */}
              <div className="pb-4 sm:pb-6 pt-0 space-y-3 sm:space-y-4">
                {/* 费率说明 */}
                <div className="p-2.5 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-blue-900">
                    {t("account.update.tip")}（‱）
                  </p>
                  <p className="text-[10px] sm:text-xs text-blue-700 mt-0.5 sm:mt-1">
                    {t("account.update.example")}: 8‱ = 0.08% = 0.0008
                  </p>
                </div>

                {/* 买费率 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="buyFeeRate">{t("account.update.rate.buy")}</Label>
                    <span className="text-xs text-muted-foreground">{t("account.update.range")}(0~127)</span>
                  </div>
                  <div className="relative">
                    <Input
                      id="buyFeeRate"
                      type="number"
                      value={buyFeeRate}
                      onChange={(e) => setBuyFeeRate(Number(e.target.value))}
                      placeholder="0"
                      className="pr-10"
                      min={0}
                      max={127}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      ‱
                    </span>
                  </div>
                </div>

                {/* 卖费率 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sellFeeRate">{t("account.update.rate.sell")}</Label>
                    <span className="text-xs text-muted-foreground">{t("account.update.range")}(0~127)</span>
                  </div>
                  <div className="relative">
                    <Input
                      id="sellFeeRate"
                      type="number"
                      value={sellFeeRate}
                      onChange={(e) => setSellFeeRate(Number(e.target.value))}
                      placeholder="0"
                      className="pr-10"
                      min={0}
                      max={127}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      ‱
                    </span>
                  </div>
                </div>

                {/* 投资费�� */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="investFeeRate">{t("account.update.rate.invest")}</Label>
                    <span className="text-xs text-muted-foreground">{t("account.update.range")}(0~63)</span>
                  </div>
                  <div className="relative">
                    <Input
                      id="investFeeRate"
                      type="number"
                      value={investFeeRate}
                      onChange={(e) => setInvestFeeRate(Number(e.target.value))}
                      placeholder="0"
                      className="pr-10"
                      min={0}
                      max={63}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      ‱
                    </span>
                  </div>
                </div>

                {/* 撤资费率 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="withdrawFeeRate">{t("account.update.rate.divest")}</Label>
                    <span className="text-xs text-muted-foreground">{t("account.update.range")}(0~63)</span>
                  </div>
                  <div className="relative">
                    <Input
                      id="withdrawFeeRate"
                      type="number"
                      value={withdrawFeeRate}
                      onChange={(e) => setWithdrawFeeRate(Number(e.target.value))}
                      placeholder="0"
                      className="pr-10"
                      min={0}
                      max={63}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      ‱
                    </span>
                  </div>
                </div>

                {/* 放大倍数 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="leverageMultiplier">{t("account.update.magnification")}</Label>
                    <span className="text-xs text-muted-foreground">{t("account.update.max.multiple")}({maxM})</span>
                  </div>
                  <div className="relative">
                    <Input
                      id="leverageMultiplier"
                      type="number"
                      value={leverageMultiplier}
                      onChange={(e) => setLeverageMultiplier(Number(e.target.value))}
                      placeholder="1"
                      className="pr-10"
                      min={1}
                      max={maxM}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {t("account.update.times")}
                    </span>
                  </div>
                </div>

                {/* 撤资切片数 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="withdrawSlices"> {t("account.update.divest.chips")}</Label>
                    <span className="text-xs text-muted-foreground">(1~1020)</span>
                  </div>
                  <Input
                    id="withdrawSlices"
                    type="number"
                    value={withdrawSlices}
                    onChange={(e) => setWithdrawSlices(Number(e.target.value))}
                    placeholder="1"
                    className="pr-10"
                    min={1}
                    max={1020}
                  />
                </div>

                {/* 投资系数 */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                      <Label htmlFor="maxLeverageMultiplier" className="text-xs sm:text-sm whitespace-nowrap">{t("account.update.investThreshold")}</Label>
                    </div>
                    <span className="text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 bg-[#0fb981]/10 text-[#0fb981] rounded whitespace-nowrap flex-shrink-0">
                      {investThreshold}
                    </span>
                  </div>
                  <Slider
                    id="maxLeverageMultiplier"
                    value={[investThreshold]}
                    onValueChange={(value) => setinvestThreshold(value[0])}
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
                    onClick={handleUpdateToken}
                    disabled={dis}
                  >{t("account.update.bnt")}
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="lock" className="mt-0 focus-visible:outline-none">

              <div className="pb-4 sm:pb-6 pt-0 space-y-3 sm:space-y-4">

                {/* 是否冻结 */}
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="isFrozen" className="cursor-pointer">
                      {t("account.update.freeze.label")}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t("account.update.freeze.label.desc")}
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
                    onClick={handleFreeze}
                    disabled={!isFrozen}
                  >
                    {t("account.update.freeze")}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
        {/* </ScrollArea> */}
      </CreatModal>
    </>
  );
}
