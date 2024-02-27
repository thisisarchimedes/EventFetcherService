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
});
