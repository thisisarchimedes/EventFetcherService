import {PrismaClient} from '@prisma/client';
import {Balance} from './MonitorTrackerService';
import {IMonitorTrackerStorage} from './IMonitorTrackerStorage';

export default class MonitorTrackerStorage implements IMonitorTrackerStorage {
  constructor(
    private prismaClient:PrismaClient,
  ) {}

  public updateBalances(balances: Balance[]) {
    return Promise.all(balances.map(async (balance)=> {
      await this.prismaClient.executorBalances.upsert({create: {
        account: balance.account,
        balance: balance.balance,
        updatedAt: new Date(),
      }, update: {
        balance: balance.balance,
        updatedAt: new Date(),
      }, where: {
        account: balance.account,
      }});
    }));
  }

  public getBalances() {
    return this.prismaClient.executorBalances.findMany();
  }
}
