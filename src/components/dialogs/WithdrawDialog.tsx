import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spin, message } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import {
  ArrowDownLeft,
  Info,
  RefreshCw,
  AlertTriangle,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
// import { copyToClipboardWithToast } from "@/components/utils/clipboard";

// 使用新的工具函数和组件
import { VALUE_TOKENS } from "@/utils/constants";
import { formatAddress as formatAddr } from "@/utils/format";
import { TokenIcon } from "../common/TokenIcon";
import useWallet from "@/hooks/useWallet";
import { myDisInvestProofGood } from '@/services/graphql/account';
import { prettifyCurrencys, powerIterative, prettifyCurrencysFee, getDecimalPlaces, withoutRounding } from '@/services/graphql/util';

import { useLocalStorage } from "@/utils/LocalStorageManager";
import { useErrorMess as formatErrorMessage } from '@/hooks/useErrorMess';
import { GRK_SIZES } from "@/types/common";
import CreatModal from "./creatModal";


interface map {
  id: number;
  name: string;
  symbol: string;
  decimals: number;
  mining: number;
  currentQuantity: number;
  currentValue: number;
  address: string;
  quantity: number;
  NAVPS: number;
  maxNum: number;
  rate: number;
  earningRate: number;
  isvaluegood: boolean;
  profit: number;
  APY: number;
  nowNAVPS: number;
  disfee: number;
  investActualQuantity: number;
  logo_url: string;
  investShares: number;
  investQuantity: number;
  allInvestShares: number;
}

interface TokenData {
  id: number;
  isvaluegood: boolean;
  ttsp: number;
  ttsc: number;
  good1: map;
  good2: map;
}
interface count {
  good1: {
    quantity: number;
    profit: number;
    disfee: number;
    count: number;
  };
  // good2: {
  //   quantity: number;
  //   profit: number;
  //   disfee: number;
  //   count: number;
  // };
}
interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investmentId?: any;
  walletAddress?: string;
}

