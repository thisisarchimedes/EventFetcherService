import {Balance} from '../../../src/services/balanceFetcher/monitorTracker/MonitorTrackerService';

export class TvlFectherStorageAdapter {
  private tvls: Balance[];
  constructor() {
  }

  public updateBalances(tvls: Balance[]): Promise<void[]> {
    this.tvls = tvls;
    return Promise.resolve([]);
  }
  public getBalances(): Promise<Balance[]> {
    return Promise.resolve(this.tvls);
  }
}
