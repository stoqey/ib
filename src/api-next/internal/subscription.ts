import { Observable, Subscriber, Subscription } from "rxjs";
import { IBApiNext } from "..";
import { IBApiError } from "../common/ib-api-error";
import { ConnectionState } from "../connection/connection-state";

/**
 * @internal
 *
 * This class implements the management of a subscription on the TWS API.
 *
 * It provides a method to create a [[Observable]] for starting / stopping
 * the TWS subscription and observing changes.
 *
 * The class will take care to call the request and cancel functions when needed
 * and provides callbacks to register and unregister the event handler.
 */
export class IBApiNextSubscription<T> {
  /**
   * Create a [[IBApiNextSubscription]] object.
   *
   * @param api: The [[IBApiNext]] instance.
   * @param allSubscriptions: List of all active subscriptions.
   * @param requestFunction A callback, invoked when the start request be send to TWS.
   * @param cancelFunction A callback, invoked when the cancel request be send to TWS.
   */
  constructor(
    private api: IBApiNext,
    private allSubscriptions: Map<number, IBApiNextSubscription<unknown>>,
    private requestFunction: (reqId: number) => void,
    private cancelFunction: (reqId: number) => void
  ) {
    this.reqId = api.nextReqId;
    this.requestTwsSubscription();
  }

  /** The request id. */
  public readonly reqId: number;

  /** The cached data. */
  private _cache?: T;

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
      };
    });
  }

  /**
   * Deliver the next value to the subject.
   *
   * @param value: Next value.
   * @param cache: If set to false, the value will not be cached.
   * Use this when you only want to post an update, but cache a full set of values (example: market data).
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
   * This function an be used when changes shall be aggregated into the
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
    this.subscribers.forEach((s) => s.error(error));
    this.cancelTwsSubscription();
  }

  /**
   * Add a subscriber to subscribers list and
   * start TWS subscription if need.
   */
  private addSubscriber(subscriber: Subscriber<T>): void {
    if (this._cache !== undefined) {
      subscriber.next(this._cache);
    }
    this.subscribers.add(subscriber);
    if (this.subscribers.size === 1) {
      this.requestTwsSubscription();
    }
  }

  /**
   * Remove a subscriber from subscribers list and cancel
   * TWS subscription if need.
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
    if (!this.allSubscriptions.has(this.reqId)) {
      this.allSubscriptions.set(this.reqId, this);
      // subscribe on connection state: send TWS request when 'connected' state is signaled
      this.connectionState$ = this.api.connectionState.subscribe((state) => {
        if (state === ConnectionState.Connected) {
          this.requestFunction(this.reqId);
        }
      });
    }
  }

  /**
   * Invoke TWS cancel function and cleanup  connection state subscription
   */
  private cancelTwsSubscription(): void {
    if (this.allSubscriptions.has(this.reqId)) {
      this.allSubscriptions.delete(this.reqId);
      this.connectionState$?.unsubscribe();
      if (this.api.isConnected) {
        this.cancelFunction(this.reqId);
      }
    }
  }
}
