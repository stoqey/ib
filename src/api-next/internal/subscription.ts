import { IBApiNextError, IBApiNext } from "../";
import { Observable, ReplaySubject, Subscription } from "rxjs";
import { ConnectionState } from "../connection/connection-state";
import { IBApiNextDataUpdate } from "./data-update";
import { DataUpdate } from "..";
import { map } from "rxjs/operators";

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
    this.reqId = api.nextReqId;
  }

  /** The request id of this subscription. */
  public reqId: number;

  /** Number of active observers. */
  private observersCount = 0;

  /** The replay subject, holding the latest emitted values. */
  private subject = new ReplaySubject<IBApiNextDataUpdate<T>>(1);

  /** The last 'all' value as send to subscribers. */
  private _lastAllValue?: T;

  /** The [[Subscription]] on the connection state. */
  private connectionState$?: Subscription;

  /** true when the end-event on an enumeration request has been received, false otherwise. */
  public endEventReceived = false;

  /** Get the last 'all' value as send to subscribers. */
  get lastAllValue(): T | undefined {
    return this._lastAllValue;
  }

  /**
   * Send the next value to subscribers.
   *
   * @param value: The next value.
   */
  next(value: IBApiNextDataUpdate<T>): void {
    this._lastAllValue = value.all;
    this.subject.next(value);
  }

  /**
   * Send an error to subscribers, reset latest value to
   * undefined and cancel TWS subscription.
   *
   * @param error: The [[IBApiError]] object.
   */
  error(error: IBApiNextError): void {
    delete this._lastAllValue;
    this.subject.error(error);
    this.cancelTwsSubscription();
  }

  /**
   * Create an Observable to start/stop the subscription on
   * TWS, receive update and error events.
   */
  createObservable(): Observable<DataUpdate<T>> {
    return new Observable<DataUpdate<T>>((subscriber) => {
      // create new subject and reqId if there is an has error

      if (this.subject.hasError) {
        this.subject = new ReplaySubject(1);
        this.reqId = this.api.nextReqId;
      }

      // subscribe on subject

      const subscription$ = this.subject
        .pipe(
          map((val, index) => {
            return index === 0
              ? ({
                  all: val.all,
                  added: val.all,
                } as DataUpdate<T>)
              : val;
          })
        )
        .subscribe(subscriber);

      // request from TWS if first subscriber

      if (this.observersCount === 0) {
        this.requestTwsSubscription();
      }
      this.observersCount++;

      // handle unsubscribe

      return (): void => {
        subscription$.unsubscribe();
        this.observersCount--;
        if (this.observersCount <= 0) {
          this.cancelTwsSubscription();
          this.cleanupFunction();
        }
      };
    });
  }

  /**
   * Invoke TWS request function and setup connection state subscription
   */
  private requestTwsSubscription(): void {
    // subscribe on connection state: send TWS request when 'connected' state is signaled
    if (!this.connectionState$) {
      this.connectionState$ = this.api.connectionState.subscribe((state) => {
        if (state === ConnectionState.Connected) {
          delete this._lastAllValue;
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
