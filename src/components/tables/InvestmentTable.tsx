import { PageState } from "@/components/common/PageState";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spin, Tooltip, message } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

// 使用新的工具函数和常量
import { formatPercentage } from "@/utils/format";
import { TokenIcon } from "../common/TokenIcon";
import { useTranslation } from 'react-i18next';
import { myInvestGoodsDatas } from '@/services/graphql/account';
import { prettifyCurrencys, prettifyCurrencysFee } from '@/services/graphql/util';
import { useValueGood } from "@/stores/valueGood";
import { useLocalStorage } from "@/utils/LocalStorageManager";
import { type TokenV2Volume } from "@/types/XykServiceTypes";
import { GRK_SIZES } from "@/types/common";

interface InvestmentTableProps {
  wallet_address: string;
  onWithdrawClick?: (id: string) => void;
  onTokenClick?: (token: string) => void;
}

export function InvestmentTable({
  wallet_address,
  onWithdrawClick,
  onTokenClick,
}: InvestmentTableProps) {


  const { t } = useTranslation();

  const [spinning, setSpinning] = useState(false);
  const [pagination, setPagination] = useState({
    page_number: 1,
  });
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [maybeResult, setResult] = useState<TokenV2Volume[] | null>(null);
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
  useEffect(() => {setPagination({page_number:1});setResult([]);setHasMore(false);setError({error:false,error_message:""});},[ssionChian, info.id, wallet_address]);
  useEffect(() => {
    let active=true;
    if (!info.id || !wallet_address) { setSpinning(true); return; }
    setSpinning(true);setError({error:false,error_message:""});
    (async()=>{try{const response:any=await myInvestGoodsDatas({id: info.id, address: wallet_address,pageNumber:pagination.page_number-1,pageSize:page_size},ssionChian);if(!active)return;
      setHasMore(response.pagination.has_more);
      setResult(prev=>pagination.page_number===1 ? response.items || [] : [...(prev || []),...(response.items || [])]);
    }catch{if(active)setError({error:true,error_message:""});}finally{if(active)setSpinning(false);}})();
    return()=>{active=false;};
  },[ssionChian, info.id, wallet_address,pagination.page_number,retryVersion]);


  const getReturnColor = (returnPercent: number) => {
    if (returnPercent > 0) return "text-green-600";
    if (returnPercent < 0) return "text-red-600";
    return "text-gray-600";
  };


  // 计算每个投资序号的行数和第一次出现的索引
  const getInvestmentNumberSpans = () => {
    const spans: {
      [key: number]: { rowSpan: number; isFirst: boolean };
    } = {};
    const numberCounts: { [key: number]: number } = {};
    const firstOccurrence: { [key: number]: number } = {};

    // 计算每个投资序号的出现次数和第一次出现的位置
    maybeResult?.forEach((item, index) => {
      if (!numberCounts[item.id]) {
        numberCounts[item.id] = 0;
        firstOccurrence[item.id] = index;
      }
      numberCounts[item.id]++;
    });

    // 为每行计算spans信息
    maybeResult?.forEach((item, index) => {
      spans[index] = {
        rowSpan: numberCounts[item.id],
        isFirst:
          firstOccurrence[item.id] === index,
      };
    });

    return spans;
  };

  const investmentSpans = getInvestmentNumberSpans();

  // 处理代币行点击
  const handleTokenRowClick = (item: TokenV2Volume, event: React.MouseEvent) => {
    // 阻止撤资按钮的点击事件冒泡
    if ((event.target as HTMLElement).closest('button')) {
      return;
    }
    if(!item.islockgood){
      onTokenClick?.(item.address);
    }
  };

  if (error.error) return <PageState kind="error" onRetry={()=>setRetryVersion(v=>v+1)}/>;
  if (spinning && !maybeResult?.length) return <PageState kind="loading"/>;
  return (
    <div>
      {/* 桌面端表格 */}
      <div className="hidden sm:block rounded-md border overflow-hidden animate-fade-in">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-center w-[80px] h-[34px] px-2 py-[5.5px]">
                {t("common.table.id")}
              </TableHead>
              <TableHead className="text-center w-[200px] h-[34px] px-2 py-[5.5px]">
                {t("account.tabs.proof.name")}
              </TableHead>
              <TableHead className="text-right w-[120px] h-[34px] px-2 py-[5.5px]">
                {t("account.tabs.proof.investShares")}
              </TableHead>
              <TableHead className="text-right w-[140px] h-[34px] px-2 py-[5.5px]">
                {t("account.tabs.proof.value")}
              </TableHead>
              <TableHead className="text-right w-[180px] h-[34px] px-2 py-[5.5px]">
                {t("account.tabs.proof.quanity")}
              </TableHead>
              <TableHead className="text-right w-[180px] h-[34px] px-2 py-[5.5px]">
                {t("account.tabs.proof.NAVPS")}
              </TableHead>
              <TableHead className="text-right w-[140px] h-[34px] px-2 py-[5.5px]">
                {t("account.tabs.proof.profit")}
              </TableHead>
              <TableHead className="text-center w-[140px] h-[34px] px-2 py-[5.5px]">
                {t("common.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {maybeResult?.map((item, index) => (
              <TableRow
                key={`${item.id}-${index}`}
                className="stagger-item hover:bg-muted/30 hover:shadow-md hover:border-[#0fb981]/20 transition-all duration-300 cursor-pointer group"
                onClick={(e) => handleTokenRowClick(item, e)}
              >
                {/* {investmentSpans[index].isFirst && ( */}
                <TableCell
                  className="text-center align-middle px-2 py-[5.5px]"
                // rowSpan={investmentSpans[index].rowSpan}
                >
                  <div className="font-medium">
                    {index + 1}
                  </div>
                </TableCell>
                {/* )} */}
                <TableCell className="text-left px-2 py-[5.5px]">
                  <div className="flex items-center gap-3">
                    <TokenIcon
                      isValueToken={item.isvaluegood}
                      icon={item.logo_url}
                      color=""
                      size={GRK_SIZES.EXTRA_SMALL}
                      showPulse={item.isvaluegood}
                    />
                    <div className="flex flex-col items-start gap-0.5">
                      <div className="font-medium text-black/80">
                        {item.symbol}
                      </div>
                      <div className="text-gray-500 text-xs opacity-80">
                        {item.name}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="text-right font-medium px-2 py-[5.5px] transition-colors duration-200 group-hover:text-[#0fb981]">
                  {prettifyCurrencys(item.investShares)}
                </TableCell>
                <TableCell className="text-right px-2 py-[5.5px]">
                  <div className="font-medium transition-colors duration-200 group-hover:text-[#0fb981]">
                    {prettifyCurrencys(item.totalInvestValue)}
                  </div>
                  <div className="text-[11px] text-gray-400 transition-colors duration-200 group-hover:text-gray-600">
                    {item.valueSymbol}
                  </div>
                </TableCell>
                <TableCell className="text-right px-2 py-[5.5px]">
                  <div className="font-medium font-mono transition-colors duration-200 group-hover:text-[#0fb981]">
                    {prettifyCurrencys(item.investQuantity)}
                  </div>
                  <div className="text-[11px] text-gray-400 font-mono transition-colors duration-200 group-hover:text-gray-600">
                    {prettifyCurrencys(item.investActualQuantity)}
                  </div>
                </TableCell>
                <TableCell className="text-right px-2 py-[5.5px]">
                  <div className="font-medium font-mono transition-colors duration-200 group-hover:text-[#0fb981]">
                    {prettifyCurrencysFee(item.NAVPS)}
                  </div>
                  <div className="text-[11px] text-gray-400 font-mono transition-colors duration-200 group-hover:text-gray-600">
                    {prettifyCurrencysFee(item.allNAVPS)}
                  </div>
                </TableCell>
                <TableCell className="text-right px-2 py-[5.5px]">
                  <div
                    className={`transition-all duration-200 ${getReturnColor(
                      item.earningRate,
                    )}`}
                  >
                    <div className="font-medium transition-transform duration-200 hover:scale-105">
                      {prettifyCurrencysFee(item.profit)}
                    </div>
                    <div className="text-sm transition-transform duration-200 hover:scale-105">
                      {formatPercentage(item.earningRate, 2, true)}
                    </div>
                  </div>
                </TableCell>
                {investmentSpans[index].isFirst && (
                  <TableCell
                    className="text-center align-middle px-2 py-[5.5px]"
                    rowSpan={investmentSpans[index].rowSpan}
                    style={{ verticalAlign: "middle" }}
                  >
                    <div className="flex items-center justify-center h-full">
                      <Button
                        size="sm"
                        className="investment-action-btn h-[1.66rem] px-3 text-xs bg-[#0fb981] hover:bg-[#22c55e] text-white border-0 shadow-sm flex items-center justify-between btn-modern hover-glow transition-all duration-200 hover:scale-105"
                        onClick={() =>
                          onWithdrawClick(item.id)
                        }
                        disabled={item.islockgood}
                      >
                        {t("common.divest")}
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 移动端卡片布局 */}
      <div className="sm:hidden space-y-4 animate-fade-in">
        {/* 按投资序号分组显示 */}
        {(() => {
          const groups: { [key: string]: TokenV2Volume[] } = {};
          if (maybeResult && maybeResult.length > 0) {
            maybeResult.forEach((item, index) => {
              const groupId = String(item.id); // 使用 item.id 作为组ID
              if (!groups[groupId]) {
                groups[groupId] = [];
              }
              groups[groupId].push(item);
            });
          }
          { console.log("---maybeResult", maybeResult, "---groups", groups) }
          return Object.entries(groups).map(
            ([id, items]) => (
              <div
                key={id}
                className="stagger-item border rounded-lg p-4 bg-white hover-lift transition-all duration-300"
              >
                {/* 代币列表 */}
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={`${item.id}-${index}`}
                      className="border border-gray-100 rounded-lg p-3 hover:shadow-md hover:border-[#0fb981]/20 hover-scale transition-all duration-300 cursor-pointer group"
                      onClick={(e) => handleTokenRowClick(item, e)}
                    >
                      {/* 代币信息和收益区域 */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <TokenIcon
                            isValueToken={item.isvaluegood}
                            icon={item.logo_url}
                            color=""
                            size={GRK_SIZES.EXTRA_SMALL}
                            showPulse={item.isvaluegood}
                          />
                          <div>
                            <div className="font-medium text-base">
                              {item.symbol}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {item.name}
                            </div>
                          </div>
                        </div>

                        {/* 收益信息 */}
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground mb-1">
                            {t("account.tabs.proof.profit")}
                          </div>
                          <div
                            className={`font-medium text-sm ${getReturnColor(item.earningRate)}`}
                          >
                            <div>
                              {prettifyCurrencysFee(item.profit)}
                            </div>
                            <div className="text-xs">
                              {formatPercentage(item.earningRate, 2, true)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 数据网格 */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-muted-foreground mb-1">
                            {t("account.tabs.proof.investShares")}
                          </div>
                          <div className="font-medium">
                            {prettifyCurrencys(item.investShares)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">
                            {t("account.tabs.proof.value")}
                          </div>
                          <div className="font-medium">
                            {prettifyCurrencys(item.totalInvestValue)}
                            <span className="text-xs text-muted-foreground ml-1">
                              {item.valueSymbol}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">
                            {t("account.tabs.proof.quanity")}
                          </div>
                          <div className="font-medium font-mono text-xs">
                            {prettifyCurrencys(item.investQuantity)}
                            <span className="text-muted-foreground ml-1">
                              /{" "}
                              {prettifyCurrencys(item.investActualQuantity)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">
                            {t("account.tabs.proof.NAVPS")}
                          </div>
                          <div className="font-medium font-mono text-xs">
                            {prettifyCurrencysFee(item.NAVPS)}
                            <span className="text-muted-foreground ml-1">
                              /{" "}
                              {prettifyCurrencysFee(item.allNAVPS)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>{" "}
                {/* 投资序号标题 */}
                <div className="flex items-center justify-end mt-2 mb-1">
                  <Button
                    size="sm"
                    className="h-8 px-3 text-xs bg-[#0fb981] hover:bg-[#22c55e] text-white border-0"
                    onClick={() =>
                      onWithdrawClick(id)
                    }
                    disabled={!items[0].islockgood}
                  >
                    {t("common.divest")}
                  </Button>
                </div>
              </div>
            ),
          );
        })()}
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
      {hasMore && <div className="app-load-more"><button className="app-secondary" disabled={spinning} onClick={()=>setPagination(p=>({page_number:p.page_number+1}))}>{t("appUx.loadMore")}</button></div>}
    </div>
  );
}
