/**
 * This file implement test code for the placeOrder function .
 */
import {
  ConjunctionConnection,
  Contract,
  ErrorCode,
  EventName,
  ExecutionCondition,
  IBApi,
  MarginCondition,
  Order,
  OrderAction,
  OrderCondition,
  OrderType,
  PercentChangeCondition,
  PriceCondition,
  TimeCondition,
  TriggerMethod,
  VolumeCondition,
} from "../../../..";
import configuration from "../../../../common/configuration";
import logger from "../../../../common/logger";
import { aapl_contract, sample_stock } from "../../sample-data/contracts";

const sample_price_condition: OrderCondition = new PriceCondition(
  29,
  TriggerMethod.Default,
  aapl_contract.conId,
  aapl_contract.exchange,
  true,
  ConjunctionConnection.OR,
);
const sample_execution_condition: OrderCondition = new ExecutionCondition(
  sample_stock.exchange,
  sample_stock.secType,
  sample_stock.symbol,
  ConjunctionConnection.OR,
);
const sample_margin_condition: OrderCondition = new MarginCondition(
  10,
  false,
  ConjunctionConnection.OR,
);
const sample_percent_condition: OrderCondition = new PercentChangeCondition(
  0.1,
  aapl_contract.conId,
  aapl_contract.exchange,
  true,
  ConjunctionConnection.OR,
);
const sample_time_condition: OrderCondition = new TimeCondition(
  "20250101-12:00:00",
  true,
  ConjunctionConnection.OR,
);
const sample_volume_condition: OrderCondition = new VolumeCondition(
  100,
  aapl_contract.conId,
  aapl_contract.exchange,
  true,
  ConjunctionConnection.OR,
);

