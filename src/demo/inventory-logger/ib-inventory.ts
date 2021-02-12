import { Subscription } from "rxjs";
import { take } from "rxjs/operators";
import { ContractDetails } from "../..";
import {
  IBApiNext,
  PnL,
  PnLSingle,
  Position,
  TickTypeNext,
} from "../../api/api-next";

/** A position on the [[IBInventoryAccount]] */
export interface IBInventoryAccount {
  /** The account id. */
  id: string;

  /** The account PnL. */
  pnl?: PnL;

  /** The account net liquidation value. */
  netLiquidation?: number;
}

/** A position on the [[IBInventory]] */
export interface IBInventoryPosition extends Position {
  /** The position PnL. */
  pnl?: PnLSingle;

  /** The contract details. */
  contractDetails?: ContractDetails;

  /** The latest market data ticks. */
  marketData: Map<TickTypeNext, number>;
}

/**
 * This class demonstrated how to manage subscriptions on the [[IBApiNext]].
 *
 * It keeps track of all inventory details (such as accounts, account summaries or positions),
 * caches it and provides getter methods for quick & easy non-blocking access.
 */
export class IBInventory {
  /**
   * Create an [[IBInventory]] object.
   *
   * @param api The [[IBApiNext]] instance.
   * Must be connected already.
   */
  constructor(private readonly api: IBApiNext) {}

  /** All accounts on inventory, with account id as key. */
  private _accounts: Map<string, IBInventoryAccount> = new Map();

  /** All positions on inventory, with "<account>:<conId>" as key */
  private readonly positions = new Map<string, IBInventoryPosition>();

  /** The account summaries subscriptions, with account id as key */
  private accountSummaries$?: Subscription;

  /** The account PnLs subscriptions, with account id as key */
  private readonly accountPnLs$ = new Map<string, Subscription>();

  /** The positions subscription. */
  private positions$?: Subscription;

  /** The position PnLs subscriptions, with "<account>:<conId>" as key */
  private readonly positionPnLs$ = new Map<string, Subscription>();

  /** The market data subscriptions, with "<account>:<conId>" as key */
  private readonly marketData$ = new Map<string, Subscription>();

  /** Subscribe on the IB inventory. */
  subscribe(): void {
    this.unsubscribe();

    // subscribe on account summaries

    this.accountSummaries$ = this.api
      .getAccountSummary("All", "NetLiquidation")
      .subscribe((summary) => {
        const inventoryAccount = this._accounts.get(summary.account) ?? {
          id: summary.account,
        };
        if (inventoryAccount) {
          const sVal = summary.values.get("NetLiquidation")?.value;
          if (sVal) {
            inventoryAccount.netLiquidation = Number.parseFloat(sVal);
          }
        }
        this._accounts.set(summary.account, inventoryAccount);
      });

    // subscribe on positions

    this.positions$ = this.api.getPositions().subscribe((positions) => {
      // update positions

      positions.forEach((pos) => {
        if (pos.contract.conId === undefined) {
          // should never happen
          return;
        }
        const key = `${pos.account}:${pos.contract.conId}`;

        if (!this.positions.has(key)) {
          // new position: get contract details and subscribe on PnL

          this.api
            .getContractDetails({
              conId: pos.contract.conId,
            })
            .pipe(take(1))
            .subscribe((details) => {
              const inventoryPosition = this.positions.get(key);
              if (inventoryPosition && details.length) {
                inventoryPosition.contract = details[0].contract;
                inventoryPosition.contractDetails = details[0];

                // subscribe on market data after we have the contract details

                this.marketData$.set(
                  key,
                  this.api
                    .getMarketData(inventoryPosition.contract, "", false, false)
                    .subscribe((data) => {
                      data.ticks.forEach((value, type) => {
                        inventoryPosition.marketData.set(type, value);
                      });
                    })
                );
              }
            });

          this.positionPnLs$.set(
            key,
            this.api
              .getPnLSingle(pos.account, null, pos.contract.conId)
              .subscribe((pnl) => {
                const inventoryPosition = this.positions.get(key);
                if (inventoryPosition) {
                  inventoryPosition.pnl = pnl;
                }
              })
          );
        }

        // update position

        const update = this.positions.get(key) ?? {
          account: pos.account,
          contract: pos.contract,
          pos: pos.pos,
          avgCost: pos.avgCost,
          marketData: new Map(),
        };

        update.account = pos.account;
        update.contract = pos.contract;
        update.avgCost = pos.avgCost;
        update.pos = pos.pos;

        this.positions.set(key, update);
      });

      this.positions.forEach((pos) => {
        if (
          !positions.find(
            (v) =>
              v.account === pos.account &&
              v.contract.conId === pos.contract.conId
          )
        ) {
          // removed position: unsubscribe and remove

          const key = `${pos.account}:${pos.contract.conId}`;

          this.positions.delete(key);
          this.positionPnLs$.get(key)?.unsubscribe();
          this.positionPnLs$.delete(key);
        }
      });

      // update accounts

      const accounts = new Set<string>();
      this.positions.forEach((pos) => accounts.add(pos.account));

      accounts.forEach((account) => {
        if (!this.accounts.find((v) => v.id === account)) {
          // new account: subscribe on summary, PnL and add to account list

          this.accountPnLs$.set(
            account,
            this.api.getPnL(account).subscribe((pnl) => {
              const inventoryAccount = this._accounts.get(account);
              if (inventoryAccount) {
                inventoryAccount.pnl = {
                  dailyPnL: pnl.dailyPnL,
                  realizedPnL: pnl.realizedPnL,
                  unrealizedPnL: pnl.unrealizedPnL,
                };
              }
            })
          );

          this._accounts.set(
            account,
            this._accounts.get(account) ?? { id: account }
          );
        }
      });

      this.accounts.forEach((account) => {
        if (!accounts.has(account.id)) {
          // removed account: unsubscribe and remove

          this.accountPnLs$.get(account.id)?.unsubscribe();
          this.accountPnLs$.delete(account.id);
          this._accounts.delete(account.id);
        }
      });
    });
  }

  /** Unsubscribe from the IB inventory. */
  unsubscribe(): void {
    this.accountSummaries$?.unsubscribe();
    this.accountPnLs$.forEach((s) => s.unsubscribe());
    this.positions$?.unsubscribe();
    this.positionPnLs$.forEach((s) => s.unsubscribe());
    this.marketData$.forEach((s) => s.unsubscribe());
  }

  /** Get all accounts on inventory. */
  get accounts(): IBInventoryAccount[] {
    return Array.from(this._accounts.values());
  }

  /**
   * Get all positions on the given account,
   * or all positions on inventory if no account is specified.
   */
  getPositions(account?: string): IBInventoryPosition[] {
    if (!account) {
      return Array.from(this.positions.values());
    }

    const result: IBInventoryPosition[] = [];
    this.positions.forEach((pos) => {
      if (pos.account === account) {
        result.push(pos);
      }
    });
    return result;
  }
}
