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

chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('Event Processor Service', function () {
  let mockContract: Contract;
  let eventProcessorService: EventProcessorService;
  let s3Stub: sinon.SinonStubbedInstance<S3Service>;
  let sqsStub: sinon.SinonStubbedInstance<SQSService>;
  let loggerStub: sinon.SinonStubbedInstance<Logger>;
  let provider: any;

  beforeEach(async function () {
    provider = new ethers.providers.JsonRpcProvider();
    const signer = provider.getSigner();

    const MockContractFactory = await ethers.getContractFactory(
      'LeverageEngine_mock',
    );
    mockContract = await MockContractFactory.deploy();
    await mockContract.deployed();

    s3Stub = sinon.createStubInstance(S3Service);
    s3Stub.getObject.resolves();
    s3Stub.putObject.resolves(undefined);

    sqsStub = sinon.createStubInstance(SQSService);
    sqsStub.sendMessage.resolves(undefined);

    loggerStub = sinon.createStubInstance(Logger);

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

  it('should process openPosition event and push messages to SQS', async function () {
    // emit PositionOpened(
    //   _nftID,
    //   _user,
    //   _strategy,
    //   _collateralAmount,
    //   _wbtcToBorrow,
    //   _positionExpireBlock,
    //   _sharesReceived,
    //   _liquidationBuffer
    // );

    const tx = await mockContract.openPosition(
      1,
      ethers.constants.AddressZero,
      ethers.constants.AddressZero,
      1,
      1,
      1,
      1,
      1,
    );

    await tx.wait();

    await eventProcessorService.execute();
    console.log('Args:', sqsStub.sendMessage.args);

    expect(sqsStub.sendMessage).to.have.been.calledOnceWith(
      'test-queue-url',
      '{"name":"PositionOpened","txHash":"0xb9a25aef78580d06027a723db58b26e7545f5e5a3a72d4b4de9ddc60fbadd5b2","blockNumber":2,"data":{"nftID":"1","user":"0x0000000000000000000000000000000000000000","strategy":"0x0000000000000000000000000000000000000000","collateralAmount":"1","wbtcToBorrow":"1","positionExpireBlock":"1","sharesReceived":"1","liquidationBuffer":"1"}}',
    );
  });

  it('should process closePosition event and push messages to SQS', async function () {
    //  emit PositionClosed(
    //   _nftID,
    //   _user,
    //   _strategy,
    //   _receivedAmount,
    //   _wbtcDebtAmount,
    //   _exitFee
    // );

    const tx = await mockContract.closePosition(
      1,
      ethers.constants.AddressZero,
      ethers.constants.AddressZero,
      1,
      1,
      1,
    );

    await tx.wait();

    await eventProcessorService.execute();

    expect(sqsStub.sendMessage).to.have.been.calledOnceWith(
      'test-queue-url',
      '{"name":"PositionClosed","txHash":"0xcb1a7fef9966982310879c6dbffb28ef700db06f7531ed2c0cc7631757f3f89b","blockNumber":4,"data":{"nftID":"1","user":"0x0000000000000000000000000000000000000000","strategy":"0x0000000000000000000000000000000000000000","receivedAmount":"1","wbtcDebtAmount":"1","exitFee":"1"}}',
    );
  });

  afterEach(() => {
    sinon.restore();
  });
});
