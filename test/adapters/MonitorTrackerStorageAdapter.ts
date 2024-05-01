import {IMonitorTrackerStorage} from '../../src/services/monitorTracker/IMonitorTrackerStorage';
import {Balance} from '../../src/services/monitorTracker/MonitorTrackerService';

export class MonitorTrackerStorageAdapter implements IMonitorTrackerStorage {
  private balances: Balance[];

  public updateBalances(balances: Balance[]): Promise<void[]> {
    console.log('here', balances);
    this.balances = balances;
    return Promise.resolve([]);
  }
  public getBalances(): Promise<Balance[]> {
    console.log('here2', this.balances);
    return Promise.resolve(this.balances);
  }
}
