import dotenv from 'dotenv';
import {expect} from 'chai';
import nock from 'nock';

import {LoggerAdapter} from '../adapters/LoggerAdapter';
import {EventFetcherLogEntryMessagePSP} from '../../src/types/NewRelicLogEntry';

import {MockEthereumNode} from './Mocks/MockEthereumNode';
import {MockNewRelic} from './Mocks/MockNewRelic';
import {MockAWSS3} from './Mocks/MockAWSS3';
import {ConfigServiceAWS} from '../../src/services/config/ConfigServiceAWS';
import {AppConfigClient} from '../../src/services/config/AppConfigClient';
import {EventProcessorService} from '../../src/EventProcessorService';
import {ethers, Logger} from '@thisisarchimedes/backend-sdk';
import {PrismaClient} from '@prisma/client';

dotenv.config();

const ENVIRONMENT = process.env.ENVIRONMENT!;
const AWS_REGION = process.env.AWS_REGION!;

describe('PSP Events', function() {
  let logger: LoggerAdapter;
  let mockEthereumNode: MockEthereumNode;
  let mockNewRelic: MockNewRelic;
  let mockAWSS3: MockAWSS3;
  const config: ConfigServiceAWS = new ConfigServiceAWS(ENVIRONMENT, AWS_REGION);
  const appConfigClient: AppConfigClient = new AppConfigClient(ENVIRONMENT, AWS_REGION);
  const prisma = new PrismaClient();
  let mainRpcProvider;
  let altRpcProvider;

  before(function() {
    mainRpcProvider = new ethers.providers.JsonRpcProvider(config.getMainRPCURL());
    altRpcProvider = new ethers.providers.JsonRpcProvider(config.getAlternativeRPCURL());
  });

  beforeEach(async function() {
    await config.refreshConfig();
    await initalizeMocks();
    setupGenericNockInterceptors();
  });

  afterEach(function() {
    cleanupNock();
  });

  it('should catch and report on Deposit event', async function() {
    const strategyAddress = config.getPSPContractAddressByStrategyName('Convex FRAXBP/msUSD Single Pool');
    mockEthereumNodeResponses('test/data/depositEvent.json', strategyAddress);

    await runCycle();

    expect(mockNewRelic.isLogEntryDetected()).to.be.true;

    const expectedLog = createExpectedLogMessagePSPDeposit();
    const actualLog = mockNewRelic.findMatchingLogEntry(logger);

    expect(actualLog).to.not.be.null;
    const res: boolean = validateLogMessage(actualLog as EventFetcherLogEntryMessagePSP, expectedLog);
    expect(res).to.be.true;
  });

  function createExpectedLogMessagePSPDeposit(): EventFetcherLogEntryMessagePSP {
    return {
      blockNumber: 18742061,
      txHash: '0x1fe52317d52b452120708667eed57e3c19ad39268bfabcf60230978c50df426f',
      event: 'Deposit',
      user: '0x93B435e55881Ea20cBBAaE00eaEdAf7Ce366BeF2',
      strategy: 'Convex FRAXBP/msUSD Single Pool',
      amountAddedToStrategy: BigInt(5000000).toString(),
      amountAddedToAdapter: BigInt(0).toString(),
    };
  }

  it('should catch and report on Withdraw event', async function() {
    const strategyAddress = config.getPSPContractAddressByStrategyName('Convex FRAXBP/msUSD Single Pool');
    mockEthereumNodeResponses(
        'test/data/withdrawEvent.json',
        strategyAddress,
    );

    await runCycle();

    expect(mockNewRelic.isLogEntryDetected()).to.be.true;

    const expectedLog = createExpectedLogMessagePSPWithdraw();
    const actualLog = mockNewRelic.findMatchingLogEntry(logger);

    expect(actualLog).to.not.be.null;
    const res: boolean = validateLogMessage(actualLog as EventFetcherLogEntryMessagePSP, expectedLog);
    expect(res).to.be.true;
  });

  function runCycle() {
    const eventProcessorService = new EventProcessorService(
      logger as unknown as Logger,
      config,
      prisma,
      mainRpcProvider,
      altRpcProvider,
    );
    return eventProcessorService.execute();
  }

  function createExpectedLogMessagePSPWithdraw(): EventFetcherLogEntryMessagePSP {
    return {
      blockNumber: 18896084,
      txHash: '0x41f9437497aee519b2c3d1013fcb40b39447a3d969cc2ddc445a1bcdb49f7600',
      event: 'Withdraw',
      user: '0x2222222222222222222222222222222222222222',
      strategy: 'Convex FRAXBP/msUSD Single Pool',
      amountAddedToStrategy: (-1n).toString(),
      amountAddedToAdapter: (0n).toString(),
    };
  }

  async function initalizeMocks() {
    logger = new LoggerAdapter('local_logger.txt');

    mockEthereumNode = new MockEthereumNode(config.getMainRPCURL());

    const newRelicApiUrl: string = 'https://log-api.newrelic.com';
    mockNewRelic = new MockNewRelic(newRelicApiUrl, logger);

    const {bucket} = JSON.parse(await appConfigClient.fetchConfigRawString('LastBlockScannedS3FileURL'));
    mockAWSS3 = new MockAWSS3(bucket, AWS_REGION);
  }

  function setupGenericNockInterceptors() {
    mockNewRelicLogEndpoint();
    mockAWSS3Endpoint();
  }

  function mockEthereumNodeResponses(syntheticEventFile: string, address?: string) {
    mockEthereumNode.mockChainId();
    mockEthereumNode.mockBlockNumber('0x5B8D86');
    mockEthereumNode.mockEventResponse(syntheticEventFile, address);
  }

  function mockNewRelicLogEndpoint() {
    mockNewRelic.mockLogEndpoint();
  }

  function mockAWSS3Endpoint() {
    mockAWSS3.mockChangeLastProcessedBlockNumber();
    mockAWSS3.mockGetLastProcessedBlockNumber(7000000);
  }

  function cleanupNock() {
    nock.cleanAll();
  }

  function validateLogMessage(
      actualLog: EventFetcherLogEntryMessagePSP,
      expectedLog: EventFetcherLogEntryMessagePSP,
  ): boolean {
    return (
      actualLog.blockNumber === expectedLog.blockNumber &&
    actualLog.txHash === expectedLog.txHash &&
    actualLog.event === expectedLog.event &&
    actualLog.user === expectedLog.user &&
    actualLog.strategy === expectedLog.strategy &&
    actualLog.amountAddedToStrategy === expectedLog.amountAddedToStrategy &&
    actualLog.amountAddedToAdapter === expectedLog.amountAddedToAdapter
    );
  }
});
