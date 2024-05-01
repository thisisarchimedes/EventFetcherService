import {Balance} from './MonitorTrackerService';

export interface IMonitorTrackerStorage {
  updateBalances(balances: Balance[]): Promise<void[]>;
  getBalances(): Promise<Balance[]>;
}
