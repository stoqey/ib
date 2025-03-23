<div align="center">
  <img src="https://www.interactivebrokers.com/images/web/logos/ib-logo-text-black.svg"></img>
  <p align="center">
    <h1 align="center">Typescript API</h1>
  </p>
  <div style="display: flex;justify-content:center;">
    <a href="https://discord.gg/T4VjBrqGtK" aria-label="Join Stoqey #welcome"><img src="https://img.shields.io/badge/discord-join%20chat-blue.svg" alt="Join Stoqey #welcome"></a>
    <img src="https://img.shields.io/github/package-json/v/stoqey/ib"></img>
    <img src="https://circleci.com/gh/stoqey/ib.svg?style=svg"></img>
    <img src="https://img.shields.io/badge/License-MIT-blue.svg"/> 
    <img src="https://img.shields.io/npm/dt/@stoqey/ib.svg"></img>

  </div>
</div>

`@stoqey/ib` is an [Interactive Brokers](http://interactivebrokers.com/) TWS (or IB Gateway) Typescript API client library for [Node.js](http://nodejs.org/). It is a port of Interactive Brokers' Java Client Version 10.32.01 ("latest" relased on Oct 9, 2024).

Refer to [IBKRCampus](https://ibkrcampus.com/campus/ibkr-api-page/twsapi-doc/) for the official documentation and the C#/Java/VB/C++/Python client.

The module makes a socket connection to TWS (or IB Gateway) using the [net](http://nodejs.org/api/net.html) module and all messages are entirely processed in Typescript. It uses [EventEmitter](http://nodejs.org/api/events.html) to pass the result back to user.

## Simpler Alternative

If you're looking for a more straightforward implementation with ready-to-use examples, check out [@stoqey/ibkr](https://github.com/stoqey/ibkr). This wrapper library provides:

- 🚀 Simplified API interface
- 📝 Full working examples for common operations
- 🔄 Built-in connection management
- 📊 Easy market data handling
- 💼 Streamlined portfolio management
- 🤖 Trading automation helpers

The wrapper is built on top of this library but offers a more developer-friendly experience for common use cases.

## Installation

    $ npm install @stoqey/ib

or

    $ yarn add @stoqey/ib

## Update from 1.1.x to 1.2.x

If you currently use version 1.1.x and want to upgrade to 1.2.x please note that there is a breaking change that might affect your code:

Versions up to 1.1.x did return `Number.MAX_VALUE` on values that are not available. This was to be in-sync with the official TWS API Java interfaces. Since the usage of `Number.MAX_VALUE` is very uncommon in JScript/TS and caused / causes lot of confusion, all versions starting from 1.2.1 will return `undefined` instead.

If you have checked for `Number.MAX_VALUE` up to now, you can drop this check. If you have not checked for `undefined` yet, you should add it.

Example:

```js
ib.on(EventName.pnlSingle, (
      reqId: number,
      pos: number,
      dailyPnL: number,
      unrealizedPnL: number,
      realizedPnL: number,
      value: number
    ) => {
      ...
    }
  );
```

now is (look at `unrealizedPnL` and `realizedPnL`)

```js
ib.on(EventName.pnlSingle, (
      reqId: number,
      pos: number,
      dailyPnL: number,
      unrealizedPnL: number | undefined,
      realizedPnL: number | undefined,
      value: number
    ) => {
      ...
    }
  );
```

## API Documentation

<b>[See API documentation here.](https://stoqey.github.io/ib-doc/)</b>

## IBApi vs IBApiNext

There are two APIs on this package, IBApi and IBApiNext.

IBApi replicates the official TWS API as close as possible, making it easy to migrate or port existing code.
It implements all functions and provides same event callbacks as the official TWS API does.

IBApiNext is a **preview** of a new API that is currently in development.
The goal of IBApiNext is it, to provide same functionality as IBApi, but focus on usability rather than replicating the official interface.
It is not based on a request/event design anymore, but it does use RxJS instead.
IBApiNext still is in preview stage. Not all functions are available yet, and we cannot guarantee stable interfaces (although are we confident that public signatures of already existing functions won't change anymore).

## IB socket ports

| Platform                 | Port  |
| ------------------------ | ----- |
| IB Gateway live account  |  4001 |
| IB Gateway paper account |  4002 |
| TWS Live Account         | 7496  |
| TWS papertrading account | 7497  |

## IBApi Examples

```js
/* Example: Print all portfolio positions to console. */

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
  .on(
    EventName.position,
    (account: string, contract: Contract, pos: number, avgCost?: number) => {
      console.log(`${account}: ${pos} x ${contract.symbol} @ ${avgCost}`);
      positionsCount++;
    },
  )
  .once(EventName.positionEnd, () => {
    console.log(`Total: ${positionsCount} positions.`);
    ib.disconnect();
  });

// call API functions

ib.connect();
ib.reqPositions();
```

### Sending first order

```js
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
    account: "YOUR_ACCOUNT_ID",
  };

  ib.placeOrder(orderId, contract, order);
});

ib.connect();
ib.reqIds();
```

## IBApiNext and RxJS

While IBApi uses a request function / event callback design where subscriptions are managed by the user, IBApiNext does use RxJS 7 to manage subscriptions.\
In general, there are two types of functions on IBApiNext:

- One-shot functions, returning a Promise, such as `IBApiNext.getCurrentTime` or `IBApiNext.getContractDetails`. Such functions will send a request to TWS and return the result (or error) on the Promise.

- Endless stream subscriptions, returning an Observable, such as `IBApiNext.getAccountSummary` or `IBApiNext.getMarketData`.
  Such functions will deliver an endless stream of update events. The `complete` callback will NEVER be invoked (do not try to convert to a Promise - it will never resolve!)

## IB-Shell / IBApiNext Examples

The src/tools folder contains a collection of command line tools to run IBApiNext from command line.
Have look on it if you search for IBApiNext sample code.

Example:

```
node ./dist/tools/account-summary.js -group=All -tags="NetLiquidation,MaintMarginReq" -watch -inc -port=4002
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

The easiest way to start testing and playing around with the code is to run included IB Gateway docker container. To set it up use following steps.

Copy `sample.env` to file `.env`

1. run `yarn` to install dependencies
2. `cp sample.env .env`
3. fill in the account info
4. you might need to change the value of `IB_PORT` from `4002` to `4004` if using IB Gateway from `docker-compose` (Step 6)
5. run command `yarn build` to compile TypeScript code
6. run command `docker-compose up` (use flag `-d` to run de-attached mode in background). Now the docker instance of IB Gateway should be running.
7. to take the container down just run `docker-compose down`

Once docker is up and running with correct credentials it should be ready to accept connections.

### Running jest test

Tests can be run from CLI with `jest` tool. Either a single one or multiple tests at once.

Running single/multiple tests

`jest src/test/unit/api/api.test.ts`

To run multiple, just use path instead of specific file.

To run all tests run the following command.

`yarn test`

### CI

Will be added later once it's stable

## Deprecation process

Public interfaces, that are planned to be removed, will be marked with a @deprecated. <br/>
The @deprecated tag will contain a description or link on how migrate to new API (example: IBApiCreationOptions.clientId).<br/>
VSCode will explicitly mark deprecated functions and attributes, so you cannot miss it.<br/>

If you write new code, don't use deprecated functions.<br/>
If you already use deprecated functions on existing code, migrate to new function on your next code-clean up session. There is no need for immediate change, the deprecated function will
continue to work for a least a half more year, but at some point it will be removed.<br/>

## How to contribute

IB does regularly release new API versions, so this library will need permanent maintenance in order to stay up-to-date with latest TWS features.<br/>
Also, there is not much testing code yet. Ideally there should be at least one test-case for each public function.<br/>
In addition to that, a little demo / example app would be nice, to demonstrate API usage (something like a little live-portoflio-viewer app for node.js console?).<br/>
Any kind of bugfixes are welcome as well.

If you want to contribute, read the [Developer Guide](https://github.com/stoqey/ib/wiki/Developer-Guide) and start coding.

## Community

Join our Discord community to get help, share ideas, and connect with other developers:

[![Join our Discord server](https://img.shields.io/badge/discord-join%20chat-blue.svg)](https://discord.gg/T4VjBrqGtK)

- Get help with implementation
- Share your projects
- Connect with other developers
- Stay updated on new releases
- Contribute to discussions
