import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAccount } from "wagmi";
import { useValueGood } from "@/stores/valueGood";
import { useLocalStorage } from "@/utils/LocalStorageManager";
import { TokenTable } from "@/components/tables/TokenTable";
import { TokensSetingDialog } from "@/components/dialogs/TokensSetingDialog";
import { PageState } from "@/components/common/PageState";
export default function TokensSeting() {
 const {t}=useTranslation();const navigate=useNavigate();const {isConnected,address}=useAccount();const {info}=useValueGood();const {ssionChian}=useLocalStorage();
 const [open,setOpen]=useState(false);const [token,setToken]=useState<any>(null);
 return <div className="app-page asset-management"><div className="app-page-heading"><h1>{t("appUx.configTitle")}</h1><p>{t("appUx.configDescription")}</p></div>
 {!isConnected ? <PageState kind="wallet"/> : <TokenTable key={`${address}-${ssionChian}`} valueId={info.id} chainId={ssionChian} wallet_address={address} showUpdateButton updateLabel={t("appUx.configure")} onTokenClick={id=>navigate(`/tokens/${id}`)} onUpdateClick={item=>{setToken(item);setOpen(true);}}/>}
 <TokensSetingDialog open={open} onOpenChange={setOpen} token={token} walletAddress={address}/></div>;
}
