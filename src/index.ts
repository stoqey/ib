/**
 * Interactive Brokers Typescript API
 *
 * ````
 * The MIT License (MIT)
 *
 * Copyright (c) 2020 Stoqey
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * ````
 */

import { IBApi } from "./api/api";

// export the IB Api class and function argument types

export { IBApi, IBApiCreationOptions } from "./api/api";

export { ErrorCode } from "./common/errorCode";

// export contract types

export { CFD } from "./api/contract/cfd";
export { Combo } from "./api/contract/combo";
export { ComboLeg } from "./api/contract/comboLeg";
export { Contract } from "./api/contract/contract";
export { ContractDescription } from "./api/contract/contractDescription";
export { ContractDetails } from "./api/contract/contractDetails";
export { DeltaNeutralContract } from "./api/contract/deltaNeutralContract";
export { FOP } from "./api/contract/fop";
export { Forex } from "./api/contract/forex";
export { Future } from "./api/contract/future";
export { Index } from "./api/contract/ind";
export { Option } from "./api/contract/option";
export { Stock } from "./api/contract/stock";
export { WshEventData } from "./api/contract/wsh";

// export container types

export { DepthMktDataDescription } from "./api/data/container/depth-mkt-data-description";
export { FamilyCode } from "./api/data/container/family-code";
export { NewsProvider } from "./api/data/container/news-provider";
export { SoftDollarTier } from "./api/data/container/soft-dollar-tier";
export { TagValue } from "./api/data/container/tag-value";

// export enum types

export { EventName } from "./api/data/enum/event-name";
export { FADataType } from "./api/data/enum/fad-data-type";
export { LogLevel } from "./api/data/enum/log-level";
export { MIN_SERVER_VER } from "./api/data/enum/min-server-version";
export { OptionExerciseAction } from "./api/data/enum/option-exercise-action";
export { OptionType } from "./api/data/enum/option-type";
export { SecType } from "./api/data/enum/sec-type";

// export historic market-data types

export { DurationUnit } from "./api/data/enum/duration-unit";
export { Bar } from "./api/historical/bar";
export { BarSizeSetting } from "./api/historical/bar-size-setting";
export { HistogramEntry } from "./api/historical/histogramEntry";
export { HistoricalTick } from "./api/historical/historicalTick";
export { HistoricalTickBidAsk } from "./api/historical/historicalTickBidAsk";
export { HistoricalTickLast } from "./api/historical/historicalTickLast";
export * from "./api/historical/what-to-show";
export { ScannerSubscription } from "./api/market/scannerSubscription";
export { TickByTickDataType } from "./api/market/tickByTickDataType";

// export realtime market-data types

import { TickType as IBApiTickType } from "./api/market/tickType";

// export order condition types

export { ContractCondition } from "./api/order/condition/contract-condition";
export { ExecutionCondition } from "./api/order/condition/execution-condition";
export { MarginCondition } from "./api/order/condition/margin-condition";
export { OperatorCondition } from "./api/order/condition/operator-condition";
export { OrderCondition } from "./api/order/condition/order-condition";
export { PercentChangeCondition } from "./api/order/condition/percent-change-condition";
export { PriceCondition } from "./api/order/condition/price-condition";
export { TimeCondition } from "./api/order/condition/time-condition";
export { VolumeCondition } from "./api/order/condition/volume-condition";

// export order enum types

export { ConjunctionConnection } from "./api/order/enum/conjunction-connection";
export { OrderAction } from "./api/order/enum/order-action";
export { OrderConditionType } from "./api/order/enum/order-condition-type";
export { OrderStatus } from "./api/order/enum/order-status";
export { OrderType } from "./api/order/enum/orderType";
export * from "./api/order/enum/tif";
export { TriggerMethod } from "./api/order/enum/trigger-method";

// export order types

export { Execution, Liquidities } from "./api/order/execution";
export { LimitOrder } from "./api/order/limit";
export { MarketOrder } from "./api/order/market";
export { MarketCloseOrder } from "./api/order/marketClose";
export { Order } from "./api/order/order";
export { OrderComboLeg } from "./api/order/orderComboLeg";
export { OrderState } from "./api/order/orderState";
export { StopOrder } from "./api/order/stop";
export { StopLimitOrder } from "./api/order/stopLimit";
export { TrailingStopOrder } from "./api/order/trailingStop";

// export report types

export { CommissionReport } from "./api/report/commissionReport";
export { ExecutionFilter } from "./api/report/executionFilter";

// export market scanner types

export {
  Instrument,
  LocationCode,
  ScanCode,
} from "./api/market-scanner/market-scanner";

// export IBApi as default

export default IBApi;

// export IBApiNext types

export * from "./api-next";

import { IBApiNextTickType } from "./api-next";
/** Combination of IBApi and IBApiNext market data tick types. */
export type TickType = IBApiTickType | IBApiNextTickType;
