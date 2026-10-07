import { PageState } from "@/components/common/PageState";
import { useEffect, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronDown,
  Coins,
} from "lucide-react";
import { TokenIcon } from "../common/TokenIcon";
import { Spin, Tooltip, message } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import useWallet from "@/hooks/useWallet";
import { useErrorMess as formatErrorMessage } from '@/hooks/useErrorMess';

// 使用新的工具函数和常量
// import { TRANSACTION_TYPE_LABELS, COLORS } from "@/utils/constants";
// import type { Transaction } from "@/types";
import { prettifyCurrencys, prettifyCurrencysFee } from '@/services/graphql/util';
import { myCommissions } from '@/services/graphql/account';
import { useTranslation } from 'react-i18next';
import { useValueGood } from "@/stores/valueGood";
import { useLocalStorage } from "@/utils/LocalStorageManager";
import { timestampParser } from "@/utils/timestamp-parser";
import { GRK_SIZES } from "@/types/common";

interface CommissionData {
  id: string;
  name: string;
  symbol: string;
  logo_url: string;
  totalFeeQantity: number;
  price: number;
  valueSymbol: string;
  tokendecimals: number;
  totalFeeAmount: number;
  myFeeQuanity: number;
  myFeeAmount: number;
  totalTradeCount: number;
  isvaluegood: boolean;
}

interface CommissionTableProps {
  wallet_address?: string;
  onTokenClick?: (token: any) => void;
}

