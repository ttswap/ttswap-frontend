import { useEffect, useState, useCallback, useRef } from "react";
import { TradingStatistics } from "@/components/business/TradingStatistics";
import { HeroSection } from "@/components/home/HeroSection";
import { MarketOverview } from "@/components/home/MarketOverview";
import { useTranslation } from "react-i18next";
import { useValueGood } from "@/stores/valueGood";
import { useLocalStorage } from "@/utils/LocalStorageManager";
import { AggregateIndex } from "@/services/graphql/overview";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { t } = useTranslation();
  const { info } = useValueGood();
  const { ssionChian } = useLocalStorage();
  const requestId = useRef(0);
  const [homeData, setHomeData] = useState<any>();
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );

  const load = useCallback(async () => {
    if (info.id === "") return;
    const request = ++requestId.current;
    setHomeData(undefined);
    setStatus("loading");
    try {
      const a: any = await AggregateIndex(info.id, ssionChian);
      if(request !== requestId.current) return;
      setHomeData(a);
      setStatus("ready");
    } catch {
      if(request !== requestId.current) return;
      setHomeData(undefined);
      setStatus("error");
    }
  }, [info.id, ssionChian]);

  useEffect(() => {
    load();
    return () => { requestId.current++; };
  }, [load]);

  const loading = status === "idle" || status === "loading";

  return (
    <div className="app-home">
      {status === "error" && (
        <div
          role="alert"
          className="mb-8 flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800"
        >
          <p className="flex-1">{t("home.loadError")}</p>
          <Button
            size="sm"
            className="h-9 rounded-xl bg-[#0fb981] hover:bg-[#0d9a6e] text-white border-0 self-start"
            onClick={load}
          >
            {t("home.retry")}
          </Button>
        </div>
      )}

      <HeroSection data={homeData?.hero} loading={loading} />
      <MarketOverview
        data={homeData?.over}
        loading={loading}
      />

      <section>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 mb-1">
          {t("home.chart.title")}
        </h2>
        <p className="text-sm text-zinc-600 mb-4 max-w-[65ch]">
          {t("home.chart.description")}
        </p>
        <TradingStatistics
          data={homeData?.chart}
          loading={loading}
        />
      </section>
    </div>
  );
}
