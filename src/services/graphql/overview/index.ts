import { getExplorer, getChainName } from '@/data/networks';
import { ecosystemChartData, AggregateIndexQ, InvestGoodDatas, transactions } from './graphql';
import { timestampdToDateSub, timestampdToDateYear, powerIterative, iconUrl, complete7DayData } from '@/services/graphql/util';
import { t } from 'i18next';


//AggregateIndex
export async function AggregateIndex(id: string, ssionChian: number): Promise<object> {
    const chainName = getChainName(ssionChian);

    let item = { hero: {}, over: [], chart: {} };
    let hero = { trdeV: 0, invertV: 0, users: 0, Tokens: 0, vSymbol: "" };
    let chart = {
        quote_currency: '', volume_chart_7d: [{ dt: 0, quote_currency: "", volume: 0 }],
        volume_chart_30d: [{ dt: 0, quote_currency: "", volume: 0 }],
        liquidity_chart_7d: [{ dt: 0, quote_currency: "", volume: 0 }],
        liquidity_chart_30d: [{ dt: 0, quote_currency: "", volume: 0 }]
    };
    try {
        if (id !== "") {
            const goodsDatas = await AggregateIndexQ({ id: id, eq7: timestampdToDateSub(6), eq30: timestampdToDateSub(29), time: timestampdToDateSub(0) }, ssionChian);

            let goodValue = goodsDatas.data.goodState.currentValue / goodsDatas.data.goodState.currentQuantity;
            let tokendecimals = powerIterative(10, 18);
            const market = goodsDatas.data.marketStates[0];
            // console.log(goodsDatas.data.marketStates ,"********")

            hero.trdeV = market.totalTradeValue * goodValue / tokendecimals;
            hero.invertV = market.totalInvestValue * goodValue / tokendecimals;
            hero.users = market.userCount - 100000;
            hero.Tokens = market.goodCount;
            hero.vSymbol = goodsDatas.data.goodState.tokensymbol;
            // const data = await ecosystemChartData({ id: id, eq7: timestampdToDateSub(6), eq30: timestampdToDateSub(29) }, ssionChian);
            // let goodValue = data.data.goodState.currentValue / data.data.goodState.currentQuantity;
            // let tokendecimals = powerIterative(10, 18);
            chart.quote_currency = goodsDatas.data.goodState.tokensymbol;

            let volume_chart_7d: { dt: number; quote_currency: string; volume: number; }[] = [];
            let volume_chart_30d: { dt: number; quote_currency: string; volume: number; }[] = [];
            let liquidity_chart_7d: { dt: number; quote_currency: string; volume: number; }[] = [];
            let liquidity_chart_30d: { dt: number; quote_currency: string; volume: number; }[] = [];


            const quote_currency = goodsDatas.data.goodState.tokensymbol;
            if (goodsDatas.data.days70.length > 0) {
                const e7 = goodsDatas.data.days70[0];
                let v7 = e7.totalInvestValue * goodValue / tokendecimals;
                let v71 = e7.totalTradeValue * goodValue / tokendecimals;
                liquidity_chart_7d.push({ dt: timestampdToDateSub(6) * 1000, quote_currency: quote_currency, volume: v7 });
                volume_chart_7d.push({ dt: timestampdToDateSub(6) * 1000, quote_currency: quote_currency, volume: v71 });
            } else {
                liquidity_chart_7d.push({ dt: timestampdToDateSub(6) * 1000, quote_currency: quote_currency, volume: 0 });
                volume_chart_7d.push({ dt: timestampdToDateSub(6) * 1000, quote_currency: quote_currency, volume: 0 });
            }
            if (goodsDatas.data.days7.length > 0) {
                goodsDatas.data.days7.forEach((e: any) => {
                    let map = { dt: 0, quote_currency: "", volume: 0 };
                    let jz = e.totalInvestValue * goodValue / tokendecimals;
                    map.dt = e.modifiedTime * 1000;
                    map.volume = jz;
                    // map.liquidity_quote = jz;
                    map.quote_currency = quote_currency;
                    liquidity_chart_7d.push(map);

                    let map1 = { dt: 0, quote_currency: "", volume: 0 };
                    let jz1 = e.totalTradeValue * goodValue / tokendecimals;
                    map1.dt = e.modifiedTime * 1000;
                    map1.volume = jz1;
                    // map1.volume_quote = jz1;
                    map1.quote_currency = quote_currency;
                    volume_chart_7d.push(map1);
                });
            }
            if (goodsDatas.data.days31.length > 0) {
                const e30 = goodsDatas.data.days31[0];
                let v3 = e30.totalInvestValue * goodValue / tokendecimals;
                let v31 = e30.totalTradeValue * goodValue / tokendecimals;
                liquidity_chart_30d.push({ dt: timestampdToDateSub(29) * 1000, quote_currency: quote_currency, volume: v3 });
                volume_chart_30d.push({ dt: timestampdToDateSub(29) * 1000, quote_currency: quote_currency, volume: v31 });
            } else {
                liquidity_chart_30d.push({ dt: timestampdToDateSub(29) * 1000, quote_currency: quote_currency, volume: 0 });
                volume_chart_30d.push({ dt: timestampdToDateSub(29) * 1000, quote_currency: quote_currency, volume: 0 });
            }
            if (goodsDatas.data.days30.length > 0) {
                goodsDatas.data.days30.forEach((e: any) => {
                    let map = { dt: 0, quote_currency: "", volume: 0 };
                    let jz = e.totalInvestValue * goodValue / tokendecimals;
                    map.dt = e.modifiedTime * 1000;
                    map.volume = jz;
                    // map.liquidity_quote = jz;
                    map.quote_currency = quote_currency;
                    liquidity_chart_30d.push(map);

                    let map1 = { dt: 0, quote_currency: "", volume: 0 };
                    let jz1 = e.totalTradeValue * goodValue / tokendecimals;
                    map1.dt = e.modifiedTime * 1000;
                    map1.volume = jz1;
                    // map1.volume_quote = jz1;
                    map1.quote_currency = quote_currency;
                    volume_chart_30d.push(map1);
                });
            }
            liquidity_chart_7d = complete7DayData(liquidity_chart_7d, 7);
            volume_chart_7d = complete7DayData(volume_chart_7d, 7);
            liquidity_chart_30d = complete7DayData(liquidity_chart_30d, 30);
            volume_chart_30d = complete7DayData(volume_chart_30d, 30);

            chart.volume_chart_7d = volume_chart_7d;
            chart.volume_chart_30d = volume_chart_30d;
            chart.liquidity_chart_7d = liquidity_chart_7d;
            chart.liquidity_chart_30d = liquidity_chart_30d;

            // const goodsDatas = await GoodsSearch({ id: params.id, sel: params.sel.toLowerCase(), time: timestampdToDateSub(0) }, ssionChian);

            // const goodState = goodsDatas.data.goodState;
            // console.log("***&&", goodState.goodData[0].currentValue)
            // const goodValue = goodState.currentValue / goodState.currentQuantity;
            // const goodValue24 = goodState.goodData[0].currentValue / goodState.goodData[0].currentQuantity;
            const tokendecimals1 = powerIterative(10, 6);

            goodsDatas.data.goodStates.forEach((en: any) => {
                const previous = en.goodData?.[0] ?? en;
                let map1 = {
                    id: "", name: "", decimals: 0, symbol: "", price: 0, logo_url: "",
                    address: "", isvaluegood: false, valueSymbol: "", h24: 0, trade24hValue: 0
                };
                let base_decimals = powerIterative(10, en.tokendecimals);
                let current_price = ((en.currentValue / tokendecimals1) / (en.currentQuantity / base_decimals)) / goodValue;
                let current_price24 = ((previous.currentValue / tokendecimals1) / (previous.currentQuantity / base_decimals)) / goodValue;
                let t24 = (en.totalTradeQuantity - previous.totalTradeQuantity) / base_decimals
                map1.id = en.id;
                map1.name = en.tokenname;
                map1.decimals = en.tokendecimals;
                map1.symbol = en.tokensymbol;
                map1.valueSymbol = goodsDatas.data.goodState.tokensymbol;
                map1.logo_url = iconUrl(chainName, en.erc20Address);
                map1.address = en.erc20Address;
                map1.isvaluegood = en.isvaluegood;
                map1.price = current_price;
                map1.h24 = (current_price - current_price24) / current_price24;
                map1.trade24hValue = t24 * current_price;
                item.over.push(map1);
            });
        }
    } catch (error) {
        throw error;
    }
    item.hero = hero;
    item.chart = chart;

    return item;
}

