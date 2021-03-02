/**
 * Emitted event names.
 */
export enum EventName {
  /** Notifies when an event has been received (called for the any type for event). */
  all = "all",

  /** Notifies when the connection to TWS/IB Gateway has been established successfully. */
  connected = "connected",

  /** Notifies that the TCP socket connection to the TWS/IB Gateway has been disconnected. */
  disconnected = "disconnected",

  /** Notifies about the API server version. */
  server = "server",

  /** A Connection, API, or TWS Error event. */
  error = "error",

  /** An Connection, API, or TWS notification message. */
  info = "info",

  /** Notifies when data has been received from the server. */
  received = "received",

  /** Notifies when data is sent to the server. */
  sent = "sent",

  /** Notifies about the the result to request. */
  result = "result",

  /** Notifies when all the account's information has finished. */
  accountDownloadEnd = "accountDownloadEnd",

  /** Receives the account information. */
  accountSummary = "accountSummary",

  /** Notifies when all the accounts' information has ben received. */
  accountSummaryEnd = "accountSummaryEnd",

  /** Provides the account updates. */
  accountUpdateMulti = "accountUpdateMulti",

  /** Indicates all the account updates have been transmitted. */
  accountUpdateMultiEnd = "accountUpdateMultiEnd",

  /** Delivers the Bond contract data after this has been requested via reqContractDetails. */
  bondContractDetails = "bondContractDetails",

  /** Provides the [[CommissionReport]] of an [[Execution]] */
  commissionReport = "commissionReport",

  /** Feeds in completed orders. */
  completedOrder = "completedOrder",

  /** Notifies the end of the completed orders' reception. */
  completedOrdersEnd = "completedOrdersEnd",

  /** Callback to indicate the API connection has closed. */
  connectionClosed = "connectionClosed",

  /** Receives the full contract's definitions. */
  contractDetails = "contractDetails",

  /** After all contracts matching the request were returned, this method will mark the end of their reception. */
  contractDetailsEnd = "contractDetailsEnd",

  /** TWS's current time. */
  currentTime = "currentTime",

  /** A one-time response to querying the display groups.  */
  deltaNeutralValidation = "deltaNeutralValidation",

  /**
   * When requesting market data snapshots, this market will indicate the snapshot reception is finished.
   * Expected to occur 11 seconds after beginning of request.
   */
  tickSnapshotEnd = "tickSnapshotEnd",

  /** Returns the market data type. */
  marketDataType = "marketDataType",

  /** A one-time response to querying the display groups.  */
  displayGroupList = "displayGroupList",

  /**
   * Call triggered once after receiving the subscription request, and will be sent again
   * if the selected contract in the subscribed display group has changed.
   */
  displayGroupUpdated = "displayGroupUpdated",

  /** Provides the executions which happened in the last 24 hours. */
  execDetails = "execDetails",

  /** Indicates the end of the [[Execution]] reception. */
  execDetailsEnd = "execDetailsEnd",

  /** Returns array of family codes. */
  familyCodes = "familyCodes",

  /** Returns array of sample contract descriptions. */
  contractDescriptions = "contractDescriptions",

  /** Returns fundamental data. */
  fundamentalData = "fundamentalData",

  /** Returns beginning of data for contract for specified data type. */
  headTimestamp = "headTimestamp",

  /** Returns data histogram. */
  histogramData = "histogramData",

  /** Receives bars in real time if keepUpToDate is `true` in reqHistoricalData. */
  historicalDataUpdate = "historicalDataUpdate",

  /** Returns news headline */
  historicalNews = "historicalNews",

  /** Returns news headline. */
  historicalNewsEnd = "historicalNewsEnd",

  /** Returns historical price tick data. */
  historicalTicks = "historicalTicks",

  /** Returns historical bid/ask tick data. */
  historicalTicksBidAsk = "historicalTicksBidAsk",

  /**  Returns historical last price tick data. */
  historicalTicksLast = "historicalTicksLast",

  /** Receives a comma-separated string with the managed account ids. */
  managedAccounts = "managedAccounts",

  /** Returns minimum price increment structure for a particular market rule ID. */
  marketRule = "marketRule",

  /**  Called when receives Depth Market Data Descriptions. */
  mktDepthExchanges = "mktDepthExchanges",

  /** Called when receives News Article. */
  newsArticle = "newsArticle",

  /** Returns array of subscribed API news providers for this user */
  newsProviders = "newsProviders",

