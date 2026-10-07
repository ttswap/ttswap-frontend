import { useTranslation } from "react-i18next";
import { useValueGood } from "@/stores/valueGood";
import { prettifyCurrencys } from "@/services/graphql/util";
export function PortfolioOverview({datas}:{datas?:any}) {
 const {t}=useTranslation(); const {info}=useValueGood();
 const fields=[["tradeValue","tradeamount",info.symbol],["investValue","investamount",info.symbol],["disinvestValue","divestamount",info.symbol],["stakettsvalue","miningvalue",info.symbol],["totalprofitvalue","profitamount",info.symbol],["totalcommissionvalue","commissionamount",info.symbol],["getfromstake","mintedtts","TTS"],["mining","mining","TTS"]];
 const metric=([key,label,unit]:string[]) => <div key={key}><dt>{t(`account.index.${label}`)}</dt><dd>{datas ? prettifyCurrencys(datas[key]) : "-"}<span>{unit}</span></dd></div>;
 return <section className="app-portfolio" aria-busy={!datas}><dl className="app-portfolio-primary">{fields.slice(0,2).map(metric)}</dl><details className="app-details"><summary>{t("appUx.accountDetails")}</summary><dl className="app-metric-grid">{fields.slice(2).map(metric)}</dl></details></section>;
}
