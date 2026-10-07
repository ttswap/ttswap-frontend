import { PageState } from "@/components/common/PageState";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "react-i18next";
import { Spin, Tooltip } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { throttle } from "lodash";

import { formatCurrency, formatPercentage } from "@/utils/format";
import { investGoodsDatas } from "@/services/graphql/overview";
import { prettifyCurrencysFee } from "@/services/graphql/util";
import { type TokenV2Volume } from "@/types/XykServiceTypes";
import { TokenIcon } from "../common/TokenIcon";
import { GRK_SIZES } from "@/types/common";

interface TokenTableProps {
  onSwapClick?: (token: TokenV2Volume) => void;
  onInvestClick?: (token: TokenV2Volume) => void;
  onFreezeClick?: (token: TokenV2Volume) => void;
  onTokenClick?: (token: string) => void;
  onUpdateClick?: (token: TokenV2Volume) => void;
  showUpdateButton?: boolean;
  updateLabel?: string;
  valueId?: string;
  chainId?: number;
  wallet_address?: string;
}

const PAGE_SIZE = 50;
const SCROLL_THRESHOLD = 200;
const THROTTLE_DELAY = 200;

const actionClass =
  "h-8 min-h-8 px-3 text-xs rounded-lg bg-[#0fb981] hover:bg-[#0d9a6e] text-white border-0 shadow-none";
const mobileActionClass =
  "flex-1 h-10 min-h-10 px-3 text-xs rounded-xl bg-[#0fb981] hover:bg-[#0d9a6e] text-white border-0 shadow-none";

