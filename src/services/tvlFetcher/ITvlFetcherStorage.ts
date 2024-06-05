import {Balance} from '../monitorTracker/MonitorTrackerService';

export interface ITvlFetcherStorage {
  updateTvls(balances: Balance[]): Promise<void[]>;
  getTvls(): Promise<Balance[]>;
}
