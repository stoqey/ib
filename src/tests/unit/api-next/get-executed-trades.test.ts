import IBApi, { ExecutionFilter, IBApiNext } from "../../..";
import { ExecutionDetail } from "../../../api-next/order/execution-detail";
import { EventName } from "../../../api/data/enum/event-name";
import SecType from "../../../api/data/enum/sec-type";

describe("RxJS Wrapper: getExecutionDetails", () => {
  test("Promise result", (done) => {
    // create IBApiNext
    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;

    const executedTrades: ExecutionDetail[] = [
      {
        reqId: 1,
        contract: {
          conId: 265598,
          symbol: "AAPL",
          secType: SecType.STK,
          lastTradeDateOrContractMonth: "",
          strike: 0,
          multiplier: 0,
          exchange: "ARCA",
          currency: "USD",
          localSymbol: "AAPL",
          tradingClass: "NMS",
        },
        execution: {
          orderId: 9,
          execId: "0000e0d5.619dbad4.01.01",
          time: "20210920  17:07:33",
          acctNumber: "DU3360023",
          exchange: "ARCA",
          side: "BOT",
          shares: 10,
          price: 143.82,
          permId: 723015772,
          clientId: 0,
          liquidation: 0,
          cumQty: 10,
          avgPrice: 143.82,
          orderRef: "",
          evRule: "",
          evMultiplier: 0,
          modelCode: "",
          lastLiquidity: {
            value: 2,
          },
        },
      },
    ];

    const executionFilter: ExecutionFilter = {};
    const reqId = 1;
    apiNext.getExecutionDetails(executionFilter).then((data) => {
      expect(data.length).toEqual(1);
      expect(data[0]["reqId"]).toMatchObject(executedTrades);
      done();
    });

    api.emit(EventName.execDetails, executedTrades);
    api.emit(EventName.execDetailsEnd, reqId);
  });
});
