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

    console.log('MockContract deployed to:', mockContract.address);

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

    expect(sqsStub.sendMessage).to.have.been.calledOnce;
  });

  it('should process closePosition event and push messages to SQS', async function () {
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

    expect(sqsStub.sendMessage).to.have.been.calledOnce;
  });

  afterEach(() => {
    sinon.restore();
  });
});
