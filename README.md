<div align="center">
  <img src="https://www.interactivebrokers.com/images/web/logos/ib-logo-text-black.svg"></img>
  <p align="center">
  <h1 align="center">Typescript API</h1>
</p>

  <div style="display: flex;justify-content:center;">
    <img alt="NPM" src="https://img.shields.io/npm/dt/@stoqey/ib.svg"></img>
  </div>
</div>

`@stoqey/ib` is an <b>unofficial</b> [Interactive Brokers](http://interactivebrokers.com/) TWS (or IB Gateway) Typescript API client library for [Node.js](http://nodejs.org/).

Refer to the [Trader Workstation API](https://interactivebrokers.github.io/tws-api/) for official documentation and the C#/Java/VB/C++/Python client.

This is a direct port of Interactive Brokers' official Java client in Typescript.<br/>
It makes a socket connection to TWS (or IB Gateway) using the [net](http://nodejs.org/api/net.html) module, and all messages are entirely processed in Typescript. It uses [EventEmitter](http://nodejs.org/api/events.html) to pass the result back to user.

### _WORK IN PROGRESS_

The library is a fork of the JScript client and porting to Typescript + current API version is still work in progress.

Some more breaking interface changes will be introduced before the public interface will be final:

- EventEmitter interface will be removed and be replace by rjxs.
  API Functions will return Observable objects directly, rather than having to register event callback functions.

- Not all functions / events are implemented yet.
  After finished, this library will implement TWS API Version 9.76 (https://www.interactivebrokers.com/en/index.php?f=23565).
  Not finished yet.

## Installation

    $ npm install @stoqey/ib
	
## API Documenation

<b>[See API documentation here.](doc/index.html)</b>

## Usage

```js
import { IBApi, EventName, Stock, LimitOrder } from "@stoqey/ib";

const ib = new IBApi({
  // clientId: 0,
  // host: '127.0.0.1',
  port: 7497,
})
.on(EventName.error, (err) => {
  console.error("error --- %s", err.message);
})
.on(EventName.result, function (event, args) {
  console.log("%s --- %s", event, JSON.stringify(args));
})
.once(EventName.nextValidId, (orderId) => {
  ib.placeOrder(
    orderId,
    new Stock("AAPL"),
    new LimitOrder(OrderAction.BUY, 1, 0.01) // safe, unreal value used for demo
  );
  ib.reqOpenOrders();
})
.once(EventName.openOrderEnd, () => {
  ib.disconnect();
});

ib.connect();
ib.reqIds(1);
```

- [See more comprehensive examples here.](https://github.com/stoqey/ib/tree/master/examples)


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
