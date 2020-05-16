var _ = require('lodash');
var chalk = require('chalk');

import ibApi from '.'

console.log('ib', typeof ibApi)

const ib = new ibApi({
  clientId: 0,
  host: '127.0.0.1',
  port: 7497
});


ib.on('error', function (err) {
  console.error(chalk.red(err.message));
}).on('error', function (err) {
  console.error(chalk.red(err.message));
}).on('historicalData', function (reqId, date, open, high, low, close, volume, barCount, WAP, hasGaps) {
  if (_.includes([-1], open)) {
    console.log('endhistoricalData');
  } else {
    console.log(
      reqId,
      date,
      open,
      high,
      low,
      close,
      volume,
      barCount,
      hasGaps
    );
  }
});


ib.connect();

const contract = ib.contract.stock('SPY', 'SMART', 'USD');

console.log('contract is', contract);
// tickerId, contract, endDateTime, durationStr, barSizeSetting, whatToShow, useRTH, formatDate, keepUpToDate
ib.reqHistoricalData(1, contract, '202005011 12:00:00', '1800 S', '1 secs', 'TRADES', 1, 1, false);

ib.on('historicalData', function (reqId, date, open, high, low, close, volume, barCount, WAP, hasGaps) {
  if (_.includes([-1], open)) {
    //ib.cancelHistoricalData(1);  // tickerId
    ib.disconnect();
  }
});
