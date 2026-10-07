import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { TradeDialog } from "@/components/dialogs/TradeDialog";
import { useValueGood } from "@/stores/valueGood";
import { useLocalStorage } from "@/utils/LocalStorageManager";
import { GoodsSearchDatas } from "@/services/graphql/goods";
import { TokenIcon } from "@/components/common/TokenIcon";
import { GRK_SIZES } from "@/types/common";
import { prettifyCurrencys } from "@/services/graphql/util";
export default function GoodsSearch({ isValue: _ }: { isValue: string }) {
 const { t }=useTranslation(); const navigate=useNavigate(); const {info}=useValueGood(); const {ssionChian}=useLocalStorage();
 const [open,setOpen]=useState(false); const [query,setQuery]=useState(""); const [items,setItems]=useState<any[]>([]); const [state,setState]=useState("idle"); const [retry,setRetry]=useState(0);
 useEffect(() => {if(!open) return; let active=true; setItems([]); setState("loading"); const timer=setTimeout(async()=>{try { const rows:any=await GoodsSearchDatas({id:info.id,sel:query.trim()},ssionChian); if(active){setItems(rows);setState("ready");}} catch {if(active) setState("error");}},300); return()=>{active=false;clearTimeout(timer);};},[open,query,info.id,ssionChian,retry]);
 return <><button className="app-icon-button" aria-label={t("header.menu.search")} onClick={()=>{setQuery("");setOpen(true);}}><Search size={20}/></button>
 <TradeDialog open={open} onOpenChange={setOpen} title={t("appUx.searchTitle")} description={t("header.menu.search")}>
 <input className="app-search-input" aria-label={t("header.menu.search")} placeholder={t("header.menu.search")} value={query} onChange={e=>setQuery(e.target.value)} />
 <div className="app-search-results" aria-live="polite">{state==="loading" ? <p>{t("common.loading")}</p> : state==="error" ? <div role="alert"><p>{t("appUx.errorDescription")}</p><button className="app-secondary" onClick={()=>setRetry(retry+1)}>{t("common.retry")}</button></div> : !items.length ? <p>{t("appUx.noMatches")}</p> : items.map(item=><button key={item.id} className="app-search-result" onClick={()=>{setOpen(false);navigate(`/tokens/${item.id}`);}}>
 <TokenIcon icon={item.logo_url} isValueToken={item.isvaluegood} color="" size={GRK_SIZES.SMALL}/><span><strong>{item.symbol}</strong><small>{item.name}</small></span><span className="app-numeric">{prettifyCurrencys(item.price)}<small>{item.valueSymbol}</small></span></button>)}</div></TradeDialog></>;
}
