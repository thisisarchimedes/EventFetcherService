// Import the AWS SDK and configure the region
import {ConfigService} from '../config/ConfigService';
import {Logger} from '@thisisarchimedes/backend-sdk';
import {IMonitorTrackerStorage} from './IMonitorTrackerStorage';
import {EventFetcher} from '../blockchain/EventFetcher';
import {IKMSFetcherService} from '../kms/IKMSFetcherService';
export interface Balance {
  account: string;
  balance: bigint;
}

export default class MonitorTrackerService {
  constructor(
    private logger: Logger,
    private configService: ConfigService,
    private eventFetcher: EventFetcher,
    private monitorTrackerStorage: IMonitorTrackerStorage,
    private kms: IKMSFetcherService,
  ) {}

  public async updateEthBalances() {
    console.log('MonitorTrackerService: called updateEthBalance');
    const addresses = await this.getMonitorAddress();
    console.log('MonitorTrackerService: updateEthBalances: addresses', addresses);
    const balances = await this.getEthBalances(addresses);
    console.log('MonitorTrackerService: updateEthBalances: balances', balances);
    await this.monitorTrackerStorage.updateBalances(balances);
  }

  private getEthBalances(addresses: string[]): Promise<Balance[]> {
    console.log({addresses});
    return Promise.all(
        addresses.map(async (address) => {
          return {
            account: address,
            balance: await this.eventFetcher.getAddressBalance(address),
          };
        }),
    );
  }

  private async getMonitorAddress() {
    console.log('MonitorTrackerService: getMonitorAddress');
    const tags = await Promise.all([
      this.kms.fetchTags(this.configService.getPSPKeyARN()),
      this.kms.fetchTags(this.configService.getLeverageKeyARN()),
      this.kms.fetchTags(this.configService.getUrgentKeyARN()),
    ]);
    console.log('MonitorTrackerService: tags', tags);

    const addresses = [];
    for (const i in tags) {
      const address = tags[i].find((tag) => tag.TagKey === 'Address')?.TagValue;
      if (address) {
        addresses.push(address);
      }
    }
    return addresses;
  }
}

// 1.Get monitor Address
// 2. Call alchemy/infura and get the address' eth balance
// 3. Update the balance in the db