// overview charts
export async function ecosystemChartDatas(id: string, ssionChian: number): Promise<object> {


    // const chainName = getChainName(ssionChian);
    let item = {
        quote_currency: '', volume_chart_7d: [{ dt: 0, quote_currency: "", volume: 0 }],
        volume_chart_30d: [{ dt: 0, quote_currency: "", volume: 0 }],
        liquidity_chart_7d: [{ dt: 0, quote_currency: "", volume: 0 }],
        liquidity_chart_30d: [{ dt: 0, quote_currency: "", volume: 0 }]
    };

    if (id !== "") {
        try {
            const data = await ecosystemChartData({ id: id, eq7: timestampdToDateSub(6), eq30: timestampdToDateSub(29) }, ssionChian);
            let goodValue = data.data.goodState.currentValue / data.data.goodState.currentQuantity;
            let tokendecimals = powerIterative(10, 18);
            item.quote_currency = data.data.goodState.tokensymbol;

            let volume_chart_7d: { dt: number; quote_currency: string; volume: number; }[] = [];
            let volume_chart_30d: { dt: number; quote_currency: string; volume: number; }[] = [];
            let liquidity_chart_7d: { dt: number; quote_currency: string; volume: number; }[] = [];
            let liquidity_chart_30d: { dt: number; quote_currency: string; volume: number; }[] = [];


            const quote_currency = data.data.goodState.tokensymbol;
            if (data.data.days70.length > 0) {
                const e7 = data.data.days70[0];
                let v7 = e7.totalInvestValue * goodValue / tokendecimals;
                let v71 = e7.totalTradeValue * goodValue / tokendecimals;
                liquidity_chart_7d.push({ dt: timestampdToDateSub(6) * 1000, quote_currency: quote_currency, volume: v7 });
                volume_chart_7d.push({ dt: timestampdToDateSub(6) * 1000, quote_currency: quote_currency, volume: v71 });
            } else {
                liquidity_chart_7d.push({ dt: timestampdToDateSub(6) * 1000, quote_currency: quote_currency, volume: 0 });
                volume_chart_7d.push({ dt: timestampdToDateSub(6) * 1000, quote_currency: quote_currency, volume: 0 });
            }
            if (data.data.days7.length > 0) {
                data.data.days7.forEach((e: any) => {
                    let map = { dt: 0, quote_currency: "", volume: 0 };
                    let jz = e.totalInvestValue * goodValue / tokendecimals;
                    map.dt = e.modifiedTime * 1000;
                    map.volume = jz;
                    // map.liquidity_quote = jz;
                    map.quote_currency = quote_currency;
                    liquidity_chart_7d.push(map);

                    let map1 = { dt: 0, quote_currency: "", volume: 0 };
                    let jz1 = e.totalTradeValue * goodValue / tokendecimals;
                    map1.dt = e.modifiedTime * 1000;
                    map1.volume = jz1;
                    // map1.volume_quote = jz1;
                    map1.quote_currency = quote_currency;
                    volume_chart_7d.push(map1);
                });
            }
            if (data.data.days31.length > 0) {
                const e30 = data.data.days31[0];
                let v3 = e30.totalInvestValue * goodValue / tokendecimals;
                let v31 = e30.totalTradeValue * goodValue / tokendecimals;
                liquidity_chart_30d.push({ dt: timestampdToDateSub(29) * 1000, quote_currency: quote_currency, volume: v3 });
                volume_chart_30d.push({ dt: timestampdToDateSub(29) * 1000, quote_currency: quote_currency, volume: v31 });
            } else {
                liquidity_chart_30d.push({ dt: timestampdToDateSub(29) * 1000, quote_currency: quote_currency, volume: 0 });
                volume_chart_30d.push({ dt: timestampdToDateSub(29) * 1000, quote_currency: quote_currency, volume: 0 });
            }
            if (data.data.days30.length > 0) {
                data.data.days30.forEach((e: any) => {
                    let map = { dt: 0, quote_currency: "", volume: 0 };
                    let jz = e.totalInvestValue * goodValue / tokendecimals;
                    map.dt = e.modifiedTime * 1000;
                    map.volume = jz;
                    // map.liquidity_quote = jz;
                    map.quote_currency = quote_currency;
                    liquidity_chart_30d.push(map);

                    let map1 = { dt: 0, quote_currency: "", volume: 0 };
                    let jz1 = e.totalTradeValue * goodValue / tokendecimals;
                    map1.dt = e.modifiedTime * 1000;
                    map1.volume = jz1;
                    // map1.volume_quote = jz1;
                    map1.quote_currency = quote_currency;
                    volume_chart_30d.push(map1);
                });
            }
            liquidity_chart_7d = complete7DayData(liquidity_chart_7d, 7);
            volume_chart_7d = complete7DayData(volume_chart_7d, 7);
            liquidity_chart_30d = complete7DayData(liquidity_chart_30d, 30);
            volume_chart_30d = complete7DayData(volume_chart_30d, 30);

            item.volume_chart_7d = volume_chart_7d;
            item.volume_chart_30d = volume_chart_30d;
            item.liquidity_chart_7d = liquidity_chart_7d;
            item.liquidity_chart_30d = liquidity_chart_30d;
        } catch (error) {
            console.error(error);
        }
    }
    return item;
}


