import {PrismaClient} from '@prisma/client';
import {Balance} from './MonitorTrackerService';
import {IBalanceFetcherStorage} from '../IBalanceFetcherStorage';

export default class MonitorTrackerStorage implements IBalanceFetcherStorage {
  constructor(
    private prismaClient:PrismaClient,
  ) {}

  public updateBalances(balances: Balance[]) {
    return Promise.all(balances.map(async (balance)=> {
      await this.prismaClient.executorBalances.upsert({create: {
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

  public async getBalances() {
    return await this.prismaClient.executorBalances.findMany();
  }
}
