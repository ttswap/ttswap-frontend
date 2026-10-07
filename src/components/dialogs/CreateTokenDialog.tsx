import React, { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp,
  ArrowLeft,
  ArrowRight,
  Check,
} from "lucide-react";


// 使用新的工具函数和常量
import { COLORS, VALUE_TOKENS } from "@/utils/constants";
import { TokenIcon } from "../common/TokenIcon";
import CreatModal from "./creatModal";
import { useTranslation } from 'react-i18next';
import { Space, Spin, message, Dropdown } from 'antd';
import { LoadingOutlined, DownOutlined } from '@ant-design/icons';
// import type { MenuProps } from 'antd';
import useWallet from "@/hooks/useWallet";
import { useMaxApprove } from '@/hooks/useMaxApprove';
import { useErrorMess as formatErrorMessage } from '@/hooks/useErrorMess';
// import { GoodsDatas } from '@/services/graphql';
import { minThreshold, createTokenV } from '@/services/graphql/account';
import { getSWETH } from '@/data/contractConfig';
import { useLocalStorage } from "@/utils/LocalStorageManager";
import { GRK_SIZES } from "@/types/common";
import { useValueGood } from "@/stores/valueGood";
import { prettifyCurrencys } from '@/services/graphql/util';

interface CreateTokenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
interface tokeninfo {
  balance?: string;
  decimals?: string;
  name?: string;
  symbol?: string;
  logo_url?: string;
  address?: string;
  price?: number | string;
}
export function CreateTokenDialog({
  open,
  onOpenChange,
}: CreateTokenDialogProps) {
  // 步骤控制
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  // 质押相关状态
  const [stakeAmountFrom, setStakeAmountFrom] = useState("");
  const [stakeAmountTo, setStakeAmountTo] = useState("");


  const [spinning, setSpinning] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const { t } = useTranslation();
  const { maxApprove, setMaxApprove } = useMaxApprove();

  const { info } = useValueGood();
  const { ssionChian } = useLocalStorage();
  const SWETH = getSWETH(ssionChian);
  const [buyF, setBuyF] = useState(8);
  const [sellF, setSellF] = useState(8);
  const [inF, setInF] = useState(8);
  const [disinF, setDisinF] = useState(8);
  const [swapS, setSwapS] = useState(1);
  const [disinS, setDisinS] = useState(10);
  const [goodC, setGoodC] = useState("");
  const [selectVgood, setSelectVgood] = useState([]);
  const [tokenInfoF, setTokenInfoF] = useState<tokeninfo>({});
  const [tokenInfoT, setTokenInfoT] = useState<tokeninfo>({});

  const { checkContractExists, newGoods, tokenDesc } = useWallet();

  useEffect(() => {
    if (!open) return;
    (async () => {
      // let tokens: any = await GoodsDatas(ssionChian);
      const data = await createTokenV(info.id, ssionChian);
      setSelectVgood(data[0]);
      // const { balance } = await tokenDesc(data[0].id);
      // let a: tokeninfo = { ...data[0], balance: balance };
      // // a.balance = balance;
      console.log("0-0-0-0", data[0])
      // setTokenInfoT(a);
    })();
  }, [ssionChian, open]);

  useMemo(() => {
    setBuyF(8);
    setSellF(8);
    setInF(8);
    setDisinF(8);
    setSwapS(1);
    setDisinS(10);
    setGoodC("");
  }, [open]);

  const isDisabled = () => {

    if (Number(stakeAmountFrom) > 0 && Number(stakeAmountTo) > 0
      // && Number(stakeAmountFrom) <= Number(tokenInfoF.balance)
      && (Number(stakeAmountTo) * Number(stakeAmountFrom)) >= 500)
      return true;
    return false;
  }


  const newGood = async () => {
    setSpinning(true);
    try {
    // @ts-ignore
    // const config = inF * 2 ** 217 + disinF * 2 ** 211 + buyF * 2 ** 204 + sellF * 2 ** 197 + swapS * 2 ** 187 + disinS * 2 ** 177

    // stakeAmountFrom,stakeAmountTo,goodC,ercType(1),ercId(0),maxApprove
    const isSuccess = await newGoods(Number(stakeAmountFrom), Number(stakeAmountTo)*selectVgood.goodValue, goodC, 1, 0, maxApprove);
    console.log("isSuccess:--", isSuccess, formatErrorMessage(isSuccess, t))
    if (isSuccess === true) {
      messageApi.open({
        type: 'success',
        content: t('common.mess.create') + t('common.mess.success'),
      });
      handleDialogClose(false)
    } else if (isSuccess === false) {
      messageApi.open({
        type: 'error',
        content: t('common.mess.create') + t('common.mess.error'),
      });
    } else {
      let yz = "";
      if (isSuccess === 35) {
        // const tokens: any = await minThreshold(tokenInfoT.address, ssionChian);
        console.log("35--: 500");
        yz = "; >= 500";
      }
      messageApi.open({
        type: 'error',
        content: formatErrorMessage(isSuccess, t) + yz,
      });
    }
    // }).catch((error) => {
    //   console.error(`"Failed to switch chains: " ${error}`);
    // });
    setSpinning(false);
    } catch { messageApi.open({type:"error",content:t("common.mess.error")}); } finally { setSpinning(false); }
    document.body.style.overflow = "";
  };

  // 质押金额变化处理 - Token A
  const handleStakeAmountFromChange = (value: string) => {
    setStakeAmountFrom(value);
  };

  // 质押金额变化处理 - Token B
  const handleStakeAmountToChange = (value: string) => {
    setStakeAmountTo(value);
  };

  // 质押最大金额 - Token A
  const handleStakeMaxAmountFrom = () => {
    handleStakeAmountFromChange(tokenInfoF?.balance);
  };


  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setSpinning(true);
      if (goodC === "0x0000000000000000000000000000000000000001" || goodC === "0x0000000000000000000000000000000000000002" || goodC === "0x0000000000000000000000000000000000000003") { }
      else {
        const staust = await checkContractExists(goodC).then(exists => {
          if (exists) {
            console.log('合约存在');
            return true;
          } else {
            console.log('合约不存在');
            return false;
          }
        });
        if (!staust) {
          setSpinning(false);
          document.body.style.overflow = "";
          messageApi.open({
            type: 'error',
            content: t('common.mess.address.error'),
          });
          return
        };
        console.log("==--==staust:", staust)
      }
      try {
        const data = await tokenDesc(goodC);
        setTokenInfoF(data);
        console.log("=====data:", data)
        setCurrentStep(currentStep + 1);
      } catch (error) {
        messageApi.open({
          type: 'error',
          content: t('common.mess.error'),
        });
      }
      setSpinning(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setCurrentStep(1); // 重置步骤
      setStakeAmountFrom("");
      setStakeAmountTo("");
    }
    onOpenChange(open);
  };

  // 验证第一步是否完成
  const isStep1Valid = () => {
    return (
      buyF < 0 || sellF < 0 || inF < 0 || disinF < 0 || disinS < 0 || goodC === ""
    );
  };

  return (
    <>
      {contextHolder}
      <CreatModal open={open} setOpen={handleDialogClose} title={t('account.create.title')}>
        <Spin spinning={spinning} fullscreen indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} size="large" />
        <div className="flex items-center justify-between pb-3">
          <div className="text-xs sm:text-sm mt-1">
            {currentStep === 1
              ? t('account.create.title.desc')
              : t('account.create.title.desc1')}
          </div>
          <div className="flex items-center gap-1 text-xs sm:text-sm">
            <span className="text-muted-foreground">
              {t('account.create.step')}
            </span>
            <span style={{ color: COLORS.PRIMARY }}>
              {currentStep}
            </span>
            <span className="text-muted-foreground">of</span>
            <span className="text-muted-foreground">
              {totalSteps}
            </span>
          </div>
        </div>

        {/* 步骤指示器 - 移动端优化 */}
        <div className="flex items-center justify-center space-x-2 sm:space-x-4 py-2 sm:py-4 px-4 sm:px-6 flex-shrink-0 border-b border-gray-100 animate-slide-in-up">
          <div className="flex items-center">
            <div
              className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${currentStep >= 1
                ? "text-white"
                : "bg-gray-200 text-gray-500"
                }`}
              style={currentStep >= 1 ? { backgroundColor: COLORS.PRIMARY } : undefined}
            >
              {currentStep > 1 ? (
                <Check className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                "1"
              )}
            </div>
            <span
              className={`ml-1 sm:ml-2 text-xs sm:text-sm ${currentStep >= 1
                ? "text-foreground"
                : "text-muted-foreground"
                }`}
            >
              {t("account.create.seting.base")}
            </span>
          </div>

          <div
            className={`w-6 sm:w-16 h-0.5 ${currentStep > 1 ? "" : "bg-gray-200"
              }`}
            style={currentStep > 1 ? { backgroundColor: COLORS.PRIMARY } : undefined}
          />

          <div className="flex items-center">
            <div
              className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${currentStep >= 2
                ? "text-white"
                : "bg-gray-200 text-gray-500"
                }`}
              style={currentStep >= 2 ? { backgroundColor: COLORS.PRIMARY } : undefined}
            >
              2
            </div>
            <span
              className={`ml-1 sm:ml-2 text-xs sm:text-sm ${currentStep >= 2
                ? "text-foreground"
                : "text-muted-foreground"
                }`}
            >
              {t('account.create.seting.value')}
            </span>
          </div>
        </div>

        {/* <ScrollArea className="flex-1 min-h-0 max-h-[calc(85vh-180px)] sm:max-h-none"> */}
        <div className="px-4 mb-10 sm:px-6 py-4 sm:py-6 space-y-3 sm:space-y-6 pb-4 sm:pb-6 animate-fade-in">
          {/* 第一步：基础配置 */}
          {currentStep === 1 && (
            <>
              {/* 合约地址 */}
              <div className="space-y-2">
                <Label
                  htmlFor="contract-address"
                  className="text-sm font-medium"
                >
                  {t('account.create.contract')}
                </Label>
                <Input
                  id="contract-address"
                  placeholder={t("account.create.contract.desc")}
                  onChange={(e) => { setGoodC(e.target.value); }}
                  value={goodC}
                  className="h-10 sm:h-11"
                />
              </div>

              {/* 买卖配置 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">
                    {t('account.create.rateconfig')}
                  </Label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 买手续费 */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="buy-fee"
                      className="text-sm"
                    >
                      {t('account.create.buy')}(0~127)
                    </Label>
                    <div className="relative">
                      <Input
                        id="buy-fee"
                        type="number"
                        min={0}
                        max={127}
                        onChange={(e) => { if (Number(e.target.value) >= 0) setBuyF(Number(e.target.value)); }}
                        value={buyF}
                        className="pr-8 h-10 sm:h-11"
                        placeholder="8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        ‱
                      </span>
                    </div>
                  </div>

                  {/* 卖手续费 */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="sell-fee"
                      className="text-sm"
                    >
                      {t('account.create.sell')}(0~127)
                    </Label>
                    <div className="relative">
                      <Input
                        id="sell-fee"
                        type="number"
                        min={0}
                        max={127}
                        onChange={(e) => { if (Number(e.target.value) >= 0) setSellF(Number(e.target.value)); }}
                        value={sellF}
                        className="pr-8 h-10 sm:h-11"
                        placeholder="8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        ‱
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 投资手续费 */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="invest-fee"
                      className="text-sm"
                    >
                      {t('account.create.invest')}(0~63)
                    </Label>
                    <div className="relative">
                      <Input
                        id="invest-fee"
                        type="number"
                        min={0}
                        max={63}
                        onChange={(e) => { if (Number(e.target.value) >= 0) setInF(Number(e.target.value)); }}
                        value={inF}
                        className="pr-8 h-10 sm:h-11"
                        placeholder="8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        ‱
                      </span>
                    </div>
                  </div>

                  {/* 撤资手续费 */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="withdraw-fee"
                      className="text-sm"
                    >
                      {t('account.create.divest')}(0~63)
                    </Label>
                    <div className="relative">
                      <Input
                        id="withdraw-fee"
                        type="number"
                        min={0}
                        max={63}
                        onChange={(e) => { if (Number(e.target.value) >= 0) setDisinF(Number(e.target.value)); }}
                        value={disinF}
                        className="pr-8 h-10 sm:h-11"
                        placeholder="8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        ‱
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 初始配置 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">
                    {t("account.create.chips")}
                  </Label>
                </div>
                <div className="space-y-2 w-full sm:max-w-48">
                  <Label
                    htmlFor="withdraw-initial"
                    className="text-sm"
                  >
                    {t('account.create.divest')}{t('account.create.chips.quanity')}(1~1023)
                  </Label>
                  <Input
                    id="withdraw-initial"
                    type="number"
                    min={1}
                    max={1023}
                    onChange={(e) => { if (Number(e.target.value) >= 0) setDisinS(Number(e.target.value)); }}
                    value={disinS}
                    placeholder="10"
                    className="focus-visible:ring-[#0fb981] focus-visible:border-[#0fb981] h-10 sm:h-11"
                  />
                </div>
              </div>
            </>
          )}

          {/* 第二步：投资配置 */}
          {currentStep === 2 && (
            <>
              {/* 代币质押选择 - 从SwapDialog复制 */}
              <div className="space-y-3 sm:space-y-4">
                {/* XXX 代币 */}
                <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm text-muted-foreground font-medium">
                      {tokenInfoF?.name}
                    </Label>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <div className="text-xs text-muted-foreground">
                        {t('account.create.balance')}:{" "}{tokenInfoF?.balance}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 sm:h-7 sm:px-2 text-xs"
                        style={{ color: COLORS.PRIMARY }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = COLORS.PRIMARY_HOVER;
                          e.currentTarget.style.backgroundColor = `${COLORS.PRIMARY}10`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = COLORS.PRIMARY;
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        onClick={handleStakeMaxAmountFrom}
                      >
                        {t('account.create.max')}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 h-auto p-2 hover:bg-white flex-shrink-0 justify-start min-w-[120px] sm:min-w-0"
                    >
                      <TokenIcon
                        isValueToken={false}
                        icon={tokenInfoF?.logo_url}
                        color=""
                        size={GRK_SIZES.EXTRA_SMALL}
                        showPulse={true}
                      />
                      <div className="text-left min-w-0 flex-1">
                        <div className="font-medium text-sm sm:text-base">{tokenInfoF?.symbol}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {tokenInfoF?.name}
                        </div>
                      </div>
                    </Button>

                    <div className="flex-1 min-w-[100px]">
                      <Input
                        value={stakeAmountFrom}
                        onChange={(e) =>
                          handleStakeAmountFromChange(
                            e.target.value,
                          )
                        }
                        placeholder="0.00"
                        className="text-right bg-white border border-gray-200 rounded-lg font-medium h-9 sm:h-10 px-2 sm:px-3 focus-visible:ring-2 hover:border-gray-300 transition-colors text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  {/* 分佣信息 */}
                  <div className="mt-2 sm:mt-3">
                    <div
                      className="text-xs font-medium"
                      style={{ color: COLORS.USDT }}
                    >
                      {t('account.create.token.tip')}2%
                    </div>
                  </div>
                </div>

                {/* 第二个代币质押 */}
                <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <Label className="text-sm text-muted-foreground font-medium">
                      {/* {tokenInfoF?.symbol} */}
                      {t('account.create.token.price')}(USDT)
                    </Label>
                    {/* <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-1 sm:ml-2">
                      <div className="text-xs text-muted-foreground text-right">
                      {t('account.create.balance')}:{" "}{tokenInfoT?.balance}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 sm:h-7 sm:px-2 text-xs"
                        style={{ color: COLORS.PRIMARY }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = COLORS.PRIMARY_HOVER;
                          e.currentTarget.style.backgroundColor = `${COLORS.PRIMARY}10`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = COLORS.PRIMARY;
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        onClick={handleStakeMaxAmountTo}
                      >
                        {t('account.create.max')}
                      </Button>
                    </div> */}
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* <Dropdown menu={{ ...menuProps(), onClick: handleMenuClick }} >
                      <Button
                        variant="ghost"
                        className="flex items-center gap-2 h-auto p-2 hover:bg-white flex-shrink-0 justify-start min-w-[120px] sm:min-w-0"
                      >
                        <Space>
                          <TokenIcon
                            isValueToken={true}
                            icon={tokenInfoT?.logo_url}
                            color=""
                            size={GRK_SIZES.EXTRA_SMALL}
                            showPulse={true}
                          />
                          <div className="text-left min-w-0 flex-1">
                            <div className="font-medium text-sm sm:text-base">
                              {tokenInfoT?.symbol}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {tokenInfoT?.name}
                            </div>
                          </div>
                          <DownOutlined />
                        </Space>
                      </Button>
                    </Dropdown> */}

                    <div className="flex-1 min-w-[100px]">
                      <Input
                        value={stakeAmountTo}
                        onChange={(e) =>
                          handleStakeAmountToChange(
                            e.target.value,
                          )
                        }
                        placeholder="0.00"
                        className="text-right bg-white border border-gray-200 rounded-lg font-medium h-9 sm:h-10 px-2 sm:px-3 focus-visible:ring-2 hover:border-gray-300 transition-colors text-sm sm:text-base"
                      />
                      {/* <div className="text-xs text-muted-foreground mt-1 text-right">
                        ≈ $
                        {stakeAmountTo
                          ? (
                            Number(stakeAmountTo) *
                            selectedStakeToken.price
                          ).toLocaleString()
                          : "0.00"}
                      </div> */}
                    </div>
                  </div>

                  {/* 分佣信息 */}
                  {/* <div className="mt-2 sm:mt-3">
                    <div className="text-xs text-[#26a17b] font-medium">
                      {t("account.create.token.tip1")}
                    </div>
                  </div> */}
                </div>
              </div>

              {/* 质押总览 - 从SwapDialog复制 */}
              {(stakeAmountFrom &&
                Number(stakeAmountFrom) > 0) ||
                (stakeAmountTo && Number(stakeAmountTo) > 0) ? (
                <div className="p-2 sm:p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <TrendingUp className="h-4 w-4 text-[#0fb981]" />
                    <Label className="text-sm font-medium text-green-800">
                      {t("account.create.preview.title")}
                    </Label>
                  </div>

                  <div className="space-y-1 sm:space-y-2 text-sm">
                    {stakeAmountFrom &&
                      Number(stakeAmountFrom) > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">
                            {tokenInfoF?.symbol}
                          </span>
                          <span className="font-medium text-right">
                            {stakeAmountFrom}
                          </span>
                        </div>
                      )}

                    {stakeAmountTo &&
                      Number(stakeAmountTo) > 0 && (
                        <>
                          {/* <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">
                              {tokenInfoT?.symbol}
                            </span>
                            <span className="font-medium text-right">
                              {stakeAmountTo}
                            </span>
                          </div> */}
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">
                              {/* {tokenInfoF?.symbol} */}
                              {t("account.create.preview.label")}(USDT)
                            </span>
                            <span className="font-medium">{prettifyCurrencys(Number(stakeAmountTo) * Number(stakeAmountFrom))}</span>
                          </div></>
                      )}


                    <Separator className="bg-green-200 my-2" />

                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-sm">
                        {t("account.create.preview.label1")}
                      </span>
                      <div className="text-green-600 text-xs sm:text-sm">
                        {stakeAmountFrom &&
                          Number(stakeAmountFrom) > 0
                          ? `${tokenInfoF?.symbol}${t("account.create.token.tip")}2%`
                          : ""}
                        {/* {Number(stakeAmountFrom) > 0 &&
                          stakeAmountTo &&
                          Number(stakeAmountTo) > 0
                          ? " + "
                          : ""}
                        {stakeAmountTo &&
                          Number(stakeAmountTo) > 0
                          ? `${tokenInfoT?.symbol}${t("account.create.token.tip1")}`
                          : ""} */}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium mb-2 text-blue-800">
                  {t("sale.mod3.tip")}
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>•
                    {t('account.create.token.warning')}(USDT)</li>
                </ul>
              </div>
              {/* 最大授权 */}
              <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                <Label
                  htmlFor="max-authorization"
                  className="font-medium"
                >
                  {t("common.maxApprove")}
                </Label>
                <Switch
                  id="max-authorization"
                  checked={maxApprove}
                  onCheckedChange={setMaxApprove}
                  className="data-[state=checked]:bg-[#0fb981]"
                />
              </div>
            </>
          )}
        </div>
        {/* </ScrollArea> */}

        {/* 步骤导航按钮 */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-0 p-4 sm:p-6 border-t flex-shrink-0 bg-white sm:bg-gray-50/50">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center justify-center gap-2 order-2 sm:order-1 h-9 sm:h-10"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm sm:text-base">{t("common.previous")}</span>
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={currentStep === 1 && isStep1Valid()}
              className="flex items-center justify-center gap-2 bg-[#0fb981] hover:bg-[#22c55e] text-white border-0 shadow-sm order-1 sm:order-2 h-9 sm:h-10 btn-modern hover-glow transition-all duration-300"
            >
              <span className="text-sm sm:text-base">
                {t("common.next")}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              disabled={!isDisabled()}
              onClick={newGood}
              className="flex items-center justify-center gap-2 text-white border-0 shadow-sm order-1 sm:order-2 h-9 sm:h-10 btn-modern hover-glow transition-all duration-300"
              style={{
                backgroundColor: COLORS.PRIMARY,
                '--hover-bg': COLORS.PRIMARY_HOVER
              } as React.CSSProperties}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.PRIMARY_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.PRIMARY)}
            >
              <Check className="h-4 w-4" />
              <span className="text-sm sm:text-base">
                {t("account.create.bnt")}
              </span>
            </Button>
          )}
        </div>
        {/* </DialogContent> */}

      </CreatModal>
    </>
  );
}
