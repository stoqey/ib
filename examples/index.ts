

function run() {

  var util = require('util');

  var chalk = require('chalk');

  var ib = new (require("../src/index"))({
    clientId: 0,
    host: "localhost",
    port: 4001
  }).on('connected', function () {
    console.log(chalk.inverse('CONNECTED'));
  }).on('disconnected', function () {
    console.log(chalk.inverse('DISCONNECTED'));
  }).on('received', function (tokens) {
    console.info('%s %s', chalk.cyan('<<< RECV <<<'), JSON.stringify(tokens));
  }).on('sent', function (tokens) {
    console.info('%s %s', chalk.yellow('>>> SENT >>>'), JSON.stringify(tokens));
  }).on('server', function (version, connectionTime) {
    console.log(chalk.inverse(util.format('Server Version: %s', version)));
    console.log(chalk.inverse(util.format('Server Connection Time: %s', connectionTime)));
  }).on('error', function (err) {
    console.error(chalk.red(util.format('@@@ ERROR: %s @@@', err.message)));
  }).on('result', function (event, args) {
    console.log(chalk.green(util.format('======= %s =======', event)));
    args.forEach(function (arg, i) {
      console.log('%s %s',
        chalk.green(util.format('[%d]', i + 1)),
        JSON.stringify(arg)
      );
    });
  });

  ib.connect();
}


// wait 2s before running the code, to give the debugger some time to attach (so we won't miss any breakpoints at the very beginning.)
setTimeout(() => {
  run();
}, 2000);
