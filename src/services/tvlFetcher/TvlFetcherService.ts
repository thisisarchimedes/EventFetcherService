import {EventFetcher} from '../blockchain/EventFetcher';
import {Logger} from '../logger/Logger';
import {Balance} from '../monitorTracker/MonitorTrackerService';
import {ITvlFetcherStorage} from './ITvlFetcherStorage';

export class TvlFetcherService {
  constructor(
    private logger: Logger,
    private eventFetcher: EventFetcher,
    private tvlFetcherStorage: ITvlFetcherStorage,
  ) {}

  public async updateStrategyTvls(addresses: string[]) {
    const balances = await this.getStrategyTvls(addresses);
    await this.tvlFetcherStorage.updateTvls(balances);
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
