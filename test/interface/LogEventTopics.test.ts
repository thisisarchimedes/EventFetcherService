import {expect} from 'chai';
import {ethers} from 'hardhat';
import {Contract} from 'ethers';

import {
  TOPIC_EVENT_LEVERAGE_POSITION_CLOSED,
  TOPIC_EVENT_LEVERAGE_POSITION_OPENED,
  TOPIC_EVENT_LEVERAGE_POSITION_LIQUIDATED,
  TOPIC_EVENT_PSP_DEPOSIT,
  TOPIC_EVENT_PSP_WITHDRAW,
} from '../../src/onchain_events/EventTopic';


describe('Events Catching and logging', function() {
  let nftId: number;
  let user: string;
  let strategy: string;
  let collateralAmount: number;
  let wbtcToBorrow: number;
  let positionExpireBlock: number;
  let sharesReceived: number;

  beforeEach(function() {
    generateMockParam();
  });

  it('should have the expected topic[0] for PositionOpened event', async function() {
    const positionOpenerMockContract: Contract = await deployMockContract('PositionOpener_mock');

    const tx = await positionOpenerMockContract.openPosition(
        nftId,
        user,
        strategy,
        collateralAmount,
        wbtcToBorrow,
        positionExpireBlock,
        sharesReceived,
    );

    const receipt = await tx.wait();
    const topics = receipt.logs[0].topics;

    expect(topics[0]).to.equal(TOPIC_EVENT_LEVERAGE_POSITION_OPENED);
  });

  it('should have the expected topic[0] for PositionClosed event', async function() {
    const positionCloserMockContract: Contract = await deployMockContract('PositionCloser_mock');

    const tx = await positionCloserMockContract.closePosition(
        nftId,
        user,
        collateralAmount,
        wbtcToBorrow,
    );

    const receipt = await tx.wait();
    const topics = receipt.logs[0].topics;

    expect(topics[0]).to.equal(TOPIC_EVENT_LEVERAGE_POSITION_CLOSED);
  });

  it('should have the expected topic[0] for PositionLiquidated event', async function() {
    const positionLiquidatorMockContract: Contract = await deployMockContract('PositionLiquidator_mock');

    const tx = await positionLiquidatorMockContract.liquidatePosition(
        nftId,
        user,
        collateralAmount,
        wbtcToBorrow,
        sharesReceived,
    );

    const receipt = await tx.wait();
    const topics = receipt.logs[0].topics;

    expect(topics[0]).to.equal(TOPIC_EVENT_LEVERAGE_POSITION_LIQUIDATED);
  });


  function generateMockParam() {
    nftId = Math.floor(Math.random() * 1000);
    user = ethers.Wallet.createRandom().address;
    strategy = ethers.Wallet.createRandom().address;
    collateralAmount = Math.floor(Math.random() * 1000);
    wbtcToBorrow = Math.floor(Math.random() * 1000);
    positionExpireBlock = Math.floor(Math.random() * 1000);
    sharesReceived = Math.floor(Math.random() * 1000);
  }

  async function deployMockContract(name: string) {
    const factory = await ethers.getContractFactory(name);
    const mockContract: Contract = await factory.deploy();
    await mockContract.deployed();

    return mockContract;
  }
});


/*

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

      const PositionExpiratorFactory = await ethers.getContractFactory(
          'PositionExpirator_mock',
      );

      positionExpiratorMockContract = await PositionExpiratorFactory.deploy();
      await positionExpiratorMockContract.deployed();

      const leverageContractAddresses = {
        positionOpenerAddress: positionOpenerMockContract.address,
        positionCloserAddress: positionCloserMockContract.address,
        positionLiquidatorAddress: positionLiquidatorMockContract.address,
        positionExpiratorAddress: positionExpiratorMockContract.address,
      };


const tx = await positionOpenerMockContract.openPosition(
    nftId,
    user,
    strategy,
    collateralAmount,
    wbtcToBorrow,
    positionExpireBlock,
    sharesReceived,
);
*/
