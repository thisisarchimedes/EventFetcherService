import {
  S3Service,
  Logger,
} from '@thisisarchimedes/backend-sdk';
import {
  ClaimEvent,
  ClosePositionEvent,
  ExpirePositionEvent,
  LiquidatePositionEvent,
  OpenPositionEvent,
} from './types/LedgerBuilder';
import {MultiPoolStrategies} from './MultiPoolStrategies';
import {LeveragePosition, PrismaClient} from '@prisma/client';
import {EventFetcherMessage} from './types/EventFetcherMessage';
import {ethers} from 'ethers';

const WBTC_DECIMALS = 8;

type EventProcessor = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: (event: any) => Promise<boolean>;
};

export class LedgerBuilder {
  private readonly s3Service: S3Service;
  private readonly GENERIC_NFT_SOURCE = `Generic.png`;

  constructor(
      private readonly logger: Logger,
      private readonly alchemyProvider: ethers.providers.JsonRpcProvider,
      private readonly infuraProvider: ethers.providers.JsonRpcProvider,
      private readonly prisma: PrismaClient,
      private readonly multiPoolStrategies: MultiPoolStrategies,
  ) {
    this.s3Service = new S3Service();
  }

  async processEvents(events: EventFetcherMessage[]): Promise<void> {
    const eventProcessors: EventProcessor = {
      'PositionOpened': this.processOpenPositionEvent,
      'PositionClosed': this.processClosePosition,
      'PositionLiquidated': this.processLiquidatePosition,
      'PositionExpired': this.processExpirePosition,
      'Claim': this.processClaimEvent,
    };

    try {
      for (const event of events) {
        this.logger.info(`Received event: ${JSON.stringify(event)}`);
        let eventProcessed = false;

        const processor = eventProcessors[event.name as keyof typeof eventProcessors];
        if (processor) {
          eventProcessed = await processor.call(this, event);
        } else {
          this.logger.warning('Unknown event type');
        }

        if (eventProcessed) {
          this.logger.info('Successfully processed event ');
        }
      }
    } catch (err) {
      this.logger.error((err as Error).message.toString());
    } finally {
      await this.logger.flush();
    }
  }

  async processOpenPositionEvent(event: OpenPositionEvent): Promise<boolean> {
    this.logger.info('Processing open position event');
    const strategyData = await this.multiPoolStrategies.fetchStrategyData(
        event.data.strategy,
    );
    const openPosition = await this.prisma.openLeverage.findFirst({
      where: {
        txHash: event.txHash,
        nftId: BigInt(event.data.nftId),
      },
    });

    if (openPosition) {
      this.logger.info('Open Position already exists');
      return true;
    }
    try {
      this.logger.info('Appending event to DB');

      await this.prisma.openLeverage.create({
        data: {
          txHash: event.txHash,
          blockNumber: event.blockNumber,
          nftId: BigInt(event.data.nftId),
          user: event.data.user.toLowerCase(),
          strategy: event.data.strategy.toLowerCase(),
          collateralAmount: Number(
              ethers.utils.formatUnits(event.data.collateralAmount, WBTC_DECIMALS),
          ),
          wbtcToBorrow: Number(
              ethers.utils.formatUnits(event.data.wbtcToBorrow, WBTC_DECIMALS),
          ),
          positionExpireBlock: Number(event.data.positionExpireBlock),
          receivedShares: Number(
              ethers.utils.formatUnits(
                  event.data.sharesReceived,
                  strategyData.assetDecimals,
              ),
          ),
        },
      });
    } catch (e) {
      this.logger.error((e as Error).message.toString());
      return false;
    }
    const leveragePosition = await this.prisma.leveragePosition.findFirst({
      where: {
        nftId: BigInt(event.data.nftId),
      },
    });
    if (leveragePosition) {
      this.logger.info('Leverage Position already exists');
      return true;
    }
    let blockTimestamp = (
      await this.alchemyProvider.getBlock(event.blockNumber)
    )?.timestamp;
    // if alchemy fails check with infura
    if (!blockTimestamp) {
      const infuraBlock = await this.infuraProvider.getBlock(
          event.blockNumber,
      );
      if (infuraBlock) {
        blockTimestamp = infuraBlock.timestamp;
      }
    }
    if (!blockTimestamp) {
      this.logger.info('Could not get block timestamp');
      return false;
    }

    const assetPriceInBTC =
      await this.multiPoolStrategies.fetchStrategyAssetPriceInBTC(
          strategyData.underlyingAsset,
      );
    const currentPositionValue =
      Number(
          ethers.utils.formatUnits(
              strategyData.assetPerShare,
              strategyData.assetDecimals,
          ),
      ) *
      Number(
          ethers.utils.formatUnits(
              event.data.sharesReceived,
              strategyData.assetDecimals,
          ),
      ) *
      assetPriceInBTC;
    try {
      const newLeveragePositionInstance =
        await this.prisma.leveragePosition.create({
          data: {
            nftId: BigInt(event.data.nftId),
            user: event.data.user.toLowerCase(),
            strategy: event.data.strategy.toLowerCase(),
            collateralAmount: Number(
                ethers.utils.formatUnits(event.data.collateralAmount, WBTC_DECIMALS),
            ),
            positionExpireBlock: Number(
                event.data.positionExpireBlock,
            ),
            strategyShares: Number(
                ethers.utils.formatUnits(
                    event.data.sharesReceived,
                    strategyData.assetDecimals,
                ),
            ),
            debtAmount: Number(
                ethers.utils.formatUnits(event.data.wbtcToBorrow, WBTC_DECIMALS),
            ),
            positionState: 'LIVE',
            timestamp: blockTimestamp,
            currentPositionValue: currentPositionValue,
            blockNumber: event.blockNumber,
          },
        });

      // Generate NFT Position Image
      await this.generateNFTImage(newLeveragePositionInstance); // Doesn't throw errors
    } catch (e) {
      this.logger.error((e as Error).message.toString());
      return false;
    }

    return true;
  }

