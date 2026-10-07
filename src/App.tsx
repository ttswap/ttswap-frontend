import { Link, useLocation } from "react-router-dom";

import { useEffect, useState, useMemo, Suspense } from "react";
import { Flex } from "@radix-ui/themes"
import "@radix-ui/themes/styles.css"
import RouterView from './routes'
import { Locale, RainbowKitProvider, lightTheme, AvatarComponent } from '@rainbow-me/rainbowkit';
import { PageState } from "@/components/common/PageState";
import { SiteHeader } from "@/components/header/site-header"
import Jazzicons from "@/components/Jazzicons";
import { Loading, GlobalLoading } from '@/components/Loading';
import { useLocalStorage } from "@/utils/LocalStorageManager";
import { useValueGood } from "@/stores/valueGood";
import { valueGood } from '@/services/graphql';
import i18n from '@/i18n';
import { useAccount, useChainId, useDisconnect } from 'wagmi';
import { ethers } from "ethers";
import { useLanguage } from '@/hooks/useLanguage';

import "@/styles/widget.css";
import "@/styles/app.css";
// import "@radix-ui/themes/styles.css"
import '@rainbow-me/rainbowkit/styles.css';

const CustomAvatar: AvatarComponent = ({ address, ensImage, size }) => {
  return (
    <Jazzicons seed={address} />
  )
};
const getString = (str: string): string | null => {
  const index = str.indexOf('?');
  if (index === -1) {
    return null; // 如果未找到"?"，则返回null
  }
  return str.substring(index + 1); // 返回"?"之后的所有字符
}
function App() {
  const [networkState, setNetworkState] = useState("loading");
  const [networkRetry,setNetworkRetry] = useState(0);
  const isTradePage = useLocation().pathname === "/trade";
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [language, setLanguage] = useState('en');
  const { ssionChian, setSsionChian } = useLocalStorage();
  const { info, setValueGood } = useValueGood();
  const { currentLanguage, changeLanguage } = useLanguage();
  // const { disconnect } = useDisconnect();


  useEffect(() => {
    changeLanguage(localStorage.getItem("language"));
    if (typeof window !== "undefined") {
      const params = window.location.search;
      const a: any = getString(params);
      // console.log(ethers.isAddress(null),"reference---")
      if (getString(params) !== null && ethers.isAddress(a) && !ethers.isAddress(localStorage.getItem("reference"))) {
        // @ts-ignore
        localStorage.setItem("reference", a);
      }
    }
  }, []);

  useEffect(() => {
    if (isConnected) {
      setSsionChian(chainId);
      localStorage.setItem("chainId", chainId.toString());
      // routerUp();
    } else {
      localStorage.setItem("chainId", ssionChian.toString());
      console.log(ssionChian, "reference---000")
    }
  }, [isConnected, chainId, ssionChian]);

  useEffect(() => {
    let active = true;
    setNetworkState("loading");
    setValueGood({id:"",name:"",symbol:"",address:"",decimals:0,logo_url:""});
    (async () => {
      try {
      const bal = await valueGood(ssionChian);
      if (!active) return;
      if (!bal?.data?.goodStates?.[0]) throw new Error("Network data unavailable");
      console.log(bal, 99999999999, ssionChian)
      setValueGood({
        id: bal.data.goodStates[0].id,
        symbol: bal.data.goodStates[0].tokensymbol,
        name: bal.data.goodStates[0].tokenname,
        logo_url: "",
        address: bal.data.goodStates[0].erc20Address,
        decimals: bal.data.goodStates[0].tokendecimals
      });
      setNetworkState("ready");
      } catch { if(active)setNetworkState("error"); }
    })();
    return () => { active = false; };
  }, [ssionChian,networkRetry]);

  useEffect(() => {
    // i18n.loadLanguages(i18n.language);
    // setLanguage(i18n.language);

    // 确保只在客户端执行，并且i18n已初始化
    if (typeof window !== 'undefined' && i18n.isInitialized) {
      setLanguage(i18n.language);
    }
  }, []);

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  return (
    <Suspense fallback={<Loading />}>
      <RainbowKitProvider
        // key={ssionChian}
        locale={language as Locale}
        initialChain={ssionChian}
        theme={lightTheme({
          accentColor: '#047857',
          accentColorForeground: 'white',
          borderRadius: 'medium',
          // fontStack: 'system',
          // overlayBlur: 'small',
        })}
        avatar={CustomAvatar}
        showRecentTransactions={false}
      >
        {/* <Loading /> */}
        <GlobalLoading />
        <div className={`app-shell ${isTradePage ? "trade-route" : ""}`}>
          <SiteHeader />
          <div className="flex-1">
            <Flex
              direction="column"
              gap="5"
              className={isTradePage ? "trade-main-container" : "app-main-container"}
            >
              {networkState === "error" ? <PageState kind="error" onRetry={()=>setNetworkRetry(n=>n+1)}/> : <RouterView />}
            </Flex>
          </div>
          <footer className="app-footer"><Link to="/">TTSwap</Link><nav aria-label={i18n.t("appUx.resources")}><a href="https://docs.ttswap.io" target="_blank" rel="noopener noreferrer">{i18n.t("footer.title2")}</a><a href="https://github.com/ttswap" target="_blank" rel="noopener noreferrer">GitHub</a><a href="https://x.com/ttswapFinance" target="_blank" rel="noopener noreferrer">X</a><a href="https://discord.gg/XygqnmQgX3" target="_blank" rel="noopener noreferrer">Discord</a><a href="mailto:ttswapfinance@gmail.com">{i18n.t("appUx.contact")}</a><a href="https://t.me/ttswap01" target="_blank" rel="noopener noreferrer">Telegram</a></nav></footer>
        </div>
      </RainbowKitProvider>
    </Suspense>
  )
}

export default App
