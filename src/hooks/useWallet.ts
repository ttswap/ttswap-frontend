import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { ethers, AbiCoder } from "ethers";
import useSwap from "@/hooks/useSwap";
import useInvest from "@/hooks/useInvest";
import erc20 from '@/data/abi/erc20.json';
import Permit2 from '@/data/abi/Permit2.json';
import TTS from '@/data/abi/TTS.json';
import TTSwapMarket from '@/data/abi/MarketManager.json';
import { useSwapAmountStore } from "@/stores/swapAmount";
import { powerIterative } from '@/services/graphql/util';
import { useLocalStorage } from "@/utils/LocalStorageManager";
import { portal } from "@/config/PortalAddress";
import { getContractAddress, getPermit2PAddress, getSWETH, getPublic } from '@/data/contractConfig';
import { useEthersSigner, useEthersProvider } from '@/config/wagmiEthersV6';
import { useAccount, useWalletClient } from 'wagmi';
import { getChainName, getAddChainParameters } from '@/data/networks';
import { confirmSwapTransaction, type SwapProgress } from "@/utils/tradeSafety";
import { iconUrl } from '@/services/graphql/util';

// 常量定义移到组件外部

const signAddress = ""; //x402
const signData = "0x";  //x402
const defaultData = "0x";
const MarketManager = TTSwapMarket;
const CON_ADDRESS_0 = "0x0000000000000000000000000000000000000000";
const CON_ADDRESS_1 = "0x0000000000000000000000000000000000000001";
const CON_ADDRESS_2 = "0x0000000000000000000000000000000000000002";
const CON_ADDRESS_3 = "0x0000000000000000000000000000000000000003";
const DEFAULT_AMOUNT = BigInt(2 ** 127);
const DEFAULT_DECIMALS = 18;
const NATIVE_TOKEN = { name: "Ether", symbol: "ETH", decimals: "18" };

const isNativeToken = (address: string) =>
    address === CON_ADDRESS_1 || address === CON_ADDRESS_2;

interface BalanceResult {
    amount: string;  // 统一为 ether 单位字符串
    decimals: number;
}

interface TokenData {
    balance: string;
    decimals: string;
    name: string;
    symbol: string;
    logo_url: string;
    address: string;
}

