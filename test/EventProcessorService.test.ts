import { S3Service, SQSService, Logger } from '@thisisarchimedes/backend-sdk';

import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Contract } from 'ethers';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';

import { EventProcessorService } from '../src/EventProcessorService';

// Set up Chai to use the sinonChai and chaiAsPromised plugins
chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('Event Processor Service', function () {
  let positionOpenerMockContract: Contract;
  let positionCloserMockContract: Contract;
  let positionLiquidatorMockContract: Contract;

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

    // Initialize the EventProcessorService with the stubs and mock contract
    eventProcessorService = new EventProcessorService(
      ethers.provider,
      ethers.provider,
      s3Stub,
      sqsStub,
      loggerStub,
      {
        enviroment: 'local',
        positionOpenerAddress: positionOpenerMockContract.address,
        positionCloserAddress: positionCloserMockContract.address,
        positionLiquidatorAddress: positionLiquidatorMockContract.address,
        S3_LAST_BLOCK_KEY: '',
        S3_BUCKET: 'test-bucket',
        rpcAddress: '',
        alternateRpcAddress: '',
        NEW_EVENTS_QUEUE_URL: 'test-queue-url',
        EVENTS_FETCH_PAGE_SIZE: 1000,
      },
    );
  });

  // Test case for processing the openPosition event
  it('should process openPosition event and push messages to SQS', async function () {
    // Generate random data to simulate a real-world scenario
    const nftId = Math.floor(Math.random() * 1000);
    const user = ethers.Wallet.createRandom().address;
    const strategy = ethers.Wallet.createRandom().address;
    const collateralAmount = Math.floor(Math.random() * 1000);
    const wbtcToBorrow = Math.floor(Math.random() * 1000);
    const positionExpireBlock = Math.floor(Math.random() * 1000);
    const sharesReceived = Math.floor(Math.random() * 1000);

    // Call the openPosition function on the mock contract with random values
    const tx = await positionOpenerMockContract.openPosition(
      nftId,
      user,
      strategy,
      collateralAmount,
      wbtcToBorrow,
      positionExpireBlock,
      sharesReceived,
    );

    // Wait for the transaction to be mined
    await tx.wait();

    // Execute the event processor function
    await eventProcessorService.execute();

    // Define the expected message that should be sent to SQS
    const expectedMessage = {
      name: 'PositionOpened',
      contractType: 0,
      txHash: tx.hash,
      blockNumber: tx.blockNumber,
      data: {
        nftId: nftId.toString(),
        user: user,
        strategy: strategy,
        collateralAmount: collateralAmount.toString(),
        wbtcToBorrow: wbtcToBorrow.toString(),
        positionExpireBlock: positionExpireBlock.toString(),
        sharesReceived: sharesReceived.toString(),
      },
    };

    // Assert that the SQS service's sendMessage function was called correctly
    expect(sqsStub.sendMessage).to.have.been.calledOnceWith(
      'test-queue-url',
      JSON.stringify(expectedMessage),
    );
  });

  it('should process closePosition event and push messages to SQS', async function () {
    const nftID = Math.floor(Math.random() * 1000);
    const user = ethers.Wallet.createRandom().address;
    const receivedAmount = Math.floor(Math.random() * 1000);
    const wbtcDebtAmount = Math.floor(Math.random() * 1000);

    const tx = await positionCloserMockContract.closePosition(
      nftID,
      user,
      receivedAmount,
      wbtcDebtAmount,
    );

    await tx.wait();

    await eventProcessorService.execute();

    const expectedMessage = {
      name: 'PositionClosed',
      contractType: 1,
      txHash: tx.hash,
      blockNumber: tx.blockNumber,
      data: {
        nftId: nftID.toString(),
        user: user,
        receivedAmount: receivedAmount.toString(),
        wbtcDebtAmount: wbtcDebtAmount.toString(),
      },
    };

    expect(sqsStub.sendMessage).to.have.been.calledOnceWith(
      'test-queue-url',
      JSON.stringify(expectedMessage),
    );
  });

  // Test case for processing the openPosition event
  it('should process liquidatePosition event and push messages to SQS', async function () {
    // Generate random data to simulate a real-world scenario
    const nftId = Math.floor(Math.random() * 1000);
    const strategy = ethers.Wallet.createRandom().address;
    const _wbtcDebtPaid = Math.floor(Math.random() * 1000);
    const _claimableAmount = Math.floor(Math.random() * 1000);
    const _liquidationFee = Math.floor(Math.random() * 1000);

    // Call the openPosition function on the mock contract with random values
    const tx = await positionLiquidatorMockContract.liquidatePosition(
      nftId,
      strategy,
      _wbtcDebtPaid,
      _claimableAmount,
      _liquidationFee,
    );

    // Wait for the transaction to be mined
    await tx.wait();

    // Execute the event processor function
    await eventProcessorService.execute();

    // Define the expected message that should be sent to SQS
    const expectedMessage = {
      name: 'PositionLiquidated',
      contractType: 2,
      txHash: tx.hash,
      blockNumber: tx.blockNumber,
      data: {
        nftId: nftId.toString(),
        strategy: strategy,
        wbtcDebtPaid: _wbtcDebtPaid.toString(),
        claimableAmount: _claimableAmount.toString(),
        liquidationFee: _liquidationFee.toString(),
      },
    };

    // Assert that the SQS service's sendMessage function was called correctly
    expect(sqsStub.sendMessage).to.have.been.calledOnceWith(
      'test-queue-url',
      JSON.stringify(expectedMessage),
    );
  });

  it('should log liquidation events correctly', async function () {
    // Generate random data to simulate a real-world scenario
    const nftId = Math.floor(Math.random() * 1000);
    const strategy = ethers.Wallet.createRandom().address;
    const wbtcDebtPaid = Math.floor(Math.random() * 1000);
    const claimableAmount = Math.floor(Math.random() * 1000);
    const liquidationFee = Math.floor(Math.random() * 1000);

    // Call the liquidatePosition function on the mock contract with random values
    const tx = await positionLiquidatorMockContract.liquidatePosition(
      nftId,
      strategy,
      wbtcDebtPaid,
      claimableAmount,
      liquidationFee,
    );

    // Wait for the transaction to be mined
    await tx.wait();

    // Execute the event processor function
    await eventProcessorService.execute();

    // Define the expected log message format
    const expectedLogMessage =
      `Liquidation Event:\n` +
      `  - NFT ID: ${nftId}\n` +
      `  - Strategy Address: ${strategy}\n` +
      `  - WBTC Debt Paid: ${wbtcDebtPaid}\n` +
      `  - Claimable Amount: ${claimableAmount}\n` +
      `  - Liquidation Fee: ${liquidationFee}\n` +
      `  - Transaction Hash: ${tx.hash}\n` +
      `  - Block Number: ${tx.blockNumber}`;

    // Assert that the logger.info function was called with the expected log message
    expect(loggerStub.info).to.have.been.calledWithMatch(
      sinon.match(
        new RegExp(
          `Liquidation Event:\\s*- NFT ID: ${nftId}\\s*- Strategy Address: ${strategy}`,
        ),
      ),
    );
  });

  afterEach(() => {
    sinon.restore();
  });
});
