/* eslint-disable require-await */
import chai, {expect} from 'chai';
import sinon, {SinonStubbedInstance} from 'sinon';
import sinonChai from 'sinon-chai';
import {PrismaClient} from '@prisma/client';

import {ethers, Logger} from '@thisisarchimedes/backend-sdk';
import {MultiPoolStrategies} from '../../src/MultiPoolStrategies';
import MonitorTrackerService from '../../src/services/monitorTracker/MonitorTrackerService';
import {ConfigServiceAWS} from '../../src/services/config/ConfigServiceAWS';
import MonitorTrackerStorage from '../../src/services/monitorTracker/MonitorTrackerStorage';
import {MonitorTrackerStorageAdapter} from '../adapters/MonitorTrackerStorageAdapter';
import {EventFetcherAdapter} from '../adapters/EventFetcherAdapter';

chai.use(sinonChai);

describe('LedgerBuilder', function() {
  let configService: ConfigServiceAdapter;
  let mockLogger: SinonStubbedInstance<Logger>;

  let mockPrisma: SinonStubbedInstance<PrismaClient>;
  let mockMultiPoolStrategies: SinonStubbedInstance<MultiPoolStrategies>;
  let mockAlchemyProvider: Partial<ethers.providers.JsonRpcProvider>;
  let mockInfuraProvider: Partial<ethers.providers.JsonRpcProvider>;


  beforeEach(async function() {
    configService = new ConfigServiceAWS('DemoApp', 'us-east-1');
    await configService.refreshConfig();
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
    const eventFetcherAdapter = new EventFetcherAdapter();
    eventFetcherAdapter.setAddressBalance([{account: '0x123', balance: 1n}, {account: '0x456', balance: 2n}]);

    const monitorTrackerStorage = new MonitorTrackerStorageAdapter();

    const monitorTracker = new MonitorTrackerService(
      mockLogger, configService, eventFetcherAdapter, monitorTrackerStorage);
    await monitorTracker.updateEthBalances();

    const ethBalancesFromDB = await monitorTrackerStorage.getBalances();
    console.log(ethBalancesFromDB);
    expect(ethBalancesFromDB).to.have.length(2);
    expect(ethBalancesFromDB[0].account).to.be.equal('0x123');
    expect(ethBalancesFromDB[0].balance).to.be.equal(1);
    expect(ethBalancesFromDB[1].account).to.be.equal('0x456');
    expect(ethBalancesFromDB[1].balance).to.be.equal(2);
  });
});

/**
 [] Read ETH balance of executors and update db
 [] If there is no change in both balances
 [] If there is only change in one balance, only update this one
 [] If failed to read from one provider, try the other one
 [] If fail from both log error
 */