export function TokenTable({
  onSwapClick,
  onInvestClick,
  onTokenClick,
  onUpdateClick,
  showUpdateButton = true,
  updateLabel,
  chainId,
  valueId,
  wallet_address,
}: TokenTableProps) {
  const { t } = useTranslation();

  const [spinning, setSpinning] = useState(false);
  const [pagination, setPagination] = useState({ page_number: 1 });
  const [hasMore, setHasMore] = useState(false);
  const [tokens, setTokens] = useState<TokenV2Volume[]>([]);
  const [error, setError] = useState<{ error: boolean; error_message: string }>({
    error: false,
    error_message: "",
  });
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("default");
  const [fetchId, setFetchId] = useState(0);

  const loadingRef = useRef(false);
  const cancelledRef = useRef(false);
  const hasMoreRef = useRef(hasMore);
  const spinningRef = useRef(spinning);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    spinningRef.current = spinning;
  }, [spinning]);

  useEffect(() => {
    setPagination({ page_number: 1 });
    setTokens([]);
    setHasMore(false);
    setError({ error: false, error_message: "" });
  }, [chainId, valueId, wallet_address]);

  useEffect(() => {
    let cancelled = false;
    if (!valueId) { setSpinning(true); return; }
    loadingRef.current = true;

    const fetchData = async () => {
      setSpinning(true);
      setError({ error: false, error_message: "" });

      try {
        const response: any = await investGoodsDatas(
          {
            id: valueId || "",
            pageNumber: pagination.page_number - 1,
            pageSize: PAGE_SIZE,
            address: wallet_address || "0",
          },
          chainId
        );

        if (!cancelled) {
          setHasMore(response.pagination.has_more);

          if (pagination.page_number === 1) {
            setTokens(response.items);
          } else {
            setTokens((prev) => [...prev, ...response.items]);
          }
        }
      } catch (exception) {
        if (!cancelled) {
          const errorMessage =
            exception instanceof Error
              ? exception.message
              : "Failed to load token data";

          setError({
            error: true,
            error_message: errorMessage,
          });
        }
      } finally {
        if (!cancelled) {
          setSpinning(false);
          loadingRef.current = false;
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [chainId, pagination.page_number, valueId, wallet_address, fetchId]);

  useEffect(() => {
    const handleScroll = throttle(
      () => {
        const scrollBottom = window.innerHeight + window.scrollY;
        const documentHeight = document.documentElement.offsetHeight;

        if (
          scrollBottom >= documentHeight - SCROLL_THRESHOLD &&
          hasMoreRef.current &&
          !loadingRef.current &&
          !spinningRef.current
        ) {
          setPagination((prev) => ({
            page_number: prev.page_number + 1,
          }));
        }
      },
      THROTTLE_DELAY,
      { leading: true, trailing: true }
    );

    // Loading more is explicit so the footer remains reachable.

    return () => {
      window.removeEventListener("scroll", handleScroll);
      handleScroll.cancel();
    };
  }, []);

  const getPercentageDisplay = useCallback((value: number) => {
    const color = value >= 0 ? "text-[#0d9a6e]" : "text-red-700";
    const text = formatPercentage(value, 2, true);
    return { color, text };
  }, []);

  const createClickHandler = useCallback(
    (handler?: (token: TokenV2Volume) => void, token?: TokenV2Volume) =>
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (handler && token) {
          handler(token);
        }
      },
    []
  );

  const retry = useCallback(() => {
    setError({ error: false, error_message: "" });
    setPagination({ page_number: 1 });
    setTokens([]);
    setFetchId((n) => n + 1);
  }, []);

  const activateRow = useCallback(
    (id: string) => {
      onTokenClick?.(id);
    },
    [onTokenClick]
  );

  const renderDesktopActions = useCallback(
    (item: TokenV2Volume) => (
      <div className="flex gap-2 justify-end">
        {onSwapClick && <Button
          size="sm"
          className={actionClass}
          onClick={createClickHandler(onSwapClick, item)}
        >
          {t("trade.quick")}
        </Button>}
        {onInvestClick && <Button size="sm" variant="outline" className="app-secondary" onClick={createClickHandler(onInvestClick, item)}>{t("common.invest")}</Button>}
        {showUpdateButton && (
          <Button
            size="sm"
            className={actionClass}
            onClick={createClickHandler(onUpdateClick, item)}
          >
            {updateLabel || t("common.update")}
          </Button>
        )}
      </div>
    ),
    [onSwapClick, onInvestClick, onUpdateClick, showUpdateButton, updateLabel, t, createClickHandler]
  );

  const renderMobileActions = useCallback(
    (item: TokenV2Volume) => (
      <div className="flex flex-row gap-2 shrink-0">
        {onSwapClick && <Button
          size="sm"
          className={mobileActionClass}
          onClick={createClickHandler(onSwapClick, item)}
        >
          {t("common.swap")}
        </Button>}
        {onInvestClick && <Button
          size="sm"
          className="app-secondary flex-1"
          onClick={createClickHandler(onInvestClick, item)}
        >
          {t("common.invest")}
        </Button>}
        {showUpdateButton && (
          <Button
            size="sm"
            className={mobileActionClass}
            onClick={createClickHandler(onUpdateClick, item)}
          >
            {updateLabel || t("common.update")}
          </Button>
        )}
      </div>
    ),
    [onSwapClick, onInvestClick, onUpdateClick, showUpdateButton, updateLabel, t, createClickHandler]
  );

  const renderMobileDataGrid = useCallback(
    (item: TokenV2Volume) => {
      const percentageDisplay = getPercentageDisplay(item.priceC_24h);
      const cells = [
        { label: t("table.tokens.price"), value: formatCurrency(item.price) },
        {
          label: t("table.tokens.change24h"),
          value: percentageDisplay.text,
          className: percentageDisplay.color,
        },
        { label: t("table.tokens.navps"), value: prettifyCurrencysFee(item.NAVPS) },
        {
          label: t("table.tokens.apy"),
          value: formatPercentage(item.apy, 2),
          className: "text-[#0d9a6e]",
        },
        {
          label: t("table.tokens.amount"),
          value: formatCurrency(item.currentValue),
          span: true,
        },
      ];

      return (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 pt-4 border-t border-zinc-100">
          {cells.map((cell) => (
            <div key={cell.label} className={cell.span ? "col-span-2" : ""}>
              <dt className="text-xs text-zinc-600 mb-0.5">{cell.label}</dt>
              <dd
                className={`font-mono tabular-nums text-sm text-zinc-900 ${cell.className ?? ""}`}
              >
                {cell.value}
              </dd>
            </div>
          ))}
        </dl>
      );
    },
    [getPercentageDisplay, t]
  );

  const visibleTokens = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = tokens.filter(item => [item.symbol,item.name,item.address,item.id].some(v => String(v ?? "").toLowerCase().includes(q)));
    if (sort !== "default") result.sort((a,b) => Number(b[sort]) - Number(a[sort]));
    return result;
  }, [tokens,query,sort]);
  if (spinning && !tokens.length) return <PageState kind="loading"/>;
  if (error.error) {
    return (
      <div
        role="alert"
        className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800"
      >
        <div className="flex-1">
          <p className="font-medium">{t("common.error")}</p>
          <p className="text-red-700 mt-0.5">{error.error_message}</p>
        </div>
        <Button
          size="sm"
          className="h-9 rounded-xl bg-[#0fb981] hover:bg-[#0d9a6e] text-white border-0 self-start"
          onClick={retry}
        >
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  const rowKeyHandlers = (id: string) => ({
    onClick: () => activateRow(id),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.target !== e.currentTarget) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activateRow(id);
      }
    },
  });

  return (
    <div className="app-token-list">
      <div className="app-list-toolbar"><input className="app-search-input" aria-label={t("appUx.filterLoaded")} placeholder={t("appUx.filterLoaded")} value={query} onChange={e=>setQuery(e.target.value)} /><label className="app-sort-label">{t("appUx.sort")}<select value={sort} onChange={e=>setSort(e.target.value)}><option value="default">{t("appUx.defaultOrder")}</option><option value="currentValue">{t("table.tokens.amount")}</option><option value="priceC_24h">{t("table.tokens.change24h")}</option><option value="apy">{t("table.tokens.apy")}</option></select></label></div>
      {query && <p className="app-filter-note">{t("appUx.loadedOnly")}</p>}
      {tokens.length > 0 && (
      <div className="hidden sm:block rounded-2xl border border-zinc-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50 hover:bg-zinc-50">
              <Tooltip placement="top" title={<span>{t("table.tokens.id.tip")}</span>}>
                <TableHead className="text-center w-[60px] h-10 px-3 text-xs font-medium text-zinc-600">
                  {t("table.tokens.id")}
                </TableHead>
              </Tooltip>
              <Tooltip placement="top" title={<span>{t("table.tokens.name.tip")}</span>}>
                <TableHead className="text-left w-[200px] h-10 px-3 text-xs font-medium text-zinc-600">
                  {t("table.tokens.name")}
                </TableHead>
              </Tooltip>
              <Tooltip placement="top" title={<span>{t("table.tokens.price.tip")}</span>}>
                <TableHead className="text-right h-10 px-3 text-xs font-medium text-zinc-600">
                  {t("table.tokens.price")}
                </TableHead>
              </Tooltip>
              <Tooltip placement="top" title={<span>{t("table.tokens.change24h.tip")}</span>}>
                <TableHead className="text-right h-10 px-3 text-xs font-medium text-zinc-600">
                  {t("table.tokens.change24h")}
                </TableHead>
              </Tooltip>
              <Tooltip placement="top" title={<span>{t("table.tokens.navps.tip")}</span>}>
                <TableHead className="text-right h-10 px-3 text-xs font-medium text-zinc-600">
                  {t("table.tokens.navps")}
                </TableHead>
              </Tooltip>
              <Tooltip placement="top" title={<span>{t("table.tokens.apy.tip")}</span>}>
                <TableHead className="text-right h-10 px-3 text-xs font-medium text-zinc-600">
                  {t("table.tokens.apy")}
                </TableHead>
              </Tooltip>
              <Tooltip placement="top" title={<span>{t("table.tokens.amount.tip")}</span>}>
                <TableHead className="text-right h-10 px-3 text-xs font-medium text-zinc-600">
                  {t("table.tokens.amount")}
                </TableHead>
              </Tooltip>
              <Tooltip placement="top" title={<span>{t("table.tokens.actions.tip")}</span>}>
                <TableHead className="text-right w-[120px] h-10 px-3 text-xs font-medium text-zinc-600">
                  {t("common.actions")}
                </TableHead>
              </Tooltip>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleTokens.map((item, index) => {
              const percentageDisplay = getPercentageDisplay(item.priceC_24h);

              return (
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-zinc-50 focus-visible:bg-zinc-50 focus-visible:outline-none"
                  tabIndex={0}
                  {...rowKeyHandlers(item.id)}
                >
                  <TableCell className="text-center align-middle px-3 py-3 text-zinc-600 tabular-nums">
                    {index + 1}
                  </TableCell>
                  <TableCell className="text-left px-3 py-3">
                    <div className="flex items-center gap-3">
                      <TokenIcon
                        isValueToken={item.isvaluegood}
                        icon={item.logo_url}
                        color=""
                        size={GRK_SIZES.EXTRA_SMALL}
                        showPulse={item.isvaluegood}
                      />
                      <div className="flex flex-col items-start gap-0.5 min-w-0">
                        <div className="font-medium text-zinc-900 truncate w-full">
                          {item.symbol}
                        </div>
                        <div className="text-zinc-600 text-xs truncate w-full">
                          {item.name}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums px-3 py-3 text-zinc-900">
                    {formatCurrency(item.price)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums px-3 py-3">
                    <span className={percentageDisplay.color}>
                      {percentageDisplay.text}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums px-3 py-3 text-zinc-900">
                    {prettifyCurrencysFee(item.NAVPS)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums px-3 py-3 text-[#0d9a6e]">
                    {formatPercentage(item.apy, 2)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums px-3 py-3 text-zinc-900">
                    {formatCurrency(item.currentValue)}
                  </TableCell>
                  <TableCell className="text-right align-middle px-3 py-3">
                    {renderDesktopActions(item)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      )}

      {tokens.length > 0 && (
      <div className="sm:hidden space-y-3">
        {visibleTokens.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-zinc-200 bg-white p-4 cursor-pointer hover:border-[#0fb981]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0fb981]/40"
            tabIndex={0}
            {...rowKeyHandlers(item.id)}
          >
            <div className="app-token-mobile-heading">
              <div className="flex items-center gap-3 min-w-0">
                <TokenIcon
                  isValueToken={item.isvaluegood}
                  icon={item.logo_url}
                  color=""
                  size={GRK_SIZES.SMALL}
                  showPulse={item.isvaluegood}
                />
                <div className="min-w-0">
                  <div className="font-medium text-zinc-900 truncate">
                    {item.symbol}
                  </div>
                  <div className="text-sm text-zinc-600 truncate">{item.name}</div>
                </div>
              </div>
              {renderMobileActions(item)}
            </div>
            {renderMobileDataGrid(item)}
          </div>
        ))}
      </div>
      )}

      {!spinning && tokens.length > 0 && !visibleTokens.length && <div className="page-state"><p>{t("appUx.noMatches")}</p><button className="app-secondary" onClick={()=>setQuery("")}>{t("appUx.clearSearch")}</button></div>}
      {hasMore && !error.error && <div className="app-load-more"><button className="app-secondary" disabled={spinning} onClick={()=>setPagination(p=>({page_number:p.page_number+1}))}>{t("appUx.loadMore")}</button></div>}
      {spinning && (
        <div className="flex justify-center py-6" aria-live="polite">
          <Spin
            spinning
            indicator={<LoadingOutlined spin />}
            tip={t("common.loading")}
          >
            <div className="h-8" />
          </Spin>
        </div>
      )}

      {!spinning && tokens.length === 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-12 text-center text-sm text-zinc-600">
          {t("common.noData")}
        </div>
      )}
    </div>
  );
}
