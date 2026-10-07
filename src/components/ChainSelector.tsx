import { FC, useEffect, useMemo, useState } from "react";

import { getChainName } from "@/data/networks";
import { DownOutlined } from "@ant-design/icons";
// import { useWeb3React } from "@web3-react/core";
import { Dropdown, Button } from "antd";
import type { MenuProps } from "antd";
// import { usePathname, useRouter } from "next/navigation";

// import arbitrum_Logo from "@/assets/images/arbitrum_Logo.png";
import ethereum_Logo from "@/assets/images/ethereum_Logo.png";
import ethereum_Logo1 from "@/assets/images/ethereum_Logo1.png";
// import fantom_Logo from "@/assets/images/fantom_Logo.png";
// import polygon_logo from "@/assets/images/polygon_logo.png";
// import zksync_Logo from "@/assets/images/zksync_Logo.png";
// import mantle_Logo from "@/assets/images/mantle_Logo.png";
// import bsc_Logo from "@/assets/svg/bsc_Logo.svg";
// import optimistim_Logo from "@/assets/svg/optimistim_Logo.svg";
import { chainIds } from "@/data/chainIds";
// import { useSwitchChain, useWindowSize } from "hooks";
// import { StaticImageData } from "next/image";
import { useLocalStorage } from "@/utils/LocalStorageManager";
// import { getAddChainParameters } from "@/data/networks";
import { useAccount, useChainId } from 'wagmi';

const styles = {
  item: {
    fontWeight: "700",
    fontFamily: "Roboto, sans-serif",
    fontSize: "16px"
  },
  button: {
    display: "flex",
    alignItems: "center",
    height: "42px",
    border: "0",
    borderRadius: "10px"
  }
};

type MenuItem = Required<MenuProps>["items"][number];

