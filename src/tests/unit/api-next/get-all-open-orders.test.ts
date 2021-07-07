import IBApi, { IBApiNext } from "../../..";
import { OpenOrder } from "../../../api-next/order/open-order";
import { EventName } from "../../../api/data/enum/event-name";
import OptionType from "../../../api/data/enum/option-type";
import SecType from "../../../api/data/enum/sec-type";
import OrderAction from "../../../api/order/enum/order-action";
import OrderStatus from "../../../api/order/enum/order-status";
import OrderType from "../../../api/order/enum/orderType";

describe('RxJS Wrapper: getAllOpenOrders(', () => {
  test("Promise result", (done) => {
    // create IBApiNext
    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;

    const openOrders: OpenOrder[] = [
      {
        "orderId": 0,
        "contract": {
          "conId": 372615761,
          "symbol": "MOGO",
          "secType": SecType.STK,
          "lastTradeDateOrContractMonth": "",
          "strike": 0,
          "multiplier": 0,
          "exchange": "SMART",
          "currency": "USD",
          "localSymbol": "MOGO",
          "tradingClass": "SCM",
          "comboLegsDescription": ""
        },
        "order": {
          "orderId": 0,
          "action": OrderAction.BUY,
          "totalQuantity": 1000,
          "orderType": OrderType.LMT,
          "lmtPrice": 7.1,
          "auxPrice": 0,
          "tif": "GTC",
          "ocaGroup": "",
          "account": "DU*******",
          "openClose": "",
          "origin": 0,
          "orderRef": "",
          "clientId": 0,
          "permId": 374834303,
          "outsideRth": false,
          "hidden": false,
          "discretionaryAmt": 0,
          "goodAfterTime": "",
          "faGroup": "",
          "faMethod": "",
          "faPercentage": "",
          "faProfile": "",
          "modelCode": "",
          "goodTillDate": "",
          "rule80A": "0",
          "percentOffset": 1.7976931348623157e+308,
          "settlingFirm": "",
          "shortSaleSlot": 0,
          "designatedLocation": "",
          "exemptCode": -1,
          "auctionStrategy": 0,
          "startingPrice": 1.7976931348623157e+308,
          "stockRefPrice": 1.7976931348623157e+308,
          "delta": 1.7976931348623157e+308,
          "stockRangeLower": 1.7976931348623157e+308,
          "stockRangeUpper": 1.7976931348623157e+308,
          "displaySize": 0,
          "blockOrder": false,
          "sweepToFill": false,
          "allOrNone": false,
          "minQty": 1.7976931348623157e+308,
          "ocaType": 3,
          "eTradeOnly": false,
          "firmQuoteOnly": false,
          "nbboPriceCap": 1.7976931348623157e+308,
          "parentId": 0,
          "triggerMethod": 0,
          "volatility": 1.7976931348623157e+308,
          "volatilityType": 0,
          "deltaNeutralOrderType": "None",
          "deltaNeutralAuxPrice": 1.7976931348623157e+308,
          "deltaNeutralConId": 0,
          "deltaNeutralSettlingFirm": "",
          "deltaNeutralClearingAccount": "",
          "deltaNeutralClearingIntent": "",
          "deltaNeutralOpenClose": "?",
          "deltaNeutralShortSale": false,
          "deltaNeutralShortSaleSlot": 0,
          "deltaNeutralDesignatedLocation": "",
          "continuousUpdate": 0,
          "referencePriceType": 0,
          "trailStopPrice": 1.7976931348623157e+308,
          "trailingPercent": 1.7976931348623157e+308,
          "basisPoints": 1.7976931348623157e+308,
          "basisPointsType": 1.7976931348623157e+308,
          "scaleInitLevelSize": 0,
          "scaleSubsLevelSize": 1.7976931348623157e+308,
          "scalePriceIncrement": 1.7976931348623157e+308,
          "hedgeType": "",
          "optOutSmartRouting": false,
          "clearingAccount": "0",
          "clearingIntent": "",
          "notHeld": false,
          "algoStrategy": "0",
          "solicited": false,
          "whatIf": false,
          "randomizeSize": false,
          "randomizePrice": false,
          "conditions": [],
          "adjustedOrderType": "None",
          "triggerPrice": 1.7976931348623157e+308,
          "lmtPriceOffset": 1.7976931348623157e+308,
          "adjustedStopPrice": 1.7976931348623157e+308,
          "adjustedStopLimitPrice": 1.7976931348623157e+308,
          "adjustedTrailingAmount": 1.7976931348623157e+308,
          "adjustableTrailingUnit": 0,
          "softDollarTier": {
            "name": "",
            "value": "",
            "displayName": ""
          },
          "cashQty": 0,
          "dontUseAutoPriceForHedge": true,
          "isOmsContainer": false,
          "discretionaryUpToLimitPrice": false,
          "usePriceMgmtAlgo": true
        },
        "orderState": {
          "status": OrderStatus.Submitted,
          "initMarginBefore": 1.7976931348623157e+308,
          "maintMarginBefore": 1.7976931348623157e+308,
          "equityWithLoanBefore": 1.7976931348623157e+308,
          "initMarginChange": 1.7976931348623157e+308,
          "maintMarginChange": 1.7976931348623157e+308,
          "equityWithLoanChange": 1.7976931348623157e+308,
          "initMarginAfter": 1.7976931348623157e+308,
          "maintMarginAfter": 1.7976931348623157e+308,
          "equityWithLoanAfter": 1.7976931348623157e+308,
          "commission": 1.7976931348623157e+308,
          "minCommission": 1.7976931348623157e+308,
          "maxCommission": 1.7976931348623157e+308,
          "commissionCurrency": "",
          "warningText": ""
        }
      }
    ]


    apiNext.getAllOpenOrders()
      .then((data) => {
        expect(data.length).toEqual(1);
        expect(data[0]).toMatchObject(openOrders[0])

      });

    api.emit(EventName.openOrder, openOrders)
    api.emit(EventName.openOrderEnd)

  })
})
