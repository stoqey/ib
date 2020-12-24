<div align="center">
  <img src="https://www.interactivebrokers.com/images/web/logos/ib-logo-text-black.svg"></img>
  <p align="center">
    <h1 align="center">Typescript API</h1>
  </p>
  <div style="display: flex;justify-content:center;">
    <img alt="NPM" src="https://img.shields.io/npm/dt/@stoqey/ib.svg"></img>
  </div>
</div>

`@stoqey/ib` is an <ins>unofficial</ins> [Interactive Brokers](http://interactivebrokers.com/) TWS (or IB Gateway) Typescript API client library for [Node.js](http://nodejs.org/). It is a direct port of Interactive Brokers' Java Client Version 9.76 from May 08 2019.

Refer to the [Trader Workstation API](https://interactivebrokers.github.io/tws-api/) for official documentation and the C#/Java/VB/C++/Python client.

The module makes a socket connection to TWS (or IB Gateway) using the [net](http://nodejs.org/api/net.html) module, and all messages are entirely processed in Typescript. It uses [EventEmitter](http://nodejs.org/api/events.html) to pass the result back to user.

## Installation

    $ npm install @stoqey/ib
	
## API Documenation

<b>[See API documentation here.](https://stoqey.github.io/ib-doc/)</b>

## Example

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
  console.error(`${err.message} - code: ${code} - reqId: ${id}`);
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