//物品列表
export async function GoodsDatas(params: { id: string; pageNumber: number; pageSize: number; }, ssionChian: number): Promise<object> {

    const chainName = getChainName(ssionChian);
    let item = { items: {}, pagination: { page_number: 0, page_size: 0, has_more: true }, error: false, error_message: "" };

    if (params.id !== "") {
        const goodsDatas = await InvestGoodDatas({ id: params.id, first: params.pageSize, time: timestampdToDateYear(1), time24: timestampdToDateSub(0), skip: params.pageSize * params.pageNumber, address: "0" }, ssionChian);

        let goodValue = goodsDatas.data.goodState.currentValue / goodsDatas.data.goodState.currentQuantity;
        let tokendecimals = powerIterative(10, 6);
        let jz = goodValue;

        let items: object[] = [];
        let pagination = {
            has_more: true,
            page_number: 0,
            page_size: 10,
            total_count: null
        };

        item.items = items;
        item.pagination = pagination;
        item.pagination.page_number = params.pageNumber;
        item.pagination.page_size = params.pageSize;

        if (goodsDatas.data.goodStates.length < params.pageSize || goodsDatas.data.goodStates.length === 0) {
            item.pagination.has_more = false;
        }

        goodsDatas.data.goodStates.forEach((e: any) => {
            let base_decimals = powerIterative(10, e.tokendecimals);
            let current_price = ((e.currentValue / tokendecimals) / (e.currentQuantity / base_decimals)) / jz;

            let map = {
                id: "", name: "", decimals: 0, symbol: "", valueSymbol: "", totalTradeQuantity: 0, currentQuantity: 0,
                totalFee: 0, price: 0, price_24h: 0, totalTradeValue: 0, totalFeeValue: 0, NAVPS: 0, apy: 0,
                tradeQuantity24: 0, fee24: 0, tradeValue24: 0, feeValue24: 0, logo_url: "", priceC_24h: 0
            };

            if (e.goodData.length > 0) {
                let en = e.goodData[0];
                // e.parGooddata.forEach((en: any) => {
                //     if (e.id === en.pargood.id) {
                let current_price_24h = ((en.currentValue / tokendecimals) / (en.currentQuantity / base_decimals)) / jz;
                // let s = splitNumber(en.open);
                map.tradeQuantity24 = (e.totalTradeQuantity - en.totalTradeQuantity) / base_decimals;
                // map.fee24 = (e.totalProfit - en.totalProfit) / base_decimals;
                // map.tradeValue24 = (e.totalTradeQuantity - en.totalTradeQuantity) / base_decimals * current_price_24h;
                // map.feeValue24 = (e.totalProfit - en.totalProfit) / base_decimals * current_price_24h;
                map.price_24h = current_price_24h;
                map.priceC_24h = (current_price - map.price_24h) / map.price_24h;
                //     }
                // });
            } else {
                map.tradeQuantity24 = e.totalTradeQuantity / base_decimals;;
                // map.fee24 = 0;
                // map.tradeValue24 = 0;
                // map.feeValue24 = 0;
                map.priceC_24h = 0;
            }

            map.id = e.id;
            map.name = e.tokenname;
            map.symbol = e.tokensymbol;
            map.decimals = e.tokendecimals;
            map.valueSymbol = goodsDatas.data.goodState.tokensymbol;
            map.totalTradeQuantity = e.totalTradeQuantity / base_decimals;
            map.currentQuantity = e.currentQuantity / base_decimals;
            // map.totalFee = e.totalProfit / base_decimals;
            // map.totalTradeValue = e.totalTradeQuantity / base_decimals * current_price;
            // map.totalFeeValue = e.totalProfit / base_decimals * current_price;
            map.logo_url = iconUrl(chainName, e.erc20Address);
            map.price = current_price;


            items.push(map);
        });

    }
    // console.log(item,"***&&")
    return item;
}


