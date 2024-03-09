/**
 * This file implement test code for the placeOrder function .
 */
import {
  Contract,
  ErrorCode,
  EventName,
  IBApi,
  Order,
  OrderAction,
  OrderType,
} from "../../../..";
import configuration from "../../../../common/configuration";
import logger from "../../../../common/logger";
import {
  sample_execution_condition,
  sample_margin_condition,
  sample_percent_condition,
  sample_price_condition,
  sample_time_condition,
  sample_volume_condition,
} from "../../sample-data/conditions";
import { sample_stock } from "../../sample-data/contracts";

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
