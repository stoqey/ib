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

export { IBApi, EventName } from "./api/api";

export { ErrorCode } from "./api/errorCode";

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

// export historic market-data types

export { Bar } from "./api/historical/bar";
export { HistogramEntry } from "./api/historical/histogramEntry";
export { HistoricalTick } from "./api/historical/historicalTick";
export { HistoricalTickBidAsk } from "./api/historical/historicalTickBidAsk";
export { HistoricalTickLast } from "./api/historical/historicalTickLast";

// export realtime market-data types

export { TickType, TickByTickDataType } from "./api/market/tickType";
export { ScannerSubscription } from "./api/market/scannerSubscription";

// export order types

export { Liquidities, Execution } from "./api/order/execution";
export { LimitOrder } from "./api/order/limit";
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

export default IBApi;
