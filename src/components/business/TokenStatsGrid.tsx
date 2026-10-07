import type { ReactNode } from "react";
import { Tooltip } from "antd";

interface StatItem {
  label: string;
  tip?: string;
  value: ReactNode;
  subValue?: ReactNode;
}

interface TokenStatsGridProps {
  title: string;
  stats: StatItem[];
}

export function TokenStatsGrid({ title, stats }: TokenStatsGridProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
      <h2 className="px-5 py-4 text-base sm:text-lg font-semibold tracking-tight text-zinc-900">
        {title}
      </h2>
      <dl className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-zinc-100">
        {stats.map((stat) => {
          const cell = (
            <div className="bg-white px-4 py-4 h-full">
              <dt className="text-xs text-zinc-600 mb-1.5">{stat.label}</dt>
              <dd className="font-mono tabular-nums text-sm sm:text-base text-zinc-900">
                {stat.value}
              </dd>
              {stat.subValue != null && (
                <div className="text-xs text-zinc-600 mt-1 font-mono tabular-nums flex items-center gap-1">
                  {stat.subValue}
                </div>
              )}
            </div>
          );

          return (
            <div key={stat.label}>
              {stat.tip ? (
                <Tooltip placement="top" title={<span>{stat.tip}</span>}>
                  {cell}
                </Tooltip>
              ) : (
                cell
              )}
            </div>
          );
        })}
      </dl>
    </section>
  );
}
