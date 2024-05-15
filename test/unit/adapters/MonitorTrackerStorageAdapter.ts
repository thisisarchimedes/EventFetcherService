import {IMonitorTrackerStorage} from '../../../src/services/monitorTracker/IMonitorTrackerStorage';
import {Balance} from '../../../src/services/monitorTracker/MonitorTrackerService';

export class MonitorTrackerStorageAdapter implements IMonitorTrackerStorage {
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
