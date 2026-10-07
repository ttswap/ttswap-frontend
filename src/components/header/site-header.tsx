import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId } from "wagmi";
import ChainSelector from "@/components/ChainSelector";
import { LanguageSwitcher } from "@/components/Language/LanguageSwitcher";
import { Faucet } from "@/components/faucet";
import GoodsSearch from "@/components/Search/GoodsSearch";
import Logo from "@/assets/tt_logo.png";
export function SiteHeader() {
 const { t } = useTranslation(); const location = useLocation();
 const [open,setOpen] = useState(false); const { isConnected } = useAccount(); const chainId = useChainId();
 useEffect(() => setOpen(false), [location.pathname]);
 const links = [["/tokens","header.menu.tokens"],["/trade","header.menu.trade"],["/profile","header.menu.myaccount"],["/publicSale","header.menu.publicSale"]];
 return <header className="app-header"><div className="app-header-inner">
   <Link to="/" className="app-brand" aria-label="TTSwap"><img src={Logo} alt="" /><span>TTSWAP</span></Link>
   <nav className="app-desktop-nav" aria-label={t("appUx.navigation")}>{links.map(([href,key]) => <NavLink key={href} to={href}>{t(key)}</NavLink>)}</nav>
   <div className="app-header-tools">{isConnected && chainId !== 1 && <span className="app-faucet"><Faucet/></span>}<GoodsSearch isValue="button" />{!isConnected && <ChainSelector />}<LanguageSwitcher /><ConnectButton label={t("tradeUx.connect")} chainStatus="icon" showBalance={false} accountStatus="address" />
   <button className="app-menu-toggle" aria-label={t(open ? "tradeUx.close" : "appUx.navigation")} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>{open ? <X size={20}/> : <Menu size={20}/>}</button></div>
 </div>{open && <nav className="app-mobile-nav" id="mobile-navigation" aria-label={t("appUx.navigation")}>
 <div className="app-mobile-search"><GoodsSearch isValue="button"/><span>{t("appUx.searchTitle")}</span></div><NavLink to="/">{t("header.menu.home")}</NavLink>{links.map(([href,key]) => <NavLink key={href} to={href}>{t(key)}</NavLink>)}
 <a href="https://docs.ttswap.io" target="_blank" rel="noopener noreferrer">{t("footer.title2")}</a>{isConnected && chainId !== 1 && <Faucet />}
 </nav>}</header>;
}
