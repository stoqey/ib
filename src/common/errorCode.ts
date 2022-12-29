/**
 * [[IBApi]] error event codes.
 */
export enum ErrorCode {
  /** Already connected. */
  ALREADY_CONNECTED = 501,

  /**
   * Couldn't connect to TWS.
   *
   * Confirm that "Enable ActiveX and Socket Clients" is enabled and connection port is the same as Socket Port on
   * the TWS  "Edit->Global Configuration...->API->Settings" menu.
   *
   * Live Trading ports: TWS: 7496; IB Gateway: 4001.
   *
   * Simulated Trading ports for new installations of version 954.1 or newer: TWS: 7497; IB Gateway: 4002
   */
  CONNECT_FAIL = 502,

  /** The TWS is out of date and must be upgraded. */
  UPDATE_TWS = 503,

  /** Not connected. */
  NOT_CONNECTED = 504,

  /** Fatal Error: Unknown message id. */
  UNKNOWN_ID = 505,

  /** Unsupported Version. */
  UNSUPPORTED_VERSION = 506,

  /** Bad Message Length. */
  BAD_LENGTH = 507,

  /** Bad Message. */
  BAD_MESSAGE = 508,

  /** Failed to send message. */
  FAIL_SEND = 509,

  /** Request Market Data Sending Error. */
  FAIL_SEND_REQMKT = 510,

  /** Cancel Market Data Sending Error. */
  FAIL_SEND_CANMKT = 511,

  /** Order Sending Error. */
  FAIL_SEND_ORDER = 512,

  /** Account Update Request Sending Error. */
  FAIL_SEND_ACCT = 513,

  /** Request For Executions Sending Error. */
  FAIL_SEND_EXEC = 514,

  /** Cancel Order Sending Error. */
  FAIL_SEND_CORDER = 515,

  /** Request Open Order Sending Error. */
  FAIL_SEND_OORDER = 516,

  /** Unknown contract. Verify the contract details supplied. */
  UNKNOWN_CONTRACT = 517,

  /** Request Contract Data Sending Error. */
  FAIL_SEND_REQCONTRACT = 518,

  /** Request Market Depth Sending Error. */
  FAIL_SEND_REQMKTDEPTH = 519,

  /** Cancel Market Depth Sending Error. */
  FAIL_SEND_CANMKTDEPTH = 520,

  /** Set Server Log Level Sending Error. */
  FAIL_SEND_SERVER_LOG_LEVEL = 521,

  /** FA Information Request Sending Error. */
  FAIL_SEND_FA_REQUEST = 522,

  /** FA Information Replace Sending Error. */
  FAIL_SEND_FA_REPLACE = 523,

  /** Request Scanner Subscription Sending Error . */
  FAIL_SEND_REQSCANNER = 524,

  /** Cancel Scanner Subscription Sending Error. */
  FAIL_SEND_CANSCANNER = 525,

  /** Request Scanner Parameter Sending Error. */
  FAIL_SEND_REQSCANNERPARAMETERS = 526,

  /** Request Historical Data Sending Error. */
  FAIL_SEND_REQHISTDATA = 527,

  /** Request Historical Data Sending Error. */
  FAIL_SEND_CANHISTDATA = 528,

  /** Request Real-time Bar Data Sending Error. */
  FAIL_SEND_REQRTBARS = 529,

  /** Cancel Real-time Bar Data Sending Error. */
  FAIL_SEND_CANRTBARS = 530,

  /** Request Current Time Sending Error. */
  FAIL_SEND_REQCURRTIME = 531,

  /** Request Fundamental Data Sending Error. */
  FAIL_SEND_REQFUNDDATA = 532,

  /** Cancel Fundamental Data Sending Error. */
  FAIL_SEND_CANFUNDDATA = 533,

  /** Request Calculate Implied Volatility Sending Error. */
  FAIL_SEND_REQCALCIMPLIEDVOLAT = 534,

  /** Request Calculate Option Price Sending Error. */
  FAIL_SEND_REQCALCOPTIONPRICE = 535,

  /** Cancel Calculate Implied Volatility Sending Error. */
  FAIL_SEND_CANCALCIMPLIEDVOLAT = 536,

  /** Cancel Calculate Option Price Sending Error. */
  FAIL_SEND_CANCALCOPTIONPRICE = 537,

  /** Request Global Cancel Sending Error. */
  FAIL_SEND_REQGLOBALCANCEL = 538,

  /** Request Market Data Type Sending Error. */
  FAIL_SEND_REQMARKETDATATYPE = 539,

  /** Request Positions Sending Error. */
  FAIL_SEND_REQPOSITIONS = 540,

  /** Cancel Positions Sending Error. */
  FAIL_SEND_CANPOSITIONS = 541,

