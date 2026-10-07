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
import { ChevronDown, Eye } from "lucide-react";
import { Spin, Tooltip } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

// 使用新的工具函数和常量
// import { TRANSACTION_TYPE_LABELS, COLORS } from "@/utils/constants";
// import type { Transaction } from "@/types";
import { prettifyCurrencys, calculateFeePercentage } from '@/services/graphql/util';
import { goodsTransactionsDatas } from '@/services/graphql/goods';
// import { myTransactionsDatas } from '@/services/graphql/account';
import { useTranslation } from 'react-i18next';
import { useValueGood } from "@/stores/valueGood";
import { useLocalStorage } from "@/utils/LocalStorageManager";
import { timestampParser } from "@/utils/timestamp-parser";

interface TransactionRecordsProps {
  tokenId?: string;
  wallet_address?: string;
  symbol?: string;
}

export function TransactionRecords({
  tokenId = "", wallet_address = "0", symbol = "",
}: TransactionRecordsProps) {
  const { t } = useTranslation();

  const [spinning, setSpinning] = useState(false);
  const [pagination, setPagination] = useState({
    page_number: 1,
  });
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [records, setRecords] = useState<any[] | null>([]);
  const [error, setError] = useState({ error: false, error_message: "" });
  const { info } = useValueGood();
  const { ssionChian } = useLocalStorage();
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


  // console.log("pafas:", pagination,hasMore)

  useEffect(() => {setPagination({page_number:1});setRecords([]);setHasMore(false);setError({error:false,error_message:""});},[ssionChian, info.id, wallet_address, tokenId]);
  useEffect(() => {
    let active=true;
    if (!info.id) { setSpinning(true); return; }
    setSpinning(true);setError({error:false,error_message:""});
    (async()=>{try{const response:any=await goodsTransactionsDatas({id: info.id, address: tokenId, walletAddress: wallet_address,pageNumber:pagination.page_number-1,pageSize:page_size},ssionChian);if(!active)return;
      setHasMore(response.pagination.has_more);
      setRecords(prev=>pagination.page_number===1 ? response.items || [] : [...(prev || []),...(response.items || [])]);
    }catch{if(active)setError({error:true,error_message:""});}finally{if(active)setSpinning(false);}})();
    return()=>{active=false;};
  },[ssionChian, info.id, wallet_address, tokenId,pagination.page_number,retryVersion]);
  // 交易类型标签
  const TRANSACTION_TYPE_LABELS: Record<string, string> = {
    buy: t("table.transactions.buy"),
    sell: t("table.transactions.sell"),
    invest: t("table.transactions.invest"),
    divest: t("table.transactions.divest"),
    init: t("table.transactions.init"),
    meta: t("table.transactions.meta")
  };
  const formatTokenPair = (symbol1: string, symbol2: string, type: string) => {
    let tokenPair: string;
    if (symbol2 === "#") {
      tokenPair = symbol1;
    } else {
      if (type === "buy" || type === "pay") {
        tokenPair = symbol1 + " -> " + symbol2;
      } else if (
        type === "divest" ||
        type === "invest" ||
        type === "init"
      ) {
        tokenPair = symbol1 + " & " + symbol2;
      }
    }
    return tokenPair;
  };

  const getTypeColor = (type: string, symbol1: string) => {
    const colorMap: Record<string, string> = {
      buy: "bg-green-100 text-green-800 border-green-200",
      sell: "bg-red-100 text-red-800 border-red-200",
      divest: "bg-red-100 text-red-800 border-red-200",
      invest: "bg-[#0fb981]/10 text-[#0fb981] border-[#0fb981]/20",
      init: "bg-purple-100 text-purple-800 border-purple-200",
      meta: "bg-gray-100 text-gray-800 border-gray-200",
    };
    if (type === "buy") {
      if (symbol === symbol1 || tokenId === "") {
        type = "sell";
      }
    }
    return colorMap[type] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getTypeLabel = (a: any) => {
    if (a.type === "buy") {
      // console.log("a:", a, symbol)
      if (symbol === a.symbol1 || tokenId === "") {
        return TRANSACTION_TYPE_LABELS["sell"];
      }
      // if (tokenId === "") {
      //   return TRANSACTION_TYPE_LABELS["sell"];
      // }
    }
    return TRANSACTION_TYPE_LABELS[a.type] || a.type;
  };

  const formatAmount = (
    amount1?: any,
    amount2?: any,
    tokenSymbol?: string,
    type?: string,
    isMobile: boolean = false,
  ) => {
    amount1 = prettifyCurrencys(amount1);
    amount2 = prettifyCurrencys(amount2);
    if (tokenSymbol === "#") {
      return "-";
    }
    if (type === "divest" || type === "invest") {
      return (
        <div className={`space-y-1 ${isMobile ? 'text-xs' : ''}`}>
          <div className={`font-medium flex items-center justify-end gap-1`}>
            <span>{amount1}</span>
            {tokenSymbol && (
              <span className={`px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded ${isMobile ? 'text-xs' : 'text-xs'} font-medium`}>
                {tokenSymbol}
              </span>
            )}
          </div>
          <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground flex items-center justify-end gap-1`}>
            <span>{amount2}</span>
            {tokenSymbol && (
              <span className="px-1 py-0.5 bg-gray-100 text-gray-700 rounded" style={{ fontSize: '0.625rem' }}>
                {tokenSymbol}
              </span>
            )}
          </div>
        </div>
      );
    } else {
      return (
        <div className={`font-medium flex items-center justify-end gap-1 ${isMobile ? 'text-xs' : ''}`}>
          <span>{amount1}</span>
          {tokenSymbol && (
            <span className={`px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded ${isMobile ? 'text-xs' : 'text-xs'} font-medium`}>
              {tokenSymbol}
            </span>
          )}
        </div>
      );
    }
  };

  if (error.error) return <PageState kind="error" onRetry={()=>setRetryVersion(v=>v+1)}/>;
  if (spinning && !records?.length) return <PageState kind="loading"/>;
  return (
    <div className="animate-fade-in">
      {/* 桌面端表格 */}
      <div className="hidden sm:block border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <Tooltip placement="top" title={<span>{t("table.transactions.time.tip")}</span>}>
                <TableHead className="text-center w-[120px] h-[34px] px-2 py-[5.5px]">
                  {t("table.transactions.time")}
                </TableHead>
              </Tooltip>
              <Tooltip placement="top" title={<span>{t("table.transactions.type.tip")}</span>}>
                <TableHead className="text-center w-[80px] h-[34px] px-2 py-[5.5px]">
                  {t("table.transactions.type")}
                </TableHead>
              </Tooltip>
              <Tooltip placement="top" title={<span>{t("table.transactions.tokens.tip")}</span>}>
                <TableHead className="text-center w-[160px] h-[34px] px-2 py-[5.5px]">
                  {t("table.transactions.tokens")}
                </TableHead>
              </Tooltip>
              <Tooltip placement="top" title={<span>{t("table.transactions.amount1.tip")}</span>}>
                <TableHead className="text-right w-[180px] h-[34px] px-2 py-[5.5px]">
                  {t("table.transactions.amount1")}
                </TableHead>
              </Tooltip>
              <Tooltip placement="top" title={<span>{t("table.transactions.amount2.tip")}</span>}>
                <TableHead className="text-right w-[180px] h-[34px] px-2 py-[5.5px]">
                  {t("table.transactions.amount2")}
                </TableHead>
              </Tooltip>
              <Tooltip placement="top" title={<span>{t("table.transactions.actions.tip")}</span>}>
                <TableHead className="text-center w-[80px] h-[34px] px-2 py-[5.5px]">
                  {t("common.actions")}
                </TableHead>
              </Tooltip>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(records || []).map((record, index) => (
              <TableRow
                key={record.id}
                className="stagger-item hover:bg-muted/30 transition-all duration-300 group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <TableCell className="text-left px-2 py-[5.5px] text-sm text-muted-foreground">
                  {timestampParser(record.time, "relative")}
                </TableCell>
                <TableCell className="text-center px-2 py-[5.5px]">
                  <Badge
                    variant="outline"
                    className={`${getTypeColor(record.type, record.symbol1)} font-medium`}
                  >
                    {getTypeLabel(record)}
                  </Badge>
                </TableCell>
                <TableCell className="text-center px-2 py-[5.5px]">
                  <Badge
                    variant="outline"
                    className="bg-gray-100 text-gray-800 border-gray-300 font-medium"
                  >
                    {formatTokenPair(
                      record.symbol1,
                      record.symbol2,
                      record.type,
                    )}
                  </Badge>
                </TableCell>
                <TableCell className="text-right px-2 py-[5.5px]">
                  {formatAmount(record.fromgoodQuanity, record.fromgoodActualQuanity, record.symbol1, record.type)}
                </TableCell>
                <TableCell className="text-right px-2 py-[5.5px]">
                  {formatAmount(record.togoodQuantity, record.togoodActualQuantity, record.symbol2, record.type)}
                </TableCell>
                <TableCell className="text-center px-2 py-[5.5px]">
                  <Button
                    aria-label={t("appUx.viewTransaction")}
                    onClick={() => window.open(`${record.hash}`, '_blank', 'noopener,noreferrer')}
                    size="sm"
                    className="h-7 px-2 text-xs bg-[#0fb981] hover:bg-[#22c55e] text-white border-0 shadow-sm transition-colors"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 移动端卡片布局 */}
      <div className="sm:hidden space-y-3">
        {records?.map((record, index) => (
          <Card key={record.id} className="stagger-item p-4 hover:shadow-md hover-lift transition-all duration-300" style={{ animationDelay: `${index * 0.1}s` }}>
            {/* 顶部：时间和操作按钮 */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-1">
                  {timestampParser(record.time, "relative")}
                </div>
                {/* 类型和代币对 */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`${getTypeColor(record.type, record.symbol1)} font-medium text-xs`}
                  >
                    {getTypeLabel(record)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-gray-100 text-gray-800 border-gray-300 font-medium text-xs"
                  >
                    {formatTokenPair(
                      record.symbol1,
                      record.symbol2,
                      record.type,
                    )}
                  </Badge>
                </div>
              </div>
              <Button
                aria-label={t("appUx.viewTransaction")}
                    onClick={() => window.open(`${record.hash}`, '_blank', 'noopener,noreferrer')}
                size="sm"
                className="h-7 px-2 text-xs bg-[#0fb981] hover:bg-[#22c55e] text-white border-0 shadow-sm btn-modern hover-glow transition-all duration-200 ml-2"
              >
                <Eye className="h-3 w-3" />
              </Button>
            </div>

            {/* 底部：数量信息 */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div>
                <div className="text-xs text-muted-foreground mb-1">代币1数量</div>
                <div className="text-right">
                  {formatAmount(record.fromgoodQuanity, record.fromgoodActualQuanity, record.symbol1, record.type, true)}
                </div>
              </div>
              {record.symbol2 && record.symbol2 !== "#" && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">代币2数量</div>
                  <div className="text-right">
                    {formatAmount(record.togoodQuantity, record.togoodActualQuantity, record.symbol2, record.type, true)}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}

        {records?.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            {t("common.noData")}
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <Spin
          spinning={spinning}
          indicator={<LoadingOutlined spin />}
          tip="Loading"
        // size="small"
        >
          <div />
        </Spin>
      </div>
      {/* 桌面端空状态 */}
      {records?.length === 0 && (
        <div className="hidden sm:block text-center py-12 text-gray-400 text-sm border rounded-lg">
          {t("common.noData")}
        </div>
      )}
      {hasMore && <div className="app-load-more"><button className="app-secondary" disabled={spinning} onClick={()=>setPagination(p=>({page_number:p.page_number+1}))}>{t("appUx.loadMore")}</button></div>}
    </div>
  );
}
