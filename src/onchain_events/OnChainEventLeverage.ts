import {OnChainEvent} from './OnChainEvent';
import {Logger, SQSService} from '@thisisarchimedes/backend-sdk';
import {ConfigService} from '../services/config/ConfigService';
import {EventFetcherLogEntryMessage} from '../types/NewRelicLogEntry';

export abstract class OnChainEventLeverage extends OnChainEvent {
  protected nftId!: number;
  protected collateralAmount!: bigint;
  protected borrowedAmount!: bigint;

  protected positionExpireBlock!: number;
  protected sharesReceived!: bigint;

  constructor(logger: Logger, sqsService: SQSService, configService: ConfigService) {
    super(logger, sqsService, configService);
  }

  public process(): void {
    this.logLeverageEvent();
    // ADD SQS
  }

  private logLeverageEvent(): void {
    const eventDetails: EventFetcherLogEntryMessage = {
      event: this.eventName,
      user: this.userAddress,
      strategy: this.strategyConfig.strategyName,
      depositAmount: this.collateralAmount.toString(),
      borrowedAmount: this.borrowedAmount.toString(),
    };

    this.logger.info(JSON.stringify(eventDetails));
  }
}
