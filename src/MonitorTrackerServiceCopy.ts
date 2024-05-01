// Import the AWS SDK and configure the region
import {ConfigService} from './services/config/ConfigService';
import {Logger, ethers} from '@thisisarchimedes/backend-sdk';
import {KMSFetcherService} from '../kms/KMSFetcherService';
import {PrismaClient} from '@prisma/client';
interface Balance {
  address: string;
  balance: bigint;
}

export default class MonitorTrackerService {
  private kms: KMSFetcherService = new KMSFetcherService();
  constructor(
    private logger: Logger,
    private configService: ConfigService,
    private mainRpcProvider: ethers.providers.JsonRpcProvider,
    private prismaClient:PrismaClient,
  ) {

  }

  public async updateEthBalances() {
    console.log('calling updateEthBalances');
    const addresses = await this.getMonitorAddress();
    const balances = await this.getEthBalances(addresses);


    Promise.all(balances.map(async (balance)=>{
      await this.prismaClient.executorBalances.upsert({create: {
        account: balance.address,
        balance: balance.balance,
        updatedAt: new Date(),
      }, update: {
        balance: balance.balance,
        updatedAt: new Date(),
      }, where: {
        account: balance.address,
      }});
    }));
  }

  private getEthBalances(addresses: string[]): Promise<Balance[]> {
    return Promise.all(addresses.map(async (address) => {
      return {
        address,
        balance: (await this.mainRpcProvider.getBalance(address)).toBigInt(),
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
