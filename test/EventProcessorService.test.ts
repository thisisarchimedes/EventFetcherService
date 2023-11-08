import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Contract } from 'ethers';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';
import { SQSService } from '../src/services/sqsService';
import { S3Service } from '../src/services/s3Service';
import { Logger } from '../src/logger/logger';
import { EventProcessorService } from '../src/EventProcessorService';

// Set up Chai to use the sinonChai and chaiAsPromised plugins
chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('Event Processor Service', function () {
  let mockContract: Contract;
  let eventProcessorService: EventProcessorService;
  let s3Stub: sinon.SinonStubbedInstance<S3Service>;
  let sqsStub: sinon.SinonStubbedInstance<SQSService>;
  let loggerStub: sinon.SinonStubbedInstance<Logger>;
  let provider: any;

  // This runs before each individual test
  beforeEach(async function () {
    // Create a new JSON RPC provider from ethers
    provider = new ethers.providers.JsonRpcProvider();

    // Deploy a mock contract for the tests
    const MockContractFactory = await ethers.getContractFactory(
      'LeverageEngine_mock',
    );
    mockContract = await MockContractFactory.deploy();
    await mockContract.deployed();

    // Stub the S3Service and SQSService and their methods
    s3Stub = sinon.createStubInstance(S3Service);
    s3Stub.getObject.resolves();
    s3Stub.putObject.resolves(undefined);

    sqsStub = sinon.createStubInstance(SQSService);
    sqsStub.sendMessage.resolves(undefined);

    // Stub the Logger
    loggerStub = sinon.createStubInstance(Logger);

    // Initialize the EventProcessorService with the stubs and mock contract
    eventProcessorService = new EventProcessorService(
      ethers.provider,
      ethers.provider,
      s3Stub,
      sqsStub,
      loggerStub,
      {
        S3_BUCKET: 'test-bucket',
        S3_KEY: 'test-key',
        SQS_QUEUE_URL: 'test-queue-url',
        PAGE_SIZE: 1000,
        CONTRACT_ADDRESS: mockContract.address,
      },
    );
  });

  // Test case for processing the openPosition event
  it('should process openPosition event and push messages to SQS', async function () {
    // Generate random data to simulate a real-world scenario
    const nftID = Math.floor(Math.random() * 1000);
    const user = ethers.Wallet.createRandom().address;
    const strategy = ethers.Wallet.createRandom().address;
    const collateralAmount = Math.floor(Math.random() * 1000);
    const wbtcToBorrow = Math.floor(Math.random() * 1000);
    const positionExpireBlock = Math.floor(Math.random() * 1000);
    const sharesReceived = Math.floor(Math.random() * 1000);
    const liquidationBuffer = Math.floor(Math.random() * 1000);

    // Call the openPosition function on the mock contract with random values
    const tx = await mockContract.openPosition(
      nftID,
      user,
      strategy,
      collateralAmount,
      wbtcToBorrow,
      positionExpireBlock,
      sharesReceived,
      liquidationBuffer,
    );

    // Wait for the transaction to be mined
    await tx.wait();

    // Execute the event processor function
    await eventProcessorService.execute();

    // Define the expected message that should be sent to SQS
    const expectedMessage = {
      name: 'PositionOpened',
      txHash: tx.hash,
      blockNumber: tx.blockNumber,
      data: {
        nftID: nftID.toString(),
        user: user,
        strategy: strategy,
        collateralAmount: collateralAmount.toString(),
        wbtcToBorrow: wbtcToBorrow.toString(),
        positionExpireBlock: positionExpireBlock.toString(),
        sharesReceived: sharesReceived.toString(),
        liquidationBuffer: liquidationBuffer.toString(),
      },
    };

    // Assert that the SQS service's sendMessage function was called correctly
    expect(sqsStub.sendMessage).to.have.been.calledOnceWith(
      'test-queue-url',
      JSON.stringify(expectedMessage),
    );
  });

  // Additional test cases would follow here, each with their setup, actions, and assertions...

  // This runs after each individual test to reset the sandboxed environment
  afterEach(() => {
    sinon.restore();
  });
});
