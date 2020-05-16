import assert from 'assert';
import { EventEmitter } from 'events';
import _ from 'lodash'
import C from './constants';
import Controller from './controller';

import order from './order';
import contract from './contract';
import utils from './util';

class IB extends EventEmitter {
  _controller: any;

  contract = contract;
  order = order;
  util = utils;

  constructor(options) {
    super();
    this._controller = new Controller(this, options);
    this.on('error', function () { });
  }


  _send = function () {
    var args = Array.prototype.slice.call(arguments);
    this._controller.schedule('api', {
      func: args[0],
      args: args.slice(1)
    });
  };

  connect = function (): IB {
    this._controller.schedule('connect');

    return this;
  };

  disconnect = function () {
    this._controller.schedule('disconnect');

    return this;
  };

  calculateImpliedVolatility = function (reqId, contract, optionPrice, underPrice) {
    this._send('calculateImpliedVolatility', reqId, contract, optionPrice, underPrice);

    return this;
  };

  calculateOptionPrice = function (reqId, contract, volatility, underPrice) {
    this._send('calculateOptionPrice', reqId, contract, volatility, underPrice);

    return this;
  };

  cancelAccountSummary = function (reqId) {
    assert(_.isNumber(reqId), '"reqId" must be an integer - ' + reqId);

    this._send('cancelAccountSummary', reqId);

    return this;
  };

  cancelPositionsMulti = function (reqId) {
    assert(_.isNumber(reqId), '"reqId" must be an integer - ' + reqId);

    this._send('cancelPositionsMulti', reqId);

    return this;
  };

  cancelAccountUpdatesMulti = function (reqId) {
    assert(_.isNumber(reqId), '"reqId" must be an integer - ' + reqId);

    this._send('cancelAccountUpdatesMulti', reqId);

    return this;
  };

  cancelCalculateImpliedVolatility = function (reqId) {
    assert(_.isNumber(reqId), '"reqId" must be an integer - ' + reqId);

    this._send('cancelCalculateImpliedVolatility', reqId);

    return this;
  };

  cancelCalculateOptionPrice = function (reqId) {
    assert(_.isNumber(reqId), '"reqId" must be an integer - ' + reqId);

    this._send('cancelCalculateOptionPrice', reqId);

    return this;
  };

  cancelFundamentalData = function (reqId) {
    assert(_.isNumber(reqId), '"reqId" must be an integer - ' + reqId);

    this._send('cancelFundamentalData', reqId);

    return this;
  };

  cancelHistoricalData = function (tickerId) {
    assert(_.isNumber(tickerId), '"tickerId" must be an integer - ' + tickerId);

    this._send('cancelHistoricalData', tickerId);

    return this;
  };

  cancelMktData = function (tickerId) {
    assert(_.isNumber(tickerId), '"tickerId" must be an integer - ' + tickerId);

    this._send('cancelMktData', tickerId);

    return this;
  };

  cancelMktDepth = function (tickerId) {
    assert(_.isNumber(tickerId), '"tickerId" must be an integer - ' + tickerId);

    this._send('cancelMktDepth', tickerId);

    return this;
  };

  cancelNewsBulletins = function () {
    this._send('cancelNewsBulletins');

    return this;
  };

  cancelOrder = function (id) {
    assert(_.isNumber(id), '"id" must be an integer - ' + id);

    this._send('cancelOrder', id);

    return this;
  };

  cancelPositions = function () {
    this._send('cancelPositions');

    return this;
  };

  cancelRealTimeBars = function (tickerId) {
    assert(_.isNumber(tickerId), '"tickerId" must be an integer - ' + tickerId);

    this._send('cancelRealTimeBars', tickerId);

    return this;
  };

  cancelScannerSubscription = function (tickerId) {
    assert(_.isNumber(tickerId), '"tickerId" must be an integer - ' + tickerId);

    this._send('cancelScannerSubscription', tickerId);

    return this;
  };

  exerciseOptions = function (tickerId, contract, exerciseAction, exerciseQuantity,
    account, override) {
    assert(_.isNumber(tickerId), '"tickerId" must be an integer - ' + tickerId);
    assert(_.isPlainObject(contract), '"contract" must be a plain object - ' + contract);
    assert(_.isNumber(exerciseAction), '"exerciseAction" must be an integer - ' + exerciseAction);
    assert(_.isNumber(exerciseQuantity), '"exerciseQuantity" must be an integer - ' + exerciseQuantity);
    assert(_.isString(account), '"account" must be a string - ' + account);
    assert(_.isNumber(override), '"override" must be an integer - ' + override);

    this._send('exerciseOptions', tickerId, contract, exerciseAction, exerciseQuantity,
      account, override);

    return this;
  };

