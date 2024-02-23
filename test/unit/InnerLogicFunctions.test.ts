import {S3Service, SQSService, Logger} from '@thisisarchimedes/backend-sdk';

import {expect} from 'chai';
import {ethers} from 'hardhat';
import {Contract} from 'ethers';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';

import {EventProcessorService} from '../../src/EventProcessorService';
import {ConfigService} from '../../src/services/config/ConfigService';
import {ConfigServiceAdapter} from '../adapters/ConfigServiceAdapter';
import {EventFetcherAdapter} from '../adapters/EventFetcherAdapter';
import { EventFactory } from '../../src/onchain_events/EventFactory';
import chaiAsPromised from 'chai-as-promised';


chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('Inner logic functions', function() {
  let positionOpenerMockContract: Contract;
  let positionCloserMockContract: Contract;
  let positionLiquidatorMockContract: Contract;
  let positionExpiratorMockContract: Contract;
  let eventProcessorService: EventProcessorService;
  let s3Stub: sinon.SinonStubbedInstance<S3Service>;
  let sqsStub: sinon.SinonStubbedInstance<SQSService>;
  let loggerStub: sinon.SinonStubbedInstance<Logger>;
  let configService: ConfigService;
  let eventFactory: EventFactory;
  let eventFetcher: EventFetcherAdapter;

  beforeEach(async function() {
    // Deploy a mock contract for the tests
    const PositionOpenerFactory = await ethers.getContractFactory(
        'PositionOpener_mock',
    );

    positionOpenerMockContract = await PositionOpenerFactory.deploy();
    await positionOpenerMockContract.deployed();

    const PositionCloserFactory = await ethers.getContractFactory(
        'PositionCloser_mock',
    );

    positionCloserMockContract = await PositionCloserFactory.deploy();
    await positionCloserMockContract.deployed();

    const PositionLiquidatorFactory = await ethers.getContractFactory(
        'PositionLiquidator_mock',
    );

    const PositionExpiratorFactory = await ethers.getContractFactory(
        'PositionExpirator_mock',
    );

    positionExpiratorMockContract = await PositionExpiratorFactory.deploy();
    await positionExpiratorMockContract.deployed();

    positionLiquidatorMockContract = await PositionLiquidatorFactory.deploy();
    await positionLiquidatorMockContract.deployed();

    // Stub the S3Service and SQSService and their methods
    s3Stub = sinon.createStubInstance(S3Service);
    s3Stub.getObject.resolves();
    s3Stub.putObject.resolves(undefined);

    sqsStub = sinon.createStubInstance(SQSService);
    sqsStub.sendMessage.resolves(undefined);

    // Stub the Logger
    loggerStub = sinon.createStubInstance(Logger);

    configService = new ConfigServiceAdapter();

    eventFactory = new EventFactory(configService, loggerStub, sqsStub);

    // Initialize the EventProcessorService with the stubs and mock contract
    eventProcessorService = new EventProcessorService(
        loggerStub,
        configService);
  });

  // Helper function to create a mock Log object
  const createMockLog = (transactionHash, logIndex) => ({
    transactionHash: transactionHash,
    logIndex: logIndex,
    blockNumber: 123, // Mock value
    blockHash: '0xblockhash', // Mock value
    transactionIndex: 0, // Mock value
    removed: false, // Mock value
    address: '0xaddress', // Mock value
    data: '0xdata', // Mock value
    topics: ['0xtopic1', '0xtopic2'], // Mock value
  });


  it('should return an empty array for no logs', async function() {
    const logs = [];
    await expect(eventFactory.createEvent(logs[0])).to.be.rejectedWith('Event log has no topics');
  });

  it('should return the same logs if all are unique', async function() {
    eventFetcher = new EventFetcherAdapter();
    eventFetcher.setEventArrayFromFile('test/data/depositEvent.json');
    const logs: ethers.providers.Log[] = await eventFetcher.getOnChainEvents(100, 200);

    expect(logs.length).to.equal(2);
  });

  it('should remove duplicate logs', async function() {
    eventFetcher = new EventFetcherAdapter();
    eventFetcher.setEventArrayFromFile('test/data/duplicatedLogs.json');
    const logs: ethers.providers.Log[] = await eventFetcher.getOnChainEvents(100, 200);

    expect(logs.length).to.equal(1);
  });

  it('should handle a mix of unique and duplicate logs correctly', function() {
    const logs = [
      createMockLog('0x1', 1),
      createMockLog('0x1', 1),
      createMockLog('0x2', 2),
      createMockLog('0x3', 3),
      createMockLog('0x3', 3),
    ];
    const result = eventProcessorService.deduplicateLogs(logs);
    expect(result).to.deep.equal([
      createMockLog('0x1', 1),
      createMockLog('0x2', 2),
      createMockLog('0x3', 3),
    ]);
  });

  it('should treat logs with same transactionHash but different logIndex as unique', function() {
    const logs = [createMockLog('0x1', 1), createMockLog('0x1', 2)];
    const result = eventProcessorService.deduplicateLogs(logs);
    expect(result).to.have.lengthOf(2);
  });

  it('should treat logs with different transactionHash but same logIndex as unique', function() {
    const logs = [createMockLog('0x1', 1), createMockLog('0x2', 1)];
    const result = eventProcessorService.deduplicateLogs(logs);
    expect(result).to.have.lengthOf(2);
  });

  it('should correctly deduplicate logs regardless of order', function() {
    const logs = [
      createMockLog('0x1', 1),
      createMockLog('0x2', 2),
      createMockLog('0x1', 1),
    ];
    const result = eventProcessorService.deduplicateLogs(logs);
    expect(result).to.deep.equal([
      createMockLog('0x1', 1),
      createMockLog('0x2', 2),
    ]);
  });

  it('should return a single log when all logs are duplicates', function() {
    const logs = [
      createMockLog('0x1', 1),
      createMockLog('0x1', 1),
      createMockLog('0x1', 1),
    ];
    const result = eventProcessorService.deduplicateLogs(logs);
    expect(result).to.deep.equal([createMockLog('0x1', 1)]);
  });
});
