function UnderrunError(message?: string) {
  this.name = 'UnderrunError';
  this.message = message || 'An underrun error has occurred';
  this.stack = (new Error()).stack;
}
UnderrunError.prototype = Object.create(Error.prototype);
UnderrunError.prototype.constructor = UnderrunError;

export default { UnderrunError };
