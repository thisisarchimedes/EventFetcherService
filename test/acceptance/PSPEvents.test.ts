import dotenv from 'dotenv';
import {expect} from 'chai';
import nock from 'nock';

import {MockEthereumNode} from './mock/MockEthereumNode';
import {MockNewRelic} from './mock/MockNewRelic';
import {MockAWSS3} from './mock/MockAWSS3';
import {ConfigServiceAWS} from '../../src/services/config/ConfigServiceAWS';
import {AppConfigClient} from '../../src/services/config/AppConfigClient';

import {createDependencies, run} from '../../src/main';
import MockPrisma from './mock/MockPrisma';
import {PrismaClient} from '@prisma/client/extension';

dotenv.config();

const ENVIRONMENT = process.env.ENVIRONMENT!;
const AWS_REGION = process.env.AWS_REGION!;

describe('PSP Events', function() {
  let mockEthereumNode: MockEthereumNode;
  let mockEthereumNodeAlt: MockEthereumNode;
  let mockNewRelic: MockNewRelic;
  let mockAWSS3: MockAWSS3;
  let mockPrisma: MockPrisma;
  const config: ConfigServiceAWS = new ConfigServiceAWS(ENVIRONMENT, AWS_REGION);
  const appConfigClient: AppConfigClient = new AppConfigClient(ENVIRONMENT, AWS_REGION);

  before(async function() {
    await config.refreshConfig();
  });

  beforeEach(async function() {
    await initalizeMocks();
    setupGenericNockInterceptors();
  });

  afterEach(function() {
    cleanupNock();
  });

  it('should catch and report on Deposit event', async function() {
    const strategyAddress = config.getPSPContractAddressByStrategyName('Convex FRAXBP/msUSD Single Pool');
    mockEthereumNodeResponses('test/data/depositEvent.json', strategyAddress);

    const expectedLog = createExpectedLogMessagePSPDeposit();
    mockNewRelic.setWaitedOnMessage(expectedLog);

    await runOneCycle();

    expect(mockNewRelic.isWaitedOnMessageObserved()).to.be.true;
  });

  function createExpectedLogMessagePSPDeposit(): string {
    return '0x1fe52317d52b452120708667eed57e3c19ad39268bfabcf60230978c50df426f';
  }

  it('should catch and report on Withdraw event', async function() {
    const strategyAddress = config.getPSPContractAddressByStrategyName('Convex FRAXBP/msUSD Single Pool');
    mockEthereumNodeResponses(
        'test/data/withdrawEvent.json',
        strategyAddress,
    );

    const expectedLog = createExpectedLogMessagePSPWithdraw();
    mockNewRelic.setWaitedOnMessage(expectedLog);

    await runOneCycle();

    expect(mockNewRelic.isWaitedOnMessageObserved()).to.be.true;
  });

  function createExpectedLogMessagePSPWithdraw(): string {
    return '0x41f9437497aee519b2c3d1013fcb40b39447a3d969cc2ddc445a1bcdb49f7600';
  }

  async function initalizeMocks() {
    mockEthereumNode = new MockEthereumNode(config.getMainRPCURL());
    mockEthereumNodeAlt = new MockEthereumNode(config.getAlternativeRPCURL());

    const newRelicApiUrl: string = 'https://log-api.newrelic.com';
    mockNewRelic = new MockNewRelic(newRelicApiUrl);

    const {bucket} = JSON.parse(await appConfigClient.fetchConfigRawString('LastBlockScannedS3FileURL'));
    mockAWSS3 = new MockAWSS3(bucket, AWS_REGION);

    mockPrisma = new MockPrisma();
  }

  function setupGenericNockInterceptors() {
    mockAWSS3Endpoint();
  }

  function mockEthereumNodeResponses(syntheticEventFile: string, address?: string) {
    mockEthereumNode.mockChainId();
    mockEthereumNode.mockBlockNumber('0x5B8D86');
    mockEthereumNode.mockEventResponse(syntheticEventFile, address);
    mockEthereumNode.mockGetBalance('0x8AC7230489E80000');

    mockEthereumNodeAlt.mockChainId();
    mockEthereumNodeAlt.mockBlockNumber('0x5B8D86');
    mockEthereumNodeAlt.mockEventResponse(syntheticEventFile, address);
    mockEthereumNodeAlt.mockGetBalance('0x8AC7230489E80000');
  }

  function mockAWSS3Endpoint() {
    mockAWSS3.mockChangeLastProcessedBlockNumber();
    mockAWSS3.mockGetLastProcessedBlockNumber(7000000);
  }

  function cleanupNock() {
    nock.cleanAll();
  }

  async function runOneCycle() {
    const {logger, configService, mainRpcProvider, altRpcProvider} = await createDependencies();
    await run(logger, configService, mockPrisma as unknown as PrismaClient, mainRpcProvider, altRpcProvider);
  }
});
