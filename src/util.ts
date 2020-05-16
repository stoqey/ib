import { TICK_TYPE, OUTGOING, INCOMING } from './constants';

export function _findKeyForValue(object, value) {
  for (var key in object) {
    if (object[key] === value) {
      return key;
    }
  }

  return TICK_TYPE.UNKNOWN;
}

export function incomingToString(incoming) {
  return _findKeyForValue(INCOMING, incoming);
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
  return _findKeyForValue(OUTGOING, outgoing);
}

export function tickTypeToString(tickType) {
  return _findKeyForValue(TICK_TYPE, tickType);
}


export default {
  _findKeyForValue,
  incomingToString,
  outgoingToString,
  tickTypeToString,
  numberToString
}