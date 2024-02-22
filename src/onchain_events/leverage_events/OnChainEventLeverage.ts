import { OnChainEvent } from '../OnChainEvent';
import { Logger, SQSService } from '@thisisarchimedes/backend-sdk';
import { ConfigService } from '../../services/config/ConfigService';
import { EventFetcherLogEntryMessage } from '../../types/NewRelicLogEntry';
import { SQSMessage } from '../../types/SQSMessage';

export abstract class OnChainEventLeverage extends OnChainEvent {
  protected nftId!: number;
  protected borrowedAmount!: bigint;

  protected positionExpireBlock!: number;
  protected sharesReceived!: bigint;

  public process(): void {
    this.logLeverageEvent();
    this.sendSqsLeverageEvent();
  }

  protected abstract getSQSMessage(): SQSMessage;

  private logLeverageEvent(): void {
    const eventDetails: EventFetcherLogEntryMessage = {
      event: this.eventName,
      user: this.userAddress,
      strategy: this.strategyConfig.strategyName,
      depositAmount: this.depositAmount.toString(),
      borrowedAmount: this.borrowedAmount.toString(),
    };

    this.logger.info(JSON.stringify(eventDetails));
  }

  private sendSqsLeverageEvent(): void {
    const sqsMessage = JSON.stringify(this.getSQSMessage());
    const queueUrl = this.configService.getEventQueueURL();
    this.sqsService.sendMessage(queueUrl, sqsMessage);
  }
}