  async processClosePosition(event: ClosePositionEvent): Promise<boolean> {
    const closePosition = await this.prisma.closeLeverage.findFirst({
      where: {
        txHash: event.txHash,
        nftId: BigInt(event.data.nftId),
      },
    });

    if (closePosition) {
      this.logger.info('Close Position already exists');
      return true;
    }
    try {
      await this.prisma.closeLeverage.create({
        data: {
          txHash: event.txHash,
          blockNumber: event.blockNumber,
          nftId: BigInt(event.data.nftId),
          user: event.data.user.toLowerCase(),
          receivedAmount: Number(
              ethers.utils.formatUnits(event.data.receivedAmount, WBTC_DECIMALS),
          ),
          wbtcDebtAmount: Number(
              ethers.utils.formatUnits(event.data.wbtcDebtAmount, WBTC_DECIMALS),
          ),
        },
      });
    } catch (e) {
      this.logger.error((e as Error).message.toString());
      return false;
    }
    const leveragePosition = await this.prisma.leveragePosition.findFirst({
      where: {
        nftId: BigInt(event.data.nftId),
      },
    });

    if (!leveragePosition) {
      this.logger.error('Could not find leverage position');
      return false;
    }
    try {
      await this.prisma.leveragePosition.update({
        where: {
          id: leveragePosition.id,
        },
        data: {
          positionState: 'CLOSED',
          currentPositionValue: 0,
        },
      });
    } catch (e) {
      this.logger.error((e as Error).message.toString());
      return false;
    }
    return true;
  }

