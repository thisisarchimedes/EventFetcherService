import {PrismaClient} from '@prisma/client';
import {Balance} from '../monitorTracker/MonitorTrackerService';
import {ITvlFetcherStorage} from './ITvlFetcherStorage';

export class TvlFetcherStorage implements ITvlFetcherStorage {
  constructor(
    private prismaClient:PrismaClient,
  ) {}

  public updateTvls(balances: Balance[]) {
    return Promise.all(balances.map(async (balance)=> {
      await this.prismaClient.strategyTVLs.upsert({create: {
        account: balance.account,
        balance: balance.balance.toString(),
        updatedAt: new Date(),
      }, update: {
        balance: balance.balance.toString(),
        updatedAt: new Date(),
      }, where: {
        account: balance.account,
      }});
    }));
  }

  public async getTvls() {
    return await this.prismaClient.strategyTVLs.findMany();
  }
}