//投资列表
export async function investGoodsDatas(params: { id: string; pageNumber: number; pageSize: number; address: string }, ssionChian: number): Promise<object> {

    const chainName = getChainName(ssionChian);
    let item = {
        items: [{
            id: "", name: "", decimals: 0, symbol: "", logo_url: "", currentQuantity: 0, currentValue: 0, valueSymbol: "",
            priceC_24h: 0, price: 0, price_24h: 0, NAVPS: 0, apy: 0, isvaluegood: false
        }], pagination: { page_number: 0, page_size: 0, has_more: false }, error: false, error_message: ""
    };

    if (params.id !== "") {
        console.log("investGoodsDatas", params);
        const goodsDatas = await InvestGoodDatas({ id: params.id, first: params.pageSize, time: timestampdToDateYear(1), time24: timestampdToDateSub(0), skip: params.pageSize * params.pageNumber, address: params.address.toLowerCase() }, ssionChian);

        let goodValue = goodsDatas.data.goodState.currentValue / goodsDatas.data.goodState.currentQuantity;
        let tokendecimals = powerIterative(10, 6);
        let jz = goodValue;

        let items: {
            id: string;
            name: string;
            decimals: number;
            symbol: string;
            logo_url: string;
            currentQuantity: number;
            currentValue: number;
            valueSymbol: string;
            priceC_24h: number;
            price: number;
            price_24h: number;
            NAVPS: number;
            apy: number;
            isvaluegood: boolean;
        }[] = [];
        let pagination = {
            has_more: true,
            page_number: 0,
            page_size: 10,
            total_count: null
        };

        item.items = items;
        item.pagination = pagination;
        item.pagination.page_number = params.pageNumber;
        item.pagination.page_size = params.pageSize;

        if (goodsDatas.data.goodStates.length < params.pageSize || goodsDatas.data.goodStates.length === 0) {
            item.pagination.has_more = false;
        }
        goodsDatas.data.goodStates.forEach((e: any) => {
            let base_decimals = powerIterative(10, e.tokendecimals);
            let current_price = ((e.currentValue / tokendecimals) / (e.currentQuantity / base_decimals)) / jz;

            let map = {
                id: "", name: "", decimals: 0, symbol: "", logo_url: "", currentQuantity: 0, currentValue: 0, valueSymbol: "",
                priceC_24h: 0, price: 0, price_24h: 0, NAVPS: 0, apy: 0, isvaluegood: false
            };

            map.id = e.id;
            map.name = e.tokenname;
            map.symbol = e.tokensymbol;
            map.valueSymbol = goodsDatas.data.goodState.tokensymbol;
            map.decimals = e.tokendecimals;
            // map.unitPrice = (e.currentValue / tokendecimals) / (e.currentQuantity / base_decimals);
            map.isvaluegood = e.isvaluegood;
            map.currentQuantity = e.currentQuantity / base_decimals;
            map.currentValue = e.currentQuantity / base_decimals * current_price;
            map.logo_url = iconUrl(chainName, e.erc20Address);
            map.price = current_price;
            map.NAVPS = e.investActualQuantity / e.investShares;
            // let uintF = (Number(e.feeQuantity) + Number(e.investQuantity)) / e.investQuantity;
            let en = e.goodData[0];
            let d24 = e.date24[0];
            console.log("investGoodsData-----s", en);
            // let uintFY = (en.feeQuantity + en.investQuantity) / en.investQuantity;
            let NAVPS = en.investActualQuantity / en.investShares;
            console.log(22222222, jz)
            let current_price_24h = ((d24.currentValue / tokendecimals) / (d24.currentQuantity / base_decimals)) / jz;
            map.price_24h = current_price_24h;
            map.priceC_24h = (current_price - current_price_24h) / current_price_24h;
            map.apy = map.NAVPS / NAVPS - 1;//uintF / uintFY - 1;

            items.push(map);
        });

    }
    console.log(3333333333, params, item)
    return item;
}

