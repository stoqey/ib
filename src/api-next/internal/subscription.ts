import { IBApiError, IBApiNext } from "..";
import { Observable, Subscriber, Subscription } from "rxjs";
import { ConnectionState } from "../connection/connection-state";

/**
 * @internal
 *
 * This class implements the management of a subscription on the TWS API.
 *
 * It provides a method to create a [[Observable]] for starting / stopping
 * the TWS subscription and observing changes.
 *
 * The class will take care to call the request and cancel functions when needed.
 */
export class IBApiNextSubscription<T> {
  /**
   * Create a [[IBApiNextSubscription]] object.
   *
   * @param api The [[IBApiNext]] instance.
   * @param requestFunction A callback, invoked when the start request shall be send to TWS.
   * @param cancelFunction A callback, invoked when the cancel request shell be send to TWS.
   * @param cleanupFunction A callback, invoked when the last observer has unsubscribed from the subject.
   */
  constructor(
    private api: IBApiNext,
    private requestFunction: () => void,
    private cancelFunction: () => void,
    private cleanupFunction: () => void,
    public readonly instanceId?: string
  ) {
    this.reqId = IBApiNextSubscription.nextReqId++;
  }

  /** The next unused request id. */
  private static nextReqId = 1;

  /** The request id of this subscription. */
  public readonly reqId: number;

  /** The cached data. */
  private _cache?: T;

  /** The error object. */
  private _error?: IBApiError;

  /** Set of active subscribers. */
  private readonly subscribers = new Set<Subscriber<T>>();

  /** The [[Subscription]] on the connection state. */
  private connectionState$?: Subscription;

  /** true when the end-event on an enumeration request has been received, false otherwise. */
  public endEventReceived = false;

  /** Get latest cached value. */
  get value(): T | undefined {
    return this._cache;
  }

  /**
   * Create an Observable to start/stop the subscription on
   * TWS, receive update and error events.
   */
  createObservable(): Observable<T> {
    return new Observable<T>((subscriber) => {
      this.addSubscriber(subscriber);
      return (): void => {
        this.removeSubscriber(subscriber);
        this.cleanupFunction();
      };
    });
  }

  /**
   * Deliver the next value to the subject.
   *
   * @param value: Next value.
   * @param cache: If set to false, the value will not be cached.
   * Use this when you only want to post an update, but cache a full set of values
   * (example: market data).
   */
  next(cache: boolean, value: T): void {
    if (cache) {
      this._cache = value;
    }
    this.subscribers.forEach((s) => s.next(value));
  }

  /**
   * Write the given value to cache, but do not deliver it to the subject.
   *
   * This function can be used when changes shall be aggregated into the
   * cache. In that case, do not cache on the [[next]] call, but implement
   * your custom cache-update logic and use this function to update the
   * whole cache, while only emitting the diff to subject.
   *
   * @param v The value to cache.
   */
  cache(v: T): void {
    this._cache = v;
  }

  /**
   * Deliver an error to the subject.
   *
   * @param error: The [[IBApiError]] object.
   */
  error(error: IBApiError): void {
    delete this._cache;
    this._error = error;
    this.subscribers.forEach((s) => s.error(error));
    this.cancelTwsSubscription();
  }

  /**
   * Add a subscriber to subscribers list and start TWS subscription if need.
   */
  private addSubscriber(subscriber: Subscriber<T>): void {
    // replay cached value
    if (this._cache !== undefined) {
      subscriber.next(this._cache);
    }

    // add to subscriber list

    this.subscribers.add(subscriber);

    // request from TWS if it is the first subscriber or if there was an error

    this.subscribers.add(subscriber);
    if (this.subscribers.size === 1 || this._error) {
      this.requestTwsSubscription();
    }
  }

  /**
   * Remove a subscriber from subscribers list and cancel TWS subscription if need.
   */
  private removeSubscriber(subscriber: Subscriber<T>) {
    this.subscribers.delete(subscriber);
    if (!this.subscribers.size) {
      this.cancelTwsSubscription();
    }
  }

  /**
   * Invoke TWS request function and setup connection state subscription
   */
  private requestTwsSubscription(): void {
    // subscribe on connection state: send TWS request when 'connected' state is signaled
    if (!this.connectionState$) {
      this.connectionState$ = this.api.connectionState.subscribe((state) => {
        if (state === ConnectionState.Connected) {
          delete this.cache;
          delete this._error;
          this.endEventReceived = false;
          this.requestFunction();
        }
      });
    }
  }

  /**
   * Invoke TWS cancel function and unsubscribe from connection state
   */
  private cancelTwsSubscription(): void {
    this.connectionState$?.unsubscribe();
    delete this.connectionState$;
    if (this.api.isConnected) {
      this.cancelFunction();
    }
  }
}