  placeOrder = function (id, contract, order) {
    assert(_.isNumber(id), '"id" must be an integer - ' + id);
    assert(_.isPlainObject(contract), '"contract" must be a plain object - ' + contract);
    assert(_.isPlainObject(order), '"order" must be a plain object - ' + order);

    this._send('placeOrder', id, contract, order);

    return this;
  };

  replaceFA = function (faDataType, xml) {
    assert(_.isNumber(faDataType), '"faDataType" must be an integer - ' + faDataType);
    assert(_.isString(xml), '"xml" must be a string - ' + xml);

    this._send('replaceFA', faDataType, xml);

    return this;
  };

  reqAccountSummary = function (reqId, group, tags) {
    assert(_.isNumber(reqId), '"reqId" must be an integer - ' + reqId);
    assert(_.isString(group), '"group" must be a string - ' + group);
    assert(_.isArray(tags) || _.isString(tags), '"tags" must be array or string - ' + tags);

    if (_.isArray(tags)) { tags = tags.join(','); }

    this._send('reqAccountSummary', reqId, group, tags);

    return this;
  };

  reqAccountUpdates = function (subscribe, acctCode) {
    assert(_.isBoolean(subscribe), '"subscribe" must be a boolean - ' + subscribe);
    assert(_.isString(acctCode), '"acctCode" must be a string - ' + acctCode);

    this._send('reqAccountUpdates', subscribe, acctCode);

    return this;
  };

  reqAccountUpdatesMulti = function (reqId, acctCode, modelCode, ledgerAndNLV) {
    assert(_.isNumber(reqId), '"reqId" must be an integer - ' + reqId);
    assert(_.isString(acctCode), '"acctCode" must be a string - ' + acctCode);
    assert(_.isString(modelCode) || _.isNull(modelCode), '"modelCode" must be a string or null - ' + modelCode);
    assert(_.isBoolean(ledgerAndNLV), '"ledgerAndNLV" must be a boolean - ' + ledgerAndNLV);

    this._send('reqAccountUpdatesMulti', reqId, acctCode, modelCode, ledgerAndNLV);

    return this;
  };

  reqAllOpenOrders = function () {
    this._send('reqAllOpenOrders');

    return this;
  };

  reqAutoOpenOrders = function (bAutoBind) {
    assert(_.isBoolean(bAutoBind), '"bAutoBind" must be a boolean - ' + bAutoBind);

    this._send('reqAutoOpenOrders', bAutoBind);

    return this;
  };

  reqContractDetails = function (reqId, contract) {
    assert(_.isNumber(reqId), '"reqId" must be an integer - ' + reqId);
    assert(_.isPlainObject(contract), '"contract" must be a plain object - ' + contract);

    this._send('reqContractDetails', reqId, contract);

    return this;
  };

  reqCurrentTime = function () {
    this._send('reqCurrentTime');

    return this;
  };

  reqExecutions = function (reqId, filter) {
    assert(_.isNumber(reqId), '"reqId" must be an integer - ' + reqId);
    assert(_.isPlainObject(filter), '"filter" must be a plain object - ' + filter);

    this._send('reqExecutions', reqId, filter);

    return this;
  };

  reqFundamentalData = function (reqId, contract, reportType) {
    assert(_.isNumber(reqId), '"reqId" must be an integer - ' + reqId);
    assert(_.isPlainObject(contract), '"contract" must be a plain object - ' + contract);
    assert(_.isString(reportType), '"reportType" must be a string - ' + reportType);

    this._send('reqFundamentalData', reqId, contract, reportType);

    return this;
  };

  reqGlobalCancel = function () {
    this._send('reqGlobalCancel');

    return this;
  };

  reqHeadTimestamp = function (reqId, contract, whatToShow, useRTH, formatDate) {
    assert(_.isNumber(reqId), '"reqId" must be an integer - ' + reqId);
    assert(_.isPlainObject(contract), '"contract" must be a plain object - ' + contract);
    assert(_.isString(whatToShow), '"whatToShow" must be a string - ' + whatToShow);
    assert(_.isNumber(useRTH), '"useRTH" must be an integer - ' + useRTH);
    assert(_.isNumber(formatDate), '"formatDate" must be an integer - ' + formatDate);
    this._send('reqHeadTimestamp', reqId, contract, whatToShow, useRTH, formatDate);
  };

