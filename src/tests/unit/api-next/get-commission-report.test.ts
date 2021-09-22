import IBApi, { CommissionReport, ExecutionFilter, IBApiNext } from "../../..";
import { EventName } from "../../../api/data/enum/event-name";

describe("RxJS Wrapper: getCommissionReport", () => {
  test("Promise result", (done) => {
    // create IBApiNext
    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;

    const commissionReports: CommissionReport[] = [
      {
        execId: "0000e0d5.619dbad4.01.01",
        commission: 1,
        currency: "USD",
        yieldRedemptionDate: 0,
      },
    ];

    const executionFilter: ExecutionFilter = {};
    const reqId = 1;
    apiNext.getCommissionReport(executionFilter).then((data) => {
      expect(data.length).toEqual(1);
      expect(data[0]).toMatchObject(commissionReports);
      done();
    });

    api.emit(EventName.commissionReport, commissionReports);
    api.emit(EventName.execDetailsEnd, reqId);
  });
});
