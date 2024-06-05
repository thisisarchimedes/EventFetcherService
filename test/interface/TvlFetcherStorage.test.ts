import {expect} from 'chai';

import dotenv from 'dotenv';
import {PrismaClient} from '@prisma/client';
import {TvlFetcherStorage} from '../../src/services/balanceFetcher/tvlFetcher/TvlFetcherStorage';

dotenv.config();

describe('Tvl Fetcher Storage', function() {
  let prisma: PrismaClient;

  beforeEach(function() {
    prisma = new PrismaClient();
  });

  it('should write new tvl to DB', async function() {
    const tvlFetcherStorage = new TvlFetcherStorage(prisma);

    const balancesToInsert = [{
      account: '0x123',
      balance: '1',
    }, {
      account: '0x456',
      balance: '2',
    }];
    await tvlFetcherStorage.updateBalances(balancesToInsert);
    const tvls = await tvlFetcherStorage.getBalances();
    const firstStrategyTvl = tvls.find((a)=>(
      a.account === '0x123'
    ));
    const secondStrategyTvl = tvls.find((a)=>(
      a.account === '0x456'
    ));
    expect(firstStrategyTvl).to.be.not.undefined;
    expect(secondStrategyTvl).to.be.not.undefined;

    expect(firstStrategyTvl!.balance).to.be.equal('1');
    expect(secondStrategyTvl!.balance).to.be.equal('2');

    await prisma.strategyTVLs.deleteMany({
      where: {
        account: {
          in: ['0x123', '0x456'],
        },
      },
    });
    const tvlsTwo = await tvlFetcherStorage.getBalances();
    const firstStrategyTvlAfterDelete = tvlsTwo.find((a)=>(
      a.account === '0x123'
    ));
    expect(firstStrategyTvlAfterDelete).to.be.undefined;
  });
});