  async processLiquidatePosition(
      event: LiquidatePositionEvent,
  ): Promise<boolean> {
    const liquidatePosition = await this.prisma.liquidateLeverage.findFirst(
        {
          where: {
            txHash: event.txHash,
            nftId: BigInt(event.data.nftId),
          },
        },
    );
    if (liquidatePosition) {
      this.logger.error('Liquidate Position already exists');
      return true;
    }
    try {
      await this.prisma.liquidateLeverage.create({
        data: {
          txHash: event.txHash,
          blockNumber: event.blockNumber,
          nftId: BigInt(event.data.nftId),
          strategy: event.data.strategy.toLowerCase(),
          claimableAmount: Number(
              ethers.utils.formatUnits(event.data.claimableAmount, WBTC_DECIMALS),
          ),
          wbtcDebtPaid: Number(
              ethers.utils.formatUnits(event.data.wbtcDebtPaid, WBTC_DECIMALS),
          ),
          liquidationFee: Number(
              ethers.utils.formatUnits(event.data.liquidationFee, WBTC_DECIMALS),
          ),
        },
      });
    } catch (e) {
      this.logger.error((e as Error).message.toString());
      return false;
    }

    const leveragePosition = await this.prisma.leveragePosition.findFirst({
      where: {
        nftId: BigInt(event.data.nftId),
      },
    });

    if (!leveragePosition) {
      this.logger.info('Could not find leverage position');
      return false;
    }

    try {
      await this.prisma.leveragePosition.update({
        where: {
          id: leveragePosition.id,
        },
        data: {
          positionState: 'LIQUIDATED',
          currentPositionValue: 0,
          claimableAmount: Number(
              ethers.utils.formatUnits(event.data.claimableAmount, WBTC_DECIMALS),
          ),
          strategyShares: 0,
        },
      });
    } catch (e) {
      this.logger.error((e as Error).message.toString());
      return false;
    }

    // send a log to new relic
    this.logger.warning(
        `Liquidation position Event:
            - NFT ID: ${event.data.nftId}
            - Strategy Address: ${event.data.strategy}
            - WBTC Debt Paid: ${event.data.wbtcDebtPaid}
            - Claimable Amount: ${event.data.claimableAmount}
            - Liquidation Fee: ${event.data.liquidationFee}
            - Transaction Hash: ${event.txHash}
            - Block Number: ${event.blockNumber}`,
    );

    return true;
  }
  async processClaimEvent(event: ClaimEvent) {
    const leveragePosition = await this.prisma.leveragePosition.findFirst({
      where: {
        nftId: BigInt(event.data.nftId),
      },
    });

    if (!leveragePosition) {
      this.logger.info('Could not find leverage position');
      return false;
    }
    try {
      await this.prisma.leveragePosition.update({
        where: {
          id: leveragePosition.id,
        },
        data: {
          claimableAmount: Number(0),
        },
      });

      return true;
    } catch (e) {
      this.logger.error((e as Error).message.toString());
      return false;
    }
  }

  async processExpirePosition(event: ExpirePositionEvent) {
    const expirePosition = await this.prisma.expireLeverage.findFirst({
      where: {
        txHash: event.txHash,
        nftId: BigInt(event.data.nftId),
      },
    });

    if (expirePosition) {
      this.logger.info('Expire Position already exists');
      return true;
    }
    try {
      await this.prisma.expireLeverage.create({
        data: {
          txHash: event.txHash,
          blockNumber: event.blockNumber,
          nftId: BigInt(event.data.nftId),
          user: event.data.user.toLowerCase(),
          claimableAmount: Number(
              ethers.utils.formatUnits(event.data.claimableAmount, WBTC_DECIMALS),
          ),
        },
      });
    } catch (e) {
      this.logger.error((e as Error).message.toString());
      return false;
    }
    const leveragePosition = await this.prisma.leveragePosition.findFirst({
      where: {
        nftId: BigInt(event.data.nftId),
      },
    });

    if (!leveragePosition) {
      this.logger.info('Could not find leverage position');
      return false;
    }
    try {
      await this.prisma.leveragePosition.update({
        where: {
          id: leveragePosition.id,
        },
        data: {
          positionState: 'EXPIRED',
          currentPositionValue: 0,
          claimableAmount: Number(
              ethers.utils.formatUnits(event.data.claimableAmount, WBTC_DECIMALS),
          ),
        },
      });
    } catch (e) {
      this.logger.error((e as Error).message.toString());
      return false;
    }

    // send a log to new relic
    this.logger.warning(
        `Expired position Event:
            - NFT ID: ${event.data.nftId}
            - User: ${event.data.user}
            - Claimable Amount: ${event.data.claimableAmount}
            - Transaction Hash: ${event.txHash}
            - Block Number: ${event.blockNumber}`,
    );

    return true;
  }

  async generateNFTImage(
      leveragePosition: LeveragePosition,
  ): Promise<string> {
    const newKey = `${leveragePosition.nftId.toString()}.png`;

    try {
      await this.s3Service.copyObject(
        process.env.S3_NFTS_BUCKET!, // sourceBucket
        encodeURI(
            `/${process.env.S3_NFTS_BUCKET!}/${this.GENERIC_NFT_SOURCE
            }`,
        ), // sourceKey
        process.env.S3_NFTS_BUCKET!, // destinationBucket
        newKey, // destinationKey
      );
    } catch (e) {
      this.logger.error((e as Error).message.toString());
    }

    return `${process.env.S3_NFTS_BUCKET}/${newKey}`;
  }
}
