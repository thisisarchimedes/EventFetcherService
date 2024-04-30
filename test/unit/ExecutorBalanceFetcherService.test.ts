/* eslint-disable require-await */
import chai, {expect} from 'chai';
import sinon, {SinonStubbedInstance} from 'sinon';
import sinonChai from 'sinon-chai';
import {PrismaClient} from '@prisma/client';

import {LedgerBuilder} from '../../src/LedgerBuilder';
import {ethers, Logger} from '@thisisarchimedes/backend-sdk';
import {MultiPoolStrategies} from '../../src/MultiPoolStrategies';
import {
  ClaimEvent,
  ClosePositionEvent,
  ExpirePositionEvent,
  LiquidatePositionEvent,
  OpenPositionEvent,
} from '../../src/types/LedgerBuilder';
import {ContractType} from '../../src/types/EventDescriptor';
import {BigNumber} from 'ethers';

chai.use(sinonChai);

describe('LedgerBuilder', function() {
  let mockLogger: SinonStubbedInstance<Logger>;

  let mockPrisma: SinonStubbedInstance<PrismaClient>;
  let mockMultiPoolStrategies: SinonStubbedInstance<MultiPoolStrategies>;
  let mockAlchemyProvider: Partial<ethers.providers.JsonRpcProvider>;
  let mockInfuraProvider: Partial<ethers.providers.JsonRpcProvider>;

  beforeEach(async function() {
    initalizeMocks();
  });

  const initalizeMocks = () => {
    mockAlchemyProvider = {
      getBlock: sinon.stub().resolves({timestamp: 1625097600}),
    };

    mockInfuraProvider = {
      getBlock: sinon.stub().resolves({timestamp: 1625097600}),
    };

    mockLogger = sinon.createStubInstance(Logger);
    mockPrisma = {
      executorBalances: {
        findFirst: sinon.stub().callsFake(async (data) => {
          return {id: data.data.id};
        }),
        create: sinon.stub().callsFake(async (data) => {
          return {id: data.data.id};
        }),
        update: sinon.stub(),
      },
    } as unknown as SinonStubbedInstance<PrismaClient>;
  };

  afterEach(function() {
    sinon.restore();
  });

  it('Read ETH balance of executors and update db', async function() {
    monitorTracker.updateEthBalances();

    const ethBalancesFromDB = monitorTracker.getEthBalances();
    expect(ethBalancesFromDB).to.have.length(2);
    expect(ethBalancesFromDB[0]).to.be.equal(1);
    expect(ethBalancesFromDB[1]).to.be.equal(2);
  });
});

/**
 [] Read ETH balance of executors and update db
 [] If there is no change in both balances
 [] If there is only change in one balance, only update this one
 [] If failed to read from one provider, try the other one
 [] If fail from both log error
 */
