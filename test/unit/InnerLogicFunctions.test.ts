import {expect} from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';
import hre from 'hardhat';
import '@nomiclabs/hardhat-ethers';
import {ethers} from 'ethers';

import {S3Service} from '@thisisarchimedes/backend-sdk';

import {ConfigService} from '../../src/services/config/ConfigService';
import {ConfigServiceAdapter} from '../adapters/ConfigServiceAdapter';
import {EventFetcherAdapter} from '../adapters/EventFetcherAdapter';
import {EventFactory, EventFactoryUnknownEventError} from '../../src/onchain_events/EventFactory';

import {Logger} from '../../src/services/logger/Logger';
import {LoggerAdapter} from '../adapters/LoggerAdapter';

chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('Inner logic functions', function() {
  let positionOpenerMockContract: ethers.Contract;
  let positionCloserMockContract: ethers.Contract;
  let positionLiquidatorMockContract: ethers.Contract;
  let positionExpiratorMockContract: ethers.Contract;
  let s3Stub: sinon.SinonStubbedInstance<S3Service>;

  let logger: Logger;
  let configService: ConfigService;
  let eventFactory: EventFactory;
  let eventFetcher: EventFetcherAdapter;

  beforeEach(async function() {
    logger = new LoggerAdapter('local_logger.txt');
    // Deploy a mock contract for the tests
    const PositionOpenerFactory = await hre.ethers.getContractFactory(
        'PositionOpener_mock',
    );

    positionOpenerMockContract = await PositionOpenerFactory.deploy();
    await positionOpenerMockContract.deployed();

    const PositionCloserFactory = await hre.ethers.getContractFactory(
        'PositionCloser_mock',
    );

    positionCloserMockContract = await PositionCloserFactory.deploy();
    await positionCloserMockContract.deployed();

    const PositionLiquidatorFactory = await hre.ethers.getContractFactory(
        'PositionLiquidator_mock',
    );

    const PositionExpiratorFactory = await hre.ethers.getContractFactory(
        'PositionExpirator_mock',
    );

    positionExpiratorMockContract = await PositionExpiratorFactory.deploy();
    await positionExpiratorMockContract.deployed();

    positionLiquidatorMockContract = await PositionLiquidatorFactory.deploy();
    await positionLiquidatorMockContract.deployed();

    s3Stub = sinon.createStubInstance(S3Service);
    s3Stub.getObject.resolves();
    s3Stub.putObject.resolves(undefined);

    configService = new ConfigServiceAdapter();

    eventFactory = new EventFactory(configService, logger);
  });

  it('should throw for no logs', async function() {
    const logs = [];
    await expect(() => eventFactory.createEvent(logs[0])).to
        .throw(EventFactoryUnknownEventError, 'Event log has no topics');
  });

  it('should return the same logs if all are unique', async function() {
    eventFetcher = new EventFetcherAdapter();
    eventFetcher.setEventArrayFromFile('test/data/depositEvent.json');
    const logs: ethers.providers.Log[] = await eventFetcher.getOnChainEvents(100, 200);

    expect(logs.length).to.equal(2);
  });

  it('should handle a mix of unique and duplicate logs correctly and remove duplicate logs', async function() {
    eventFetcher = new EventFetcherAdapter();
    eventFetcher.setEventArrayFromFile('test/data/duplicatedLogs.json');
    const logs: ethers.providers.Log[] = await eventFetcher.getOnChainEvents(100, 200);

    expect(logs.length).to.equal(3);
  });

  it('should return a single log when all logs are duplicates', async function() {
    eventFetcher = new EventFetcherAdapter();
    eventFetcher.setEventArrayFromFile('test/data/duplicatedLogs2.json');
    const logs: ethers.providers.Log[] = await eventFetcher.getOnChainEvents(100, 200);

    expect(logs.length).to.equal(1);
  });
});
