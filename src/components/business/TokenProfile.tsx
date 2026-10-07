import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Copy,
  Check,
  Globe,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  XOutlined,
  GithubOutlined,
  LinkOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { Tooltip } from "antd";
import { TransactionRecords } from "../tables/TransactionRecords";
import * as echarts from "echarts";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import TokenSwap from "@/components/trade/trade";
import { useValueGood } from "@/stores/valueGood";
import { useLocalStorage } from "@/utils/LocalStorageManager";
import {
  prettifyCurrencys,
  calculateFeePercentage,
  prettifyCurrencysFee,
} from "@/services/graphql/util";
import { getLpTokenView, GoodKLineData } from "@/services/graphql/goods";
import { TokenAvatar } from "../common/TokenAvatar";
import { TokenIcon } from "../common/TokenIcon";
import { GRK_SIZES } from "@/types/common";
import { getChainName } from "@/data/networks";
import { useValueCionLogo } from "@/hooks/useValueCionLogo";
import { TokenStatsGrid } from "./TokenStatsGrid";

interface TokenProfileData {
  id: string;
  name: string;
  decimals: number;
  symbol: string;
  vlogo_url: string;
  logo_url: string;
  exp_url: string;
  tokenInfo: string;
  address: string;
  valueSymbol: string;
  price: number;
  NAVPS: number;
  APY: number;
  price_24h: number;
  currentQuantity: number;
  currentValue: number;
  investQuantity: number;
  investValue: number;
  currentFee: number;
  currentFeeValue: number;
  tradeQuantity24: number;
  tradeValue24: number;
  fee24: number;
  feeValue24: number;
  investQuantity24: number;
  investValue24: number;
  totalInvestQuantity: number;
  totalInvestValue: number;
  totalTradeQuantity: number;
  totalTradeValue: number;
  totalDisinvestQuantity: number;
  totalDisinvestValue: number;
  totalTradeCount: number;
  totalInvestCount: number;
  owner: string;
  isvaluegood: boolean;
  buyFee: number;
  sellFee: number;
  investFee: number;
  divestFee: number;
  investM: number;
  divestChips: number;
  investor: number;
  operator: number;
  portal: number;
  referrer: number;
  user: number;
  protocol: number;
  maxLiquidity: number;
}

interface TokenProfileProps {
  handleBack: () => void;
  tokenId?: string;
}

const emptyToken: TokenProfileData = {
  id: "",
  name: "",
  decimals: 0,
  symbol: "",
  logo_url: "",
  vlogo_url: "",
  exp_url: "",
  address: "",
  valueSymbol: "",
  price: 0,
  NAVPS: 0,
  APY: 0,
  price_24h: 0,
  tokenInfo: "",
  currentQuantity: 0,
  currentValue: 0,
  investQuantity: 0,
  investValue: 0,
  currentFee: 0,
  currentFeeValue: 0,
  tradeQuantity24: 0,
  tradeValue24: 0,
  fee24: 0,
  feeValue24: 0,
  investQuantity24: 0,
  investValue24: 0,
  totalInvestQuantity: 0,
  totalInvestValue: 0,
  totalTradeQuantity: 0,
  totalTradeValue: 0,
  totalDisinvestQuantity: 0,
  totalDisinvestValue: 0,
  totalTradeCount: 0,
  totalInvestCount: 0,
  owner: "",
  isvaluegood: false,
  buyFee: 0,
  sellFee: 0,
  investFee: 0,
  divestFee: 0,
  investM: 0,
  divestChips: 0,
  investor: 0,
  operator: 0,
  portal: 0,
  referrer: 0,
  user: 0,
  protocol: 0,
  maxLiquidity: 0,
};

const linkBtn =
  "h-9 w-9 rounded-xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 hover:text-zinc-900 transition-colors";