  /** Request Account Data Sending Error. */
  FAIL_SEND_REQACCOUNTDATA = 542,

  /** Cancel Account Data Sending Error. */
  FAIL_SEND_CANACCOUNTDATA = 543,

  /** Verify Request Sending Error. */
  FAIL_SEND_VERIFYREQUEST = 544,

  /** Verify Message Sending Error. */
  FAIL_SEND_VERIFYMESSAGE = 545,

  /** Query Display Groups Sending Error. */
  FAIL_SEND_QUERYDISPLAYGROUPS = 546,

  /** Subscribe To Group Events Sending Error. */
  FAIL_SEND_SUBSCRIBETOGROUPEVENTS = 547,

  /** Update Display Group Sending Error. */
  FAIL_SEND_UPDATEDISPLAYGROUP = 548,

  /** Unsubscribe From Group Events Sending Error. */
  FAIL_SEND_UNSUBSCRIBEFROMGROUPEVENTS = 549,

  /** Start API Sending Error. */
  FAIL_SEND_STARTAPI = 550,

  /** Verify And Auth Request Sending Error. */
  FAIL_SEND_VERIFYANDAUTHREQUEST = 551,

  /** Verify And Auth Message Sending Error. */
  FAIL_SEND_VERIFYANDAUTHMESSAGE = 552,

  /** Request Positions Multi Sending Error. */
  FAIL_SEND_REQPOSITIONSMULTI = 553,

  /** Cancel Positions Multi Sending Error. */
  FAIL_SEND_CANPOSITIONSMULTI = 554,

  /** Request Account Updates Multi Sending Error. */
  FAIL_SEND_REQACCOUNTUPDATESMULTI = 555,

  /** Cancel Account Updates Multi Sending Error. */
  FAIL_SEND_CANACCOUNTUPDATESMULTI = 556,

  /** Request Security Definition Option Params Sending Error. */
  FAIL_SEND_REQSECDEFOPTPARAMS = 557,

  /** Request Soft Dollar Tiers Sending Error. */
  FAIL_SEND_REQSOFTDOLLARTIERS = 558,

  /** Request Family Codes Sending Error. */
  FAIL_SEND_REQFAMILYCODES = 559,

  /** Request Matching Symbols Sending Error. */
  FAIL_SEND_REQMATCHINGSYMBOLS = 560,

  /** Request Market Depth Exchanges Sending Error. */
  FAIL_SEND_REQMKTDEPTHEXCHANGES = 561,

  /** Request Smart Components Sending Error. */
  FAIL_SEND_REQSMARTCOMPONENTS = 562,

  /** Request News Providers Sending Error. */
  FAIL_SEND_REQNEWSPROVIDERS = 563,

  /** Request News Article Sending Error. */
  FAIL_SEND_REQNEWSARTICLE = 564,

  /** Request Historical News Sending Error. */
  FAIL_SEND_REQHISTORICALNEWS = 565,

  /** Request Head Time Stamp Sending Error. */
  FAIL_SEND_REQHEADTIMESTAMP = 566,

  /** Cancel Head Time Stamp Sending Error. */
  FAIL_SEND_CANHEADTIMESTAMP = 567,

  /** Request Market Rule Sending Error. */
  FAIL_SEND_REQMARKETRULE = 568,

  /** Request PnL Sending Error. */
  FAIL_SEND_REQPNL = 566,

  /** Cancel PnL Sending Error. */
  FAIL_SEND_CANPNL = 567,

  /** Request PnL Single Sending Error. */
  FAIL_SEND_REQPNL_SINGLE = 568,

  /** Cancel PnL Single Sending Error. */
  FAIL_SEND_CANPNL_SINGLE = 569,

  /** Request Historical Ticks Sending Error. */
  FAIL_SEND_HISTORICAL_TICK = 569,

  /** Request Tick-By-Tick Sending Error. */
  FAIL_SEND_REQTICKBYTICK = 570,

  /** Cancel Tick-By-Tick Sending Error. */
  FAIL_SEND_CANTICKBYTICK = 571,

  /** Request Completed Orders Sending Error. */
  FAIL_SEND_REQ_COMPLETED_ORDERS = 572,

  /** Request WSH Meta Data Sending Error. */
  FAIL_SEND_REQ_WSH_META_DATA = 573,

  /** Cancel WSH Meta Data Sending Error */
  FAIL_SEND_CAN_WSH_META_DATA = 574,

  /** Request WSH Event Data Sending Error */
  FAIL_SEND_REQ_WSH_EVENT_DATA = 575,

  /** Cancel WSH Event Data Sending Error */
  FAIL_SEND_CAN_WSH_EVENT_DATA = 576,

  /* Invalid symbol in string */
  INVALID_SYMBOL = 579


}