describe("Place Conditional Orders", () => {
  jest.setTimeout(20 * 1000);

  let ib: IBApi;
  let clientId = Math.floor(Math.random() * 32766) + 1; // ensure unique client

  beforeEach(() => {
    ib = new IBApi({
      host: configuration.ib_host,
      port: configuration.ib_port,
      clientId: clientId++, // increment clientId for each test so they don't interfere on each other
    });
  });

  afterEach(() => {
    if (ib) {
      ib.disconnect();
      ib = undefined;
    }
  });

  test("placeOrder with PriceCondition", (done) => {
    let refId: number;

    const refContract: Contract = sample_stock;
    const refOrder: Order = {
      orderType: OrderType.LMT,
      action: OrderAction.BUY,
      lmtPrice: 0.01,
      totalQuantity: 1,
      conditionsIgnoreRth: true,
      conditionsCancelOrder: false,
      conditions: [sample_price_condition],
      transmit: true,
    };

    let isDone = false;
    ib.once(EventName.nextValidId, (orderId: number) => {
      refId = orderId;
      ib.placeOrder(refId, refContract, refOrder);
    })
      .on(EventName.openOrder, (orderId, contract, order, _orderState) => {
        if (orderId == refId && !isDone) {
          isDone = true;
          expect(contract.symbol).toEqual(refContract.symbol);
          expect(order.totalQuantity).toEqual(refOrder.totalQuantity);
          done();
        }
      })
      .on(
        EventName.error,
        (
          error: Error,
          code: ErrorCode,
          reqId: number,
          _advancedOrderReject?: unknown,
        ) => {
          if (reqId === -1) {
            logger.info(error.message);
          } else {
            const msg = `[${reqId}] ${error.message} (Error #${code})`;
            if (
              error.message.includes("Warning:") ||
              error.message.includes("Order Message:")
            ) {
              logger.warn(msg);
            } else {
              ib.disconnect();
              done(msg);
            }
          }
        },
      );

    ib.connect().reqOpenOrders();
  });

  test("placeOrder with ExecutionCondition", (done) => {
    let refId: number;

    const refContract: Contract = sample_stock;
    const refOrder: Order = {
      orderType: OrderType.LMT,
      action: OrderAction.BUY,
      lmtPrice: 0.01,
      totalQuantity: 1,
      conditionsIgnoreRth: true,
      conditionsCancelOrder: false,
      conditions: [sample_execution_condition],
      transmit: true,
    };

    let isDone = false;
    ib.once(EventName.nextValidId, (orderId: number) => {
      refId = orderId;
      ib.placeOrder(refId, refContract, refOrder);
    })
      .on(EventName.openOrder, (orderId, contract, order, _orderState) => {
        if (orderId == refId && !isDone) {
          isDone = true;
          expect(contract.symbol).toEqual(refContract.symbol);
          expect(order.totalQuantity).toEqual(refOrder.totalQuantity);
          done();
        }
      })
      .on(
        EventName.error,
        (
          error: Error,
          code: ErrorCode,
          reqId: number,
          _advancedOrderReject?: unknown,
        ) => {
          if (reqId === -1) {
            logger.info(error.message);
          } else {
            const msg = `[${reqId}] ${error.message} (Error #${code})`;
            if (
              error.message.includes("Warning:") ||
              error.message.includes("Order Message:")
            ) {
              logger.warn(msg);
            } else {
              ib.disconnect();
              done(msg);
            }
          }
        },
      );

    ib.connect().reqOpenOrders();
  });

  test("placeOrder with MarginCondition", (done) => {
    let refId: number;

    const refContract: Contract = sample_stock;
    const refOrder: Order = {
      orderType: OrderType.LMT,
      action: OrderAction.BUY,
      lmtPrice: 0.01,
      totalQuantity: 1,
      conditionsIgnoreRth: true,
      conditionsCancelOrder: false,
      conditions: [sample_margin_condition],
      transmit: true,
    };

    let isDone = false;
    ib.once(EventName.nextValidId, (orderId: number) => {
      refId = orderId;
      ib.placeOrder(refId, refContract, refOrder);
    })
      .on(EventName.openOrder, (orderId, contract, order, _orderState) => {
        if (orderId == refId && !isDone) {
          isDone = true;
          expect(contract.symbol).toEqual(refContract.symbol);
          expect(order.totalQuantity).toEqual(refOrder.totalQuantity);
          done();
        }
      })
      .on(
        EventName.error,
        (
          error: Error,
          code: ErrorCode,
          reqId: number,
          _advancedOrderReject?: unknown,
        ) => {
          if (reqId === -1) {
            logger.info(error.message);
          } else {
            const msg = `[${reqId}] ${error.message} (Error #${code})`;
            if (
              error.message.includes("Warning:") ||
              error.message.includes("Order Message:")
            ) {
              logger.warn(msg);
            } else {
              ib.disconnect();
              done(msg);
            }
          }
        },
      );

    ib.connect().reqOpenOrders();
  });

  test("placeOrder with PercentChangeCondition", (done) => {
    let refId: number;

    const refContract: Contract = sample_stock;
    const refOrder: Order = {
      orderType: OrderType.LMT,
      action: OrderAction.BUY,
      lmtPrice: 0.01,
      totalQuantity: 1,
      conditionsIgnoreRth: true,
      conditionsCancelOrder: false,
      conditions: [sample_percent_condition],
      transmit: true,
    };

    let isDone = false;
    ib.once(EventName.nextValidId, (orderId: number) => {
      refId = orderId;
      ib.placeOrder(refId, refContract, refOrder);
    })
      .on(EventName.openOrder, (orderId, contract, order, _orderState) => {
        if (orderId == refId && !isDone) {
          isDone = true;
          expect(contract.symbol).toEqual(refContract.symbol);
          expect(order.totalQuantity).toEqual(refOrder.totalQuantity);
          done();
        }
      })
      .on(
        EventName.error,
        (
          error: Error,
          code: ErrorCode,
          reqId: number,
          _advancedOrderReject?: unknown,
        ) => {
          if (reqId === -1) {
            logger.info(error.message);
          } else {
            const msg = `[${reqId}] ${error.message} (Error #${code})`;
            if (
              error.message.includes("Warning:") ||
              error.message.includes("Order Message:")
            ) {
              logger.warn(msg);
            } else {
              ib.disconnect();
              done(msg);
            }
          }
        },
      );

    ib.connect().reqOpenOrders();
  });

  test("placeOrder with TimeCondition", (done) => {
    let refId: number;

    const refContract: Contract = sample_stock;
    const refOrder: Order = {
      orderType: OrderType.LMT,
      action: OrderAction.BUY,
      lmtPrice: 0.01,
      totalQuantity: 1,
      conditionsIgnoreRth: true,
      conditionsCancelOrder: false,
      conditions: [sample_time_condition],
      transmit: true,
    };

    let isDone = false;
    ib.once(EventName.nextValidId, (orderId: number) => {
      refId = orderId;
      ib.placeOrder(refId, refContract, refOrder);
    })
      .on(EventName.openOrder, (orderId, contract, order, _orderState) => {
        if (orderId == refId && !isDone) {
          isDone = true;
          expect(contract.symbol).toEqual(refContract.symbol);
          expect(order.totalQuantity).toEqual(refOrder.totalQuantity);
          done();
        }
      })
      .on(
        EventName.error,
        (
          error: Error,
          code: ErrorCode,
          reqId: number,
          _advancedOrderReject?: unknown,
        ) => {
          if (reqId === -1) {
            logger.info(error.message);
          } else {
            const msg = `[${reqId}] ${error.message} (Error #${code})`;
            if (
              error.message.includes("Warning:") ||
              error.message.includes("Order Message:")
            ) {
              logger.warn(msg);
            } else {
              ib.disconnect();
              done(msg);
            }
          }
        },
      );

    ib.connect().reqOpenOrders();
  });

  test("placeOrder with VolumeCondition", (done) => {
    let refId: number;

    const refContract: Contract = sample_stock;
    const refOrder: Order = {
      orderType: OrderType.LMT,
      action: OrderAction.BUY,
      lmtPrice: 0.01,
      totalQuantity: 1,
      conditionsIgnoreRth: true,
      conditionsCancelOrder: false,
      conditions: [sample_volume_condition],
      transmit: true,
    };

    let isDone = false;
    ib.once(EventName.nextValidId, (orderId: number) => {
      refId = orderId;
      ib.placeOrder(refId, refContract, refOrder);
    })
      .on(EventName.openOrder, (orderId, contract, order, _orderState) => {
        if (orderId == refId && !isDone) {
          isDone = true;
          expect(contract.symbol).toEqual(refContract.symbol);
          expect(order.totalQuantity).toEqual(refOrder.totalQuantity);
          done();
        }
      })
      .on(
        EventName.error,
        (
          error: Error,
          code: ErrorCode,
          reqId: number,
          _advancedOrderReject?: unknown,
        ) => {
          if (reqId === -1) {
            logger.info(error.message);
          } else {
            const msg = `[${reqId}] ${error.message} (Error #${code})`;
            if (
              error.message.includes("Warning:") ||
              error.message.includes("Order Message:")
            ) {
              logger.warn(msg);
            } else {
              ib.disconnect();
              done(msg);
            }
          }
        },
      );

    ib.connect().reqOpenOrders();
  });

  test("placeOrder with all conditions", (done) => {
    let refId: number;

    const refContract: Contract = sample_stock;
    const refOrder: Order = {
      orderType: OrderType.LMT,
      action: OrderAction.BUY,
      lmtPrice: 0.01,
      totalQuantity: 1,
      conditionsIgnoreRth: true,
      conditionsCancelOrder: false,
      conditions: [
        sample_price_condition,
        sample_execution_condition,
        sample_margin_condition,
        sample_percent_condition,
        sample_time_condition,
        sample_volume_condition,
      ],
      transmit: true,
    };

    let isDone = false;
    ib.once(EventName.nextValidId, (orderId: number) => {
      refId = orderId;
      ib.placeOrder(refId, refContract, refOrder);
    })
      .on(EventName.openOrder, (orderId, contract, order, _orderState) => {
        if (orderId == refId && !isDone) {
          isDone = true;
          expect(contract.symbol).toEqual(refContract.symbol);
          expect(order.totalQuantity).toEqual(refOrder.totalQuantity);
          done();
        }
      })
      .on(
        EventName.error,
        (
          error: Error,
          code: ErrorCode,
          reqId: number,
          _advancedOrderReject?: unknown,
        ) => {
          if (reqId === -1) {
            logger.info(error.message);
          } else {
            const msg = `[${reqId}] ${error.message} (Error #${code})`;
            if (
              error.message.includes("Warning:") ||
              error.message.includes("Order Message:")
            ) {
              logger.warn(msg);
            } else {
              ib.disconnect();
              done(msg);
            }
          }
        },
      );

    ib.connect().reqOpenOrders();
  });
});
