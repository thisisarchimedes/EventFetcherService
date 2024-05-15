/* eslint-disable require-await */
import chai, {expect} from 'chai';
import sinon, {SinonStubbedInstance} from 'sinon';
import sinonChai from 'sinon-chai';
import {PrismaClient} from '@prisma/client';
import {ethers} from 'ethers';

import {LedgerBuilder} from '../../src/LedgerBuilder';
import {MultiPoolStrategies} from '../../src/MultiPoolStrategies';
import {
  ClaimEvent, ClosePositionEvent, ExpirePositionEvent,
  LiquidatePositionEvent, OpenPositionEvent,
} from '../../src/types/LedgerBuilder';
import {ContractType} from '../../src/types/EventDescriptor';
import {BigNumber} from 'ethers';
import {Logger} from '../../src/services/logger/Logger';
import {LoggerAdapter} from './adapters/LoggerAdapter';

chai.use(sinonChai);

describe('LedgerBuilder', function() {
  let logger: Logger;

  let mockPrisma: SinonStubbedInstance<PrismaClient>;
  let mockMultiPoolStrategies: SinonStubbedInstance<MultiPoolStrategies>;
  let mockAlchemyProvider: Partial<ethers.providers.JsonRpcProvider>;
  let mockInfuraProvider: Partial<ethers.providers.JsonRpcProvider>;

  beforeEach(async function() {
    logger = new LoggerAdapter('local_logger.txt');
    initalizeMocks();
  });

  const initalizeMocks = () => {
    mockAlchemyProvider = {
      getBlock: sinon.stub().resolves({timestamp: 1625097600}),
    };

    mockInfuraProvider = {
      getBlock: sinon.stub().resolves({timestamp: 1625097600}),
    };

    mockPrisma = ({
      openLeverage: {
        findFirst: sinon.stub(),
        create: sinon.stub().callsFake(async () => {
          return {data: {}};
        }),
      },
      closeLeverage: {
        findFirst: sinon.stub().resolves(null),
        create: sinon.stub(),
      },
      expireLeverage: {
        findFirst: sinon.stub().resolves(null),
        create: sinon.stub(),
      },
      liquidateLeverage: {
        findFirst: sinon.stub().resolves(null),
        create: sinon.stub(),
      },
      leveragePosition: {
        findFirst: sinon.stub().callsFake(async (data) => {
          if (data.where.nftId.toString() == '1') {
            return null;
          } else {
            return {nftId: data.where.nftId};
          }
        }),
        create: sinon.stub().callsFake(async (data) => {
          return {nftId: data.data.nftId};
        }),
        update: sinon.stub(),
      },
    } as unknown) as SinonStubbedInstance<PrismaClient>;

    mockMultiPoolStrategies = sinon.createStubInstance(MultiPoolStrategies);
    mockMultiPoolStrategies.fetchStrategyData.resolves({
      assetDecimals: 8,
      assetPerShare: BigNumber.from('100000000'),
      underlyingAsset: '0xAsset',
    });
  };

  afterEach(function() {
    sinon.restore();
  });

  it('should handle an empty array of events', async function() {
    const ledgerBuilder = initializeLedgerBuilder();
    await ledgerBuilder.processEvents([]);
  });

  it('should process a PositionOpened event successfully', async function() {
    const positionOpenedEvent: OpenPositionEvent = {
      name: 'PositionOpened',
      contractType: ContractType.Opener,
      txHash: '0x123',
      blockNumber: 123456,
      data: {
        nftId: '1',
        user: '0xUser',
        strategy: '0xStrategy',
        collateralAmount: '100000000', // 1 unit in 8 decimals
        wbtcToBorrow: '50000000', // 0.5 units in 8 decimals
        positionExpireBlock: 123460,
        sharesReceived: '100000000', // 1 unit in 8 decimals
      },
    };

    const ledgerBuilder = initializeLedgerBuilder();
    await ledgerBuilder.processEvents([positionOpenedEvent]);
    // Use mockPrisma for assertions
    expect(mockPrisma.openLeverage.create).to.have.been.calledOnce;
    expect(mockPrisma.leveragePosition.create).to.have.been.calledOnce;
  });

  it('should process a PositionClosed event successfully', async function() {
    const positionClosedEvent: ClosePositionEvent = {
      name: 'PositionClosed',
      contractType: ContractType.Closer,
      txHash: '0x456',
      blockNumber: 123789,
      data: {
        nftId: '2',
        user: '0xUser',
        receivedAmount: '40000000',
        wbtcDebtAmount: '50000000',
      },
    };

    const ledgerBuilder = initializeLedgerBuilder();

    await ledgerBuilder.processEvents([positionClosedEvent]);

    // Assertions to check if the PositionClosed event was processed correctly
    expect(mockPrisma.closeLeverage.create).to.have.been.calledOnce;
    expect(mockPrisma.leveragePosition.findFirst).to.have.been.calledOnce;
    expect(mockPrisma.leveragePosition.update).to.have.been.calledOnce;
  });

  it('should process a PositionLiquidated event successfully', async function() {
    const positionLiquidateEvent: LiquidatePositionEvent = {
      name: 'PositionLiquidated',
      contractType: ContractType.Liquidator,
      txHash: '0x456',
      blockNumber: 123789,
      data: {
        nftId: '2',
        strategy: '0xStrategy',
        wbtcDebtPaid: '40000000',
        claimableAmount: '50000000',
        liquidationFee: '1',
      },
    };

    const ledgerBuilder = initializeLedgerBuilder();

    await ledgerBuilder.processEvents([positionLiquidateEvent]);

    // Assertions to check if the PositionClosed event was processed correctly
    expect(mockPrisma.liquidateLeverage.create).to.have.been.calledOnce;
    expect(mockPrisma.leveragePosition.findFirst).to.have.been.calledOnce;
    expect(mockPrisma.leveragePosition.update).to.have.been.calledOnce;
  });

  it('should process a PositionExpired event successfully', async function() {
    const positionExpiredEvent: ExpirePositionEvent = {
      name: 'PositionExpired',
      contractType: ContractType.Expirator,
      txHash: '0x456',
      blockNumber: 123789,
      data: {
        nftId: '2',
        user: '0xUser',
        claimableAmount: '50000000',
      },
    };

    const ledgerBuilder = initializeLedgerBuilder();

    await ledgerBuilder.processEvents([positionExpiredEvent]);

    // Assertions to check if the PositionClosed event was processed correctly
    expect(mockPrisma.expireLeverage.create).to.have.been.calledOnce;
    expect(mockPrisma.leveragePosition.findFirst).to.have.been.calledOnce;
    expect(mockPrisma.leveragePosition.update).to.have.been.calledOnce;
  });

  it('should process a Claim event successfully', async function() {
    const claimEvent: ClaimEvent = {
      name: 'Claim',
      contractType: ContractType.ExpiredVault,
      txHash: '0x456',
      blockNumber: 123789,
      data: {
        claimer: '0xUser',
        nftId: '2',
        amount: '50000000',
      },
    };

    const ledgerBuilder = initializeLedgerBuilder();

    await ledgerBuilder.processEvents([claimEvent]);

    expect(mockPrisma.leveragePosition.findFirst)
        .to.have.been.calledOnce;
    expect(mockPrisma.leveragePosition.update)
        .to.have.been.calledOnce;
  });


  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const initializeLedgerBuilder = () => {
    return new LedgerBuilder(
        logger,
        mockAlchemyProvider as ethers.providers.JsonRpcProvider,
        mockInfuraProvider as ethers.providers.JsonRpcProvider,
        mockPrisma,
        mockMultiPoolStrategies,
    );
  };
});
