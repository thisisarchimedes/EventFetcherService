// Import the AWS SDK and configure the region
import {ConfigService} from '../config/ConfigService';
import {Logger, ethers} from '@thisisarchimedes/backend-sdk';
import {KMSFetcherService} from '../kms/KMSFetcherService';
import {LeveragePosition, PrismaClient} from '@prisma/client';
import {IMonitorTrackerStorage} from './IMonitorTrackerStorage';
import { EventFetcher } from '../blockchain/EventFetcher';
export interface Balance {
  account: string;
  balance: bigint;
}

export default class MonitorTrackerService {
  private kms: KMSFetcherService = new KMSFetcherService();
  constructor(
    private logger: Logger,
    private configService: ConfigService,
    private eventFetcher: EventFetcher,
    private monitorTrackerStorage: IMonitorTrackerStorage,
  ) {

  }

  public async updateEthBalances() {
    const addresses = await this.getMonitorAddress();
    const balances = await this.getEthBalances(addresses);
    await this.monitorTrackerStorage.updateBalances(balances);
  }

  private getEthBalances(addresses: string[]): Promise<Balance[]> {
    return Promise.all(addresses.map(async (address) => {
      console.log(address);
      return {
        account: address,
        balance: (await this.eventFetcher.getAddressBalance(address)),
      };
    }));
  }

  private async getMonitorAddress() {
    const tags = await Promise.all([
      this.kms.fetchTags(this.configService.getPSPKeyARN()),
      this.kms.fetchTags(this.configService.getLeverageKeyARN()),
      this.kms.fetchTags(this.configService.getUrgentKeyARN()),
    ]);

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
