import { assertQuoteLiquidity, assertQuoteStep } from "@/utils/tradeSafety";
import { useSwapStore } from "@/stores/swap";
import { useSwapAmountStore } from "@/stores/swapAmount";
import { SwapKeys } from "@/types/common";
import { useMemo, useState, useEffect } from "react";
import { DEFAULT_TOKEN } from "@/types/common";
// import { toast } from "react-toastify";
import { useAccount } from 'wagmi';

const useSwap = () => {
    const { isConnected } = useAccount();
    const { swaps, setSwap } = useSwapStore();
    const { swapsAmount, setSwapAmount } = useSwapAmountStore();
    const [focus, setFocus] = useState("from");
    const [isHandleFlip, setIsHandleFlip] = useState(false);

    const setToken = (element: string, value: any) => {
        // console.log(element,value, 4444)
        if (value) {

            if (element === SwapKeys.From) {
                if (swaps.to.id === value.id) {
                    handleFlip();
                    return;
                }
                setSwap({
                    from: {
                        id: value.id,
                        name: value.name,
                        symbol: value.symbol,
                        buyFee: value.buyFee,
                        sellFee: value.sellFee,
                        price: value.price,
                        logo_url: value.logo_url,
                        address: value.address,
                        currentQuantity: value.currentQuantity,
                        currentValue: value.currentValue,
                        decimals: value.decimals,
                        isvaluegood: value.isvaluegood,
                        no: value.no,
                        type: value.type,
                    },
                    to: {
                        id: swaps.to.id,
                        name: swaps.to.name,
                        symbol: swaps.to.symbol,
                        buyFee: swaps.to.buyFee,
                        sellFee: swaps.to.sellFee,
                        price: swaps.to.price,
                        logo_url: swaps.to.logo_url,
                        address: swaps.to.address,
                        currentQuantity: swaps.to.currentQuantity,
                        currentValue: swaps.to.currentValue,
                        decimals: swaps.to.decimals,
                        isvaluegood: swaps.to.isvaluegood,
                        no: swaps.to.no,
                        type: swaps.to.type,
                    },
                });
            } else {
                if (swaps.from.id === value.id) {
                    handleFlip();
                    return;
                }
                setSwap({
                    from: {
                        id: swaps.from.id,
                        name: swaps.from.name,
                        symbol: swaps.from.symbol,
                        buyFee: swaps.from.buyFee,
                        sellFee: swaps.from.sellFee,
                        price: swaps.from.price,
                        logo_url: swaps.from.logo_url,
                        address: swaps.from.address,
                        currentQuantity: swaps.from.currentQuantity,
                        currentValue: swaps.from.currentValue,
                        decimals: swaps.from.decimals,
                        isvaluegood: swaps.from.isvaluegood,
                        no: swaps.from.no,
                        type: swaps.from.type,
                    },
                    to: {
                        id: value.id,
                        name: value.name,
                        symbol: value.symbol,
                        buyFee: value.buyFee,
                        sellFee: value.sellFee,
                        price: value.price,
                        logo_url: value.logo_url,
                        address: value.address,
                        currentQuantity: value.currentQuantity,
                        currentValue: value.currentValue,
                        decimals: value.decimals,
                        isvaluegood: value.isvaluegood,
                        no: value.no,
                        type: value.type,
                    },
                });
            }
            // console.log(focus, "******", swaps)
            // if (focus === SwapKeys.From) {
            //     setAmount(focus, swapsAmount.from.amount)
            // } else {
            //     setAmount(focus, swapsAmount.to.amount)
            // }
        }
    };

    const cionNum = (value: number, data: any, type: number) => {
        if (!Number.isFinite(Number(value)) || Number(value) <= 0) return 0;
        assertQuoteLiquidity(data);
        let steps = 0;
        const guardStep = (step: number, remaining: number) => {
            assertQuoteStep(step, remaining, ++steps);
        };
        if (type === 0) {
            // let fa = value * 10 ** swaps.from.decimals;
            // fa = fa - fa * swaps.from.sellFee;
            // const rv = 2 * Number(data.fromValue) * Number(data.toQuan) * fa;
            // const rv1 = 2 * Number(data.toValue) * Number(data.fromQuan) + Number(data.toValue) * fa + Number(data.fromValue) * fa;
            // const ta = rv / rv1;
            // let tnum = (ta - ta * swaps.to.buyFee) / 10 ** swaps.to.decimals;
            // tnum = Math.floor(tnum * 1e6) / 1e6;
            // // tnum = Number(tnum.toFixed(6));
            // console.log(value, 8980);
            if (value > 0) {
                const baseAmount = value * 10 ** swaps.from.decimals;
                let remainingAmount = baseAmount;
                let fromQuantity = Number(data.fromQuan);
                let totalValue = 0;

                while (remainingAmount > 0) {
                    const stepSize = Math.min(remainingAmount, fromQuantity / 100);
                    guardStep(stepSize, remainingAmount);

                    totalValue += Math.trunc((2 * stepSize * Number(data.fromValue)) / (2 * fromQuantity + stepSize));

                    // 更新池状态
                    fromQuantity += stepSize;
                    remainingAmount -= stepSize;
                }

                console.log("---ff--", remainingAmount, fromQuantity, totalValue, data);

                // 步骤3：将累积的价值转换为目标代币数量
                let toValue = Number(data.toValue);
                let toQuantity = Number(data.toQuan);
                let totalOutput = 0;
                let remainingValue = totalValue;
                let st1 = 0;

                while (remainingValue > 0) {

                    const stepSize = Math.min(remainingValue, toValue / 100);
                    guardStep(stepSize, remainingValue);
                    console.log("---ss--", stepSize, remainingValue);
                    if (stepSize > 0) {
                        st1 = (2 * stepSize * toQuantity) / (2 * toValue + stepSize);

                        // 更新池状态
                        toQuantity -= st1;
                        remainingValue -= stepSize;
                        totalOutput += st1;
                    }
                }

                console.log("---tt--", toValue, toQuantity, remainingValue, totalOutput);
                return +((totalOutput - totalOutput * swaps.to.buyFee) / 10 ** swaps.to.decimals).toFixed(6);
                // return tnum;
            }
        } else if (type === 1) {
            // let ta = value * 10 ** swaps.to.decimals;
            // ta = ta + ta * swaps.to.buyFee;
            // const rv = 2 * ta * Number(data.fromQuan) * Number(data.toValue);
            // const rv1 = 2 * Number(data.fromValue) * Number(data.toQuan) - Number(data.fromValue) * ta - ta * Number(data.toValue);
            // const fa = rv / rv1;
            // let tnum = (fa + fa * swaps.from.sellFee) / 10 ** swaps.from.decimals;
            // tnum = Math.ceil(tnum * 1e6) / 1e6;
            // console.log(ta, rv, rv1, fa, tnum, 8981)
            // return tnum;
            if (value > 0) {
                const baseAmount = value * 10 ** swaps.to.decimals;
                let remainingAmount = baseAmount;
                let fromQuantity = Number(data.toQuan);
                let totalValue = 0;

                while (remainingAmount > 0) {
                    const stepSize = Math.min(remainingAmount, fromQuantity / 100);
                    guardStep(stepSize, remainingAmount);

                    totalValue += Math.trunc((2 * stepSize * Number(data.toValue)) / (2 * fromQuantity + stepSize));

                    // 更新池状态
                    fromQuantity += stepSize;
                    remainingAmount -= stepSize;
                }

                console.log("---ff--", remainingAmount, fromQuantity, totalValue, data);

                // 步骤3：将累积的价值转换为目标代币数量
                let toValue = Number(data.fromValue);
                let toQuantity = Number(data.fromQuan);
                let totalOutput = 0;
                let remainingValue = totalValue;
                let st1 = 0;

                while (remainingValue > 0) {

                    const stepSize = Math.min(remainingValue, toValue / 100);
                    guardStep(stepSize, remainingValue);
                    console.log("---ss--", stepSize, remainingValue);
                    if (stepSize > 0) {
                        st1 = (2 * stepSize * toQuantity) / (2 * toValue + stepSize);

                        // 更新池状态
                        toQuantity -= st1;
                        remainingValue -= stepSize;
                        totalOutput += st1;
                    }
                }

                console.log("---tt--", toValue, toQuantity, remainingValue, totalOutput);
                return +((totalOutput - totalOutput * swaps.from.sellFee) / 10 ** swaps.from.decimals).toFixed(6);
            }
        } else if (type === 2) {
            const fa = value * 10 ** swaps.from.decimals;
            // const rv = (Number(data.fromValue) / (Number(data.fromQuan) + fa)) * fa;
            // const ta = (Number(data.valueQ) / (Number(data.valueV) + rv)) * rv;
            const rv = 2 * Number(data.fromValue) * Number(data.valueQ) * fa;
            const rv1 = 2 * Number(data.valueV) * Number(data.fromQuan) + Number(data.valueV) * fa + Number(data.fromValue) * fa;
            // const rv = 2 * fa * Number(data.fromQuan) * Number(data.valueV);
            // const rv1 = 2 * Number(data.fromValue) * Number(data.valueQ) - Number(data.fromValue) * fa - fa * Number(data.valueV);
            const ta = rv / rv1;
            let tnum = ta / 10 ** data.valueD;
            tnum = Math.floor(tnum * 1e6) / 1e6;
            console.log(fa, rv, ta, tnum, 8982)
            return tnum;
        } else {
            const fa = value * 10 ** swaps.to.decimals;
            // const rv = (Number(data.toValue) / (Number(data.toQuan) + fa)) * fa;
            // const ta = (Number(data.valueQ) / (Number(data.valueV) + rv)) * rv;
            const rv = 2 * Number(data.toValue) * Number(data.valueQ) * fa;
            const rv1 = 2 * Number(data.valueV) * Number(data.toQuan) + Number(data.valueV) * fa + Number(data.toValue) * fa;
            // const rv = 2 * fa * Number(data.toQuan) * Number(data.valueV);
            // const rv1 = 2 * Number(data.toValue) * Number(data.valueQ) - Number(data.toValue) * fa - fa * Number(data.valueV);
            const ta = rv / rv1;
            let tnum = ta / 10 ** data.valueD;
            tnum = Math.floor(tnum * 1e6) / 1e6;
            console.log(fa, rv, rv1, ta, tnum, 8983)
            return tnum;
        }
    }
    const setAmount = (element: string, value: any, data: any) => {
        console.log(data, 898)

        // const fa = value * 10**swaps.from.decimals;
        // const rv = (Number(data.fromValue)/(Number(data.fromQuan)+fa))*fa;
        // const ta = (Number(data.toQuan)/(Number(data.toValue)+rv))*rv;
        // let tnum = (ta-ta*swaps.to.sellFee)/10**swaps.to.decimals;
        // tnum = Number(tnum.toFixed(6));
        if (!value || Number(value) <= 0 || !data) {
            const input: any = value || "";
            setSwapAmount({
                from: {
                    token: swaps.from.symbol,
                    // @ts-ignore
                    amount: element === SwapKeys.From ? input : "",
                    id: swaps.from.id,
                    currentQuantity: 0,
                    currentValue: 0,
                    price: 0
                },
                to: {
                    token: swaps.to.symbol,
                    // @ts-ignore
                    amount: element === SwapKeys.From ? "" : input,
                    id: swaps.to.id,
                    currentQuantity: 0,
                    currentValue: 0,
                    price: 0
                },
            });
        } else {
            if (element === SwapKeys.From) {
                const tnum = cionNum(value, data, 0);
                const fprice = cionNum(value, data, 2);
                const tprice = cionNum(tnum, data, 3);
                setSwapAmount({
                    from: {
                        token: swaps.from.symbol,
                        // @ts-ignore
                        amount: value,
                        id: swaps.from.id,
                        currentQuantity: data.fromQuan,
                        currentValue: data.fromValue,
                        price: fprice
                    },
                    to: {
                        token: swaps.to.symbol,
                        // @ts-ignore
                        amount: tnum,
                        id: swaps.to.id,
                        currentQuantity: data.toQuan,
                        currentValue: data.toValue,
                        price: tprice
                    },
                });
            } else {
                const fnum = cionNum(value, data, 1);
                const fprice = cionNum(fnum, data, 2);
                const tprice = cionNum(value, data, 3);
                setSwapAmount({
                    from: {
                        token: swaps.from.symbol,
                        // @ts-ignore
                        amount: fnum,
                        id: swaps.from.id,
                        currentQuantity: data.fromQuan,
                        currentValue: data.fromValue,
                        price: fprice
                    },
                    to: {
                        token: swaps.to.symbol,
                        // @ts-ignore
                        amount: value,
                        id: swaps.to.id,
                        currentQuantity: data.toQuan,
                        currentValue: data.toValue,
                        price: tprice
                    },
                });

            }

        }
    };

    const setAmount1 = (element: string, value: any, data: any) => {
        // console.log(data,898)
        let fromPrice = 0;
        let toPrice = 0;
        if (data !== 0) {
            fromPrice = data.fromPrice;
            if (data.toPrice > 0) {
                toPrice = data.toPrice;
            }
        }
        // console.log(element, "******", value, swaps)
        let num: number | string = "";
        // if (value=== ''|| value ===null || value < 0) value = 0;
        if (element === SwapKeys.From) {
            // @ts-ignore
            if (value > 0) {
                // @ts-ignore
                num = fromPrice / toPrice * value * (1 - swaps.to.buyFee);
                num = Number(num.toFixed(6));
            }
            // @ts-ignore
            const priceF = value * fromPrice * (1 - swaps.from.sellFee);
            // @ts-ignore
            const priceT = num * toPrice;
            setSwapAmount({
                from: {
                    token: swaps.from.symbol,
                    // @ts-ignore
                    amount: value,
                    id: swaps.from.id,
                    currentQuantity: data.fromQuan,
                    currentValue: data.fromValue,
                    price: priceF > 0 ? Number(priceF.toFixed(6)) : 0
                },
                to: {
                    token: swaps.to.symbol,
                    // @ts-ignore
                    amount: num,
                    id: swaps.to.id,
                    currentQuantity: data.toQuan,
                    currentValue: data.toValue,
                    price: priceT > 0 ? Number(priceT.toFixed(6)) : 0
                },
            });
        } else {
            // @ts-ignore
            if (value > 0) {
                // @ts-ignore
                num = toPrice / fromPrice * value;
                num = Number(num.toFixed(6));
            }
            // @ts-ignore
            const priceF = num * fromPrice * (1 - swaps.from.sellFee);
            // @ts-ignore
            const priceT = value * toPrice * (1 - swaps.to.buyFee);
            setSwapAmount({
                from: {
                    token: swaps.from.symbol,
                    // @ts-ignore
                    amount: num,
                    id: swaps.from.id,
                    currentQuantity: data.fromQuan,
                    currentValue: data.fromValue,
                    price: priceF > 0 ? Number(priceF.toFixed(6)) : 0
                },
                to: {
                    token: swaps.to.symbol,
                    // @ts-ignore
                    amount: value,
                    id: swaps.to.id,
                    currentQuantity: data.toQuan,
                    currentValue: data.toValue,
                    price: priceT > 0 ? Number(priceT.toFixed(6)) : 0
                },
            });
        }
    };

    useEffect(() => {
        // setAmount(focus, "");
        // console.log(focus, swapsAmount, "****",isHandleFlip)
        // if (!isHandleFlip) {
        //     if (focus === SwapKeys.From) {
        //         setAmount(focus, swapsAmount.from.amount)
        //     } else {
        //         setAmount(focus, swapsAmount.to.amount)
        //     }
        // } else {
        //     let value;
        //     let num;
        //     if (focus === SwapKeys.From) {
        //         value = swapsAmount.from.amount;
        //         if (value)
        //             num = swaps.from.price / swaps.to.price * value / (1 - swaps.from.buyFee);
        //         num = 0;
        //         setSwapAmount({
        //             from: {
        //                 token: swaps.to.symbol,
        //                 amount: Number(num.toFixed(6)),
        //                 id: swaps.to.id
        //             },
        //             to: {
        //                 token: swaps.from.symbol,
        //                 amount: value,
        //                 id: swaps.from.id
        //             },
        //         });
        //     } else {
        //         value = swapsAmount.to.amount;
        //         if (value)
        //             num = swaps.to.price / swaps.from.price * value * (1 - swaps.from.buyFee);
        //         num = 0;
        //         setSwapAmount({
        //             from: {
        //                 token: swaps.to.symbol,
        //                 amount: value,
        //                 id: swaps.to.id
        //             },
        //             to: {
        //                 token: swaps.from.symbol,
        //                 amount: Number(num.toFixed(6)),
        //                 id: swaps.from.id
        //             },
        //         });
        //     }
        // }
    }, [swaps]);
    // console.log( focus,"****",isHandleFlip)
    const handleSwap = () => {
        // setSwap({
        //   from: { token: swaps.from.token, amount: 0 },
        //   to: { token: swaps.to.token, amount: 0 },
        // });

        // toast.success('Token swapped successfully')
    };

    const handleFlip = () => {
        setSwap({
            from: {
                id: swaps.to.id,
                name: swaps.to.name,
                symbol: swaps.to.symbol,
                buyFee: swaps.to.buyFee,
                sellFee: swaps.to.sellFee,
                price: swaps.to.price,
                logo_url: swaps.to.logo_url,
                address: swaps.to.address,
                currentQuantity: swaps.to.currentQuantity,
                currentValue: swaps.to.currentValue,
                decimals: swaps.to.decimals,
                isvaluegood: swaps.to.isvaluegood,
                no: swaps.to.no,
                type: swaps.to.type,

            },
            to: {
                id: swaps.from.id,
                name: swaps.from.name,
                symbol: swaps.from.symbol,
                buyFee: swaps.from.buyFee,
                sellFee: swaps.from.sellFee,
                price: swaps.from.price,
                logo_url: swaps.from.logo_url,
                address: swaps.from.address,
                currentQuantity: swaps.from.currentQuantity,
                currentValue: swaps.from.currentValue,
                decimals: swaps.from.decimals,
                isvaluegood: swaps.from.isvaluegood,
                no: swaps.from.no,
                type: swaps.from.type,
            },
        });
        setIsHandleFlip(true);
        // let value;
        // let num;
        // if (focus === SwapKeys.From) {
        //     value = swapsAmount.from.amount;
        //     if (value)
        //         num = swaps.from.price / swaps.to.price * value / (1 - swaps.from.buyFee);
        //     num = 0;
        //     setSwapAmount({
        //         from: {
        //             token: swaps.to.symbol,
        //             amount: Number(num.toFixed(6)),
        //             id: swaps.to.id
        //         },
        //         to: {
        //             token: swaps.from.symbol,
        //             amount: value,
        //             id: swaps.from.id
        //         },
        //     });
        // } else {
        //     value = swapsAmount.to.amount;
        //     if (value)
        //         num = swaps.to.price / swaps.from.price * value * (1 - swaps.from.buyFee);
        //     num = 0;
        //     setSwapAmount({
        //         from: {
        //             token: swaps.to.symbol,
        //             amount: value,
        //             id: swaps.to.id
        //         },
        //         to: {
        //             token: swaps.from.symbol,
        //             amount: Number(num.toFixed(6)),
        //             id: swaps.from.id
        //         },
        //     });
        // }
    };

    const swapArray = Object.keys(swaps) as Array<SwapKeys>;

    // const fromPrice = useMemo(() => {
    //     if (swapsAmount.from.amount && swaps.from.symbol !== DEFAULT_TOKEN) {
    //         const price =
    //             swapsAmount.from.amount * swaps.from.price * (1 - swaps.from.sellFee);

    //         return price > 0 ? Number(price.toFixed(6)) : 0;
    //     }
    //     return 0;
    // }, [swaps, swapsAmount]);

    // const toPrice = useMemo(() => {
    //     if (swapsAmount.to.amount && swaps.to.symbol !== DEFAULT_TOKEN) {
    //         const price =
    //             swapsAmount.to.amount * swaps.to.price;

    //         return price > 0 ? Number(price.toFixed(6)) : 0;
    //     }
    //     return 0;
    // }, [swaps, swapsAmount]);

    const priceImpact = useMemo(() => {
        if (swapsAmount.to.amount !== '' && swapsAmount.from.amount !== '' && swaps.to.symbol !== DEFAULT_TOKEN) {
            const fromV = swaps.from.currentValue / 10 ** 6;
            const fromQ = swaps.from.currentQuantity / 10 ** swaps.from.decimals;
            const toV = swaps.to.currentValue / 10 ** 6;
            const toQ = swaps.to.currentQuantity / 10 ** swaps.to.decimals;
            const priceF = fromV / fromQ;
            const priceT = toV / toQ;
            const ncvf = priceF * swapsAmount.from.amount;
            const ncvt = priceT * swapsAmount.to.amount;
            const priceFN = (fromV - ncvf) / (fromQ + swapsAmount.from.amount * 1);
            const priceTN = (toV + ncvt) / (toQ - swapsAmount.to.amount * 1);
            const initial = priceF / priceT;
            const newP = priceFN / priceTN;
            const ippact = (newP - initial) / initial * 100
            // console.log(fromQ,toQ,priceF,priceT,priceFN,priceTN,1111)
            return ippact.toFixed(2);
        }
    }, [swapsAmount.to.amount]);

    const disabled = useMemo(() => {
        return (
            swaps.from.symbol === DEFAULT_TOKEN ||
            swaps.to.symbol === DEFAULT_TOKEN ||
            swapsAmount.from.amount === 0 ||
            swapsAmount.from.amount === "" ||
            !isConnected
        );
    }, [swaps, swapsAmount, isConnected]);

    return {
        swaps,
        swapsAmount,
        // priceImpact,
        focus,
        setAmount,
        handleFlip,
        handleSwap,
        setToken,
        setFocus,
        swapArray,
        // fromPrice,
        // toPrice,
        disabled,
    };
};

export default useSwap