//记录列表
export async function transactionsDatas(id: string, ssionChian: number): Promise<object> {

    const blockExplorerUrls = getExplorer(ssionChian);
    let item = { items: {}, pagination: {}, error: false, error_message: "", tokensymbol: "" };
    if (id !== "") {
        const goodsDatas = await transactions({ id: id, first: 10 }, ssionChian);

        let goodValue = goodsDatas.data.goodState.currentValue / goodsDatas.data.goodState.currentQuantity;
        let tokendecimals = powerIterative(10, 6);
        let jz = goodValue;



        let items: object[] = [];
        let pagination = {
            "has_more": true,
            "page_number": 0,
            "page_size": 10,
            "total_count": null
        };

        item.items = items;
        item.tokensymbol = goodsDatas.data.goodState.tokensymbol;
        item.pagination = pagination;

        goodsDatas.data.transactions.forEach((e: any) => {
            let from_decimals = powerIterative(10, e.frompargood.tokendecimals);
            let to_decimals = powerIterative(10, e.togood.tokendecimals);
            // let from_price = 0;
            // if (e.frompargood.currentValue > 0 || e.frompargood.currentQuantity > 0 || e.frompargood.tokendecimals > 0) {
            //     from_price = ((e.frompargood.currentValue / tokendecimals) / (e.frompargood.currentQuantity / from_decimals)) / jz;
            // }
            // let to_price = 0;
            // if (e.togood.currentValue > 0 || e.togood.currentQuantity > 0 || e.togood.tokendecimals > 0) {
            //     to_price = ((e.togood.currentValue / tokendecimals) / (e.togood.currentQuantity / to_decimals)) / jz;
            // }

            let map = {
                id: "", blockNumber: "", type: "", symbol1: "", symbol2: "", fromgoodQuanity: 0, togoodQuantity: 0,
                hash: "", totalValue: 0, time: 0, valueSymbol: ""
            };

            map.id = e.id;
            map.time = e.timestamp * 1000;
            map.blockNumber = e.blockNumber;
            map.type = e.transtype;
            map.valueSymbol = goodsDatas.data.goodState.tokensymbol;
            // @ts-ignore
            map.hash = blockExplorerUrls[0] + "/tx/" + e.hash;
            map.symbol1 = e.frompargood.tokensymbol;
            map.symbol2 = e.togood.tokensymbol;
            if (from_decimals > 0) {
                map.fromgoodQuanity = e.fromgoodQuanity / from_decimals;
            } else {
                map.fromgoodQuanity = 0;
            }
            if (to_decimals > 0) {
                map.togoodQuantity = e.togoodQuantity / to_decimals;
            } else {
                map.togoodQuantity = 0;
            }
            map.totalValue = e.transvalue / tokendecimals;
            // if (e.transtype === "buy" || e.transtype === "pay") {
            //     map.totalValue = map.fromgoodQuanity * from_price;
            // } else {
            //     map.totalValue = (map.fromgoodQuanity * from_price) + (map.togoodQuantity * to_price);
            // }
            // console.log(map.fromgoodQuanity,"********",from_price,"***",map.togoodQuantity,"**",to_price)
            items.push(map);
        });
    }

    // console.log(item,"********")
    return item;
}