  reqSecDefOptParams = function (reqId, underlyingSymbol, futFopExchange, underlyingSecType, underlyingConId) {
    assert(_.isNumber(reqId), '"reqId" must be an integer - ' + reqId);
    assert(_.isString(underlyingSymbol), '"underlyingSymbol" must be a string - ' + underlyingSymbol);
    assert(_.isString(futFopExchange), '"futFopExchange" must be a string - ' + futFopExchange);
    assert(_.isString(futFopExchange), '"underlyingSecType" must be a string - ' + underlyingSecType);
    assert(_.isNumber(underlyingConId), '"underlyingConId" must be an integer - ' + underlyingConId);

    this._send('reqSecDefOptParams', reqId, underlyingSymbol, futFopExchange, underlyingSecType, underlyingConId);
    return this;
  };

  reqHistoricalData = function (tickerId, contract, endDateTime, durationStr,
    barSizeSetting, whatToShow, useRTH, formatDate, keepUpToDate) {
    assert(_.isNumber(tickerId), '"tickerId" must be an integer - ' + tickerId);
    assert(_.isPlainObject(contract), '"contract" must be a plain object - ' + contract);
    assert(_.isString(endDateTime), '"endDateTime" must be a string - ' + endDateTime);
    assert(_.isString(durationStr), '"durationStr" must be a string - ' + durationStr);
    assert(_.isString(barSizeSetting), '"barSizeSetting" must be a string - ' + barSizeSetting);
    assert(_.isString(whatToShow), '"whatToShow" must be a string - ' + whatToShow);
    assert(_.isNumber(useRTH), '"useRTH" must be an integer - ' + useRTH);
    assert(_.isNumber(formatDate), '"formatDate" must be an integer - ' + formatDate);
    assert(_.isBoolean(keepUpToDate), '"keepUpToDate" must be an boolean - ' + keepUpToDate);

    this._send('reqHistoricalData', tickerId, contract, endDateTime, durationStr,
      barSizeSetting, whatToShow, useRTH, formatDate, keepUpToDate);

    return this;
  };

  reqHistoricalTicks = function (tickerId, contract, startDateTime, endDateTime, numberOfTicks,
    whatToShow, useRTH, ignoreSize) {
    assert(_.isNumber(tickerId), '"tickerId" must be an integer - ' + tickerId);
    assert(_.isPlainObject(contract), '"contract" must be a plain object - ' + contract);
    if (startDateTime && endDateTime || !startDateTime && !endDateTime) {
      assert.fail('specify one of "startDateTime" or "endDateTime" (as a string) but not both - ' + startDateTime + ':' + endDateTime);
    }
    assert(_.isNumber(numberOfTicks), '"numberOfTicks" must be a number - ' + numberOfTicks);
    assert(_.isString(whatToShow), '"whatToShow" must be a string - ' + whatToShow);
    assert(_.isNumber(useRTH), '"useRTH" must be an integer - ' + useRTH);
    assert(_.isBoolean(ignoreSize), '"ignoreSize" must be an boolean - ' + ignoreSize);

    this._send('reqHistoricalTicks', tickerId, contract, startDateTime, endDateTime, numberOfTicks,
      whatToShow, useRTH, ignoreSize);

    return this;
  };

  reqTickByTickData = function (tickerId, contract, tickType, numberOfTicks, ignoreSize) {
    assert(_.isNumber(tickerId), '"tickerId" must be an integer - ' + tickerId);
    assert(_.isPlainObject(contract), '"contract" must be a plain object - ' + contract);
    assert(_.isString(tickType), '"tickType" must be a string - ' + tickType);
    assert(_.isNumber(numberOfTicks), '"numberOfTicks" must be a number - ' + numberOfTicks);
    assert(_.isBoolean(ignoreSize), '"ignoreSize" must be an boolean - ' + ignoreSize);

    this._send('reqTickByTickData', tickerId, contract, tickType, numberOfTicks, ignoreSize);

    return this;
  };

  cancelTickByTickData = function (tickerId) {
    assert(_.isNumber(tickerId), '"tickerId" must be an integer - ' + tickerId);

    this._send('cancelTickByTickData', tickerId);

    return this;
  };

  reqIds = function (numIds) {
    assert(_.isNumber(numIds), '"numIds" must be an integer - ' + numIds);

    this._send('reqIds', numIds);

    return this;
  };

  reqManagedAccts = function () {
    this._send('reqManagedAccts');

    return this;
  };

  reqMarketDataType = function (marketDataType) {
    assert(_.isNumber(marketDataType), '"marketDataType" must be an integer - ' + marketDataType);

    this._send('reqMarketDataType', marketDataType);

    return this;
  };