export function WithdrawDialog({
  open,
  onOpenChange,
  investmentId,
  walletAddress
}: WithdrawDialogProps) {

  const { t } = useTranslation();
  const { ssionChian } = useLocalStorage();
  const { disinvest } = useWallet();

  let count = { good1: { quantity: 0, profit: 0, disfee: 0, count: 0 } };

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const [spinning, setSpinning] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const [goodQ, setGoodQ] = useState("");
  const [goodVQ, setGoodVQ] = useState("");
  const [disgood, setDisgood] = useState<TokenData>(null);
  const [disgoodCot, setDisgoodCot] = useState<count>(count);


  useMemo(() => {
    setGoodVQ("");
    setGoodQ("");
    console.log(investmentId, open, 1001, goodQ, goodVQ);
    // setOpen(open_zt);
    if (!open) return;
    (async () => {
      if (investmentId > 0 && open) {
        setSpinning(true);
        let tokens: any = await myDisInvestProofGood(investmentId, walletAddress, ssionChian);
        console.log("*************##############", tokens, 99)
        setDisgood(tokens);
        disAmount(tokens, 0, 0, 0);
        setSpinning(false);
        // setPercent(0);
      }
    })();
  }, [investmentId, open, ssionChian]);

  const isDisabled = useMemo(() => {
    // console.log(buyF, sellF, inF, disinF, swapS, disinS, goodQ, goodVQ, goodC, goodV)
    // @ts-ignore
    if (goodQ === "" || goodQ === "0" || goodQ <= 0 || disgood.good1.maxNum < goodQ)
      return true;
    return false;
  }, [goodQ, goodVQ])

  function disAmount(e: any, zt: number, amount: number, amount2: number) {
    // console.log("99999999", e, zt, amount)
    if (zt == 0) {
      count.good1.quantity = e.good1.investActualQuantity;
      count.good1.profit = e.good1.profit;
      count.good1.disfee = e.good1.disfee;
      count.good1.count = e.good1.quantity + e.good1.profit - e.good1.disfee;
      // count.good2.quantity = e.good2.quantity;
      // count.good2.profit = e.good2.profit;
      // count.good2.disfee = e.good2.disfee;
      // count.good2.count = e.good2.quantity + e.good2.profit - e.good2.disfee;
    } else if (zt == 1) {
      let g1da = e.good1.quantity / e.good1.investShares * amount;
      let g1ada = e.good1.investActualQuantity / e.good1.investShares * amount;
      let sy = e.good1.investQuantity / e.good1.allInvestShares * amount - g1da;
      let sxf = g1da * e.good1.rate;
      count.good1.quantity = g1ada;
      count.good1.profit = sy;
      count.good1.disfee = sxf;
      count.good1.count = sy + g1ada - sxf;
    } else {
      let g1da = e.good1.quantity / e.good1.investShares * amount;
      let g1ada = e.good1.investActualQuantity / e.good1.investShares * amount;
      let sy = e.good1.investQuantity / e.good1.allInvestShares * amount - g1da;
      let sxf = g1da * e.good1.rate;
      count.good1.quantity = g1ada;
      count.good1.profit = sy;
      count.good1.disfee = sxf;
      count.good1.count = sy + g1ada - sxf;

      // let g2da = e.good2.quantity / e.good1.investShares * amount;
      // let g2ada = e.good2.investActualQuantity / e.good1.investShares * amount;
      // let sy2 = e.good2.investQuantity / e.good2.allInvestShares * amount2 - g2da;
      // let sxf2 = g2da * e.good2.rate;
      // count.good2.quantity = g2ada;
      // count.good2.profit = sy2;
      // count.good2.disfee = sxf2;
      // count.good2.count = sy2 + g2ada - sxf2;
    }
    setDisgoodCot(count);
  }
  const disinvestgood = async () => {
    setSpinning(true);
    // @ts-ignore
    const qunt = Number(goodQ * powerIterative(10, disgood.good1.decimals)).toFixed(0);
    console.log("dis---", qunt, goodQ)
    try {
    const isSuccess = await disinvest(disgood.id, BigInt(qunt));
    if (isSuccess === true) {
      messageApi.open({
        type: 'success',
        content: t('common.divest') + t('common.mess.success'),
      });
      // setDataNum(1);
      onOpenChange(false);
    } else if (isSuccess === false) {
      messageApi.open({
        type: 'error',
        content: t('common.divest') + t('common.mess.error'),
      });
    } else {
      messageApi.open({
        type: 'error',
        content: formatErrorMessage(isSuccess, t),
      });
    }
    setSpinning(false);
    } catch { messageApi.open({type:"error",content:t("common.mess.error")}); } finally { setSpinning(false); }
    document.body.style.overflow = "";
  };

  const goodQOn = (e: any) => {
    // @ts-ignore
    const g1: number = disgood.good1.decimals;
    let numg1 = e;
    const pd = parseFloat(e);
    if (Number(numg1) < 0 || isNaN(pd)) {
      numg1 = 0;
      setGoodQ("");
      console.log("----00000", goodQ, e)
    }
    // else {
    const ws = getDecimalPlaces(numg1);
    if (ws > g1) {
      numg1 = withoutRounding(numg1, 6);//Number(numg1).toFixed(g1);
    }
    // console.log("------00--",withoutRounding(2.111111111111111, g1));
    // @ts-ignore
    // if (disgood.isvaluegood) {
      // let num = 0;
      // @ts-ignore
      if (numg1 < disgood.good1.quantity && numg1 < disgood.good1.maxNum || numg1 == disgood.good1.maxNum) {
        if (e == "" && numg1 == 0) {
        } else {
          setGoodQ(numg1);
        }
        numg1 = Number(numg1);
      } else {
        setGoodQ(goodQ);
        numg1 = Number(goodQ);
      }
      // @ts-ignore
      disAmount(disgood, 1, numg1);
      console.log("00000", disgoodCot, 999)
    // }
    //  else {
    //   // @ts-ignore
    //   const g2 = disgood.good2.decimals;
    //   let num = Number(numg1);
    //   // @ts-ignore
    //   let num1: any = disgood.good2.investShares / disgood.good1.investShares * num;
    //   const ws = getDecimalPlaces(num1);
    //   if (ws > g2) {
    //     num1 = withoutRounding(Number(num1), g2);//num1.toFixed(g2);
    //   }
    //   // @ts-ignore
    //   if (num < disgood.good1.quantity && num < disgood.good1.maxNum || num == disgood.good1.maxNum && num1 < disgood.good2.quantity && num1 < disgood.good2.maxNum || num1 == disgood.good2.maxNum) {
    //     if (e == "" && numg1 == 0) {
    //     } else {
    //       setGoodQ(numg1);
    //     }
    //     // @ts-ignore
    //     setGoodVQ(num1);
    //     num1 = Number(num1);
    //   } else {
    //     setGoodQ(goodQ);
    //     setGoodVQ(goodVQ);
    //     numg1 = Number(goodQ);
    //     num1 = Number(goodVQ);
    //   }
    //   disAmount(disgood, 2, numg1, num1);
    //   console.log("------", numg1, num1, count)

    // }
    // }

  };
  // @ts-ignore
  // const goodVQOn = (e: any) => {
  //   // @ts-ignore
  //   const g1: number = disgood.good1.decimals;
  //   //const g2: number = disgood.good2.decimals;

  //   let num1 = e;
  //   const pd = parseFloat(e);
  //   if (Number(num1) < 0 || isNaN(pd)) {
  //     num1 = 0;
  //     setGoodVQ("");
  //   }
  //   // else {
  //   const ws = getDecimalPlaces(num1);
  //   // if (ws > g2) {
  //   //   num1 = withoutRounding(Number(num1), g2);//Number(num1).toFixed(g2);
  //   // }
  //   // @ts-ignore
  //   let num: any = num1 / (disgood.good2.investShares / disgood.good1.investShares);
  //   console.log("++++++", num)
  //   const ws1 = getDecimalPlaces(num);
  //   if (ws1 > g1) {
  //     num = withoutRounding(Number(num), g1);//Number(num).toFixed(g1);
  //   }
  //   // @ts-ignore
  //   if (num < disgood.good1.quantity && num < disgood.good1.maxNum || num == disgood.good1.maxNum && num1 < disgood.good2.quantity && num1 < disgood.good2.maxNum || num1 == disgood.good2.maxNum) {

  //     if (e == "" && num1 == 0) {
  //     } else {
  //       setGoodVQ(num1);
  //     }
  //     setGoodQ(num);
  //     // setGoodVQ(num1);
  //     num = Number(num);
  //     num1 = Number(num1);
  //   } else {
  //     setGoodQ(goodQ);
  //     setGoodVQ(goodVQ);
  //     num = Number(goodQ);
  //     num1 = Number(goodVQ);
  //   }
  //   console.log("++++++", num, num1)
  //   disAmount(disgood, 2, num, num1);
  //   // }
  // };



  // 重置状态
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setIsSubmitting(false);
    }
  }, [open]);

  // 步骤处理
  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 验证是否可以进入下一步
  const canProceedToNextStep = () => {
    if (currentStep === 1) return true;
    if (currentStep === 2) {
      return !isDisabled;
    }
    return false;
  };

  const ttsextract = () => {
    let a = 0;
    let b = 0;
    let av = disgood.good1.currentValue / disgood.good1.currentQuantity * Number(goodQ) * 10 ** disgood.good1.decimals;
    a = (av * disgood.ttsp - av * disgood.ttsc) / 10 ** 12;
    // if (!disgood.isvaluegood && disgood.good2.address!=="") {
    //   let bv = disgood.good2.currentValue / disgood.good2.currentQuantity * Number(goodVQ) * 10 ** disgood.good2.decimals;
    //   b = (bv * disgood.ttsp - bv * disgood.ttsc) / 10 ** 12;
    // }

    return a + b;
  };

  return (
    <>
      {contextHolder}
      <CreatModal open={open} setOpen={onOpenChange} title={t("account.divest.title")}>
        <Spin spinning={spinning} fullscreen indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} size="large" />

        <div className="pb-4"> {t("account.divest.title.desc")}</div>
        {/* <DialogContent className="max-w-2xl max-h-[85vh] min-h-[500px] p-0 flex flex-col">
          <DialogHeader className="p-6 pb-0 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownLeft className="h-5 w-5 text-[#0fb981]" />
              撤资申请
            </DialogTitle>
            <DialogDescription>
              分步式撤资流程，帮助您安全地撤回投资份额
            </DialogDescription>
          </DialogHeader> */}

        {/* 步骤指示器 */}
        <div className="flex items-center justify-center mb-6 px-6 flex-shrink-0">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${currentStep >= step
                    ? "bg-[#0fb981] text-white"
                    : "bg-gray-200 text-gray-600"
                    }`}
                >
                  {currentStep > step ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step
                  )}
                </div>
                {step < 3 && (
                  <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 步骤标题 */}
        <div className="text-center mb-6">
          <h3 className="font-medium text-gray-900">
            {currentStep === 1 && t("account.divest.invest.title")}
            {currentStep === 2 && t("account.divest.divest.title")}
            {currentStep === 3 && t("account.divest.details.title")}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {currentStep === 1 && t("account.divest.invest.title.desc")}
            {currentStep === 2 && t("account.divest.divest.title.desc")}
            {currentStep === 3 && t("account.divest.details.title.desc")}
          </p>
        </div>

        {disgood?.id && (
          <ScrollArea className="px-6 max-h-[calc(85vh - 357px)]  min-h-[calc(500px - 357px)]">
            <div className="pb-6">
              {/* 第一步：投资信息展示 */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-medium mb-3">{t("account.divest.invest.par.title")}</h4>

                    {/* 第一个代币信息 */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <TokenIcon
                            isValueToken={disgood.good1.isvaluegood}
                            icon={disgood.good1.logo_url}
                            color=""
                            size={GRK_SIZES.EXTRA_SMALL}
                            showPulse={disgood.good1.isvaluegood}
                          />
                          <div>
                            <div className="font-medium">
                              {disgood.good1.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {disgood.good1.symbol}
                            </div>
                            {disgood.good1.address && (
                              <div className="text-xs text-muted-foreground font-mono">
                                {formatAddr(
                                  disgood.good1.address,
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            {t("account.divest.invest.shares")}
                          </div>
                          <div className="font-medium">
                            {
                              prettifyCurrencys(disgood.good1.investShares)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t("account.divest.invest.NAVPS")}:{" "}
                            {prettifyCurrencysFee(disgood.good1.NAVPS)}
                          </div>
                        </div>
                      </div>

                      {/* 第二个代币信息 */}
                      {/* {!disgood.isvaluegood && disgood.good2.address!=="" && (
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <TokenIcon
                              isValueToken={disgood.good2.isvaluegood}
                              icon={disgood.good2.logo_url}
                              color=""
                              size={GRK_SIZES.EXTRA_SMALL}
                              showPulse={disgood.good2.isvaluegood}
                            />
                            <div>
                              <div className="font-medium">
                                {disgood.good2.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {disgood.good2.symbol}
                              </div>
                              {disgood.good2.address && (
                                <div className="text-xs text-muted-foreground font-mono">
                                  {formatAddr(
                                    disgood.good2.address,
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">
                              {t("account.divest.invest.shares")}
                            </div>
                            <div className="font-medium">
                              {prettifyCurrencys(disgood.good2.investShares)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {t("account.divest.invest.NAVPS")}:{" "}
                              {prettifyCurrencysFee(disgood.good2.NAVPS)}
                            </div>
                          </div>
                        </div>
                      )} */}
                    </div>

                    {/* 投资类型标识 */}
                    <div className="mt-4 flex justify-center">
                      <Badge
                        variant="outline"
                        className="text-[#0fb981] border-[#0fb981]"
                      >
                        {t("account.divest.invest.title1")}
                      </Badge>
                    </div>
                  </div>

                  {/* 重要提示 */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-yellow-800">
                        <div className="font-medium mb-1">
                          {t("account.divest.notice.title")}
                        </div>
                        <ul className="space-y-1 text-xs">
                          <li>•{t("account.divest.notice.label1")}{disgood.good1.rate * 10000}‱{t("account.divest.notice.label1-1")}</li>
                          <li>•{t("account.divest.notice.label2")}</li>
                          <li>
                            •{t("account.divest.notice.label3")}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 第二步：撤资设置 */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  {/* 第一个代币撤资设置 */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <TokenIcon
                          isValueToken={disgood.good1.isvaluegood}
                          icon={disgood.good1.logo_url}
                          color=""
                          size={GRK_SIZES.EXTRA_SMALL}
                          showPulse={disgood.good1.isvaluegood}
                        />
                        <Label className="text-sm font-medium">
                          {disgood.good1.symbol}
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground">
                          {t("account.divest.invest.shares")}:{" "}
                          {prettifyCurrencys(disgood.good1.investShares)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-[#0fb981] hover:text-[#22c55e] hover:bg-[#0fb981]/10"
                          onClick={() => goodQOn(disgood.good1.maxNum)}
                        >
                          {t("common.max")}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="text-left">
                          <div className="font-medium">
                            {disgood.good1.symbol}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {disgood.good1.name}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <Input
                          type="number"
                          // value={withdrawShares1}
                          // onChange={(e) =>
                          //   setWithdrawShares1(e.target.value)
                          // }
                          onChange={(e) => goodQOn(e.target.value)}
                          min={0}
                          max={disgood.good1.maxNum}
                          value={goodQ}
                          placeholder={t("account.divest.divest.tip")}
                          className="text-right bg-white border border-gray-200 rounded-lg text-lg font-medium h-10 px-3 focus-visible:ring-2 focus-visible:ring-[#0fb981] focus-visible:border-[#0fb981] hover:border-gray-300 transition-colors"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          {t("account.divest.divest.revenue")}:{" "}
                          {prettifyCurrencysFee(disgood.good1.profit)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 第二个代币撤资设置 */}
                  {/* {!disgood.isvaluegood && disgood.good2.address!=="" && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <TokenIcon
                            isValueToken={disgood.good2.isvaluegood}
                            icon={disgood.good2.logo_url}
                            color=""
                            size={GRK_SIZES.EXTRA_SMALL}
                            showPulse={disgood.good2.isvaluegood}
                          />
                          <Label className="text-sm font-medium">
                            {disgood.good2.symbol}
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-muted-foreground">
                            {t("account.divest.invest.shares")}:{" "}
                            {prettifyCurrencys(disgood.good2.investShares)}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-[#0fb981] hover:text-[#22c55e] hover:bg-[#0fb981]/10"
                            onClick={() => goodVQOn(disgood.good2.maxNum)}
                          >
                            {t("common.max")}
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className="text-left">
                            <div className="font-medium">
                              {disgood.good2.symbol}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {disgood.good2.name}
                            </div>
                          </div>
                        </div>
                        <div className="flex-1">
                          <Input
                            type="number"
                            // value={withdrawShares2}
                            // onChange={(e) =>
                            //   goodVQOn(e.target.value)
                            // }
                            min={0}
                            max={disgood.good2.maxNum}
                            onChange={(e) => goodVQOn(e.target.value)}
                            value={goodVQ}
                            placeholder={t("account.divest.divest.tip")}
                            className="text-right bg-white border border-gray-200 rounded-lg text-lg font-medium h-10 px-3 focus-visible:ring-2 focus-visible:ring-[#0fb981] focus-visible:border-[#0fb981] hover:border-gray-300 transition-colors"
                          />
                          <div className="text-xs text-muted-foreground mt-1">
                            {t("account.divest.divest.revenue")}:{" "}
                            {prettifyCurrencysFee(disgood.good2.profit)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )} */}

                  {/* 实时预览 */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-3">
                      {t("account.divest.divest.preview.title")}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>
                          {t("account.divest.divest.preview.label")}{" "}
                          {disgood.good1.symbol}
                        </span>
                        <span className="font-medium text-[#0fb981]">
                          {prettifyCurrencys(disgoodCot.good1.count)}
                          {" "}
                          {disgood.good1.symbol}
                        </span>
                      </div>
                      {/* {!disgood.isvaluegood && disgood.good2.address!=="" && (
                        <div className="flex justify-between">
                          <span>
                            {t("account.divest.divest.preview.label")}{" "}
                            {disgood.good2!.symbol}
                          </span>
                          <span className="font-medium text-[#0fb981]">
                            {prettifyCurrencys(disgoodCot.good2.count)}{" "}
                            {disgood.good2!.symbol}
                          </span>
                        </div>
                      )} */}
                    </div>
                  </div>
                </div>
              )}

              {/* 第三步：确认详情 */}
              {currentStep === 3 && !isDisabled && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-medium mb-4">{t("account.divest.details.list")}</h4>

                    {/* 第一个代币详情 */}
                    {Number(goodQ) > 0 && (
                      <div className="space-y-2 text-sm mb-4">
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          <TokenIcon
                            isValueToken={disgood.good1.isvaluegood}
                            icon={disgood.good1.logo_url}
                            color=""
                            size={GRK_SIZES.EXTRA_SMALL}
                            showPulse={disgood.good1.isvaluegood}
                          />
                          {disgood.good1.symbol}
                        </div>

                        <div className="pl-6 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              {t("account.divest.details.list.shares")}
                            </span>
                            <span className="font-medium">
                              {goodQ}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              {t("account.divest.details.list.volume")}
                            </span>
                            <span className="font-medium">
                              {prettifyCurrencys(disgoodCot.good1.quantity)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              {t("account.divest.details.list.fee")} ({disgood.good1.rate * 10000}‱)
                            </span>
                            <span className="font-medium text-red-600">
                              -{prettifyCurrencysFee(disgoodCot.good1.disfee)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              {t("account.divest.divest.revenue")}
                            </span>
                            <span className="font-medium">
                              {prettifyCurrencysFee(disgood.good1.profit)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              {t("account.divest.details.list.revenue")}
                            </span>
                            <span className="font-medium text-blue-600">
                              {prettifyCurrencysFee(disgoodCot.good1.profit)}
                            </span>
                          </div>
                          <div className="flex justify-between font-medium border-t pt-1">
                            <span>{t("account.divest.details.list.total")}</span>
                            <span className="text-[#0fb981]">
                              {prettifyCurrencys(disgoodCot.good1.count)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 第二个代币详情 */}
                    {/* {Number(goodVQ) > 0 && disgood.good2.address!=="" && (
                      <div className="space-y-2 text-sm">
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          <TokenIcon
                            isValueToken={disgood.good2.isvaluegood}
                            icon={disgood.good2.logo_url}
                            color=""
                            size={GRK_SIZES.EXTRA_SMALL}
                            showPulse={disgood.good2.isvaluegood}
                          />
                          {disgood.good2!.symbol}
                        </div>

                        <div className="pl-6 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              {t("account.divest.details.list.shares")}
                            </span>
                            <span className="font-medium">
                              {goodVQ}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              {t("account.divest.details.list.volume")}
                            </span>
                            <span className="font-medium">
                              {prettifyCurrencys(disgoodCot.good2.quantity)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              {t("account.divest.details.list.fee")} ({disgood.good2.rate * 10000}‱)
                            </span>
                            <span className="font-medium text-red-600">
                              -{prettifyCurrencysFee(disgoodCot.good2.disfee)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              {t("account.divest.divest.revenue")}
                            </span>
                            <span className="font-medium">
                              {prettifyCurrencysFee(disgood.good2.profit)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              {t("account.divest.details.list.revenue")}
                            </span>
                            <span className="font-medium text-blue-600">
                              {prettifyCurrencysFee(disgoodCot.good2.profit)}
                            </span>
                          </div>
                          <div className="flex justify-between font-medium border-t pt-1">
                            <span>{t("account.divest.details.list.total")}</span>
                            <span className="text-[#0fb981]">
                              {prettifyCurrencys(disgoodCot.good2.count)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )} */}
                  </div>

                  {/* TTS挖矿状态 */}
                  <div className="bg-yellow-50 rounded-xl p-4">
                    <h4 className="font-medium mb-4 text-yellow-900">
                      {t("account.divest.details.mining.title")}
                    </h4>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t("account.divest.details.mining.tip")}
                        </span>
                        <span className="font-medium text-yellow-700">
                          {prettifyCurrencys(disgood.good1.mining)
                            // disgood.isvaluegood ? prettifyCurrencys(disgood.good1.mining) : prettifyCurrencys(Number(disgood.good1.mining) + Number(disgood.good2.mining))
                            }
                        </span>
                      </div>
                      {/* <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            已提取数量
                          </span>
                          <span className="font-medium text-yellow-600">
                            100 TTS
                          </span>
                        </div> */}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t("account.divest.details.mining.tip1")}
                        </span>
                        <span className="font-medium text-orange-600">
                          {prettifyCurrencys(ttsextract())}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <Separator className="flex-shrink-0" />

        {/* 底部按钮 */}
        <div className="flex justify-between p-6 pt-4 flex-shrink-0">
          <Button
            variant="outline"
            onClick={
              currentStep === 1
                ? () => onOpenChange(false)
                : handlePrevious
            }
            className="flex items-center gap-2"
          >
            {currentStep === 1 ? (
              t("common.cancel")
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                {t("common.previous")}
              </>
            )}
          </Button>

          {currentStep < 3 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceedToNextStep()}
              className="bg-[#0fb981] hover:bg-[#22c55e] text-white border-0 shadow-sm flex items-center gap-2"
            >
              {t("common.next")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={disinvestgood}
              disabled={isSubmitting}
              className="bg-[#0fb981] hover:bg-[#22c55e] text-white border-0 shadow-sm flex items-center gap-2"
            >
              {/* {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  提交中...
                </>
              ) : (
                "确认提交"
              )} */}
              {t("common.submit")}
            </Button>
          )}
        </div>
        {/* </DialogContent> */}
      </CreatModal>


    </>
  );
}
