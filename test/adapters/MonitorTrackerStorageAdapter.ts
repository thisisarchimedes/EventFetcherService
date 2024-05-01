import {IMonitorTrackerStorage} from '../../src/services/monitorTracker/IMonitorTrackerStorage';
import {Balance} from '../../src/services/monitorTracker/MonitorTrackerService';

export class MonitorTrackerStorageAdapter implements IMonitorTrackerStorage {
  private balances: Balance[];

  constructor() {
    console.log('MonitorTrackerStorageAdapter - constructor');
  }

  public updateBalances(balances: Balance[]): Promise<void[]> {
    console.log('MonitorTrackerStorageAdapter - updateBalances: ', balances);
    this.balances = balances;
    return Promise.resolve([]);
  }
  public getBalances(): Promise<Balance[]> {
    return Promise.resolve(this.balances);
  }
}