  reqMktData = function (tickerId, contract, genericTickList, snapshot, regulatorySnapshot) {
    assert(_.isNumber(tickerId), '"tickerId" must be an integer - ' + tickerId);
    assert(_.isPlainObject(contract), '"contract" must be a plain object - ' + contract);
    assert(_.isString(genericTickList), '"genericTickList" must be a string - ' + genericTickList);
    assert(_.isBoolean(snapshot), '"snapshot" must be a boolean - ' + snapshot);
    assert(_.isBoolean(regulatorySnapshot), '"regulatorySnapshot" must be a boolean - ' + regulatorySnapshot);

    this._send('reqMktData', tickerId, contract, genericTickList, snapshot, regulatorySnapshot);

    return this;
  };

  reqMktDepth = function (tickerId, contract, numRows) {
    assert(_.isNumber(tickerId), '"tickerId" must be an integer - ' + tickerId);
    assert(_.isPlainObject(contract), '"contract" must be a plain object - ' + contract);
    assert(_.isNumber(numRows), '"numRows" must be an integer - ' + numRows);

    this._send('reqMktDepth', tickerId, contract, numRows);

    return this;
  };

  reqNewsBulletins = function (allMsgs) {
    assert(_.isBoolean(allMsgs), '"allMsgs" must be a boolean - ' + allMsgs);

    this._send('reqNewsBulletins', allMsgs);

    return this;
  };

  reqOpenOrders = function () {
    this._send('reqOpenOrders');

    return this;
  };

  reqPositions = function () {
    this._send('reqPositions');

    return this;
  };

  // input params account here is acctCode, we name it account to be consistent with IB document
  reqPositionsMulti = function (reqId, account, modelCode) {
    assert(_.isNumber(reqId), '"reqId" must be an integer - ' + reqId);
    assert(_.isString(account), '"account" must be a string - ' + account);
    assert(_.isString(modelCode) || _.isNull(modelCode), '"modelCode" must be a string or null - ' + modelCode);

    this._send('reqPositionsMulti', reqId, account, modelCode);

    return this;
  };

  reqRealTimeBars = function (tickerId, contract, barSize, whatToShow, useRTH) {
    assert(_.isNumber(tickerId), '"tickerId" must be an integer - ' + tickerId);
    assert(_.isPlainObject(contract), '"contract" must be a plain object - ' + contract);
    assert(_.isNumber(barSize), '"barSize" must be an integer - ' + barSize);
    assert(_.isString(whatToShow), '"whatToShow" must be a string - ' + whatToShow);
    assert(_.isBoolean(useRTH), '"useRTH" must be a boolean - ' + useRTH);

    this._send('reqRealTimeBars', tickerId, contract, barSize, whatToShow, useRTH);

    return this;
  };

  reqScannerParameters = function () {
    this._send('reqScannerParameters');

    return this;
  };

  reqScannerSubscription = function (tickerId, subscription) {
    assert(_.isNumber(tickerId), '"tickerId" must be an integer - ' + tickerId);
    assert(_.isPlainObject(subscription), '"subscription" must be a plain object - ' + subscription);

    this._send('reqScannerSubscription', tickerId, subscription);

    return this;
  };

  requestFA = function (faDataType) {
    assert(_.isNumber(faDataType), '"faDataType" must be an integer - ' + faDataType);

    this._send('requestFA', faDataType);

    return this;
  };

  setServerLogLevel = function (logLevel) {
    assert(_.isNumber(logLevel), '"logLevel" must be an integer - ' + logLevel);

    this._send('setServerLogLevel', logLevel);

    return this;
  };

  queryDisplayGroups = function (reqId) {
    assert(_.isNumber(reqId), '"reqId" must be an integer - ' + reqId);

    this._send('queryDisplayGroups', reqId);

    return this;
  };

  updateDisplayGroup = function (reqId, contractInfo) {
    assert(_.isNumber(reqId), '"reqId" must be an integer - ' + reqId);
    assert(_.isString(contractInfo), '"contractInfo" must be an string - ' + contractInfo);

    this._send('updateDisplayGroup', reqId, contractInfo);

    return this;
  };

  subscribeToGroupEvents = function (reqId, groupId) {
    assert(_.isNumber(reqId), '"reqId" must be an integer - ' + reqId);
    assert(_.isString(groupId), '"groupId" must be an integer - ' + groupId);

    this._send('subscribeToGroupEvents', reqId, groupId);

    return this;
  };

  unsubscribeToGroupEvents = function (reqId) {
    assert(_.isNumber(reqId), '"reqId" must be an integer - ' + reqId);

    this._send('unsubscribeToGroupEvents', reqId);

    return this;
  };

}

// Attach constants.
_.keys(C).forEach(function (key) {
  Object.defineProperty(IB.prototype, key, {
    get: function () {
      return C[key];
    }
  });
  Object.defineProperty(IB, key, {
    get: function () {
      return C[key];
    }
  });
});

export = IB;
