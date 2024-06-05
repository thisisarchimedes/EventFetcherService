import {EventFetcher} from '../../blockchain/EventFetcher';
import {IBalanceFetcherStorage} from '../IBalanceFetcherStorage';
import {Balance} from '../monitorTracker/MonitorTrackerService';

export class TvlFetcherService {
  constructor(
    private eventFetcher: EventFetcher,
    private tvlFetcherStorage: IBalanceFetcherStorage,
  ) {}

  public async updateStrategyTvls(addresses: string[]) {
    const balances = await this.getStrategyTvls(addresses);
    await this.tvlFetcherStorage.updateBalances(balances);
  }

  private getStrategyTvls(addresses: string[]): Promise<Balance[]> {
    return Promise.all(
        addresses.map(async (address) => {
          return {
            account: address,
            balance: (await this.eventFetcher.getStrategyTvl(address)).toString(),
          };
        }),
    );
  }
}
