import {Balance} from './monitorTracker/MonitorTrackerService';

export interface IBalanceFetcherStorage {
  updateBalances(balances: Balance[]): Promise<void[]>;
  getBalances(): Promise<Balance[]>;
}
