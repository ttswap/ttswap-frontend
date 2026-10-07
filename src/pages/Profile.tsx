import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAccount } from "wagmi";
import { Plus, Share } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PortfolioOverview } from "@/components/business/PortfolioOverview";
import { TokenTable } from "@/components/tables/TokenTable";
import { InvestmentTable } from "@/components/tables/InvestmentTable";
import { CommissionTable } from "@/components/tables/CommissionTable";
import { ReferralTable } from "@/components/tables/ReferralTable";
import { TransactionRecords } from "@/components/tables/TransactionRecords";
import { CreateTokenDialog, SwapDialog, WithdrawDialog, UpdateTokenDialog } from "@/components/dialogs";
import { PageState } from "@/components/common/PageState";
import { useValueGood } from "@/stores/valueGood";
import { useLocalStorage } from "@/utils/LocalStorageManager";
import { myIndexes } from "@/services/graphql/account";
export default function Profile() {
 const {t}=useTranslation(); const navigate=useNavigate(); const {address,isConnected}=useAccount(); const {info}=useValueGood(); const {ssionChian}=useLocalStorage();
 const [data,setData]=useState<any>(null); const [state,setState]=useState("loading"); const [retry,setRetry]=useState(0); const [tab,setTab]=useState("investment");
 const [create,setCreate]=useState(false); const [swap,setSwap]=useState(false); const [swapTab,setSwapTab]=useState<"swap"|"invest">("swap"); const [token,setToken]=useState<any>(null);
 const [withdraw,setWithdraw]=useState(false); const [investment,setInvestment]=useState<any>(null); const [update,setUpdate]=useState(false); const [copy,setCopy]=useState("");
 useEffect(()=>{let active=true;setData(null);setState("loading");if(!isConnected || !address || !info.id) return;myIndexes(info.id,address,ssionChian).then(result=>{if(active){setData(result);setState("ready");}}).catch(()=>{if(active)setState("error");});return()=>{active=false;};},[address,isConnected,info.id,ssionChian,retry]);
 const openTrade=(item:any,mode:"swap"|"invest")=>{setToken(item);setSwapTab(mode);setSwap(true);};
 const share=async()=>{try{await navigator.clipboard.writeText(`${window.location.origin}/?${address}`);setCopy(t("common.mess.copy"));}catch{setCopy(t("appUx.copyFailed"));}};
 const tabs=[["investment","account.tabs.proof"],["tokens","account.tabs.goods"],["idle","account.tabs.commission"],["records","account.tabs.transactions"],["referrals","account.tabs.referees"]];
 return <div className="app-page profile-page"><div className="app-page-heading"><h1>{t("account.title")}</h1><p>{t("account.title.desc")}</p></div>
 {!isConnected ? <PageState kind="wallet"/> : <>
 <div className="app-account-bar"><span className="app-address" title={address}>{address?.slice(0,8)}…{address?.slice(-6)}</span><div className="app-action-group"><button className="app-secondary" onClick={()=>setCreate(true)}><Plus size={16}/>{t("account.add.token")}</button><button className="app-secondary" onClick={share}><Share size={16}/>{t("account.bnt.share")}</button><Link className="app-text-link" to="/publicSale">{t("header.menu.publicSale")}</Link><Link className="app-text-link" to="/TokensSeting">{t("appUx.manageAssets")}</Link></div></div><p className="app-feedback" role="status">{copy}</p>
 {state==="error" ? <PageState kind="error" onRetry={()=>setRetry(retry+1)}/> : <PortfolioOverview datas={data}/>}
 <Tabs value={tab} onValueChange={setTab} className="app-account-tabs"><TabsList>{tabs.map(([value,key])=><TabsTrigger key={value} value={value}>{t(key)}{value==="referrals" && state==="ready" && <span className="app-count">{data?.referralnum ?? 0}</span>}</TabsTrigger>)}</TabsList>
 <TabsContent value="investment"><InvestmentTable wallet_address={address} onTokenClick={id=>navigate(`/tokens/${id}`)} onWithdrawClick={id=>{setInvestment(id);setWithdraw(true);}}/></TabsContent>
 <TabsContent value="tokens"><TokenTable key={`${address}-${ssionChian}`} valueId={info.id} chainId={ssionChian} wallet_address={address} showUpdateButton onTokenClick={id=>navigate(`/tokens/${id}`)} onSwapClick={item=>openTrade(item,"swap")} onInvestClick={item=>openTrade(item,"invest")} onUpdateClick={item=>{setToken(item);setUpdate(true);}}/></TabsContent>
 <TabsContent value="idle"><CommissionTable wallet_address={address} onTokenClick={id=>navigate(`/tokens/${id}`)}/></TabsContent><TabsContent value="records"><TransactionRecords wallet_address={address}/></TabsContent><TabsContent value="referrals"><ReferralTable wallet_address={address}/></TabsContent></Tabs>
 </>}
 <CreateTokenDialog open={create} onOpenChange={setCreate}/><SwapDialog open={swap} onOpenChange={setSwap} defaultTab={swapTab} tokenId={token?.id}/><WithdrawDialog open={withdraw} onOpenChange={setWithdraw} investmentId={investment} walletAddress={address}/><UpdateTokenDialog open={update} onOpenChange={setUpdate} token={token} walletAddress={address}/>
 </div>;
}
