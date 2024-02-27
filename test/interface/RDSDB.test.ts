import {expect} from 'chai';
import {PrismaClient} from '@prisma/client';

describe('RDS DB with Prisma', function() {
  let prisma: PrismaClient;

  beforeEach(function() {
    prisma = new PrismaClient();
  });

  it('should read from RDS DB', async function() {
    const openPosition = await prisma.openLeverage.findFirst({
      where: {
        nftId: BigInt(1),
      },
    });

    expect(openPosition).to.not.be.null;
    expect(openPosition?.nftId).to.equal(BigInt(1));
  });

  it('should write to RDS DB', async function() {
    await prisma.openLeverage.create({
      data: {
        txHash: '0x123',
        blockNumber: 600000,
        nftId: BigInt(139489340),
        user: '0x123',
        strategy: '0x123',
        collateralAmount: Number(1),
        wbtcToBorrow: Number(1),
        positionExpireBlock: Number(600000),
        receivedShares: Number(1),
      },
    });

    const openPosition = await prisma.openLeverage.findFirst({
      where: {
        nftId: BigInt(139489340),
      },
    });

    expect(openPosition).to.not.be.null;
    expect(openPosition?.nftId).to.equal(BigInt(139489340));

    await prisma.openLeverage.delete({
      where: {
        id: openPosition?.id,
      },
    });
  });
});
