// Import the AWS SDK and configure the region
import {ConfigService} from '../config/ConfigService';
import {IMonitorTrackerStorage} from './IMonitorTrackerStorage';
import {EventFetcher} from '../blockchain/EventFetcher';
import {IKMSFetcherService} from '../kms/IKMSFetcherService';
import {Logger} from '../logger/Logger';

export interface Balance {
  account: string;
  balance: string;
}

export default class MonitorTrackerService {
  constructor(
    private logger: Logger,
    private configService: ConfigService,
    private eventFetcher: EventFetcher,
    private monitorTrackerStorage: IMonitorTrackerStorage,
    private kms: IKMSFetcherService,
  ) { }

  public async updateEthBalances() {
    const addresses = await this.getMonitorAddress();
    const balances = await this.getEthBalances(addresses);
    await this.monitorTrackerStorage.updateBalances(balances);
  }

  private getEthBalances(addresses: string[]): Promise<Balance[]> {
    return Promise.all(
        addresses.map(async (address) => {
          return {
            account: address,
            balance: (await this.eventFetcher.getAddressBalance(address)).toString(),
          };
        }),
    );
  }

  private async getMonitorAddress() {
    const tags = await Promise.all([
      this.kms.fetchTags(this.configService.getPSPKeyARN()),
      this.kms.fetchTags(this.configService.getLeverageKeyARN()),
      this.kms.fetchTags(this.configService.getUrgentKeyARN()),
    ]);
    const addresses = [];

    for (let i = 0; i < tags.length; i++) {
      const address = tags[i].find((tag) => tag.TagKey === 'Address')?.TagValue;
      if (address) {
        addresses.push(address);
      }
    }
    return addresses;
  }
}
