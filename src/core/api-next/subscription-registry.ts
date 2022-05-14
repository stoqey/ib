import { Observable } from "rxjs";
import { EventName } from "../..";
import { IBApiNextError, IBApiNext, ItemListUpdate } from "../../api-next";
import { IBApiAutoConnection } from "./auto-connection";
import { IBApiNextMap } from "./map";
import { IBApiNextSubscription } from "./subscription";

/** An id that uniquely identifies the type of a subscription. */
export type SubscriptionTypeId = string;

/** An id that uniquely identifies the subscription instance. */
export type SubscriptionInstanceId = string;

/** The log tag */
const LOG_TAG = "IBApiNextSubscriptionRegistry";

/**
 * @internal
 *
 * An entry on the subscription registry.
 */
class RegistryEntry {
  /**
   * Create a new [[RegistryEntry]] object.
   *
   * @param eventName The [[IBApi]] event name.
   * @param callback The event callback handler.
   */
  constructor(
    public readonly eventName: EventName,
    public readonly callback: (
      subscriptions: Map<number, IBApiNextSubscription<unknown>>,
      ...eventArgs: unknown[]
    ) => void
  ) {
    this.listener = (...eventArgs) => {
      this.callback(this.subscriptions, ...eventArgs);
    };
  }

  /** The event listener on [[IBApi]]. */
  public readonly listener: (...eventArgs: unknown[]) => void;

  /** Map of all active subscriptions, with reqId as key. */
  public readonly subscriptions: Map<
    number,
    IBApiNextSubscription<unknown>
  > = new Map();
}

/**
 * @internal
 *
 * The subscription registry as used by [[IBApiNext]].
 *
 * The subscription registry maintains the list of all currently
 * registered subscriptions. See [[IBApiNext.register]] about how
 * register a subscription.
 */
export class IBApiNextSubscriptionRegistry {
  /**
   * Create an [[IBApiNextSubscriptionRegistry]] instance.
   *
   * @param api The [[IBApiAutoConnection]] instance for event listener registration and
   * invoking TWS API.
   * @param apiNext The [[IBApiNext]] instance for observing the connection state.
   */
  constructor(
    private readonly api: IBApiAutoConnection,
    private readonly apiNext: IBApiNext
  ) { }

  /** A Map containing the subscription registry, with event name as key. */
  private readonly entires = new IBApiNextMap<EventName, RegistryEntry>();

  /**
   * Register a subscription.
   *
   * @param requestFunction A callback, invoked when the start request shall be send to TWS.
   * @param cancelFunction A callback, invoked when the cancel request shall be send to TWS.
   * @param eventHandler Array of IB API event, callback function to handle this event.
   * @param instanceId When not undefined, this an id that uniquely identifies
   * the subscription instance. This can be used to avoid creation of multiple subscriptions,
   * that will end up on same TWS request (i.e. request same market data multiple times), but an
   * existing subscription instance will be re-used if same instanceId does already exist.
   * As a general rule: don't use instanceId when there is no reqId or when you want to return
   * a Promise (single emitted value). Use it everywhere else.
   */
  register<T>(
    requestFunction: (reqId: number) => void,
    cancelFunction: (reqId: number) => void | null | undefined,
    eventHandler: [
      EventName,
      (
        subscriptions: Map<number, IBApiNextSubscription<T>>,
        ...eventArgs: unknown[]
      ) => void
    ][],
    instanceId?: string
  ): Observable<ItemListUpdate<T>> {
    // get the existing registry entries, or add if not existing yet

    const entires: RegistryEntry[] = [];
    eventHandler.forEach((handler) => {
      const eventName = handler[0];
      const callback = handler[1];
      const entry = this.entires.getOrAdd(eventName, () => {
        const entry = new RegistryEntry(eventName, callback);
        this.apiNext.logger.debug(
          LOG_TAG,
          `Add RegistryEntry for EventName.${eventName}`
        );
        this.api.addListener(eventName, entry.listener);
        return entry;
      });
      entires.push(entry);
    });

    // lookup subscription by instance id

    let subscription: IBApiNextSubscription<T>;
    if (instanceId) {
      entires.forEach((entry) => {
        const values = entry.subscriptions.values();
        while (!subscription) {
          const it = values.next();
          if (it.done) {
            break;
          }
          if (
            (it.value as IBApiNextSubscription<T>).instanceId === instanceId
          ) {
            subscription = it.value;
          }
        }
      });
    }

    // create new subscription

    if (!subscription) {
      subscription = new IBApiNextSubscription<T>(
        this.apiNext,
        () => {
          requestFunction(subscription.reqId);
        },
        () => {
          if (cancelFunction) {
            cancelFunction(subscription.reqId);
          }
        },
        () => {
          entires.forEach((entry) => {
            entry.subscriptions.delete(subscription.reqId);
            if (!entry.subscriptions.size) {
              this.api.removeListener(entry.eventName, entry.listener);
              this.apiNext.logger.debug(
                LOG_TAG,
                `Remove RegistryEntry for EventName.${entry.eventName}.`
              );
              this.entires.delete(entry.eventName);
            }
          });

          this.apiNext.logger.debug(
            LOG_TAG,
            `Deleted IBApiNextSubscription for ${subscription.reqId}.`
          );
        },
        instanceId
      );

      entires.forEach((entry) => {
        this.apiNext.logger.debug(
          LOG_TAG,
          `Add IBApiNextSubscription on EventName.${entry.eventName} for ${subscription.reqId}.`
        );
        entry.subscriptions.set(subscription.reqId, subscription);
      });
    }

    // create an observable on the subscription

    return subscription.createObservable();
  }

  /**
   * Dispatch an error into the subscription that owns the given request id.
   */
  dispatchError(reqId: number, error: IBApiNextError): void {
    this.entires.forEach((entry) => {
      entry.subscriptions.get(reqId)?.error(error);
    });
  }
}
