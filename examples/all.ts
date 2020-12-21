import util from "util";
import chalk from "chalk";

import { IBApi } from "..";
import * as reqPositions from "./reqPositions";

/**
 * Run the examples.
 *
 * @param ib A connected IBApi object.
 */
function runExamples(ib: IBApi): void  {
  reqPositions.run(ib);
}

/**
 * Create a IBApi object, register generic event handler and connect to the TWS or IB Gateway.
 *
 * @param execFunc Callback function, invoked as soon connected TWS/IB Gateway has been established.
 */
function startUp(execFunc: (ib: IBApi) => void): IBApi {

  // create IB API object

  const ib = new IBApi({
    // clientId: 0,
    host: "localhost",
    port: 4001
  });

  // register generic event handler

  ib.on("connected", () => {
    console.log(chalk.inverse("CONNECTED"));
    execFunc(ib);
  }).on("disconnected", () => {
    console.log(chalk.inverse("DISCONNECTED"));
  }).on("received", (tokens: string[]) => {
    console.info("%s %s", chalk.cyan("<<< RECV <<<"), JSON.stringify(tokens));
  }).on("sent", (tokens: string[]) => {
    console.info("%s %s", chalk.yellow(">>> SENT >>>"), JSON.stringify(tokens));
  }).on("server", function (version: number, connectionTime: string) {
    console.log(chalk.inverse(util.format("Server Version: %d", version)));
    console.log(chalk.inverse(util.format("Server Connection Time: %s", connectionTime)));
  }).on("error", function (err: Error) {
    console.error(chalk.red(util.format("@@@ ERROR: %s @@@", err.message)));
  }).on("result", function (event, args) {
    console.log(chalk.green(util.format("======= %s =======", event)));
    args.forEach(function (arg, i) {
      console.log("%s %s",
        chalk.green(util.format("[%d]", i + 1)),
        JSON.stringify(arg)
      );
    });
  });

  // connect to TWS (or B Gateway)

  ib.connect();

  return ib;

  //
  // Function call examples
  //


  ib.exerciseOptions(12345, {
    currency: "USD",
    exchange: "SMART",
    expiry: "20140118",
    right: "C",
    secType: "OPT",
    strike: 40.00,
    symbol: "QQQQ"
  }, ib.EXERCISE_ACTION.EXERCISE, 10, "U1234567", 0);  // tickerId, contract, exerciseAction, exerciseQuantity, account, override

  /*
  ib.on("tickPrice", (id: number, field: TICK_TYPE, val: number, attr: unknown) =>  {
    console.log(field);
  });
  */

  ib.reqPositions();



  ib.calculateImpliedVolatility(12345, {
    currency: "USD",
    exchange: "SMART",
    expiry: "20140118",
    right: "C",
    secType: "OPT",
    strike: 40.00,
    symbol: "QQQQ"
  }, 12.34, 56.78);  // reqId, contract, optionPrice, underPrice





  ib.calculateOptionPrice(12345, {
    currency: "USD",
    exchange: "SMART",
    expiry: "20140118",
    right: "C",
    secType: "OPT",
    strike: 40.00,
    symbol: "QQQQ"
  }, 12.34, 56.78);  // reqId, contract, volatility, underPrice

  ib.cancelAccountSummary(12345);  // reqId

  ib.cancelCalculateImpliedVolatility(12345);  // reqId

  ib.cancelCalculateOptionPrice(12345);  // reqId

  ib.cancelFundamentalData(12345);  // reqId

  ib.cancelHistoricalData(12345);  // tickerId

  ib.cancelMktData(12345);  // tickerId

  ib.cancelMktDepth(12345);  // tickerId

  ib.cancelNewsBulletins();

  ib.cancelOrder(12345);  // id

  ib.cancelPositions();

  ib.cancelRealTimeBars(12345);  // tickerId

  ib.cancelScannerSubscription(12345);  // tickerId

  ib.exerciseOptions(12345, {
    currency: "USD",
    exchange: "SMART",
    expiry: "20140118",
    right: "C",
    secType: "OPT",
    strike: 40.00,
    symbol: "QQQQ"
  }, ib.EXERCISE_ACTION.EXERCISE, 10, "U1234567", 0);  // tickerId, contract, exerciseAction, exerciseQuantity, account, override

  // ib.placeOrder(id, contract, order);

  ib.replaceFA(ib.FA_DATA_TYPE.GROUPS, "<?xml version=\"1.0\" encoding=\"UTF-8\"?>");  // faDataType, xml

  ib.reqAccountSummary(12345, "All", "AccountType,NetLiquidation,TotalCashValue,SettledCash,AccruedCash,BuyingPower,EquityWithLoanValue,PreviousEquityWithLoanValue,GrossPositionValue,RegTEquity,RegTMargin,SMA,InitMarginReq,MaintMarginReq,AvailableFunds,ExcessLiquidity,Cushion,FullInitMarginReq,FullMaintMarginReq,FullAvailableFunds,FullExcessLiquidity,LookAheadNextChange,LookAheadInitMarginReq,LookAheadMaintMarginReq,LookAheadAvailableFunds,LookAheadExcessLiquidity,HighestSeverity,DayTradesRemaining,Leverage");  // reqId, group, tags

  ib.reqAccountUpdates(true, "U1234567");  // subscribe, acctCode

  ib.reqAllOpenOrders();

  ib.reqAutoOpenOrders(true);  // bAutoBind

  ib.reqContractDetails(101, {
    currency: "USD",
    exchange: "IDEALPRO",
    secType: "CASH",
    symbol: "EUR"
  });  // reqId, contract

  ib.reqCurrentTime();

  ib.reqExecutions(12345, {
    // clientId: '',
    // acctCode: '',
    // time: '',
    // symbol: '',
    // secType: '',
    // exchange: '',
    // side: ''
  });  // reqId, filter

  ib.reqFundamentalData(201, {
    currency: "USD",
    exchange: "SMART",
    primaryExch: "NASDAQ",
    secType: "STK",
    symbol: "AMZN"
  }, "Estimates");  // reqId, contract, reportType

  ib.reqFundamentalData(202, {
    currency: "USD",
    exchange: "SMART",
    primaryExch: "NASDAQ",
    secType: "STK",
    symbol: "AMZN"
  }, "Financial Statements");  // reqId, contract, reportType

  ib.reqFundamentalData(203, {
    currency: "USD",
    exchange: "SMART",
    primaryExch: "NASDAQ",
    secType: "STK",
    symbol: "AMZN"
  }, "Summary");  // reqId, contract, reportType

  ib.reqGlobalCancel();

  // ib.reqHistoricalData(12345, {}, ...);  // tickerId, contract, endDateTime, durationStr, barSizeSetting, whatToShow, useRTH, formatDate

  ib.reqIds(1);  // numIds

  ib.reqManagedAccts();

  ib.reqMarketDataType(1);  // marketDataType (1 or 2)

  ib.reqMktData(301, {
    currency: "USD",
    exchange: "IDEALPRO",
    secType: "CASH",
    symbol: "EUR"
  }, "", false, false);  // tickerId, contract, genericTickList, snapshot

  ib.reqMktData(302, {
    currency: "CAD",
    exchange: "IDEALPRO",
    secType: "CASH",
    symbol: "USD"
  }, "", false, false);  // tickerId, contract, genericTickList, snapshot

  ib.reqMktData(303, {
    currency: "USD",
    exchange: "SMART",
    primaryExch: "NASDAQ",
    secType: "STK",
    symbol: "AMZN"
  }, "", false, false);  // tickerId, contract, genericTickList, snapshot

  ib.reqMktDepth(12345, {
    currency: "CAD",
    exchange: "IDEALPRO",
    secType: "CASH",
    symbol: "USD"
  }, 10);  // tickerId, contract, numRows

  ib.reqNewsBulletins(true);  // allMsgs

  ib.reqOpenOrders();

  ib.reqPositions();

  ib.reqRealTimeBars(12345, {
    currency: "USD",
    exchange: "SMART",
    primaryExch: "NASDAQ",
    secType: "STK",
    symbol: "AMZN"
  }, 5, "TRADES", false);  // tickerId, contract, barSize, whatToShow, useRTH

  // ib.reqScannerParameters();

  ib.reqScannerSubscription(12345, {
    instrument: "STK",
    locationCode: "STK.NASDAQ.NMS",
    numberOfRows: 5,
    scanCode: "TOP_PERC_GAIN",
    stockTypeFilter: "ALL"
  });  // tickerId, subscription

  ib.requestFA(ib.FA_DATA_TYPE.GROUPS);  // faDataType

  ib.requestFA(ib.FA_DATA_TYPE.PROFILES);  // faDataType

  // ib.requestFA(ib.FA_DATA_TYPE.ALIASES);  // faDataType

  ib.setServerLogLevel(ib.LOG_LEVEL.WARN);  // logLevel

  // ib.disconnect();


  ib.reqSecDefOptParams(1235, "IBM", "", "STK", 8314);  // reqId, underlyingSymbol, futFopExchange, underlyingSecType, underlyingConId

  ib.reqHeadTimestamp(11234, { secType: "STK", symbol: "IBM", exchange: "SMART", currency: "USD" }, "TRADES", 0, 0);   // (reqId, contract, whatToShow, useRTH, formatDate)
}


setTimeout(() => startUp(runExamples), 2000);
