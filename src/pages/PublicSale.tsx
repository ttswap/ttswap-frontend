import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAccount, useChainId } from "wagmi";
import { useConnectModal, useChainModal } from "@rainbow-me/rainbowkit";
import { ethers } from "ethers";
import { TradeDialog } from "@/components/dialogs/TradeDialog";
import { PageState } from "@/components/common/PageState";
import { useLocalStorage } from "@/utils/LocalStorageManager";
import { getChainName, getExplorer } from "@/data/networks";
import { publicSaleData } from "@/services/graphql";
import useWallet from "@/hooks/useWallet";
import { type SwapProgress } from "@/utils/tradeSafety";
import { saleView, ownSaleRecords, validSaleAmount } from "@/utils/saleView";
import { getPublic } from "@/data/contractConfig";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
export default function PublicSale() {
 const {t,i18n}=useTranslation(); const {isConnected,address}=useAccount();const chainId=useChainId(); const {ssionChian}=useLocalStorage();const {openConnectModal}=useConnectModal();const {openChainModal}=useChainModal();const {ttsPublic,handleAddToken}=useWallet();
 const [data,setData]=useState<any>(null);const [status,setStatus]=useState("loading");const [revision,setRevision]=useState(0);const [amount,setAmount]=useState("");const [review,setReview]=useState(false);const [mine,setMine]=useState(false);const [progress,setProgress]=useState<SwapProgress|null>(null);const [error,setError]=useState("");const [busy,setBusy]=useState(false);const [unknown,setUnknown]=useState(false);const lock=useRef(false);const context=useRef("");
 const fmt=(n:number)=>new Intl.NumberFormat(i18n.language,{maximumFractionDigits:6}).format(n);
 useEffect(()=>{let active=true;setData(null);setStatus("loading");publicSaleData(ssionChian).then(result=>{if(active){setData(result);setStatus("ready");}}).catch(()=>{if(active)setStatus("error");});return()=>{active=false;};},[ssionChian,revision]);
 const phases=saleView(Number(data?.totalU ?? 0));const current=phases.find(p=>p.status==="active");const valid=validSaleAmount(amount);const walletMismatch=isConnected && chainId!==ssionChian;
 context.current=`${address}:${chainId}:${ssionChian}:${current?.id}:${amount}`;
 useEffect(()=>{setReview(false);setAmount("");setError("");setUnknown(false);setProgress(null);},[address,ssionChian]);
 const records=mine ? ownSaleRecords(data?.items ?? [],address) : data?.items ?? [];
 const busyPhase=progress?.phase;
 const submit=async()=>{if(lock.current || !valid || !current || !isConnected || walletMismatch || status!=="ready")return; lock.current=true;setBusy(true);setReview(false);setError("");setUnknown(false);setProgress(null);const captured=context.current;let broadcast=false;try{
 const result=await ttsPublic(ethers.parseUnits(amount,6), value=>{if(["preparing","approving","submitting"].includes(value.phase) && captured!==context.current)throw new Error(t("appUx.contextChanged"));if(value.phase==="pending"||value.phase==="approvalPending")broadcast=true;setProgress(value);});
 if(result===true){setRevision(n=>n+1);}else{setError(t("common.mess.error"));if(broadcast)setUnknown(true);}
 }catch(e){setError(e instanceof Error ? e.message : t("common.mess.error"));if(broadcast)setUnknown(true);}finally{lock.current=false;setBusy(false);}};
 const cta=!isConnected ? t("tradeUx.connect") : walletMismatch ? t("tradeUx.switchNetwork") : t("appUx.saleReview");
 return <div className="app-page sale-page"><div className="app-page-heading"><h1>{t("sale.title")}</h1><p>{t("sale.title.desc")}</p><span className="app-network-label">{t("appUx.network")}: {(ssionChian === 560048 ? "Hoodi Testnet" : getChainName(ssionChian))}</span></div>
 {status==="error" ? <PageState kind="error" onRetry={()=>setRevision(n=>n+1)}/> : status==="loading" ? <PageState kind="loading"/> : <>
 <div className="app-sale-layout"><section className="app-sale-information"><h2>{t("appUx.saleOverview")}</h2><dl className="app-sale-metrics"><div><dt>{t("sale.mod1.label2")}</dt><dd>{fmt(data.totalU)} <span>USDT</span></dd></div><div><dt>{t("sale.mod1.label1")}</dt><dd>{fmt(250000)} <span>USDT</span></dd></div></dl>
 <progress max={250000} value={Math.min(250000,data.totalU)} aria-label={t("sale.progress")}/><p className="app-sale-progress-label">{fmt(Math.min(100,data.totalU/250000*100))}%</p>
 <div className="app-sale-phases">{phases.map(p=><div className={p.status==="active" ? "app-sale-phase active" : "app-sale-phase"} key={p.id}><div><h3>{t(`sale.phase${p.id}`)}</h3><span>{t(`sale.status.${p.status}`)}</span></div><dl><div><dt>{t("sale.price")}</dt><dd>{p.price} USDT / TTS</dd></div><div><dt>{t("sale.raised")}</dt><dd>{fmt(p.raised)} / {fmt(p.target)} USDT</dd></div></dl></div>)}</div>
 <details className="app-details"><summary>{t("sale.mod3.Instructions")}</summary><dl className="app-metric-grid"><div><dt>{t("sale.mod2.label2")}</dt><dd>{fmt(50000000)} TTS</dd></div><div><dt>{t("sale.mod2.label3")}</dt><dd>10% · {fmt(5000000)} TTS</dd></div></dl><p>{t("sale.mod3.Instructions.label1")}</p><p>{t("appUx.saleStageNote")}</p></details></section>
 <section className="app-sale-purchase"><h2>{t("appUx.salePurchase")}</h2><p>{current ? <>{t(`sale.phase${current.id}`)} · {current.price} USDT / TTS</> : t("appUx.saleEnded")}</p><label htmlFor="sale-amount">{t("sale.mod3.buy")} · USDT</label><input id="sale-amount" type="text" inputMode="decimal" autoComplete="off" value={amount} placeholder="0.00" aria-invalid={!!amount&&!valid} aria-describedby="sale-amount-help" disabled={busy||unknown||!current} onChange={e=>{setAmount(e.target.value);setError("");setProgress(null);}}/>
 <p id="sale-amount-help" className={amount&&!valid ? "app-error" : "app-helper"}>{t("appUx.saleAmountError")}</p><dl className="app-sale-estimate"><dt>{t("appUx.saleEstimate")}</dt><dd>{valid&&current ? fmt(Number(amount)/current.price) : "-"}<span>TTS</span></dd></dl>
 <p className="app-helper">{t("appUx.saleStageNote")}</p><p className="app-helper">{t("sale.mod3.tip.label3")} · {t("sale.mod3.tip.label4")}</p><button className="app-primary" disabled={busy||unknown||(isConnected&&!walletMismatch&&(!valid||!current))} onClick={()=>!isConnected ? openConnectModal?.() : walletMismatch ? openChainModal?.() : setReview(true)}>{busy ? t(busyPhase==="pending" ? "appUx.salePending" : busyPhase==="approving" ? "tradeUx.approving" : busyPhase==="approvalPending" ? "tradeUx.approvalPending" : "appUx.saleConfirm") : cta}</button>
 {(progress||error) && <div className="app-sale-feedback" role="status"><p className={error ? "app-error" : ""}>{unknown ? t("appUx.saleUnknown") : error || t(progress?.phase==="confirmed" ? "common.mess.success" : progress?.phase==="pending" ? "appUx.salePending" : "common.loading")}</p>{progress?.hash && <a target="_blank" rel="noopener noreferrer" href={`${getExplorer(ssionChian)[0]}/tx/${progress.hash}`}>{t("appUx.viewTransaction")}</a>}</div>}
 {progress?.phase==="confirmed" && <button className="app-secondary" onClick={async()=>{try{await handleAddToken();}catch{setError(t("common.mess.error"));}}}>{t("sale.mod3.wallet")}</button>}
 </section></div>
 <section className="app-sale-records"><div className="app-section-heading"><h2>{t(mine ? "appUx.saleOwnRecords" : "appUx.saleAllRecords")}</h2><div className="app-action-group"><button className={!mine ? "app-secondary selected" : "app-secondary"} aria-pressed={!mine} onClick={()=>setMine(false)}>{t("appUx.saleAllRecords")}</button><button className={mine ? "app-secondary selected" : "app-secondary"} aria-pressed={mine} onClick={()=>setMine(true)}>{t("appUx.saleOwnRecords")}</button></div></div>
 {mine&&!isConnected ? <PageState kind="wallet"/> : !records.length ? <PageState kind="empty"/> : <Table><TableHeader><TableRow><TableHead>{t("sale.mod4.table.time")}</TableHead><TableHead>{t("appUx.walletAddress")}</TableHead><TableHead>{t("sale.mod4.table.amount")}</TableHead><TableHead>{t("sale.mod4.table.obtain")}</TableHead><TableHead>{t("common.actions")}</TableHead></TableRow></TableHeader><TableBody>{records.map((r:any)=><TableRow key={r.id}><TableCell>{new Date(r.create_time).toLocaleString(i18n.language)}</TableCell><TableCell title={r.user}>{r.user?.slice(0,6)}…{r.user?.slice(-4)}</TableCell><TableCell>{fmt(r.usdtamount)} USDT</TableCell><TableCell>{fmt(r.ttsamount)} TTS</TableCell><TableCell><a className="app-text-link" href={r.hash} target="_blank" rel="noopener noreferrer">{t("appUx.viewTransaction")}</a></TableCell></TableRow>)}</TableBody></Table>}
 </section></>}
 <TradeDialog open={review} onOpenChange={setReview} title={t("appUx.saleReview")} description={t("appUx.saleApproval")}><dl className="app-review-list"><div><dt>{t("sale.mod3.buy")}</dt><dd>{amount} USDT</dd></div><div><dt>{t("appUx.saleEstimate")}</dt><dd>{current ? fmt(Number(amount)/current.price) : "-"} TTS</dd></div><div><dt>{t("sale.price")}</dt><dd>{current?.price} USDT / TTS</dd></div><div><dt>{t("appUx.network")}</dt><dd>{(ssionChian === 560048 ? "Hoodi Testnet" : getChainName(ssionChian))}</dd></div><div><dt>{t("appUx.saleFee")}</dt><dd>{t("appUx.saleFeeNote")}</dd></div><div><dt>{t("appUx.contract")}</dt><dd className="app-full-address">{getPublic(ssionChian)?.tts}</dd></div></dl><p className="app-helper">{t("appUx.saleStageNote")}</p><p className="app-helper">{t("sale.mod3.tip.label3")} · {t("sale.mod3.tip.label4")}</p><button className="app-primary" disabled={busy||!current||walletMismatch||!valid} onClick={submit}>{t("appUx.saleConfirm")}</button></TradeDialog>
 </div>;
}
