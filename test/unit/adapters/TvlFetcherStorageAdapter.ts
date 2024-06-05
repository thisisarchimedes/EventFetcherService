import {Balance} from '../../../src/services/monitorTracker/MonitorTrackerService';

export class TvlFectherStorageAdapter {
  private tvls: Balance[];
  constructor() {
  }

  public updateTvls(tvls: Balance[]): Promise<void[]> {
    this.tvls = tvls;
    return Promise.resolve([]);
  }
  public getTvls(): Promise<Balance[]> {
    return Promise.resolve(this.tvls);
  }
}
