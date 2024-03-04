import dotenv from 'dotenv';
import {expect} from 'chai';
import nock from 'nock';

import {LoggerAdapter} from '../adapters/LoggerAdapter';
import {EventFetcherLogEntryMessagePSP} from '../../src/types/NewRelicLogEntry';
import {handler} from '../../src/lambda-handler';

import {MockEthereumNode} from './Mocks/MockEthereumNode';
import {MockNewRelic} from './Mocks/MockNewRelic';
import {MockSQS} from './Mocks/MockSQS';
import {MockAWSS3} from './Mocks/MockAWSS3';
import {ConfigServiceAWS} from '../../src/services/config/ConfigServiceAWS';
import {AppConfigClient} from '../../src/services/config/AppConfigClient';

dotenv.config();

const ENVIRONMENT = process.env.ENVIRONMENT!;
const AWS_REGION = process.env.AWS_REGION!;

describe('PSP Events', function() {
  let logger: LoggerAdapter;
  let mockEthereumNode: MockEthereumNode;
  let mockNewRelic: MockNewRelic;
  let mockSQS: MockSQS;
  let mockAWSS3: MockAWSS3;
  const config: ConfigServiceAWS = new ConfigServiceAWS(ENVIRONMENT, AWS_REGION);
  const appConfigClient: AppConfigClient = new AppConfigClient(ENVIRONMENT, AWS_REGION);

  // before(async function() {
  // });

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

    await handler(0, 0);

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

    await handler(0, 0);

    const expectedLog = createExpectedLogMessagePSPWithdraw();
    const actualLog = mockNewRelic.findMatchingLogEntry(logger);

    expect(actualLog).to.not.be.null;
    const res: boolean = validateLogMessage(actualLog as EventFetcherLogEntryMessagePSP, expectedLog);
    expect(res).to.be.true;
  });

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

  async function initalizeMocks() {
    logger = new LoggerAdapter('local_logger.txt');

    mockEthereumNode = new MockEthereumNode('http://ec2-52-4-114-208.compute-1.amazonaws.com:8545');

    const newRelicApiUrl: string = 'https://log-api.newrelic.com';
    mockNewRelic = new MockNewRelic(newRelicApiUrl, logger);

    mockSQS = new MockSQS('https://sqs.us-east-1.amazonaws.com/');

    const {bucket} = JSON.parse(await appConfigClient.fetchConfigRawString('LastBlockScannedS3FileURL'));

    mockAWSS3 = new MockAWSS3(bucket, AWS_REGION);
  }

  function setupGenericNockInterceptors() {
    mockNewRelicLogEndpoint();
    mockAWSS3Endpoint();
    mockSQSEndpoint();
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

  function mockSQSEndpoint() {
    mockSQS.mockSQSSendMessage();
  }

  function cleanupNock() {
    nock.cleanAll();
  }
});
