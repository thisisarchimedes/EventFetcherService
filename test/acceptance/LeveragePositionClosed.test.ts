import nock from 'nock';
import {expect} from 'chai';
import {AppConfigClient} from '../../src/services/config/AppConfigClient';
import {ConfigServiceAWS} from '../../src/services/config/ConfigServiceAWS';
import {MockAWSS3} from './mock/MockAWSS3';
import {MockEthereumNode} from './mock/MockEthereumNode';
import {MockNewRelic} from './mock/MockNewRelic';
import dotenv from 'dotenv';
import {createDependencies, run} from '../../src/main';
import MockPrisma from './mock/MockPrisma';
import {PrismaClient} from '@prisma/client';

dotenv.config();

const ENVIRONMENT = process.env.ENVIRONMENT!;
const AWS_REGION = process.env.AWS_REGION!;

describe('Leveraged Position Closed', function() {
  let mockEthereumNode: MockEthereumNode;
  let mockEthereumNodeAlt: MockEthereumNode;
  let mockNewRelic: MockNewRelic;
  let mockAWSS3: MockAWSS3;
  let mockPrisma: MockPrisma;
  const config: ConfigServiceAWS = new ConfigServiceAWS(
      ENVIRONMENT,
      AWS_REGION,
  );
  const appConfigClient: AppConfigClient = new AppConfigClient(
      ENVIRONMENT,
      AWS_REGION,
  );

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

  it('should catch and report on Leverage Position Closed event', async function() {
    const positionCloser = config.getLeveragePositionCloserAddress();
    mockEthereumNodeResponses(
        'test/data/leveragePositionClosedEvent.json',
        positionCloser,
    );

    const expectedLog = createExpectedLogMessageLeveragedPositionClosed();
    mockNewRelic.setWaitedOnMessage(expectedLog);

    await runOneCycle();

    expect(mockNewRelic.isWaitedOnMessageObserved()).to.be.true;
  });

  function createExpectedLogMessageLeveragedPositionClosed(): string {
    return '0xa3f9c612d3b54762107493d6f0e29d2b35c4c0fe8b37a8cd50b4e711c6d8b431';
  }

  async function initalizeMocks() {
    mockEthereumNode = new MockEthereumNode(config.getMainRPCURL());
    mockEthereumNodeAlt = new MockEthereumNode(config.getAlternativeRPCURL());

    const newRelicApiUrl: string = 'https://log-api.newrelic.com';
    mockNewRelic = new MockNewRelic(newRelicApiUrl);

    const {bucket} = JSON.parse(
        await appConfigClient.fetchConfigRawString('LastBlockScannedS3FileURL'),
    );
    mockAWSS3 = new MockAWSS3(bucket, AWS_REGION);
    mockPrisma = new MockPrisma();
  }

  function setupGenericNockInterceptors() {
    mockAWSS3Endpoint();
  }

  function mockAWSS3Endpoint() {
    mockAWSS3.mockChangeLastProcessedBlockNumber();
    mockAWSS3.mockGetLastProcessedBlockNumber(7000000);
  }

  function cleanupNock() {
    nock.cleanAll();
  }
  function mockEthereumNodeResponses(
      syntheticEventFile: string,
      address?: string,
  ) {
    mockEthereumNode.mockChainId();
    mockEthereumNode.mockBlockNumber('0x5B8D86');
    mockEthereumNode.mockEventResponse(syntheticEventFile, address);
    mockEthereumNode.mockGetBalance('0x8AC7230489E80000');
    mockEthereumNode.setValueForETHCall(
        'asset',
        '0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    );
    mockEthereumNode.setValueForETHCall(
        'decimals',
        '0x0000000000000000000000000000000000000000000000000000000000000006',
    );
    mockEthereumNode.setValueForETHCall(
        'convertToAssets',
        '0x00000000000000000000000000000000000000000000000000000000000f0e8d',
    );
    mockEthereumNode.mockGetBlockByNumber();
    mockEthereumNode.mockEthCall();

    mockEthereumNodeAlt.mockChainId();
    mockEthereumNodeAlt.mockBlockNumber('0x5B8D86');
    mockEthereumNodeAlt.mockEventResponse(syntheticEventFile, address);
    mockEthereumNodeAlt.mockGetBalance('0x8AC7230489E80000');
    mockEthereumNodeAlt.mockEthCall();
    mockEthereumNodeAlt.setValueForETHCall(
        'asset',
        '0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    );
    mockEthereumNodeAlt.setValueForETHCall(
        'decimals',
        '0x0000000000000000000000000000000000000000000000000000000000000006',
    );
    mockEthereumNodeAlt.setValueForETHCall(
        'convertToAssets',
        '0x00000000000000000000000000000000000000000000000000000000000f0e8d',
    );
    mockEthereumNodeAlt.mockGetBlockByNumber();
  }

  async function runOneCycle() {
    const {logger, configService, mainRpcProvider, altRpcProvider} = await createDependencies();
    await run(logger, configService, mockPrisma as unknown as PrismaClient, mainRpcProvider, altRpcProvider);
  }
});
