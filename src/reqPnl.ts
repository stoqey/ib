import { LoDashStatic } from "lodash";

const _: LoDashStatic = require('lodash');
const chalk = require('chalk');

var ib = new (require('.'))({
    // clientId: 0,
    // host: '127.0.0.1',
    port: 4001
}).on('error', function (err) {
    console.error(chalk.red(err.message));
}).on('result', function (event, args) {
    if (!_.includes(['pnl'], event)) {
        console.log('%s %s', chalk.yellow(event + ':'), JSON.stringify(args));
    }
}).on('pnl', function (reqId, dailyPnl) {
    console.log(dailyPnl);
});

ib.connect();

const reqId = 123456;
ib.reqPnl(reqId, 'U1234567', null);

setTimeout(() => {
    console.log("canceling pnl");
    ib.cancelPnl(reqId);
    console.log("sent cancel for pnl");

    console.log("about to disconnect");
    ib.disconnect();
    console.log("disconnceted");
}, 30 * 1000);
