import {IBalanceFetcherStorage} from '../../../src/services/balanceFetcher/IBalanceFetcherStorage';
import {Balance} from '../../../src/services/balanceFetcher/monitorTracker/MonitorTrackerService';

export class MonitorTrackerStorageAdapter implements IBalanceFetcherStorage {
  private balances: Balance[];

  constructor() {
  }

  public updateBalances(balances: Balance[]): Promise<void[]> {
    this.balances = balances;
    return Promise.resolve([]);
  }
  public getBalances(): Promise<Balance[]> {
    return Promise.resolve(this.balances);
  }
}
