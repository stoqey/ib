<div align="center">
  <img src="https://www.interactivebrokers.com/images/web/logos/ib-logo-text-black.svg"></img>
  <p align="center">
    <h1 align="center">Typescript API</h1>
  </p>
  <div style="display: flex;justify-content:center;">
    <img alt="NPM" src="https://img.shields.io/npm/dt/@stoqey/ib.svg"></img>
    <img alt="NPM" src="https://circleci.com/gh/stoqey/ib.svg?style=svg"></img>
  </div>

</div>




`@stoqey/ib` is an <ins>unofficial</ins> [Interactive Brokers](http://interactivebrokers.com/) TWS (or IB Gateway) Typescript API client library for [Node.js](http://nodejs.org/). It is a direct port of Interactive Brokers' Java Client Version 9.76 from May 08 2019.

Refer to the [Trader Workstation API](https://interactivebrokers.github.io/tws-api/) for official documentation and the C#/Java/VB/C++/Python client.

The module makes a socket connection to TWS (or IB Gateway) using the [net](http://nodejs.org/api/net.html) module and all messages are entirely processed in Typescript. It uses [EventEmitter](http://nodejs.org/api/events.html) to pass the result back to user.

## Installation

    $ npm install @stoqey/ib

  or

    $ yarn add @stoqey/ib

## API Documenation

<b>[See API documentation here.](https://stoqey.github.io/ib-doc/)</b>

## IBApi vs IBApiNext

There are two APIs on this package, IBApi and IBApiNext.

IBApi replicates the official TWS API as close as possible, making it easy to migrate or port existing code.
It implements all functions and provies same event callbacks as the official TWS API does.

IBApiNext is a **preview** of a new API that is currently in development.
The goal of IBApiNext is it, to provide same functionality as IBApi, but focus on usuability rather than replicating the official interface.
It is not based on a request/event design anymore, but it does use RxJS instead.
IBApiNext still is in preview stage. Not all functions are available yet and we cannot guarantee stable interfaces (although are we confident that public signatures of already existing functions won't change anymore).

## IB socket ports

| Platform  |  Port |
|---|---|
|IB Gateway live account   | 4001 |
|IB Gateway paper account  | 4002 |
|TWS Live Account          | 7496 |
|TWS papertrading account  | 7497 |

## Important

IBApi is returning `Number.MAX_SAFE_INTEGER` when there is no value from IB, commonly seen when there is no bid / offer or other missing market data.

## IBApi Examples

```js

/* Example: Print all portfolio posistions to console. */

import { IBApi, EventName, ErrorCode, Contract } from "@stoqey/ib";

// create IBApi object

const ib = new IBApi({
  // clientId: 0,
  // host: '127.0.0.1',
  port: 7497,
});

// register event handler

let positionsCount = 0;

ib.on(EventName.error, (err: Error, code: ErrorCode, reqId: number) => {
  console.error(`${err.message} - code: ${code} - reqId: ${reqId}`);
})
.on(EventName.position, (account: string, contract: Contract, pos: number, avgCost: number) => {
  console.log(`${account}: ${pos} x ${contract.symbol} @ ${avgCost}`);
  positionsCount++:
})
.once(EventName.positionEnd, () => {
  console.log(`Total: ${positionsCount} posistions.`);
  ib.disconnect();
});

// call API functions

ib.connect();
ib.reqPositions();
```

### Sending first order

```
ib.once(EventName.nextValidId, (orderId: number) => {
    const contract: Contract = {
      symbol: "AMZN",
      exchange: "SMART",
      currency: "USD",
      secType: SecType.STK,
    };

    const order: Order = {
      orderType: OrderType.LMT,
      action: OrderAction.BUY,
      lmtPrice: 1,
      orderId,
      totalQuantity: 1,
      account: <your_account_id>
    };

    ib.placeOrder(orderId, contract, order);
  });

ib.connect();
ib.reqIds();
```

## IB-Shell / IBApiNext Examples

The src/tools folder contains a collection of command line tools to run IBApiNext from command line.
Have look on it if you search for IBApiNext sample code.

Example:
```
node .\dist\tools\account-summary.js -group=All -tags="NetLiquidation,MaintMarginReq" -watch -inc -port=4002
{
  "all": [
    [
      "DU******",
      [
        [
          "MaintMarginReq",
          [
            [
              "EUR",
              {
                "value": "37688.07",
                "ingressTm": 1616849611611
              }
            ]
          ]
        ]
      ]
    ]
  ],
  "added": [
    [
...
```

## Testing

### Locally

! WARNING ! - Make sure to test on papertrading account as tests could contain actions that result in selling and buying financial instruments.

Easiest way to start test and playing around with the code is to run included IB Gateway docker container. To set it up use following steps.

Copy `sample.env` to file `.env`
1. run `yarn` to install dependencies
2. `cp sample.env .env`
3. fill in the account info
4. run command `docker-compose up` (use flag `-d` to run de-attached mode in background). Now the docker instance of IB Gateway should be running.
5. to take the container down just run `docker-compose down`

Once docker is up and running with correct credentials it should be ready to accept connections.

### Running jest test

Test's can be ran from CLI with `jest` tool. Either singular or multible tests at once.

Running single/multible tests

`jest src/test/unit/api/api.test.ts`

to run multible, just use path instead of specific file.

To run all test srun following command.

`yarn test`

### CI

Will be added later once it's stable

## Deprecation process

This library was initially forked from a JScript project (https://github.com/pilwon/node-ib) and ported to Typescript.
The API interfaces are still largely compatible with the old library, however there are ongoing efforts port this library to more modern Typescript-like codebase and interface design.

Therefore, there is a defined deprecation process:<br/>

Public interfaces, that are planned to be removed, will be marked with a @deprecated. <br/>
The @deprecated tag will contain a description or link on how migrate to new API (example: IBApiCreationOptions.clientId).<br/>
VSCode will explicitly mark deprecated functions and attributes, so you cannot miss it.<br/>

If you write new code, don't use deprecated functions.<br/>
If you already use deprecated functions on existing code, migrate to new function on your next code-clean up session. There is no need for immediate change, the deprecated function will
continue to work for a least a half more year, but at some point it will be removed.<br/>

## How to contribute

IB does regularly release new API versions, so this library will need permanent maintenance in oder to stay up-to-date with latest TWS features.<br/>
Also, there is not much testing code yet. Ideally there should be at least one test-case for each public function.<br/>
In addition to that.. a little demo / example app would be nice, to demonstrate API usage (something like a little live-portoflio-viewer app for node.js console?).<br/>
Any kind of bugfixes are welcome as well.

If you want to contribute, read the [Developer Guide](https://github.com/stoqey/ib/wiki/Developer-Guide) and start coding.


## License

<pre>
The MIT License (MIT)

Copyright (c) 2020 Stoqey

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
</pre>
