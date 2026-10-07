import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { TokenIcon } from "../common/TokenIcon";
import { formatCurrency } from "@/utils/format";
import { GRK_SIZES } from "@/types/common";
import { prettifyCurrencys, calculateFeePercentage } from "@/services/graphql/util";
import { useTranslation } from "react-i18next";
import { useMuneName } from "@/stores/menu";

interface TokenmarketData {
  id: string;
  name: string;
  decimals: number;
  symbol: string;
  price: any;
  logo_url: string;
  address: string;
  isvaluegood: boolean;
  valueSymbol: string;
  h24: number;
  trade24hValue: number;
}

export function MarketOverview({
  data,
  loading = false,
}: {
  data?: TokenmarketData[];
  loading?: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setName } = useMuneName();
  const [marketData, setmarketData] = useState<TokenmarketData[]>([]);

  useEffect(() => {
    setmarketData(data ?? []);
  }, [data]);

  const handleTokenClick = (path: string) => {
    navigate("/" + path);
  };

  return (
    <section className="mb-12">
      <div className="flex items-start justify-between gap-4 mb-2">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
          {t("home.market.title")}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 min-h-8 rounded-xl text-[#0d9a6e] hover:text-[#0b7f5a] hover:bg-[#0fb981]/10 shrink-0"
          onClick={() => {
            setName("tokens");
            handleTokenClick("tokens");
          }}
        >
          {t("home.market.all")}
          <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      </div>
      <p className="text-sm text-zinc-600 mb-4 max-w-[65ch]">
        {t("home.market.description")}
      </p>

      <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
        {loading ? (
          <div className="px-5 py-10 text-sm text-zinc-600" aria-busy="true">
            {t("home.loading")}
          </div>
        ) : !marketData.length ? (
          <div className="px-5 py-10 text-sm text-zinc-600">
            {t("home.market.empty")}
          </div>
        ) : (
          <ul className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-px bg-zinc-100">
            {marketData.map((token) => {
              const up = token.h24 >= 0;
              return (
                <li
                  key={token.address || token.id || token.symbol}
                  className="bg-white"
                >
                  <button
                    type="button"
                    className="w-full min-h-14 text-left px-4 py-3.5 transition-colors duration-150 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0fb981]/50 motion-reduce:transition-none"
                    onClick={() => handleTokenClick("tokens/" + token.id)}
                    aria-label={`${token.symbol} ${token.name}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <TokenIcon
                          isValueToken={token.isvaluegood}
                          icon={token.logo_url}
                          color=""
                          size={GRK_SIZES.SMALL}
                          showPulse={token.isvaluegood}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-zinc-900 truncate">
                              {token.symbol}
                            </span>
                            <span
                              className={`inline-flex items-center gap-0.5 font-mono tabular-nums text-[11px] ${
                                up ? "text-[#0d9a6e]" : "text-red-700"
                              }`}
                            >
                              {up ? (
                                <TrendingUp className="h-3 w-3" strokeWidth={1.5} />
                              ) : (
                                <TrendingDown className="h-3 w-3" strokeWidth={1.5} />
                              )}
                              {calculateFeePercentage(token.h24)}
                            </span>
                          </div>
                          <div className="text-xs text-zinc-600 truncate">
                            {token.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono tabular-nums text-sm text-zinc-900">
                          {formatCurrency(parseFloat(token.price), token.valueSymbol)}
                        </div>
                        <div className="text-[11px] text-zinc-600">
                          24h {prettifyCurrencys(token.trade24hValue)}{" "}
                          {token.valueSymbol}
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