export function TokenProfile({ handleBack, tokenId }: TokenProfileProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const { t } = useTranslation();
  const { info } = useValueGood();
  const { ssionChian } = useLocalStorage();
  const tokenLogo = useValueCionLogo(info);
  const chainName = getChainName(ssionChian);

  const [tokenDataState, setTokenDataState] =
    useState<TokenProfileData>(emptyToken);
  const [jsonData, setJsonData] = useState<any>(null);
  const [h24KLineData, setH24KLineData] = useState<any>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [copied, setCopied] = useState(false);
  const dataRequest = useRef(0);
  const [chartStatus,setChartStatus] = useState("loading");
  const [fetchId, setFetchId] = useState(0);

  const load = useCallback(async () => {
    if (!tokenId || info.id === "") return;
    const request = ++dataRequest.current;
    setStatus("loading");
    setTokenDataState(emptyToken);
    setJsonData(null);
    try {
      const response: any = await getLpTokenView(info.id, tokenId, ssionChian);
      if (request !== dataRequest.current) return;
      const item = response.items[0];
      if (!item) throw new Error("Asset not found");
      setTokenDataState(item);
      setStatus("ready");
      const infoUrl = item?.tokenInfo;
      if (infoUrl) {
        try {
          const json = await (await fetch(infoUrl)).json();
          if (request === dataRequest.current) setJsonData(json);
        } catch {
          if (request === dataRequest.current) setJsonData(null);
        }
      } else {
        setJsonData(null);
      }
    } catch {
      if (request === dataRequest.current) setStatus("error");
    }
  }, [tokenId, info.id, ssionChian, fetchId]);

  useEffect(() => {
    load();
    return () => { dataRequest.current++; };
  }, [load]);

  useEffect(() => {
    if (!tokenId || info.id === "") return;
    let active = true;
    setH24KLineData([]);
    setChartStatus("loading");
    (async () => {
      try {
        const a: any = await GoodKLineData(
          { id: info.id, sel: tokenId },
          ssionChian
        );
        if (active) { setH24KLineData(a); setChartStatus("ready"); }
      } catch {
        if (active) { setH24KLineData([]); setChartStatus("error"); }
      }
    })();
    return () => { active = false; };
  }, [tokenId, info.id, ssionChian,fetchId]);

  const formatPercent = (value: number) => `${value}%`;
  const formatPercents = (value: number) => `${value}‱`;

  const openUrl = (url?: string) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const tokenLinks = () => {
    const links: { key: string; title: string; url?: string; icon: ReactNode }[] =
      [
        {
          key: "explorer",
          title: chainName || "Explorer",
          url: tokenDataState?.exp_url,
          icon: <LinkOutlined />,
        },
        {
          key: "website",
          title: t("appUx.website"),
          url: jsonData?.website,
          icon: <Globe className="h-4 w-4" strokeWidth={1.5} />,
        },
      ];

    (jsonData?.links || []).forEach((link: any, i: number) => {
      if (link?.name === "x") {
        links.push({
          key: `x-${i}`,
          title: "X",
          url: link?.url,
          icon: <XOutlined />,
        });
      } else if (link?.name === "github") {
        links.push({
          key: `gh-${i}`,
          title: "GitHub",
          url: link?.url,
          icon: <GithubOutlined />,
        });
      } else if (link?.name === "whitepaper") {
        links.push({
          key: `wp-${i}`,
          title: t("appUx.whitepaper"),
          url: link?.url,
          icon: <FilePdfOutlined />,
        });
      }
    });

    return links
      .filter((l) => l.url)
      .map((l) => (
        <button
          key={l.key}
          type="button"
          onClick={() => openUrl(l.url)}
          className={linkBtn}
          title={l.title}
          aria-label={l.title}
        >
          {l.icon}
        </button>
      ));
  };

  const quoteIcon = () => (
    <span className="inline-flex items-center">
      <span className="w-[14.7px] h-[14.7px] rounded-full overflow-hidden bg-[#26a17b] flex items-center justify-center">
        <TokenAvatar token_url={tokenLogo} size={GRK_SIZES.SMALL} />
      </span>
    </span>
  );

  const handleCopyAddress = async (value: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = value;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.setAttribute("readonly", "");
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const formatAddress = (address: string) => {
    if (!address || address.length <= 10) return address || "-";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  useEffect(() => {
    if (!chartRef.current) return;

    try {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }

      const container = chartRef.current;
      if (container.clientWidth === 0 || container.clientHeight === 0) {
        const timer = window.setTimeout(() => {
          if (chartRef.current && chartRef.current.clientWidth > 0) {
            chartInstance.current = echarts.init(chartRef.current);
          }
        }, 100);
        return () => window.clearTimeout(timer);
      }

      chartInstance.current = echarts.init(chartRef.current);

      const dates = h24KLineData?.map((item: any) => item[0]);
      const ohlcData = h24KLineData?.map((item: any) => [
        item[1],
        item[2],
        item[3],
        item[4],
      ]);
      const volumeData = h24KLineData?.map((item: any) => item[5]);

      const option = {
        backgroundColor: "transparent",
        grid: [
          { left: "10%", right: "8%", height: "50%" },
          { left: "10%", right: "8%", top: "70%", height: "16%" },
        ],
        xAxis: [
          {
            type: "category",
            data: dates,
            boundaryGap: false,
            axisLine: { onZero: false },
            splitLine: { show: false },
            min: "dataMin",
            max: "dataMax",
            axisPointer: { z: 100 },
          },
          {
            type: "category",
            gridIndex: 1,
            data: dates,
            boundaryGap: false,
            axisLine: { onZero: false },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            min: "dataMin",
            max: "dataMax",
          },
        ],
        yAxis: [
          { scale: true, splitArea: { show: true } },
          {
            scale: true,
            gridIndex: 1,
            splitNumber: 2,
            axisLabel: { show: false },
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { show: false },
          },
        ],
        dataZoom: [
          { type: "inside", xAxisIndex: [0, 1], start: 90, end: 100 },
          {
            show: true,
            xAxisIndex: [0, 1],
            type: "slider",
            top: "85%",
            start: 10,
            end: 100,
            backgroundColor: "#f4f4f5",
            borderColor: "#e4e4e7",
            handleStyle: { color: "#0fb981", borderColor: "#0fb981" },
            textStyle: { color: "#52525b" },
          },
        ],
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "cross" },
          backgroundColor: "#fff",
          borderWidth: 1,
          borderColor: "#e4e4e7",
          padding: 10,
          textStyle: { color: "#18181b" },
          formatter: function (params: any) {
            const candlestickParam = params.find(
              (p: any) => p.seriesName === "Kline"
            );
            const volumeParam = params.find(
              (p: any) => p.seriesName === "volume"
            );
            let html = `<div style="margin-bottom: 8px; font-weight: 600;">${params[0].axisValue}</div>`;
            if (candlestickParam) {
              const data = candlestickParam.data;
              html += `
              <div>${t("token.k.open")}: ${data[1].toFixed(6)} ${info.symbol}</div>
              <div>${t("token.k.close")}: ${data[2].toFixed(6)} ${info.symbol}</div>
              <div>${t("token.k.low")}: ${data[3].toFixed(6)} ${info.symbol}</div>
              <div>${t("token.k.high")}: ${data[4].toFixed(6)} ${info.symbol}</div>
            `;
            }
            if (volumeParam) {
              html += `<div>${t("token.k.volume")}: ${volumeParam.data.toFixed(2)}</div>`;
            }
            return html;
          },
        },
        series: [
          {
            name: "Kline",
            type: "candlestick",
            data: ohlcData,
            itemStyle: {
              color: "#0fb981",
              color0: "#b91c1c",
              borderColor: "#0fb981",
              borderColor0: "#b91c1c",
            },
            markPoint: {
              label: {
                formatter: function (param: any) {
                  return param != null ? Math.round(param.value) + "" : "";
                },
              },
              data: [
                { name: "maxValue", type: "max", valueDim: "highest" },
                { name: "minValue", type: "min", valueDim: "lowest" },
              ],
            },
          },
          {
            name: "volume",
            type: "bar",
            xAxisIndex: 1,
            yAxisIndex: 1,
            data: volumeData,
            itemStyle: {
              color: function (params: any) {
                const candleData = ohlcData[params.dataIndex];
                return candleData[1] > candleData[0] ? "#0fb981" : "#b91c1c";
              },
              opacity: 0.6,
            },
          },
        ],
      };

      chartInstance.current.setOption(option);

      const handleResize = () => chartInstance.current?.resize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    } catch {
      // chart init is best-effort; empty state is shown below
    }
  }, [h24KLineData, info.symbol, t]);

  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  const qtyPair = (qty: number, value: number) => ({
    value: status === "ready" ? prettifyCurrencys(qty) : "-",
    subValue: (
      <>
        {status === "ready" ? prettifyCurrencys(value) : "-"}
        {quoteIcon()}
      </>
    ),
  });

  const up = (tokenDataState?.price_24h ?? 0) >= 0;
  const loading = status === "loading";

  return (
    <div className="app-token-detail">
      <div className="flex items-center justify-between gap-3 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          aria-label={t("token.back")}
          className="h-9 rounded-xl border-[#0fb981] text-[#0d9a6e] hover:bg-[#0fb981]/10 hover:text-[#0d9a6e]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          <span className="hidden sm:inline">{t("token.back")}</span>
        </Button>
        <p className="text-sm font-medium text-zinc-900 truncate min-w-0">
          {tokenDataState?.name || t("common.loading")} {t("token.detail")}
        </p>
      </div>

      {status === "error" && (
        <div
          role="alert"
          className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800"
        >
          <p className="flex-1">{t("common.error")}</p>
          <Button
            size="sm"
            className="h-9 rounded-xl bg-[#0fb981] hover:bg-[#0d9a6e] text-white border-0 self-start"
            onClick={() => setFetchId((n) => n + 1)}
          >
            {t("common.retry")}
          </Button>
        </div>
      )}

      {status !== "error" && <div className="space-y-6">
        <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start sm:items-center gap-4">
            <TokenIcon
              isValueToken={tokenDataState?.isvaluegood}
              icon={tokenDataState?.logo_url}
              color=""
              size={GRK_SIZES.MEDIUM}
              showPulse={tokenDataState?.isvaluegood}
            />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-lg text-zinc-900 truncate">
                {loading ? "-" : tokenDataState?.symbol}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-0.5">
                <span className="text-sm text-zinc-600 truncate">
                  {tokenDataState?.name}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="font-mono text-xs text-zinc-600">
                    {formatAddress(tokenDataState?.address)}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={loading || !tokenDataState?.address}
                    onClick={() => handleCopyAddress(tokenDataState?.address)}
                    className="h-8 w-8 p-0 rounded-lg text-zinc-500 hover:bg-[#0fb981]/10 hover:text-[#0d9a6e]"
                    aria-label={copied ? t("common.copied") : t("common.copy")}
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
                    ) : (
                      <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
                    )}
                  </Button>
                </span>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-1.5 shrink-0">
              {tokenLinks()}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-5 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <Tooltip
              placement="top"
              title={<span>{t("token.level1.price.tip")}</span>}
            >
              <div>
                <div className="text-xs text-zinc-600 mb-1">
                  {t("token.level1.price")}
                </div>
                <div className="font-mono tabular-nums text-xl sm:text-2xl font-semibold text-zinc-900 flex items-center gap-2">
                  {loading ? "-" : prettifyCurrencys(tokenDataState?.price)}
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden bg-[#26a17b] flex items-center justify-center shrink-0">
                    <TokenAvatar token_url={tokenLogo} size={GRK_SIZES.SMALL} />
                  </span>
                </div>
              </div>
            </Tooltip>
            <Tooltip
              placement="top"
              title={<span>{t("token.level1.24h.tip")}</span>}
            >
              <div>
                <div className="text-xs text-zinc-600 mb-1">
                  {t("token.level1.24h")}
                </div>
                <div
                  className={`font-mono tabular-nums text-xl sm:text-2xl font-semibold flex items-center gap-1 ${
                    up ? "text-[#0d9a6e]" : "text-red-700"
                  }`}
                >
                  {up ? (
                    <TrendingUp className="h-4 w-4" strokeWidth={1.5} />
                  ) : (
                    <TrendingDown className="h-4 w-4" strokeWidth={1.5} />
                  )}
                  {loading ? "-" : calculateFeePercentage(tokenDataState?.price_24h)}
                </div>
              </div>
            </Tooltip>
            <Tooltip
              placement="top"
              title={<span>{t("token.level1.NAVPS.tip")}</span>}
            >
              <div>
                <div className="text-xs text-zinc-600 mb-1">
                  {t("token.level1.NAVPS")}
                </div>
                <div className="font-mono tabular-nums text-xl sm:text-2xl font-semibold text-zinc-900">
                  {loading ? "-" : prettifyCurrencysFee(tokenDataState?.NAVPS)}
                </div>
              </div>
            </Tooltip>
            <Tooltip
              placement="top"
              title={<span>{t("token.level1.apy.tip")}</span>}
            >
              <div>
                <div className="text-xs text-zinc-600 mb-1">
                  {t("token.level1.apy")}
                </div>
                <div className="font-mono tabular-nums text-xl sm:text-2xl font-semibold text-[#0d9a6e]">
                  {loading ? "-" : calculateFeePercentage(tokenDataState?.APY)}
                </div>
              </div>
            </Tooltip>
          </div>
        </section>

        <div className="app-detail-split">
          <div className="app-detail-chart">
            <Card className="h-full rounded-2xl border-zinc-200 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base sm:text-lg font-semibold tracking-tight text-zinc-900">
                  {t("token.k.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                {!h24KLineData?.length ? (
                  <div className="app-chart-state">
                    {chartStatus === "loading" ? t("common.loading") : chartStatus === "error" ? <div><p>{t("appUx.errorDescription")}</p><button className="app-secondary" onClick={()=>setFetchId(n=>n+1)}>{t("common.retry")}</button></div> : t("common.noData")}
                  </div>
                ) : (
                  <div
                    ref={chartRef}
                    className="app-chart-canvas"

                  />
                )}
              </CardContent>
            </Card>
          </div>
          <div className="app-detail-trade">
            <Card className="h-full rounded-2xl border-zinc-200 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base sm:text-lg font-semibold tracking-tight text-zinc-900">
                  {t("token.trade.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TokenSwap params={{ defaultTab: "swap", tokenId: tokenId || "" }} />
              </CardContent>
            </Card>
          </div>
        </div>

        <TokenStatsGrid
          title={t("token.level2.title")}
          stats={[
            {
              label: t("token.level2.volume"),
              tip: t("token.level2.volume.tip"),
              ...qtyPair(
                tokenDataState.currentQuantity,
                tokenDataState.currentValue
              ),
            },
            {
              label: t("token.level2.invest"),
              tip: t("token.level2.invest.tip"),
              ...qtyPair(
                tokenDataState.investQuantity,
                tokenDataState.investValue
              ),
            },
            {
              label: t("token.level2.fee"),
              tip: t("token.level2.fee.tip"),
              ...qtyPair(
                tokenDataState.currentFee,
                tokenDataState.currentFeeValue
              ),
            },
            {
              label: t("token.level2.24htrade"),
              tip: t("token.level2.24htrade.tip"),
              ...qtyPair(
                tokenDataState.tradeQuantity24,
                tokenDataState.tradeValue24
              ),
            },
            {
              label: t("token.level2.24hinvest"),
              tip: t("token.level2.24hinvest.tip"),
              ...qtyPair(
                tokenDataState.investQuantity24,
                tokenDataState.investValue24
              ),
            },
            {
              label: t("token.level2.24hfee"),
              tip: t("token.level2.24hfee.tip"),
              ...qtyPair(tokenDataState.fee24, tokenDataState.feeValue24),
            },
          ]}
        />

        <details className="app-protocol-details"><summary>{t("appUx.protocolDetails")}</summary><div className="app-protocol-content">
        <TokenStatsGrid
          title={t("token.level3.title")}
          stats={[
            {
              label: t("token.level3.totaltrade"),
              tip: t("token.level3.totaltrade.tip"),
              ...qtyPair(
                tokenDataState.totalTradeQuantity,
                tokenDataState.totalTradeValue
              ),
            },
            {
              label: t("token.level3.totalinvest"),
              tip: t("token.level3.totalinvest.tip"),
              ...qtyPair(
                tokenDataState.totalInvestQuantity,
                tokenDataState.totalInvestValue
              ),
            },
            {
              label: t("token.level3.totaldivest"),
              tip: t("token.level3.totaldivest.tip"),
              ...qtyPair(
                tokenDataState.totalDisinvestQuantity,
                tokenDataState.totalDisinvestValue
              ),
            },
            {
              label: t("token.level3.totaltradecount"),
              tip: t("token.level3.totaltradecount.tip"),
              value: tokenDataState.totalTradeCount,
            },
            {
              label: t("token.level3.totalinvestcount"),
              tip: t("token.level3.totalinvestcount.tip"),
              value: tokenDataState.totalInvestCount,
            },
            {
              label: t("token.level3.creator"),
              tip: t("token.level3.creator.tip"),
              value: formatAddress(tokenDataState.owner),
            },
          ]}
        />

        <TokenStatsGrid
          title={t("token.level4.title")}
          stats={[
            {
              label: t("token.level4.buyfee"),
              tip: t("token.level4.buyfee.tip"),
              value: formatPercents(tokenDataState.buyFee),
            },
            {
              label: t("token.level4.sellfee"),
              tip: t("token.level4.sellfee.tip"),
              value: formatPercents(tokenDataState.sellFee),
            },
            {
              label: t("token.level4.investfee"),
              tip: t("token.level4.investfee.tip"),
              value: formatPercents(tokenDataState.investFee),
            },
            {
              label: t("token.level4.divestfee"),
              tip: t("token.level4.divestfee.tip"),
              value: formatPercents(tokenDataState.divestFee),
            },
            {
              label: t("token.level4.strengthen"),
              tip: t("token.level4.strengthen.tip"),
              value: tokenDataState.investM,
            },
            {
              label: t("token.level4.divestchips"),
              tip: t("token.level4.divestchips.tip"),
              value: tokenDataState.divestChips,
            },
          ]}
        />

        <TokenStatsGrid
          title={t("token.level6.title")}
          stats={[
            {
              label: t("token.level6.investor"),
              tip: t("token.level6.investor.tip"),
              value: formatPercent(tokenDataState.investor),
            },
            {
              label: t("token.level6.operator"),
              tip: t("token.level6.operator.tip"),
              value: formatPercent(tokenDataState.operator),
            },
            {
              label: t("token.level6.portal"),
              tip: t("token.level6.portal.tip"),
              value: formatPercent(tokenDataState.portal),
            },
            {
              label: t("token.level6.referrer"),
              tip: t("token.level6.referrer.tip"),
              value: formatPercent(tokenDataState.referrer),
            },
            {
              label: t("token.level6.user"),
              tip: t("token.level6.user.tip"),
              value: formatPercent(tokenDataState.user),
            },
            {
              label: t("token.level6.protocol"),
              tip: t("token.level6.protocol.tip"),
              value: formatPercent(tokenDataState.protocol),
            },
          ]}
        />

        </div></details>
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 mb-4">
            {t("token.level5.title")}
          </h2>
          <TransactionRecords
            tokenId={tokenId}
            symbol={tokenDataState?.symbol}
            wallet_address=""
          />
        </section>
      </div>}
    </div>
  );
}
