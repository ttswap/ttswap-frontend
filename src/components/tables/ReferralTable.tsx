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
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Users, TrendingUp } from "lucide-react";
import { formatAddress } from "@/utils/format";
import { Spin, Tooltip, message } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import useWallet from "@/hooks/useWallet";
import { useErrorMess } from '@/hooks/useErrorMess';

// 使用新的工具函数和常量
// import { TRANSACTION_TYPE_LABELS, COLORS } from "@/utils/constants";
// import type { Transaction } from "@/types";
import { prettifyCurrencys, prettifyCurrencysFee } from '@/services/graphql/util';
import { myRefereesDatas } from '@/services/graphql/account';
import { useTranslation } from 'react-i18next';
import { useValueGood } from "@/stores/valueGood";
import { useLocalStorage } from "@/utils/LocalStorageManager";
import { timestampParser } from "@/utils/timestamp-parser";
import { GRK_SIZES } from "@/types/common";

interface ReferralData {
  id: string;
  disinvestValue: number;
  investValue: number;
  totalprofitvalue: number;
  lastoptime: number;
  link: string;
  tradeValue: number;
  valueSymbol: string;
}

interface ReferralTableProps {
  wallet_address?: string;
}

export function ReferralTable({ wallet_address }: ReferralTableProps) {
  const { t } = useTranslation();




  const [maybeResult, setResult] = useState<ReferralData[]>(null);
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



  useEffect(() => {setPagination({page_number:1});setResult([]);setHasMore(false);setError({error:false,error_message:""});},[ssionChian, info.id, wallet_address]);
  useEffect(() => {
    let active=true;
    if (!info.id || !wallet_address) { settableSpinning(true); return; }
    settableSpinning(true);setError({error:false,error_message:""});
    (async()=>{try{const response:any=await myRefereesDatas({id: info.id, address: wallet_address,pageNumber:pagination.page_number-1,pageSize:page_size},ssionChian);if(!active)return;
      setHasMore(response.pagination.has_more);setTotalValue(response.totalValue);setCollectIds(response.ids);
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


  if (error.error) return <PageState kind="error" onRetry={()=>setRetryVersion(v=>v+1)}/>;
  if (tableSpinning && !maybeResult?.length) return <PageState kind="loading"/>;
  if (maybeResult?.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 transition-transform duration-200 hover:scale-110" />
        <h3 className="mb-2 transition-colors duration-200 hover:text-[#0fb981]">{t("common.noData")}</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto transition-colors duration-200 hover:text-gray-600">
        {t("account.tabs.referees.table.tip")}
        </p>
        {/* <Button
          className="bg-[#0fb981] hover:bg-[#22c55e] text-white border-0 shadow-sm btn-modern hover-glow transition-all duration-300"
          onClick={() => {
            // 这里可以添加分享推荐链接的逻辑
            console.log("分享推荐链接");
          }}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          分享推荐链接
        </Button> */}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 统计概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stagger-item bg-gradient-to-r from-[#0fb981]/10 to-[#22c55e]/10 rounded-lg p-4 border border-[#0fb981]/20 hover-lift transition-all duration-300">
          <div className="mb-2">
            <span className="text-sm text-muted-foreground transition-colors duration-200 hover:text-gray-600">
            {t("account.tabs.referees.label1")}
            </span>
          </div>
          <div className="text-2xl font-semibold text-[#0fb981] transition-transform duration-200 hover:scale-105">
            {maybeResult?.length}
          </div>
        </div>

        <div className="stagger-item bg-blue-50 rounded-lg p-4 border border-blue-200 hover-lift transition-all duration-300">
          <div className="mb-2">
            <span className="text-sm text-muted-foreground transition-colors duration-200 hover:text-gray-600">
            {t("account.tabs.referees.label2")}
            </span>
          </div>
          <div className="text-2xl font-semibold text-blue-600 transition-transform duration-200 hover:scale-105 flex justify-between items-center">
            {prettifyCurrencys(
              maybeResult?.reduce(
                (sum, item) => sum + item.tradeValue,
                0,
              ),
            )}
              <span className="text-base sm:text-lg">{info.symbol}</span>
          </div>
        </div>

        <div className="stagger-item bg-purple-50 rounded-lg p-4 border border-purple-200 hover-lift transition-all duration-300">
          <div className="mb-2">
            <span className="text-sm text-muted-foreground transition-colors duration-200 hover:text-gray-600">
            {t("account.tabs.referees.label3")}
            </span>
          </div>
          <div className="text-2xl font-semibold text-purple-600 transition-transform duration-200 hover:scale-105 flex justify-between items-center">
            {prettifyCurrencys(
              maybeResult?.reduce(
                (sum, item) => sum + item.investValue,
                0,
              ),
            )}
              <span className="text-base sm:text-lg">{info.symbol}</span>
          </div>
        </div>
      </div>

      {/* 桌面端被推荐人表格 */}
      <div className="hidden sm:block border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-center w-[200px] h-[34px] px-2 py-[5.5px]">{t("account.tabs.referees.address")}</TableHead>
              <TableHead className="text-center h-[34px] px-2 py-[5.5px]">
              {t("account.tabs.referees.trade")}
              </TableHead>
              <TableHead className="text-center h-[34px] px-2 py-[5.5px]">
              {t("account.tabs.referees.invest")}
              </TableHead>
              <TableHead className="text-center h-[34px] px-2 py-[5.5px]">
              {t("account.tabs.referees.divest")}
              </TableHead>
              <TableHead className="text-center h-[34px] px-2 py-[5.5px]">
              {t("account.tabs.referees.income")}
              </TableHead>
              <TableHead className="text-center h-[34px] px-2 py-[5.5px]">
              {t("account.tabs.referees.time")}
              </TableHead>
              <TableHead className="text-center w-[80px] h-[34px] px-2 py-[5.5px]">
                {t("common.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {maybeResult?.map((item, index) => (
              <TableRow
                key={item.id}
                className="stagger-item hover:bg-muted/30 transition-all duration-300 group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <TableCell className="text-center align-middle px-2 py-[5.5px]">
                  <span className="font-mono text-sm">
                    {formatAddress(item.id)}
                  </span>
                </TableCell>
                <TableCell className="text-center font-medium px-2 py-[5.5px]">
                  {prettifyCurrencys(item.tradeValue)}{" "}{item.valueSymbol}
                </TableCell>
                <TableCell className="text-center font-medium px-2 py-[5.5px]">
                  {prettifyCurrencys(item.investValue)}{" "}{item.valueSymbol}
                </TableCell>
                <TableCell className="text-center font-medium px-2 py-[5.5px]">
                  {prettifyCurrencys(item.disinvestValue)}{" "}{item.valueSymbol}
                </TableCell>
                <TableCell className="text-center px-2 py-[5.5px]">
                  <span
                    className={`font-medium ${item.totalprofitvalue > 0
                      ? "text-[#0fb981]"
                      : item.totalprofitvalue < 0
                        ? "text-red-500"
                        : "text-muted-foreground"
                      }`}
                  >
                    {prettifyCurrencys(item.totalprofitvalue)}{" "}{item.valueSymbol}
                  </span>
                </TableCell>
                <TableCell className="text-center text-[12px] text-gray-400 px-2 py-[5.5px]">
                  {timestampParser(item.lastoptime, "relative")}
                </TableCell>
                <TableCell className="text-center align-middle px-2 py-[5.5px]">
                  <Button
                    size="sm"
                    className="h-[1.66rem] px-3 text-xs bg-[#0fb981] hover:bg-[#22c55e] text-white border-0 shadow-sm flex items-center justify-between"
                    onClick={() =>
                      window.open(item.link, '_blank')
                    }
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    link
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 移动端卡片布局 */}
      <div className="sm:hidden space-y-3">
        {maybeResult?.map((item) => (
          <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
            {/* 顶部：地址和操作按钮 */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="font-mono text-base font-medium">
                  {formatAddress(item.id)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                {t("account.tabs.referees.time")}：{item.lastoptime}
                </div>
              </div>
              <Button
                size="sm"
                className="h-8 px-3 text-xs bg-[#0fb981] hover:bg-[#22c55e] text-white border-0 shadow-sm"
                onClick={() =>
                  window.open(item.link, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                link
              </Button>
            </div>

            {/* 数据网格 */}
            <div className="grid grid-cols-2 gap-3 text-sm pt-3 border-t border-gray-100">
              <div>
                <div className="text-muted-foreground mb-1"> {t("account.tabs.referees.trade")}</div>
                <div className="font-medium">{prettifyCurrencys(item.tradeValue)}{" "}{item.valueSymbol}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1"> {t("account.tabs.referees.invest")}</div>
                <div className="font-medium">{prettifyCurrencys(item.investValue)}{" "}{item.valueSymbol}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1"> {t("account.tabs.referees.divest")}</div>
                <div className="font-medium">{prettifyCurrencys(item.disinvestValue)}{" "}{item.valueSymbol}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1"> {t("account.tabs.referees.income")}</div>
                <div
                  className={`font-medium ${item.totalprofitvalue > 0
                    ? "text-[#0fb981]"
                    : item.totalprofitvalue < 0
                      ? "text-red-500"
                      : "text-muted-foreground"
                    }`}
                >
                  {prettifyCurrencys(item.totalprofitvalue)}{" "}{item.valueSymbol}
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
      <div className="bg-muted/30 rounded-lg p-4 text-[12px] text-gray-400">
        <div className="flex items-start gap-2">
          <Users className="h-4 w-4 mt-0.5 text-[#0fb981]" />
          <div>
            <p className="mb-2">
              <strong>{t("account.tabs.referees.Instructions")}</strong>
            </p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>{t("account.tabs.referees.Instructions.label1")}</li>
              <li>{t("account.tabs.referees.Instructions.label2")}</li>
              <li>{t("account.tabs.referees.Instructions.label3")}</li>
              <li>{t("account.tabs.referees.Instructions.label4")}</li>
              <li>{t("account.tabs.referees.Instructions.label5")}</li>
            </ul>
          </div>
        </div>
      </div>
      {hasMore && <div className="app-load-more"><button className="app-secondary" disabled={tableSpinning} onClick={()=>setPagination(p=>({page_number:p.page_number+1}))}>{t("appUx.loadMore")}</button></div>}
    </div>
  );
}
