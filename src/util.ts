var C = require('./constants');

export function _findKeyForValue(object, value) {
  for (var key in object) {
    if (object[key] === value) {
      return key;
    }
  }

  return C.TICK_TYPE.UNKNOWN;
}

export function incomingToString(incoming) {
  return _findKeyForValue(C.INCOMING, incoming);
}

export function numberToString(number) {
  if (number === Number.MAX_VALUE) {
    return 'MAX';
  } else if (number === Number.MIN_VALUE) {
    return 'MIN';
  } else {
    return number.toString();
  }
}

export function outgoingToString(outgoing) {
  return _findKeyForValue(C.OUTGOING, outgoing);
}

export function tickTypeToString(tickType) {
  return _findKeyForValue(C.TICK_TYPE, tickType);
}
