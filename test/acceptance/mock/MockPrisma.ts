/* eslint-disable @typescript-eslint/ban-ts-comment */
import {PrismaClient} from '@prisma/client';

export default class MockPrisma extends PrismaClient {
  constructor() {
    super({
      datasources: {
        db: {
          url: 'postgres://localhost:5432/testdb',
        },
      },
    });
  }

  // @ts-expect-error
  public openLeverage = {
    create: () => {
      return Promise.resolve({});
    },
  };

  // @ts-expect-error
  public closeLeverage = {
    create: () => {
      return Promise.resolve({});
    },
  };

  // @ts-expect-error
  public liquidateLeverage = {
    create: () => {
      return Promise.resolve({});
    },
  };

  // @ts-expect-error
  public expireLeverage = {
    create: () => {
      return Promise.resolve({});
    },
  };

  // @ts-expect-error
  public leveragePosition = {
    create: () => {
      console.log('HERE!');
      return Promise.resolve({});
    },
    update: () => Promise.resolve({}),
  };

  // @ts-expect-error
  public executorBalances = {
    upsert: () => Promise.resolve({}),
    findMany: () => Promise.resolve([]),
  };
}