const useWallet = () => {
    // ============ Refs ============
    const mountedRef = useRef(true);
    const abortControllerRef = useRef<AbortController | null>(null);

    // ============ 外部 Hooks ============
    const { ssionChian } = useLocalStorage();
    const { isConnected, address } = useAccount();
    const provider = useEthersProvider({ chainId: ssionChian });
    const signer = useEthersSigner({ chainId: ssionChian });
    const { swaps } = useSwap();
    const { invest } = useInvest();
    const { swapsAmount } = useSwapAmountStore();
    const { data: walletClient } = useWalletClient();

    // ============ 派生状态 ============
    const chainName = useMemo(() => getChainName(ssionChian), [ssionChian]);
    const contractAddress = useMemo(() => getContractAddress(ssionChian), [ssionChian]);
    const permit2Address = useMemo(() => getPermit2PAddress(ssionChian), [ssionChian]);
    const SWETH = useMemo(() => getSWETH(ssionChian), [ssionChian]);
    const abiCoder = useMemo(() => new AbiCoder(), []);

    // ============ State ============
    const [networkCost, setNetworkCost] = useState<string | number>(0);
    const [balanceMap, setBalanceMap] = useState<{ from: string; to: string }>({ from: "0", to: "0" });
    const [swapBalanceStatus, setSwapBalanceStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
    const [balanceRevision, setBalanceRevision] = useState(0);
    const refreshSwapBalances = useCallback(() => setBalanceRevision(n => n + 1), []);
    const [balanceMap1, setBalanceMap1] = useState<{ from: string; to: string }>({ from: "0", to: "0" });
    const [account, setAccount] = useState<string>();
    const [isActive, setIsActive] = useState(false);
    const [tokenData, setTokenData] = useState<Record<string, TokenData>>({});

    // ============ 生命周期 ============
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            // 取消进行中的请求
            abortControllerRef.current?.abort();
        };
    }, []);

    useEffect(() => {
        setIsActive(isConnected);
        if (isConnected && address) {
            setAccount(address);
        }
    }, [isConnected, address]);

    // ============ 工具函数 ============

    // 带取消和重试的请求函数
    const fetchWithRetry = useCallback(async <T,>(
        fn: () => Promise<T>,
        retries = 3,
        delay = 1000
    ): Promise<T> => {
        let lastError: any;

        for (let i = 0; i < retries; i++) {
            if (!mountedRef.current) {
                throw new Error("Component unmounted");
            }

            try {
                return await fn();
            } catch (error) {
                lastError = error;
                if (i === retries - 1) throw error;

                console.warn(`尝试 ${i + 1}/${retries} 失败，${delay}ms 后重试...`);
                await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
            }
        }

        throw lastError;
    }, []);

    // 解析代币地址
    const resolveTokenAddress = useCallback((token: string) => {
        return token === CON_ADDRESS_3 ? SWETH : token;
    }, [SWETH]);

    // ============ 余额查询（核心优化）============

    // 统一获取代币余额和精度（仅返回原始数据）
    const fetchTokenBalance = useCallback(async (tokenAddress: string, no: number, type: number): Promise<{
        balance: bigint;
        decimals: number;
    }> => {
        if (!isConnected || !tokenAddress) {
            throw new Error("Not connected or invalid address");
        }

        const resolvedAddress = resolveTokenAddress(tokenAddress);

        if (type === 1) {
            const contract = new ethers.Contract(resolvedAddress, erc20, provider);
            const [balance, decimals] = await Promise.all([
                fetchWithRetry(() => contract.balanceOf(address)),
                fetchWithRetry(() => contract.decimals()),
            ]);

            return { balance, decimals: Number(decimals) };
        } else {
            //erc1155 3:erc6909
        }
    }, [isConnected, address, provider, resolveTokenAddress, fetchWithRetry]);

    // 获取原生代币余额
    const fetchNativeBalance = useCallback(async (targetAddress: string) => {
        return fetchWithRetry(() => provider.getBalance(targetAddress));
    }, [provider, fetchWithRetry]);

    // 格式化余额（统一返回 ether 单位字符串）
    const formatBalance = useCallback((balance: bigint, decimals: number): string => {
        return ethers.formatUnits(balance, decimals);
    }, []);

    // ============ 暴露的查询函数 ============

    const tokensBalance = useCallback(async (token: string): Promise<{
        balance: string;
        decimals: number;
    }> => {
        if (!isConnected) {
            return { balance: "0", decimals: DEFAULT_DECIMALS };
        }

        try {
            const { balance, decimals } = await fetchTokenBalance(token, 0, 1);
            return {
                balance: formatBalance(balance, decimals),
                decimals
            };
        } catch (error) {
            console.error(`获取 ${token} 余额失败:`, error);
            return { balance: "0", decimals: DEFAULT_DECIMALS };
        }
    }, [isConnected, fetchTokenBalance, formatBalance]);

    const tokenBalance = useCallback(async (token: any): Promise<string> => {
        if (!isConnected) return "0";

        try {
            if (isNativeToken(token.address)) {
                const balance = await fetchNativeBalance(address!);
                return formatBalance(balance, DEFAULT_DECIMALS);
            }

            const { balance, decimals } = await fetchTokenBalance(token.address, token.no, token.type);
            return formatBalance(balance, decimals);
        } catch (error) {
            console.error(`获取 ${token.address} 余额失败:`, error);
            return "0";
        }
    }, [isConnected, address, fetchNativeBalance, fetchTokenBalance, formatBalance]);

    const tokenDesc = useCallback(async (token: string): Promise<TokenData> => {
        const defaultTokenData: TokenData = {
            balance: "0",
            decimals: "0",
            name: "",
            symbol: "",
            logo_url: "",
            address: token
        };

        if (!isConnected) return defaultTokenData;

        try {
            const logoUrl = iconUrl(chainName, token);

            if (isNativeToken(token)) {
                const balance = await fetchNativeBalance(address!);
                return {
                    ...defaultTokenData,
                    balance: formatBalance(balance, DEFAULT_DECIMALS),
                    decimals: NATIVE_TOKEN.decimals,
                    name: NATIVE_TOKEN.name,
                    symbol: NATIVE_TOKEN.symbol,
                    logo_url: logoUrl
                };
            }

            const resolvedAddress = (token);
            const contract = new ethers.Contract(resolvedAddress, erc20, provider);

            const [decimals, balance, name, symbol] = await Promise.all([
                fetchWithRetry(() => contract.decimals()),
                fetchWithRetry(() => contract.balanceOf(address)),
                fetchWithRetry(() => contract.name()),
                fetchWithRetry(() => contract.symbol())
            ]);

            return {
                balance: formatBalance(balance, Number(decimals)),
                decimals: decimals.toString(),
                name,
                symbol,
                logo_url: logoUrl,
                address: token
            };
        } catch (error) {
            console.error(`${token} 获取数据失败:`, error);
            return defaultTokenData;
        }
    }, [isConnected, address, chainName, provider, fetchNativeBalance, formatBalance, resolveTokenAddress, fetchWithRetry]);

    // ============ Swap 余额 Effect ============
    useEffect(() => {
        let cancelled = false;

        const fetchSwapBalances = async () => {
            // 重置
            if (!cancelled) setBalanceMap({ from: "0", to: "0" });

            if (!isConnected || !address) { setSwapBalanceStatus("idle"); return; }
            setSwapBalanceStatus("loading");

            const fromAddress = swaps?.from?.address;
            const toAddress = swaps?.to?.address;

            if (!fromAddress && !toAddress) { setSwapBalanceStatus("idle"); return; }

            try {
                let fromBalance = "0";
                let toBalance = "0";

                // 并行获取两个余额
                const promises: Promise<string>[] = [];

                if (fromAddress) {
                    promises.push(
                        isNativeToken(fromAddress)
                            ? fetchNativeBalance(address).then(b => formatBalance(b, DEFAULT_DECIMALS))
                            : fetchTokenBalance(fromAddress, swaps?.from?.no, swaps?.from?.type).then(({ balance, decimals }) => formatBalance(balance, decimals))
                    );
                } else {
                    promises.push(Promise.resolve("0"));
                }

                if (toAddress) {
                    promises.push(
                        isNativeToken(toAddress)
                            ? fetchNativeBalance(address).then(b => formatBalance(b, DEFAULT_DECIMALS))
                            : fetchTokenBalance(toAddress, swaps?.to?.no, swaps?.to?.type).then(({ balance, decimals }) => formatBalance(balance, decimals))
                    );
                } else {
                    promises.push(Promise.resolve("0"));
                }

                const [from, to] = await Promise.all(promises);

                if (!cancelled) {
                    setBalanceMap({ from, to });
                    setSwapBalanceStatus("ready");
                }
            } catch (error) {
                console.error("获取 swap 余额失败:", error);
                if (!cancelled) setSwapBalanceStatus("error");
            }
        };

        fetchSwapBalances();

        return () => { cancelled = true; };
    }, [isConnected, address, swaps?.from?.address, swaps?.to?.address, fetchNativeBalance, fetchTokenBalance, formatBalance, balanceRevision]);

    // ============ Invest 余额 Effect ============
    useEffect(() => {
        let cancelled = false;

        const fetchInvestBalances = async () => {
            if (!cancelled) setBalanceMap1({ from: "0", to: "0" });

            if (!isConnected || !address) return;

            const fromAddress = invest?.from?.address;

            if (!fromAddress) return;

            try {
                const fromBalance = isNativeToken(fromAddress)
                    ? await fetchNativeBalance(address).then(b => formatBalance(b, DEFAULT_DECIMALS))
                    : await fetchTokenBalance(fromAddress, invest?.from?.no, invest?.from?.type).then(({ balance, decimals }) => formatBalance(balance, decimals));

                if (!cancelled) {
                    setBalanceMap1({ from: fromBalance, to: "0" });
                }
            } catch (error) {
                console.error("获取 invest 余额失败:", error);
                if (!cancelled) setBalanceMap1({ from: "0", to: "0" });
            }
        };

        fetchInvestBalances();

        return () => { cancelled = true; };
    }, [isConnected, address, invest?.from?.address, fetchNativeBalance, fetchTokenBalance, formatBalance]);

    // ============ 其他函数（保持不变，仅修复关键问题）============

    // 合约存在性检查（添加重试）
    const checkContractExists = useCallback(async (contractAddress: string): Promise<boolean> => {
        try {
            const code = await fetchWithRetry(() => provider?.getCode(contractAddress), 2);
            return code !== '0x';
        } catch {
            return false;
        }
    }, [provider, fetchWithRetry]);


    const handleAddToken = async () => {

        const token = getPublic(ssionChian).tts;

        if (!walletClient.watchAsset) {
            alert('当前钱包不支持添加代币');
            return;
        }

        try {
            const wasAdded = await walletClient.watchAsset({
                type: 'ERC20',
                options: {
                    address: token,
                    symbol: "TTS",
                    decimals: 12
                }
            });
            return true;
            // if (wasAdded) {
            //     // 在本地存储中标记为已添加
            //     localStorage.setItem(`token_${token.address.toLowerCase()}`, 'true');
            // } else {
            //     console.log('用户取消了操作');
            // }
        } catch (error) {
            console.error('添加代币出错:', error);
        }
    };

    async function checkContractSupport(contractToken: string | ethers.Addressable, amount: any) {
        if (contractToken === CON_ADDRESS_1 || contractToken === CON_ADDRESS_2) {
            return 1;
        }
        if (contractToken === CON_ADDRESS_3) {
            contractToken = SWETH;
        }
        const tokenContract = new ethers.Contract(contractToken, erc20, signer);
        const tokenContractp = new ethers.Contract(contractToken, erc20, provider);
        const tokenSymbol = await tokenContractp.symbol();
        if (contractToken === CON_ADDRESS_1 || contractToken === CON_ADDRESS_2 || tokenSymbol === "DAI" || tokenSymbol === "dai") return 1;
        try {
            // const tx = await tokenContract.approve(permit2Address,amount);
            // await tx.wait();
            const allowance = await tokenContractp.allowance(account, permit2Address).then((allowance) => {
                console.log("该代币支持 permit2Address:", allowance, amount);
                if (allowance > amount || allowance === amount) {
                    return true;
                } else {
                    return false;
                }
            }).catch((error) => {
                return false;
            });
            if (allowance) {
                return 5;
            }
        } catch (error) {
            console.error("检查授权时出错:", error);
        }
        // if (type === 'permit') {
        try {
            const nonce = await tokenContract.nonces(account);
            const allowance = await tokenContractp.allowance(account, contractAddress).then((allowance) => {
                console.log("该代币支持 allowance:", allowance, amount);
                if (allowance > amount || allowance === amount) {
                    return true;
                } else {
                    return false;
                }
            }).catch((error) => {
                return true;
            });
            if (!allowance) {
                console.log("该代币支持 Permit，nonce:", nonce.toString());
                return 2;
            }
            return 1;
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.log("该代币不支持 Permit:", error.message);
            } else {
                console.log("该代币不支持 Permit: 未知错误");
            }
            return 1;
        }
    }

    //使用 Permit 授权 签名消息
    async function PermitSigner(contract: string, value: any, symbol: string) {
        // 代币合约实例
        const tokenContract = new ethers.Contract(contract, erc20, signer);
        const tokenContractp = new ethers.Contract(contract, erc20, provider);
        // 授权参数
        const spender = contractAddress;
        const name = await tokenContractp.name();
        const nonce = await tokenContract.nonces(account);
        const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10分钟后过期
        // 生成签名
        const domain = {
            name: name,
            version: "1",
            chainId: ssionChian, // 主网
            verifyingContract: contract,
        };
        const types = {
            Permit: [
                { name: "owner", type: "address" },
                { name: "spender", type: "address" },
                { name: "value", type: "uint256" },
                { name: "nonce", type: "uint256" },
                { name: "deadline", type: "uint256" },
            ],
        };
        const message = {
            owner: account,
            spender: spender,
            value: value,
            nonce: nonce,
            deadline: deadline,
        };
        const signature = await signer?.signTypedData(domain, types, message);
        // // 提取 v, r, s
        const { r, s, v } = ethers.Signature.from(signature);
        console.log("Signature:", ethers.Signature.from(signature));
        console.log("r:", r, name);
        console.log("s:", s);
        console.log("v:", v);
        // await tokenContract.permit('0x0F18A2428C934db7b9E040F8Fc6e08975cBEf07a',spender,'170141183460469231731687303715884105728',1741710042,);
        return { value, deadline, v, r, s };
    }

    //使用 Permit2 授权 签名消息
    async function Permit2Signer(contract: string, value: any, symbol: string) {

        const PERMIT2_ABI = [
            'function approve(address token, address spender, uint160 amount, uint48 expiration)',
            // 明确指定 PermitSingle 结构
            `function permitTransferFrom(
        ((address token, uint256 amount) permitted, uint256 nonce, uint256 deadline) permit,
        (address to, uint256 amount) transferDetails,address owner,
        bytes signature
    )`,
            'function allowance(address user, address token, address spender) public view returns (uint160 amount, uint48 expiration, uint48 nonce)'
        ];
        // 代币合约实例
        const permitContract = new ethers.Contract(permit2Address, PERMIT2_ABI, signer);
        const permitContractp = new ethers.Contract(permit2Address, Permit2, provider);
        // 授权参数
        const spender = contractAddress;
        const nonce = new Date().getTime();//await permitContractp.allowance(account, contract, contractAddress);
        const deadline = Math.floor(Date.now() / 1000) + 60 * 100; // 10分钟后过期
        const expiration = Math.floor(Date.now() / 1000) + 60 * 100; // 10分钟后过期
        console.log(1000, nonce)
        // 生成签名
        const domain = {
            name: 'Permit2',
            chainId: ssionChian, // 主网
            verifyingContract: permit2Address,
        };
        // const types = {
        //     PermitSingle: [
        //         { name: 'details', type: 'PermitDetails' },
        //         { name: 'spender', type: 'address' },
        //         { name: 'sigDeadline', type: 'uint256' }
        //     ],
        //     PermitDetails: [
        //         { name: 'token', type: 'address' },
        //         { name: 'amount', type: 'uint160' },
        //         { name: 'expiration', type: 'uint48' },
        //         { name: 'nonce', type: 'uint48' }
        //     ]
        // };
        // const message = {
        //     details: {
        //         token: contract,
        //         amount: value,
        //         expiration: expiration,
        //         nonce: nonce
        //     },
        //     spender: spender,
        //     sigDeadline: deadline
        // };
        const types = {
            PermitTransferFrom: [
                { name: 'permitted', type: 'TokenPermissions' },
                { name: 'spender', type: 'address' },
                { name: 'nonce', type: 'uint256' },
                { name: 'deadline', type: 'uint256' }
            ],
            TokenPermissions: [
                { name: 'token', type: 'address' },
                { name: 'amount', type: 'uint256' }
            ]
        };
        const message = {
            permitted: {
                token: contract,
                amount: value
            },
            spender: spender,
            nonce: nonce,
            deadline: deadline
        };

        const signature = await signer?.signTypedData(domain, types, message);
        console.log(10001)
        // // 提取 v, r, s
        const { r, s, v } = ethers.Signature.from(signature);
        console.log("Signature:", ethers.Signature.from(signature));
        console.log("r:", r);
        console.log("s:", s);
        console.log("v:", v);
        // 构建transfer参数
        // const transferParams = {
        //     // from: account,
        //     to: contractAddress,
        //     amount: value
        // };

        // const messages = {
        //     permitted: {
        //         token: contract,
        //         amount: value
        //     },
        //     nonce: nonce,
        //     deadline: deadline
        // };
        // try {
        // 构建交易数据
        // const txData = permitContract.interface.encodeFunctionData(
        //     'permitTransferFrom',
        //     [message, transferParams, signature]
        // );
        // // 6. 估算gas
        // const gasEstimate = await provider?.estimateGas(
        //     { from: account, to: permit2Address, data: txData }
        // ).catch(error => {
        //     console.error('Gas估算失败:', error);
        //     // 返回一个默认值
        //     return BigInt(300000);
        // });
        // console.log('gasEstimate  :', gasEstimate);
        //     const permitTx = await permitContract.approve(
        //         contract, permit2Address, value,expiration
        //     );

        //     console.log('Permit2授权交易已发送:', permitTx.hash);
        //     await permitTx.wait();
        //     console.log('Permit2授权已确认');
        // } catch (error) {
        //     console.error('Permit2 error occurred:', error);
        // }
        return { value, deadline, nonce, v, r, s };
    }

    //获取签名信息
    async function signerData(address: string, amount: any, symbol: string, maxApprove: boolean, progress?: (value: SwapProgress) => void) {
        // const { value, deadline, v, r, s } = await PermitSigner(address, amount, symbol);
        const a = await checkContractSupport(address, amount);
        console.log("1110----", amount, a)
        let transferData: string;
        let approveAmount = amount;
        if (maxApprove) {
            approveAmount = DEFAULT_AMOUNT;
        }
        if (a === 2) {
            progress?.({ phase: "signing" });
            const types = ["tuple(uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)"];
            const { value, deadline, v, r, s } = await PermitSigner(address, approveAmount, symbol);
            const values = [{
                value: value,
                deadline: deadline,
                v: v,
                r: r,
                s: s
            }];
            console.log(1110678678, values)
            const sigdata = abiCoder.encode(types, values);
            // console.log(1111111, sigdata)
            transferData = abiCoder.encode(["tuple(uint8 transfertype, bytes sigdata)"], [{ transfertype: a, sigdata: sigdata }]);
            // console.log(2222222, transferData)
        } else if (a === 5) {
            progress?.({ phase: "signing" });
            const types = ["tuple(uint256 value, uint256 deadline, uint256 nonce, uint8 v, bytes32 r, bytes32 s)"];
            const { value, deadline, nonce, v, r, s } = await Permit2Signer(address, amount, symbol);
            const values = [{
                value: value,
                deadline: deadline,
                nonce: nonce,
                v: v,
                r: r,
                s: s
            }];
            console.log(1110, values)
            const sigdata2 = abiCoder.encode(types, values);
            transferData = abiCoder.encode(["tuple(uint8 transfertype, bytes sigdata)"], [{ transfertype: a, sigdata: sigdata2 }]);
        } else {
            transferData = defaultData;
        }
        // console.log(333333, a, transferData, approveAmount)
        return { a, transferData, approveAmount };
    }


    const upTokenSet = async (id: string, wallet: string, config: string) => {
        console.log("upTokenSet", id, wallet, config);

        try {
            //const signer = await provider.getSigner()
            const contract = new ethers.Contract(contractAddress, MarketManager, signer);
            return await contract.modifyGoodByGoodOwner(id, config, wallet, signData).then(async (transaction) => {
                console.log('Transaction sent:', transaction);
                return await confirmSwapTransaction(transaction, () => {});
            }).catch((error: any) => {
                return errorData(error);
            });
        } catch {
            return false;
        }
    }
    const collect = async (ids: any) => {

        try {
            //const signer = await provider.getSigner()
            const contract = new ethers.Contract(contractAddress, MarketManager, signer);
            console.log(ids);
            return await contract.collectCommission(ids, address, signData).then(async (transaction) => {
                console.log('Transaction sent:', transaction);
                return await confirmSwapTransaction(transaction, () => {});
            }).catch((error: any) => {
                return errorData(error);
            });
        } catch {
            return false;
        }
    }

    // const checkContractExists = async (contract: any) => {
    //     try {
    //         const code = await retry(() => provider?.getCode(contract));
    //         // console.log(code)
    //         return code !== '0x';
    //     } catch {
    //         return false;
    //     }
    // }

    const faucetTestCion = async (wallet: string, contractA: string) => {

        try {
            //const signer = await provider.getSigner()
            const contract = new ethers.Contract(contractA, erc20, signer);

            return await contract.mint(wallet).then((transaction) => {
                console.log('Transaction sent:', transaction);
                return true;
            }).catch((error: any) => {
                console.error('出错:', error);
                return false;
            });
        } catch (e) {
            return false;

        }
    }


    const disinvest = async (pid: number, qut: any) => {

        //const signer = await provider.getSigner()
        const contract = new ethers.Contract(contractAddress, MarketManager, signer);

        console.log("disinvest-----", pid, qut, portal);
        return await contract.disinvestProof(pid, qut, portal, address, signData).then(async (transaction) => {
            console.log('Transaction sent:', transaction);
            return await confirmSwapTransaction(transaction, () => {});
        }).catch((error: any) => {
            return errorData(error);
        });
    }

    const newGoods = async (num1: number, num2: number, addr: string, ercType: number, ercId: number, maxApprove: boolean) => {
        addr = addr.toLowerCase();
        console.log("newGoods-----", num1, num2, addr, ercType, ercId, maxApprove);
        const goodKey = { ercType: ercType, contractAddress: addr, id: ercId };
        try {
            //const signer = await provider.getSigner()
            const contract = new ethers.Contract(contractAddress, MarketManager, signer);

            let decimals = 18;
            let nameG: string;
            if (addr === CON_ADDRESS_3) {
                addr = SWETH;
            }
            if (addr === CON_ADDRESS_1 || addr === CON_ADDRESS_2) {
                decimals = 18;
            } else if (ethers.isAddress(addr)) {
                decimals = await new ethers.Contract(addr, erc20, provider).decimals();
                nameG = await new ethers.Contract(addr, erc20, provider).name();
            } else return false;

            let fAmount = BigInt(0);
            let tAmount = BigInt(0);
            if (num2 > 0) {
                fAmount = BigInt(Math.floor(num2 * num1));
            }
            if (num1 > 0) {
                tAmount = BigInt(num1 * powerIterative(10, decimals));
            }
            const qunt = BigInt(fAmount * BigInt(2 ** 128) + tAmount);
            console.log("*****111111****", decimals, fAmount, tAmount, qunt)

            let allowanceV: any;
            let allowanceB: boolean;
            let approveV: any;
            let approveB: boolean;
            let approveS: any;
            let initGoodVA: boolean;
            let initGoodV = BigInt(0);

            const t = await signerData(addr, tAmount, nameG, maxApprove);
            const aT = t.a;
            const approveAmountT = t.approveAmount;
            const transferDataT = t.transferData;

            if (!ethers.isAddress(addr)) return;

            if (addr === CON_ADDRESS_1 || addr === CON_ADDRESS_2) {
                // addr = CON_ADDRESS_1;
                initGoodV = tAmount;
                initGoodVA = true;
                allowanceB = true;
            } else {
                if (aT === 1) {
                    const contractAllow = new ethers.Contract(addr, erc20, provider);
                    allowanceB = await contractAllow.allowance(account, contractAddress).then((allowance) => {
                        console.log("aT--", addr, allowance, tAmount)
                        if (allowance > tAmount || allowance === tAmount) {
                            return true;
                        } else {
                            return false;
                        }
                    }).catch((error) => {
                        return false;
                    });
                } else {
                    allowanceB = true;
                }
            }
            if (allowanceB) {
                approveB = true;
            } else {
                const contractT = new ethers.Contract(addr, erc20, signer);
                approveB = await contractT.approve(contractAddress, approveAmountT).then((transaction) => {
                    return transaction.wait().then(() => {
                        return true;
                    }).catch(() => {
                        return false;
                    });
                }).catch(() => {
                    return false;
                });
                if (!approveB) return false;
            }
            console.log(1111, allowanceV, allowanceB, approveS, initGoodV, initGoodVA, approveV, approveB)
            if (approveB) {
                if (addr === SWETH) {
                    addr = CON_ADDRESS_3;
                }
                if (initGoodVA) {
                    console.log(2222, goodKey, qunt, transferDataT, address, signData, initGoodV,contract)
                    return await contract.initGood(goodKey, qunt, transferDataT, address, signData, { value: initGoodV }).then(async (transaction) => {
                        return await confirmSwapTransaction(transaction, () => {});
                    }).catch((error: any) => {
                        return errorData(error);
                    });
                } else {
                    console.log(3333, goodKey, qunt, transferDataT, address, signData,contract)
                    return await contract.initGood(goodKey, qunt, transferDataT, address, signData).then(async (transaction) => {
                        return await confirmSwapTransaction(transaction, () => {});
                    }).catch((error: any) => {
                        return errorData(error);
                    });
                }
            }

        } catch (error) {
            return errorData(error);
        }
    }

    // ... existing code ...

    function errorData(error: unknown) {
        console.error('Transaction failed:', error);

        // 检查错误对象是否有 data 属性
        if (error instanceof Error) {
            // 处理不同类型的错误对象
            let errorDataField = null;

            // 检查错误对象本身是否有 data 属性
            if ('data' in error && error.data) {
                errorDataField = error.data;
            }
            // 检查错误对象是否有 error 属性，这在某些 RPC 错误中常见
            else if ('error' in error && typeof error.error === 'object' && error.error && 'data' in error.error) {
                errorDataField = error.error.data;
            }
            // 对于一些其他常见的错误格式
            else if ('info' in error && typeof error.info === 'object' && error.info && 'error' in error.info && typeof error.info.error === 'object' && error.info.error && 'data' in error.info.error) {
                errorDataField = error.info.error.data;
            }
            console.error('errorDataField:', errorDataField);
            if (errorDataField) {
                console.error('Transaction failed with data:', errorDataField);

                // 根据错误数据的类型进行处理
                if (typeof errorDataField === 'string') {
                    // 处理字符串类型的错误数据（通常是十六进制编码）
                    if (errorDataField.startsWith('0x')) {
                        // 如果只是简单的错误函数签名（如 "0xf27f64e4"），则去掉 "0x" 并返回
                        if (errorDataField.length === 10) { // "0x" + 8个字符 = 10个字符
                            const errorSignature = errorDataField.substring(2); // 去掉 "0x" 前缀
                            console.error('Simple error signature:', errorSignature);
                            return errorSignature;
                        }

                        // 处理更复杂的错误数据（包含参数）
                        if (errorDataField.length > 10) {
                            try {
                                const errorSignature = errorDataField.slice(0, 10); // 获取错误函数签名（前4字节）
                                const errorArgsData = "0x" + errorDataField.slice(10); // 获取参数数据

                                console.error('Error signature:', errorSignature);
                                console.error('Error args data (hex):', errorArgsData);

                                // 解析错误参数
                                let decodedError = null;

                                // 尝试解码为 uint256（原代码逻辑）
                                if (errorArgsData.length >= 64) { // 至少有32字节的数据
                                    try {
                                        const [code] = abiCoder.decode(["uint256"], errorArgsData);
                                        console.error('Decoded uint256 error code:', code.toString());
                                        decodedError = code.toString();
                                    } catch (decodeError) {
                                        console.warn('Could not decode as uint256:', decodeError);
                                    }
                                }

                                // 如果上面的解码失败，尝试作为字符串错误消息
                                if (!decodedError) {
                                    try {
                                        // 尝试解码为字符串
                                        const [errorMessage] = abiCoder.decode(["string"], errorArgsData);
                                        console.error('Decoded string error message:', errorMessage);
                                        decodedError = errorMessage;
                                    } catch (decodeError) {
                                        console.warn('Could not decode as string:', decodeError);
                                    }
                                }

                                // 如果还是无法解码，返回原始错误签名（去掉0x前缀）
                                if (!decodedError) {
                                    decodedError = errorSignature.substring(2); // 去掉 "0x" 前缀
                                }

                                return decodedError;
                            } catch (parseError) {
                                console.error('Failed to parse error data:', parseError);
                                // 如果解析复杂数据失败，返回去掉0x前缀的原始数据
                                return errorDataField.substring(2); // 去掉 "0x" 前缀
                            }
                        } else {
                            // 只有 "0x" 前缀但长度不足10的情况，返回去掉0x前缀的原始数据
                            return errorDataField.substring(2); // 去掉 "0x" 前缀
                        }
                    } else {
                        // 不是有效的十六进制错误数据，直接返回
                        return errorDataField;
                    }
                }
                // 如果错误数据是一个对象
                else if (typeof errorDataField === 'object') {
                    console.error('Complex error data object:', errorDataField);

                    // 检查是否是包含 message 的对象
                    if ('message' in errorDataField && typeof errorDataField.message === 'string') {
                        return errorDataField.message;
                    }
                    // 检查是否是包含 data 字段的对象（嵌套情况）
                    else if ('data' in errorDataField && typeof errorDataField.data === 'string') {
                        const errorStr = errorDataField.data;
                        // 应用相同的十六进制数据处理逻辑
                        if (errorStr.startsWith('0x')) {
                            if (errorStr.length === 10) { // "0x" + 8个字符 = 10个字符
                                return errorStr.substring(2); // 去掉 "0x" 前缀
                            } else if (errorStr.length > 10) {
                                try {
                                    const errorArgsData = "0x" + errorStr.slice(10);
                                    let decodedError = null;

                                    if (errorArgsData.length >= 64) {
                                        try {
                                            const [code] = abiCoder.decode(["uint256"], errorArgsData);
                                            decodedError = code.toString();
                                        } catch (decodeError) {
                                            console.warn('Could not decode as uint256:', decodeError);
                                        }
                                    }

                                    if (!decodedError) {
                                        decodedError = errorStr.substring(2); // 去掉 "0x" 前缀
                                    }

                                    return decodedError;
                                } catch (parseError) {
                                    console.error('Failed to parse nested error data:', parseError);
                                    return errorStr.substring(2); // 去掉 "0x" 前缀
                                }
                            } else {
                                return errorStr.substring(2); // 去掉 "0x" 前缀
                            }
                        } else {
                            return errorStr;
                        }
                    }
                    // 返回整个对象的字符串表示
                    else {
                        return false;
                        // try {
                        //     return JSON.stringify(errorDataField);
                        // } catch (stringifyError) {
                        //     console.error('Could not stringify error object:', stringifyError);
                        //     return String(errorDataField);
                        // }
                    }
                }
                // 其他类型的错误数据
                else {
                    return String(errorDataField);
                }
            }
        }

        // 如果没有找到错误数据或不是 Error 实例，则返回 false
        console.error('An unknown error occurred:', error);
        return false;
    }

    // ... existing code ...

    const investGoods = async (invest: any, famount: any, tamount: any, isValueGood: boolean, maxApprove: boolean) => {

        console.log("investGoods",famount,tamount)
        const goodKey = { ercType: 1, contractAddress: invest.from.address, id: 0 };
        try {

            const contract = new ethers.Contract(contractAddress, MarketManager, signer);
            console.log(0)

            let allowanceF: boolean;
            // let allowanceT;
            let approveF: boolean;
            // let approveT;
            // let approveS;
            let investGoodVA: boolean;
            let investGoodV = BigInt(0);

            let fromAddress = invest.from.address;
            let toAddress = invest.to.address;
            if (fromAddress === CON_ADDRESS_3) {
                fromAddress = SWETH;
            }
            if (toAddress === CON_ADDRESS_3) {
                toAddress = SWETH;
            }
            const qunt = BigInt(tamount * BigInt(2 ** 128) + famount);
            const f = await signerData(fromAddress, famount, invest.from.symbol, maxApprove);
            const aF = f.a;
            const approveAmountF = f.approveAmount;
            const transferDataF = f.transferData;
            // let aT;
            // let approveAmountT;
            // let transferDataT = defaultData;
            // if (isValueGood) {
            if (fromAddress === CON_ADDRESS_1 || fromAddress === CON_ADDRESS_2) {
                allowanceF = true;
                investGoodV = famount;
                investGoodVA = true;
                // allowanceT = true;
            } else {
                // allowanceT = true;
                if (aF === 1) {
                    const contractAllowF = new ethers.Contract(fromAddress, erc20, provider);
                    allowanceF = await contractAllowF.allowance(account, contractAddress).then((allowance) => {
                        if (allowance > famount || allowance === famount) {
                            return true;
                        } else {
                            return false;
                        }
                    }).catch((error) => {
                        return false;
                    });
                } else {
                    allowanceF = true;
                }
            }
            // }
            // } else {
            //     const t = await signerData(toAddress, tamount, invest.to.symbol, maxApprove);
            //     aT = t.a;
            //     approveAmountT = t.approveAmount;
            //     transferDataT = t.transferData;

            //     if (fromAddress === CON_ADDRESS_1 || fromAddress === CON_ADDRESS_2) {
            //         allowanceF = true;
            //         investGoodV = famount;
            //         investGoodVA = true;
            //         if (aT === 1) {
            //             const contractAllowT = new ethers.Contract(toAddress, erc20, provider);
            //             allowanceT = await contractAllowT.allowance(account, contractAddress).then((allowance) => {
            //                 console.log(allowance, tamount)
            //                 if (allowance > tamount || allowance === tamount) {
            //                     return true;
            //                 } else {
            //                     return false;
            //                 }
            //             }).catch((error) => {
            //                 return false;
            //             });
            //         } else {
            //             allowanceT = true;
            //         }
            //     } else if (toAddress === CON_ADDRESS_1 || toAddress === CON_ADDRESS_2) {
            //         allowanceT = true;
            //         investGoodV = tamount;
            //         investGoodVA = true;
            //         if (aF === 1) {
            //             const contractAllowF = new ethers.Contract(fromAddress, erc20, provider);
            //             allowanceF = await contractAllowF.allowance(account, contractAddress).then((allowance) => {
            //                 if (allowance > famount || allowance === famount) {
            //                     return true;
            //                 } else {
            //                     return false;
            //                 }
            //             }).catch((error) => {
            //                 return false;
            //             });
            //         } else {
            //             allowanceF = true;
            //         }

            //     } else if (toAddress === CON_ADDRESS_1 || toAddress === CON_ADDRESS_2 || fromAddress === CON_ADDRESS_1 || fromAddress === CON_ADDRESS_2) {
            //         investGoodV = tamount + famount;
            //         investGoodVA = true;
            //         allowanceT = true;
            //         allowanceF = true;
            //     } else if (toAddress === fromAddress) {
            //         const contractAllowF = new ethers.Contract(fromAddress, erc20, provider);
            //         allowanceF = await contractAllowF.allowance(account, contractAddress).then((allowance) => {
            //             console.log(allowance, (famount + tamount))
            //             if (allowance > (famount + tamount) || allowance === (famount + tamount)) {
            //                 allowanceT = true;
            //                 return true;
            //             } else {
            //                 approveS = true;
            //                 return false;
            //             }
            //         }).catch((error) => {
            //             console.log(error)
            //             approveS = true;
            //             return false;
            //         });
            //     } else {

            //         if (aT === 1) {
            //             const contractAllowT = new ethers.Contract(toAddress, erc20, provider);
            //             allowanceT = await contractAllowT.allowance(account, contractAddress).then((allowance) => {
            //                 console.log(allowance, tamount)
            //                 if (allowance > tamount || allowance === tamount) {
            //                     return true;
            //                 } else {
            //                     return false;
            //                 }
            //             }).catch((error) => {
            //                 return false;
            //             });
            //         } else {
            //             allowanceT = true;
            //         }
            //         if (aF === 1) {
            //             const contractAllowF = new ethers.Contract(fromAddress, erc20, provider);
            //             allowanceF = await contractAllowF.allowance(account, contractAddress).then((allowance) => {
            //                 if (allowance > famount || allowance === famount) {
            //                     return true;
            //                 } else {
            //                     return false;
            //                 }
            //             }).catch((error) => {
            //                 return false;
            //             });
            //         } else {
            //             allowanceF = true;
            //         }
            //     }
            // }


            // if (approveS) {
            //     const contractF = new ethers.Contract(fromAddress, erc20, signer);
            //     approveF = await contractF.approve(contractAddress, famount + tamount).then((transaction) => {
            //         return transaction.wait().then(() => {
            //             allowanceT = true;
            //             return true;
            //         }).catch(() => {
            //             return false;
            //         });
            //     }).catch(() => {
            //         return false;
            //     });
            // } else {
            if (allowanceF) {
                approveF = true;
            } else {
                const contractF = new ethers.Contract(fromAddress, erc20, signer);
                approveF = await contractF.approve(contractAddress, approveAmountF).then((transaction) => {
                    return transaction.wait().then(() => {
                        return true;
                    }).catch(() => {
                        return false;
                    });
                }).catch(() => {
                    return false;
                });
            }
            // if (approveF) {
            //     if (allowanceT) {
            //         approveT = true;
            //     } else {
            //         const contractT = new ethers.Contract(toAddress, erc20, signer);
            //         approveT = await contractT.approve(contractAddress, approveAmountT).then((transaction) => {
            //             return transaction.wait().then(() => {
            //                 return true;
            //             }).catch(() => {
            //                 return false;
            //             });
            //         }).catch(() => {
            //             return false;
            //         });
            //         if (!approveT) return false;
            //     }
            // } else return false;
            // }

            if (approveF) {
                // if (isValueGood) { 
                console.log('investGood params:', goodKey, qunt, transferDataF, signData, address);
                if (investGoodVA) {
                    return await contract.investGood(goodKey, qunt, transferDataF, signData, address, { value: investGoodV }).then(async (transaction) => {
                        return await confirmSwapTransaction(transaction, () => {});
                    }).catch((error: any) => {
                        return errorData(error);
                    });
                } else {
                    return await contract.investGood(goodKey, qunt, transferDataF, signData, address).then(async (transaction) => {
                        return await confirmSwapTransaction(transaction, () => {});
                    }).catch((error: any) => {
                        return errorData(error);
                    });
                }
                // } else {
                //     if (investGoodVA) {
                //         return await contract.investGood(invest.from.id, invest.to.id, famount, transferDataF, transferDataT, address, signData, { value: investGoodV }).then((transaction) => {
                //             console.log('Transaction sent1:', transaction);
                //             return true;
                //         }).catch((error: any) => {
                //             return errorData(error);
                //         });
                //     } else {
                //         return await contract.investGood(invest.from.id, invest.to.id, famount, transferDataF, transferDataT, address, signData).then((transaction) => {
                //             console.log('Transaction sent2:', transaction);
                //             return true;
                //         }).catch((error: any) => {
                //             return errorData(error);
                //         });
                //     }

                // }
            }
        } catch (error) {
            return errorData(error);
        };

    };

    const swapBuyGood = async (params: any, amount: any, tokenAddress: string, symbol: string, maxApprove: boolean, refer: string, onProgress?: (value: SwapProgress) => void) => {
        let broadcast = false;
        const progress = (value: SwapProgress) => {
            if (value.phase === "pending" || value.phase === "approvalPending") broadcast = true;
            if (value.phase === "submitting") broadcast = false;
            onProgress?.(value);
        };
        try {
            if (!signer) throw new Error("Wallet unavailable");
            progress({ phase: "preparing" });
            const wallet = await signer.getAddress();
            const contract = new ethers.Contract(contractAddress, MarketManager, signer);
            const goodKey1 = { ercType: 1, contractAddress: params[0], id: 0 };
            const goodKey2 = { ercType: 1, contractAddress: params[1], id: 0 };
            const resolvedAddress = tokenAddress === CON_ADDRESS_3 ? SWETH : tokenAddress;
            let reference = localStorage.getItem("reference");
            if (!reference || !ethers.isAddress(reference) || reference === resolvedAddress || refer !== "#") reference = CON_ADDRESS_0;
            const { a, transferData, approveAmount } = await signerData(resolvedAddress, amount, symbol, maxApprove, progress);
            if (!isNativeToken(resolvedAddress) && a === 1) {
                const tokenContract = new ethers.Contract(resolvedAddress, erc20, signer);
                const allowance = await tokenContract.allowance(wallet, contractAddress);
                if (allowance < amount) {
                    progress({ phase: "approving" });
                    const approval = await tokenContract.approve(contractAddress, approveAmount);
                    const approved = await confirmSwapTransaction(approval, value => progress({
                        phase: value.phase === "pending" ? "approvalPending" : value.phase === "confirmed" ? "preparing" : "failed", hash: value.hash,
                    }));
                    if (!approved) return false;
                }
            }
            progress({ phase: "submitting" });
            const args = [goodKey1, goodKey2, params[2], reference, transferData, wallet, signData, 0];
            const transaction = isNativeToken(resolvedAddress)
                ? await contract.buyGood(...args, { value: amount })
                : await contract.buyGood(...args);
            const confirmed = await confirmSwapTransaction(transaction, progress);
            if (confirmed) refreshSwapBalances();
            return confirmed;
        } catch (error) {
            // A missing RPC receipt does not prove that an already broadcast transaction failed.
            if (!broadcast) progress({ phase: "failed" });
            return errorData(error);
        }
    };

    const ttsPublic = async (amount: any, onProgress?: (value: SwapProgress) => void) => {
        try {
            if (!signer || !isConnected) throw new Error("Wallet is not connected");
            const { tts, usdt } = getPublic(ssionChian);
            const contract = new ethers.Contract(tts, TTS, signer);
            const payment = new ethers.Contract(usdt, erc20, signer);
            const owner = await signer.getAddress();
            onProgress?.({ phase: "preparing" });
            const balance = await payment.balanceOf(owner);
            if (balance < amount) throw new Error("Insufficient USDT balance");
            if (await payment.allowance(owner, tts) < amount) {
                onProgress?.({ phase: "approving" });
                const approval = await payment.approve(tts, amount);
                const confirmed = await confirmSwapTransaction(approval, value => onProgress?.({ ...value, phase: value.phase === "pending" ? "approvalPending" : value.phase === "confirmed" ? "preparing" : value.phase }));
                if (!confirmed) return false;
            }
            onProgress?.({ phase: "submitting" });
            const transaction = await contract.publicSell(amount, defaultData);
            return await confirmSwapTransaction(transaction, value => onProgress?.(value));
        } catch (error) { throw error; }
    };


    const lockToken = async (id: string, wallet: string) => {
        console.log("upTokenSet", id, wallet);

        try {
            //const signer = await provider.getSigner()
            const contract = new ethers.Contract(contractAddress, MarketManager, signer);
            return await contract.lockGood(id, wallet, signData).then(async (transaction) => {
                console.log('Transaction sent:', transaction);
                return await confirmSwapTransaction(transaction, () => {});
            }).catch((error: any) => {
                return errorData(error);
            });
        } catch {
            return false;
        }
    }


    const setingToken = async (id: string, wallet: string, config: string) => {
        console.log("upTokenSet-modifyGoodByManager", id, wallet, config);

        try {
            //const signer = await provider.getSigner()
            const contract = new ethers.Contract(contractAddress, MarketManager, signer);
            return await contract.modifyGoodByManager(id, config, wallet, signData).then(async (transaction) => {
                console.log('Transaction sent:', transaction);
                return await confirmSwapTransaction(transaction, () => {});
            }).catch((error: any) => {
                return errorData(error);
            });
        } catch {
            return false;
        }
    }


    const setingTokenAdmin = async (id: string, wallet: string, config: string) => {
        console.log("upTokenSet-modifyGoodByAdmin", id, wallet, config);

        try {
            //const signer = await provider.getSigner()
            const contract = new ethers.Contract(contractAddress, MarketManager, signer);
            return await contract.modifyGoodByAdmin(id, config, wallet, signData).then(async (transaction) => {
                console.log('Transaction sent:', transaction);
                return await confirmSwapTransaction(transaction, () => {});
            }).catch((error: any) => {
                return errorData(error);
            });
        } catch {
            return false;
        }
    }


    const updateNetworkVia = async (id: any) => {
        const params: any = getAddChainParameters(id);
        console.log("upTokenSet", params);

        try {
            // 先尝试切换到网络，如果失败再尝试添加网络
            if (typeof window !== 'undefined' && window.ethereum) {
                // 确保chainId是数字，然后转换为十六进制格式
                let chainIdNum: number;
                if (typeof params.chainId === 'string') {
                    // 如果chainId已经是十六进制字符串，则解析它；否则假设它是十进制字符串
                    if (params.chainId.startsWith('0x')) {
                        chainIdNum = parseInt(params.chainId, 16);
                    } else {
                        chainIdNum = parseInt(params.chainId, 10);
                    }
                } else {
                    chainIdNum = params.chainId;
                }
                const hexChainId = `0x${chainIdNum.toString(16)}`;

                try {
                    const addChainParams = {
                        chainId: hexChainId,
                        chainName: params.chainName,
                        nativeCurrency: params.nativeCurrency,
                        rpcUrls: params.rpcUrls,
                        blockExplorerUrls: params.blockExplorerUrls,
                    };

                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [addChainParams]
                    });
                } catch (switchError: any) {
                }
            } else {
                console.warn('Ethereum object not found in window');
            }
        } catch (error) {
            console.error(error);
        }
    }
    // console.log(networkCost)
    return {
        balanceMap,
        swapBalanceStatus,
        refreshSwapBalances,
        balanceMap1,
        networkCost,
        swapBuyGood,      // 保持原有实现
        investGoods,      // 保持原有实现
        newGoods,         // 保持原有实现
        disinvest,        // 保持原有实现
        faucetTestCion,   // 保持原有实现
        checkContractExists,
        collect,          // 保持原有实现
        upTokenSet,       // 保持原有实现
        tokenDesc,
        ttsPublic,        // 保持原有实现
        tokenBalance,
        handleAddToken,   // 保持原有实现
        lockToken,        // 保持原有实现
        setingToken,      // 保持原有实现
        setingTokenAdmin, // 保持原有实现
        updateNetworkVia, // 保持原有实现
        tokensBalance,    // 新增暴露
    };
};


export default useWallet;