  /** Receives next valid order id. */
  nextValidId = "nextValidId",

  /**  Feeds in currently open orders. */
  openOrder = "openOrder",

  /** Notifies the end of the open orders' reception. */
  openOrderEnd = "openOrderEnd",

  /** Response to API bind order control message. */
  orderBound = "orderBound",

  /** Gives the up-to-date information of an order every time it changes. */
  orderStatus = "orderStatus",

  /** Receives PnL updates in real time for the daily PnL and the total unrealized PnL for an account. */
  pnl = "pnl",

  /** Receives real time updates for single position daily PnL values. */
  pnlSingle = "pnlSingle",

  /** Provides the portfolio's open positions. */
  position = "position",

  /** Indicates all the positions have been transmitted. */
  positionEnd = "positionEnd",

  /** Provides the portfolio's open positions. */
  positionMulti = "positionMulti",

  /** Indicates all the positions have been transmitted. */
  positionMultiEnd = "positionMultiEnd",

  /** Updates the real time 5 seconds bars. */
  realtimeBar = "realtimeBar",

  /** Receives the Financial Advisor's configuration available in the TWS. */
  receiveFA = "receiveFA",

  /** Notifies the end of the FA replace. */
  replaceFAEnd = "replaceFAEnd",

  /** Returns conId and exchange for CFD market data request re-route. */
  rerouteMktDataReq = "rerouteMktDataReq",

  /**
   * Returns the conId and exchange for an underlying contract when a request is made for level 2 data for an
   * instrument which does not have data in IB's database. For example stock CFDs and index CFDs.
   */
  rerouteMktDepthReq = "rerouteMktDepthReq",

  /**  Provides the data resulting from the market scanner request. */
  scannerData = "scannerData",

  /** Indicates the scanner data reception has terminated. */
  scannerDataEnd = "scannerDataEnd",

  /** Provides the xml-formatted parameters available from TWS market scanners (not all available in API). */
  scannerParameters = "scannerParameters",

  /** Provides the option chain for an underlying on an exchange specified in reqSecDefOptParams. */
  securityDefinitionOptionParameter = "securityDefinitionOptionParameter",

  /** Called when all callbacks to securityDefinitionOptionParameter are complete. */
  securityDefinitionOptionParameterEnd = "securityDefinitionOptionParameterEnd",

  /** Bit number to exchange + exchange abbreviation dictionary. */
  smartComponents = "smartComponents",

  /** Called when receives Soft Dollar Tier configuration information */
  softDollarTiers = "softDollarTiers",

  /** Provides an array of sample contract descriptions. */
  symbolSamples = "symbolSamples",

  /** Provides "Last" or "AllLast" tick-by-tick real-time tick. */
  tickByTickAllLast = "tickByTickAllLast",

  /** Provides "BidAsk" tick-by-tick real-time tick. */
  tickByTickBidAsk = "tickByTickBidAsk",

  /** Provides "MidPoint" tick-by-tick real-time tick. */
  tickByTickMidPoint = "tickByTickMidPoint",

  /**  Exchange for Physicals. */
  tickEFP = "tickEFP",

  /** Provides a market data generic tick. */
  tickGeneric = "tickGeneric",

  /** Provides a news headline tick. */
  tickNews = "tickNews",

  /** Provides option specific market data. */
  tickOptionComputation = "tickOptionComputation",

  /** Market data tick price callback. Handles all price related ticks. */
  tickPrice = "tickPrice",

  /** A tick with BOO exchange and snapshot permissions. */
  tickReqParams = "tickReqParams",

  /** Market data tick size callback. Handles all size-related ticks. */
  tickSize = "tickSize",

  /**  Market data callback. Every tickPrice is followed by a tickSize. */
  tickString = "tickString",

  /** Receives the last time on which the account was updated. */
  updateAccountTime = "updateAccountTime",

  /** Receives the subscribed account's information. */
  updateAccountValue = "updateAccountValue",

  /** Receives the subscribed account's portfolio. */
  updatePortfolio = "updatePortfolio",

  /** Returns the order book. */
  updateMktDepth = "updateMktDepth",

  /** Returns the order book (level 2). */
  updateMktDepthL2 = "updateMktDepthL2",

  /** Provides IB's bulletins. */
  updateNewsBulletin = "updateNewsBulletin",

  /** Returns the requested historical data bars. */
  historicalData = "historicalData",
}