export function CommissionTable({
  wallet_address,
  onTokenClick,
}: CommissionTableProps) {
  const { t } = useTranslation();




  const [maybeResult, setResult] = useState<CommissionData[]>(null);
  const [collectIds, setCollectIds] = useState<[]>([]);
  const [error, setError] = useState({ error: false, error_message: "" });
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const [pagination, setPagination] = useState({
    page_number: 1,
  });
  const [hasMore, setHasMore] = useState<boolean>();
  const [spinning, setSpinning] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [tableSpinning, settableSpinning] = useState(false);
  const { info } = useValueGood();
  const { ssionChian } = useLocalStorage();
  const [totalValue, setTotalValue] = useState(0);
  const [totalcommissionvalue, setTotalcommissionvalue] = useState(0);
  const page_size = 20;
  const [retryVersion,setRetryVersion] = useState(0);

  const handlePagination = (page_number: number) => {
    setPagination((prev) => {
      return {
        ...prev,
        page_number,
      };
    });
  };

  const handleScroll = () => {
    if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight) {
      if (hasMore) {
        handlePagination(pagination.page_number + 1);
      }
    }
  };



  const { collect } = useWallet();

  const text = <span>{t('body.account.tabs.commission.tip')}</span>;

  const collectCommission = async () => {
    setSpinning(true);
    const isSuccess = await collect(collectIds);
    console.log(isSuccess)
    if (isSuccess === true) {
      messageApi.open({
        type: 'success',
        content: t('common.mess.collect') + t('common.mess.success'),
      });
    } else if (isSuccess === false) {
      messageApi.open({
        type: 'error',
        content: t('common.mess.collect') + t('common.mess.error'),
      });
    } else {
      messageApi.open({
        type: 'error',
        content: formatErrorMessage(isSuccess, t),
      });
    }
    setSpinning(false);
    document.body.style.overflow = "";

  }

  useEffect(() => {setPagination({page_number:1});setResult([]);setHasMore(false);setError({error:false,error_message:""});},[ssionChian, info.id, wallet_address]);
  useEffect(() => {
    let active=true;
    if (!info.id || !wallet_address) { settableSpinning(true); return; }
    settableSpinning(true);setError({error:false,error_message:""});
    (async()=>{try{const response:any=await myCommissions({id: info.id, address: wallet_address,pageNumber:pagination.page_number-1,pageSize:page_size},ssionChian);if(!active)return;
      setHasMore(response.pagination.has_more);setTotalValue(response.totalValue);setTotalcommissionvalue(response.totalcommissionvalue);setCollectIds(response.ids);
      setResult(prev=>pagination.page_number===1 ? response.items || [] : [...(prev || []),...(response.items || [])]);
    }catch{if(active)setError({error:true,error_message:""});}finally{if(active)settableSpinning(false);}})();
    return()=>{active=false;};
  },[ssionChian, info.id, wallet_address,pagination.page_number,retryVersion]);

  useEffect(() => {
    setWindowWidth(window.innerWidth);

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const formatValue = (value: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(value);
  };

  const handleCollectFees = () => {
    console.log("收取手续费");
    // 这里可以添加收费逻辑
  };

  // 处理代币行点击
  const handleTokenRowClick = (item: CommissionData, event: React.MouseEvent) => {
    // 阻止一键提取按钮的点击事件冒泡
    if ((event.target as HTMLElement).closest('button')) {
      return;
    }
    onTokenClick?.(item.id);
  };

  if (error.error) return <PageState kind="error" onRetry={()=>setRetryVersion(v=>v+1)}/>;
  if (tableSpinning && !maybeResult?.length) return <PageState kind="loading"/>;
  if (maybeResult?.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4 transition-transform duration-200 hover:scale-110" />
        <h3 className="mb-2 transition-colors duration-200 hover:text-[#0fb981]">{t("common.noData")}</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto transition-colors duration-200 hover:text-gray-600">
          {t("account.tabs.commission.table.tip")}
        </p>
      </div>
    );
  }

  return (
    <>
      {contextHolder}
      <Spin spinning={spinning} fullscreen indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} size="large" />
      <div className="space-y-6 animate-fade-in">
        {/* 顶部统计概览 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 总佣金价值 */}
          <div className="stagger-item bg-gradient-to-r from-[#0fb981]/10 to-[#22c55e]/10 rounded-lg p-4 border border-[#0fb981]/20 hover-lift transition-all duration-300">
            <div className="mb-2">
              <span className="text-sm text-muted-foreground transition-colors duration-200 hover:text-gray-600">
                {t("account.tabs.commission.label1")}
              </span>
            </div>
            <div className="text-xl sm:text-2xl text-[#0fb981] flex justify-between items-center">
              <span className="transition-transform duration-200 hover:scale-105">{prettifyCurrencys(totalcommissionvalue)}</span>
              <span className="text-base sm:text-lg">{info.symbol}</span>
            </div>
          </div>

          {/* 我的佣金价值 + 一键提取按钮 */}
          <div className="stagger-item bg-blue-50 rounded-lg p-4 border border-blue-200 hover-lift transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-sm text-muted-foreground transition-colors duration-200 hover:text-gray-600">
                {t("account.tabs.commission.label2")}
                </span>
              </div>
              <Button
                onClick={collectCommission}
                size="sm"
                className="bg-[#0fb981] hover:bg-[#22c55e] text-white border-0 shadow-sm h-6 px-2 text-xs btn-modern hover-glow transition-all duration-200"
                disabled={collectIds?.length > 0 ? false : true}
              >
                {t("account.tabs.commission.bnt")}
              </Button>
            </div>
            <div className="text-xl sm:text-2xl text-blue-600 flex justify-between items-center">
              <span className="transition-transform duration-200 hover:scale-105">{prettifyCurrencysFee(totalValue)}</span>
              <span className="text-base sm:text-lg">{info.symbol}</span>
            </div>
          </div>

          {/* 佣金代币数量 */}
          <div className="stagger-item bg-purple-50 rounded-lg p-4 border border-purple-200 hover-lift transition-all duration-300">
            <div className="mb-2">
              <span className="text-sm text-muted-foreground transition-colors duration-200 hover:text-gray-600">
              {t("account.tabs.commission.label3")}
              </span>
            </div>
            <div className="text-xl sm:text-2xl text-purple-600 text-left transition-transform duration-200 hover:scale-105">
              {maybeResult?.length}
            </div>
          </div>
        </div>

        {/* 桌面端佣金表格 */}
        <div className="hidden sm:block border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-center w-[60px] h-[34px] px-2 py-[5.5px]">{t("common.table.id")}</TableHead>
                <TableHead className="text-center w-[200px] h-[34px] px-2 py-[5.5px]">{t("account.tabs.commission.name")}</TableHead>
                <TableHead
                  className="text-center h-[34px] px-2 py-[5.5px] cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  {t("account.tabs.commission.totalfeevolume")}
                </TableHead>
                <TableHead className="text-center h-[34px] px-2 py-[5.5px]">
                {t("account.tabs.commission.totalfeeamount")}
                </TableHead>
                <TableHead className="text-center h-[34px] px-2 py-[5.5px]">
                {t("account.tabs.commission.feevolume")}
                </TableHead>
                <TableHead className="text-center h-[34px] px-2 py-[5.5px]">
                {t("account.tabs.commission.feeamount")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maybeResult?.map((item, index) => (
                <TableRow
                  key={item.id}
                  className="stagger-item hover:bg-muted/30 hover:shadow-md hover:border-[#0fb981]/20 transition-all duration-300 cursor-pointer group"
                  onClick={(e) => handleTokenRowClick(item, e)}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <TableCell className="text-center px-2 py-[5.5px] text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell className="px-2 py-[5.5px]">
                    <div className="flex items-center gap-3">
                      <TokenIcon
                        isValueToken={item.isvaluegood}
                        icon={item.logo_url}
                        color=""
                        size={GRK_SIZES.EXTRA_SMALL}
                        showPulse={item.isvaluegood}
                      />
                      <div className="flex flex-col items-start gap-0.5">
                        <div className="font-medium text-black/80 text-[110%]">
                          {item.symbol}
                        </div>
                        <div className="text-gray-500 text-[85%] opacity-75">
                          {item.name}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium px-2 py-[5.5px]">
                    {prettifyCurrencys(item.totalFeeQantity)}
                  </TableCell>
                  <TableCell className="text-center font-medium px-2 py-[5.5px]">
                    {prettifyCurrencys(item.totalFeeAmount)} {" "}{
                      item.valueSymbol}
                  </TableCell>
                  <TableCell className="text-center font-medium px-2 py-[5.5px]">
                    {prettifyCurrencysFee(item.myFeeQuanity)}
                  </TableCell>
                  <TableCell className="text-center px-2 py-[5.5px]">
                    <span
                      className={`font-medium ${item.myFeeAmount > 0
                        ? "text-[#0fb981]"
                        : "text-gray-400"
                        }`}
                    >
                      {prettifyCurrencysFee(item.myFeeAmount)} {" "}{
                        item.valueSymbol}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* 移动端卡片布局 */}
        <div className="sm:hidden space-y-3">
          {maybeResult?.map((item, index) => (
            <Card key={item.id} className="p-4 hover:shadow-md hover:border-[#0fb981]/20 transition-all duration-200 cursor-pointer"
              onClick={(e) => handleTokenRowClick(item, e)}>
              {/* 代币信息 */}
              <div className="flex items-center gap-3 mb-4">
                <TokenIcon
                  isValueToken={item.isvaluegood}
                  icon={item.logo_url}
                  color=""
                  size={GRK_SIZES.SMALL}
                  showPulse={item.isvaluegood}
                />
                <div className="flex-1">
                  <div className="font-medium text-lg">{item.symbol}</div>
                  <div className="text-sm text-muted-foreground">{item.name}</div>
                  {/* <div className="text-xs text-muted-foreground">#{index + 1}</div> */}
                </div>
              </div>

              {/* 数据网格 */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1">{t("account.tabs.commission.totalfeevolume")}</div>
                  <div className="font-medium">{prettifyCurrencys(item.totalFeeQantity)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">{t("account.tabs.commission.totalfeeamount")}</div>
                  <div className="font-medium">{prettifyCurrencys(item.totalFeeAmount)} {" "}{
                    item.valueSymbol}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">{t("account.tabs.commission.feevolume")}</div>
                  <div className="font-medium"> {prettifyCurrencysFee(item.myFeeQuanity)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">{t("account.tabs.commission.feeamount")}</div>
                  <div className={`font-medium ${item.myFeeAmount > 0 ? "text-[#0fb981]" : "text-gray-400"}`}>
                    {prettifyCurrencysFee(item.myFeeAmount)} {" "}{item.valueSymbol}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-center">
          <Spin
            spinning={tableSpinning}
            indicator={<LoadingOutlined spin />}
            tip="Loading"
          // size="small"
          >
            <div />
          </Spin>
        </div>
        {/* 空状态 */}
        {maybeResult?.length === 0 && (
          <div>
            <div className="hidden sm:block text-center py-12 text-gray-400 text-sm border rounded-lg">
              {t("common.noData")}
            </div>
            <div className="sm:hidden text-center py-12 text-gray-400 text-sm">
              {t("common.noData")}
            </div>
          </div>
        )}

        {/* 页面底部说明 */}
        <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Coins className="h-4 w-4 mt-0.5 text-[#0fb981]" />
            <div>
              <p className="mb-2">
                <strong>{t("account.tabs.commission.Instructions")}</strong>
              </p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>{t("account.tabs.commission.Instructions.label1")}</li>
                <li>
                {t("account.tabs.commission.Instructions.label2")}
                </li>
                <li>{t("account.tabs.commission.Instructions.label3")}</li>
                <li>{t("account.tabs.commission.Instructions.label4")}</li>
                <li>{t("account.tabs.commission.Instructions.label5")}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
