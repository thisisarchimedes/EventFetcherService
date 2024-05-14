import {expect} from 'chai';
import MonitorTrackerStorage from '../../src/services/monitorTracker/MonitorTrackerStorage';

import dotenv from 'dotenv';
import {PrismaClient} from '@prisma/client';

dotenv.config();

describe('Monitor balance storage', function() {
  let prisma: PrismaClient;

  beforeEach(function() {
    prisma = new PrismaClient();
  });

  it('should write new balance to DB', async function() {
    const monitorTrackerStorage = new MonitorTrackerStorage(prisma);

    const balancesToInsert = [{
      account: '0x123',
      balance: '1',
    }, {
      account: '0x456',
      balance: '2',
    }];
    await monitorTrackerStorage.updateBalances(balancesToInsert);
    const balances = await monitorTrackerStorage.getBalances();
    const firstWalletBalance = balances.find((a)=>(
      a.account === '0x123'
    ));
    const secondWalletBalance = balances.find((a)=>(
      a.account === '0x456'
    ));
    expect(firstWalletBalance).to.be.not.undefined;
    expect(secondWalletBalance).to.be.not.undefined;

    expect(firstWalletBalance!.balance).to.be.equal('1');
    expect(secondWalletBalance!.balance).to.be.equal('2');

    await prisma.executorBalances.deleteMany({
      where: {
        account: {
          in: ['0x123', '0x456'],
        },
      },
    });
    const balancesTwo = await monitorTrackerStorage.getBalances();
    const firstWalletBalanceAfterDelete = balancesTwo.find((a)=>(
      a.account === '0x123'
    ));
    expect(firstWalletBalanceAfterDelete).to.be.undefined;
  });
});