const ChainSelector: FC = () => {

  const { isConnected, address } = useAccount();
  const chainId = useChainId()
  const [selected, setSelected] = useState<MenuItem>();
  const [label, setLabel] = useState<JSX.Element>();
  // @ts-ignore
  const { ssionChian, setSsionChian } = useLocalStorage();
  const [chainId1, setChainId] = useState(ssionChian);

  // const routeSegments = pathname.split('/');

  const labelToShow = (logo: any, alt: string) => {
    return (
      <div style={{ display: "inline-flex", alignItems: "center" }}>
        <img src={logo} alt={alt} style={{ width: "25px", height: "25px", borderRadius: "10px", marginRight: "0" }} />
      </div>
    );
  };

  const items: MenuProps["items"] = useMemo(
    () => [
      { label: "Ethereum", key: chainIds.ethereum, icon: labelToShow(ethereum_Logo1, "Ethereum_logo") },
      // { label: "Sepolia Testnet", key: chainIds.sepolia, icon: labelToShow(ethereum_Logo, "Ethereum_logo")},
      { label: "Hoodi Testnet", key: chainIds.hoodiTestnet, icon: labelToShow(ethereum_Logo, "Ethereum_logo")},
      // { label: "Optimism", key: chainIds.optimism, icon: labelToShow(optimistim_Logo, "Optimistim_Logo")},
      // { label: "Optimism Goerli", key: chainIds.optimismgoerli, icon: labelToShow(optimistim_Logo, "Optimistim_Logo")},
      // { label: "Arbitrum", key: chainIds.arbitrum, icon: labelToShow(arbitrum_Logo, "Arbitrum_Logo")},
      // { label: "Arbitrum testnet", key: chainIds.arbitrumsepolia, icon: labelToShow(arbitrum_Logo, "Arbitrum_Logo")},
      // { label: "zkSync Era", key: chainIds.zkSync, icon: labelToShow(zksync_Logo, "zksync_Logo")},,
      // { label: "zkSync testnet", key: chainIds.zksyncgoerli, icon: labelToShow(zksync_Logo, "zksync_Logo")},
      // { label: "Polygon", key: chainIds.polygon, icon: labelToShow(polygon_logo, "Polygon_logo")},
      // { label: "Mumbai", key: chainIds.polygonmumbai, icon: labelToShow(polygon_logo, "Polygon_logo")},
      // { label: "Fantom", key: chainIds.fantom, icon: labelToShow(fantom_Logo, "Fantom_Logo")},
      // { label: "Fantom testnet", key: chainIds.fantomtest, icon: labelToShow(fantom_Logo, "Fantom_Logo")},
      // { label: "BNB Chain", key: chainIds.binance, icon: labelToShow(bsc_Logo, "BNB_logo") },
      // { label: "BSC Testnet", key: chainIds.binancetestnet, icon: labelToShow(bsc_Logo, "BNB_logo")},
      // { label: "Mantle Sepolia", key: chainIds.mantleSepolia, icon: labelToShow(mantle_Logo, "MNT_logo")},
      // { label: "FlowEVM Testnet", key: chainIds.flowTestnet, icon: labelToShow(flow_Logo, "FLOW_logo")},
    ],
    []
  );

  const itemsWithSelectedClass = items.map(item => ({
    ...item,
    className: chainId1?.toString() === item.key ? 'chain-selected' : ''
  }));

  useEffect(() => {
    const chname = ''; //routeSegments[1];
    // (async () => {
    const chid = chainIds[chname];
    setChainId(ssionChian);
    console.log(Number(chid), "account", ssionChian);
    // })();
  }, [ssionChian]);

  useEffect(() => {

    // if (chainId1===0) return;
    let selectedLabel;
    if (chainId1 === 1) {
      selectedLabel = labelToShow(ethereum_Logo1, "Ethereum_logo");
    } else if (chainId1 === 11155111 || chainId1 === 560048) {
      selectedLabel = labelToShow(ethereum_Logo, "Ethereum_logo");
      // } else if (chainId1 === 137 || chainId1 === 80001) {
      //   selectedLabel = labelToShow(polygon_logo, "Polygon_logo");
      // } else if (chainId1 === 10 || chainId1 === 420) {
      //   selectedLabel = labelToShow(optimistim_Logo, "Optimistim_Logo");
      // } else if (chainId1 === 280 || chainId1 === 324) {
      //   selectedLabel = labelToShow(zksync_Logo, "zksync_Logo");
      // } else if (chainId1 === 250 || chainId1 === 4002) {
      //   selectedLabel = labelToShow(fantom_Logo, "Fantom_Logo");
      // } else if (chainId1 === 42161 || chainId1 === 421614) {
      //   selectedLabel = labelToShow(arbitrum_Logo, "Arbitrum_Logo");
      // } else if (chainId1 === 56 || chainId1 === 97) {
      //   selectedLabel = labelToShow(bsc_Logo, "BNB_logo");
      // } else if (chainId1 === 5000 || chainId1 === 5003) {
      //   selectedLabel = labelToShow(mantle_Logo, "MNT_logo");
      // } else if (chainId1 === 747 || chainId1 === 545) {
      // selectedLabel = labelToShow(flow_Logo, "FLOW_logo");
    } else {
      selectedLabel = undefined;
    }

    setLabel(selectedLabel);
    setSelected(items.find((item) => item?.key === chainId1.toString()));
    localStorage.setItem("chainId", chainId1.toString());
    setSsionChian(chainId1);

  }, [chainId1, chainId, address]);

  const onClick: MenuProps["onClick"] = async ({ key }) => {
    // if (!isActive) {
    // @ts-ignore
    setChainId(Number(key));
    localStorage.setItem("chainId", key);
    setSsionChian(Number(key));
  };


  return (
    <div>
      <style>
        {`
        .custom-chain-dropdown .ant-dropdown-menu {
          font-size: 16px !important;
          font-weight: 700 !important;
        }
        .custom-chain-dropdown .ant-dropdown-menu-item,
        .custom-chain-dropdown .ant-dropdown-menu-submenu-title {
          font-size: 16px !important;
          font-weight: 700 !important;
        }
          .chain-selected{
          background: rgb(134 211 139) !important;
          color: white !important;
        }
      `}
      </style>
      <Dropdown menu={{ items: itemsWithSelectedClass, onClick, }} trigger={['click']} overlayClassName="custom-chain-dropdown">
        <Button className="app-network-selector" aria-label={(ssionChian === 560048 ? "Hoodi Testnet" : getChainName(ssionChian))} style={{ ...styles.button, ...styles.item }}>
          {!selected && <span style={{ marginLeft: "5px" }}>Select Chain</span>}
          {selected ? (
            <div className="app-chain-icon" style={{ display: "flex", alignItems: "center", minWidth: "25px" }}>
              <span style={{ paddingTop: "5px" }}>{label}</span>
            </div>
          ) : (
            <>
              {label && (
                <div className="gap-2" style={{ display: "flex", alignItems: "center", minWidth: "100px" }}>
                  <span style={{ paddingTop: "5px" }}>{label}</span>
                  {/*  @ts-expect-error title is a valid object */}
                  <span style={{ marginRight: "10px" }}>{selected?.label}</span>
                </div>
              )}
            </>
          )}
          <span className="app-chain-name">{(ssionChian === 560048 ? "Hoodi Testnet" : getChainName(ssionChian))}</span><DownOutlined />
        </Button>
      </Dropdown>
    </div>
  );
};

export default ChainSelector;
