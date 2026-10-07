import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TrendingUp, Shield, Zap, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { prettifyCurrencys, formatLargeNumber } from "@/services/graphql/util";
import { useMuneName } from "@/stores/menu";

interface HeroMetrics {
  trdeV: number;
  invertV: number;
  users: number;
  Tokens: number;
  vSymbol: string;
}

const emptyMetrics: HeroMetrics = {
  trdeV: 0,
  invertV: 0,
  users: 0,
  Tokens: 0,
  vSymbol: "",
};

export function HeroSection({
  data,
  loading = false,
}: {
  data?: HeroMetrics;
  loading?: boolean;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setName } = useMuneName();
  const marketData = data ?? emptyMetrics;

  const handleClick = (path: string) => {
    navigate("/" + path);
  };

  const features = [
    {
      icon: TrendingUp,
      title: t("home.HeroSection.features1.title"),
      description: t("home.HeroSection.features1.description"),
    },
    {
      icon: Shield,
      title: t("home.HeroSection.features2.title"),
      description: t("home.HeroSection.features2.description"),
    },
    {
      icon: Zap,
      title: t("home.HeroSection.features3.title"),
      description: t("home.HeroSection.features3.description"),
    },
    {
      icon: Users,
      title: t("home.HeroSection.features4.title"),
      description: t("home.HeroSection.features4.description"),
    },
  ];

  const metrics = [
    {
      value: loading || !data ? "-" : prettifyCurrencys(marketData.trdeV),
      label: `${t("home.HeroSection.volume")} (${marketData.vSymbol || "-"})`,
    },
    {
      value: loading || !data ? "-" : prettifyCurrencys(marketData.invertV),
      label: `${t("home.HeroSection.liquidity")} (${marketData.vSymbol || "-"})`,
    },
    {
      value: loading || !data ? "-" : formatLargeNumber(marketData.users, 0),
      label: t("home.HeroSection.user"),
    },
    {
      value: loading || !data ? "-" : formatLargeNumber(marketData.Tokens, 0),
      label: t("home.HeroSection.tokens"),
    },
  ];

  return (
    <section className="app-hero">
      <div className="app-hero-main">
        <div className="app-hero-content">
          <h1 className="app-hero-title">
            {t("home.HeroSection.title")}
          </h1>
          <p className="app-hero-description">
            {t("home.HeroSection.description")}
          </p>

          <div className="app-hero-actions">
            <Button
              size="lg"
              className="h-12 min-h-12 px-8 rounded-xl bg-[#0fb981] hover:bg-[#0d9a6e] text-white border-0 shadow-none focus-visible:ring-[#0fb981]/40"
              onClick={() => {
                setName("trade");
                handleClick("trade");
              }}
            >
              {t("home.HeroSection.button1")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 min-h-12 px-8 rounded-xl border-[#0fb981] text-[#0fb981] bg-transparent hover:bg-[#0fb981]/10 hover:text-[#0d9a6e] focus-visible:ring-[#0fb981]/40"
              onClick={() => {
                setName("publicSale");
                handleClick("publicSale");
              }}
            >
              {t("home.HeroSection.button2")}
            </Button>
          </div>

          <dl
            className="app-hero-metrics"
            aria-busy={loading}
          >
            {metrics.map((m) => (
              <div key={m.label} className="flex flex-col">
                <dt className="order-2 text-xs sm:text-sm text-zinc-600">
                  {m.label}
                </dt>
                <dd
                  className={`order-1 font-mono tabular-nums text-2xl sm:text-3xl tracking-tight text-[#0d9a6e] mb-1 ${
                    loading ? "animate-pulse motion-reduce:animate-none" : ""
                  }`}
                >
                  {m.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <ul className="app-feature-list">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <li key={feature.title} className="min-w-0">
              <div className="flex items-start gap-3">
                <div
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0fb981]/12 text-[#0d9a6e]"
                  aria-hidden="true"
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-zinc-900 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
