import {ethers} from 'ethers';
import {EventFetcher} from '../../../src/services/blockchain/EventFetcher';
import fs from 'fs';
import {Balance} from '../../../src/services/monitorTracker/MonitorTrackerService';

export class EventFetcherAdapter extends EventFetcher {
  private events: ethers.providers.Log[];
  private balances: Balance[];
  private tvls: Balance[];

  constructor() {
    super();
    this.events = [];
  }
  // eslint-disable-next-line require-await, @typescript-eslint/no-unused-vars
  public async getOnChainEvents(
      blockNumberFrom: number,
      blockNumberTo: number,
  ): Promise<ethers.providers.Log[]> {
    return this.dedupLogsBasedOnTxHashLogIndexAndTopic0(this.events);
  }

  public setEventArrayFromFile(
      fileName: string,
      strategyOverride?: string,
  ): void {
    try {
      const data = fs.readFileSync(fileName, 'utf8');
      this.events = JSON.parse(data) as ethers.providers.Log[];
      if (strategyOverride) {
        this.events = this.events.map((event) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          event.address = strategyOverride;
          return event;
        });
      }
    } catch (err) {
      console.error(`Error reading file from disk: ${err}`);
    }
  }

  public setAddressBalance(balances: Balance[]): void {
    this.balances = balances;
  }

  // TODO: address is the real public key of the monitor and here we want to get demi
  public getAddressBalance(address: string): Promise<bigint> {
    const balance = this.balances.find((balance) => balance.account === address);
    if (balance === undefined) {
      throw new Error('Balance not found');
    }

    return Promise.resolve(balance.balance);
  }

  public setStrategyTvl(balances: Balance[]): void {
    this.tvls = balances;
  }

  public getStrategyTvl(address: string): Promise<bigint> {
    const balance = this.tvls.find((balance) => balance.account === address);
    if (balance === undefined) {
      throw new Error('Balance not found');
    }

    return Promise.resolve(balance.balance);
  }
}
