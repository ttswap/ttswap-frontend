import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useState, useEffect, type ReactNode } from "react";
import { COLORS } from "@/utils/constants";
import { prettifyCurrencys } from "@/services/graphql/util";
import { timestampParser } from "@/utils/timestamp-parser";
import { type UniswapLikeEcosystemCharts } from "@/types/XykServiceTypes";
import { useTranslation } from "react-i18next";

type Period = "7d" | "30d";

function PeriodToggle({
  value,
  onChange,
  label,
}: {
  value: Period;
  onChange: (p: Period) => void;
  label: string;
}) {
  const { t } = useTranslation();
  return (
    <div
      className="flex gap-1 self-start sm:self-auto"
      role="group"
      aria-label={label}
    >
      {(["7d", "30d"] as const).map((p) => {
        const active = value === p;
        return (
          <Button
            key={p}
            type="button"
            variant={active ? "default" : "outline"}
            size="sm"
            aria-pressed={active}
            className={`h-8 min-h-8 px-3 text-xs rounded-lg ${
              active
                ? "bg-[#0fb981] hover:bg-[#0d9a6e] text-white border-0"
                : "bg-white text-zinc-700 hover:bg-zinc-50 hover:border-[#0fb981] hover:text-[#0d9a6e]"
            }`}
            onClick={() => onChange(p)}
          >
            {p === "7d" ? `7 ${t("home.chart.day")}` : `30 ${t("home.chart.day")}`}
          </Button>
        );
      })}
    </div>
  );
}

export function TradingStatistics({
  data,
  loading = false,
}: {
  data?: UniswapLikeEcosystemCharts;
  loading?: boolean;
}) {
  const { t } = useTranslation();
  const [volumePeriod, setVolumePeriod] = useState<Period>("7d");
  const [liquidityPeriod, setLiquidityPeriod] = useState<Period>("7d");
  const [liquidityData, setLiquidityData] = useState<
    { date: string; liquidity: any }[]
  >([]);
  const [volumeData, setVolumeData] = useState<
    { date: string; volume: any }[]
  >([]);
  const [chartData, setChartData] = useState<UniswapLikeEcosystemCharts | null>(
    null
  );

  useEffect(() => {
    setChartData(data ?? null);
  }, [data]);

  useEffect(() => {
    const volumeSrc =
      volumePeriod === "7d"
        ? chartData?.volume_chart_7d
        : chartData?.volume_chart_30d;
    setVolumeData(
      volumeSrc?.map((item: any) => ({
        date: timestampParser(item.dt, "DD MMM YY"),
        volume: item.volume,
      })) ?? []
    );

    const liqSrc =
      liquidityPeriod === "7d"
        ? chartData?.liquidity_chart_7d
        : chartData?.liquidity_chart_30d;
    setLiquidityData(
      liqSrc?.map((item: any) => ({
        date: timestampParser(item.dt, "DD MMM YY"),
        liquidity: item.volume,
      })) ?? []
    );
  }, [chartData, volumePeriod, liquidityPeriod]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-zinc-200 rounded-xl shadow-sm">
          <p className="font-medium text-zinc-900 tabular-nums">{label}</p>
          <p className="text-sm text-zinc-600 tabular-nums">
            {payload[0].dataKey === "volume"
              ? t("home.chart.volume")
              : t("home.chart.liquidity")}
            : {prettifyCurrencys(payload[0].value)} USDT
          </p>
        </div>
      );
    }
    return null;
  };

  const axisTick = { fontSize: 10, fill: "#52525b" };

  const chartShell = (empty: boolean, children: ReactNode) => (
    <div className="h-48 sm:h-64">
      {loading || empty ? (
        <div className="h-full flex items-center justify-center text-sm text-zinc-600">
          {loading ? t("home.loading") : t("home.chart.empty")}
        </div>
      ) : (
        children
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <Card className="rounded-2xl border-zinc-200 shadow-none">
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg text-zinc-900">
              {t("home.chart.volume.title")}
              <span className="text-sm font-normal text-zinc-600">(USDT)</span>
            </CardTitle>
            <PeriodToggle
              value={volumePeriod}
              onChange={setVolumePeriod}
              label={t("home.chart.volume.title")}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <span
              className="w-2.5 h-2.5 rounded-full bg-[#0fb981]"
              aria-hidden="true"
            />
            Volume (USDT)
          </div>
        </CardHeader>
        <CardContent>
          {chartShell(
            !volumeData.length,
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={volumeData}
                margin={{ top: 20, right: 15, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={axisTick}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={axisTick}
                  width={35}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="volume"
                  fill={COLORS.PRIMARY}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-zinc-200 shadow-none">
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg text-zinc-900">
              {t("home.chart.liquidity.title")}
              <span className="text-sm font-normal text-zinc-600">(USDT)</span>
            </CardTitle>
            <PeriodToggle
              value={liquidityPeriod}
              onChange={setLiquidityPeriod}
              label={t("home.chart.liquidity.title")}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <span
              className="w-2.5 h-2.5 rounded-full bg-[#0fb981]"
              aria-hidden="true"
            />
            Liquidity (USDT)
          </div>
        </CardHeader>
        <CardContent>
          {chartShell(
            !liquidityData.length,
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={liquidityData}
                margin={{ top: 20, right: 15, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={axisTick}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={axisTick}
                  width={35}
                />
                <Tooltip content={<CustomTooltip />} />
                <defs>
                  <linearGradient
                    id="liquidityGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={COLORS.PRIMARY}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={COLORS.PRIMARY}
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="liquidity"
                  stroke={COLORS.PRIMARY}
                  strokeWidth={2}
                  fill="url(#liquidityGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
