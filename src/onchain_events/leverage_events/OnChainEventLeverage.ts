import {OnChainEvent} from '../OnChainEvent';
import {EventFetcherSQSMessage} from '../../types/EventFetcherSQSMessage';

export abstract class OnChainEventLeverage extends OnChainEvent {
  protected nftId!: number;

  public process(): void {
    this.logLeverageEvent();
    this.sendSqsLeverageEvent();
  }

  protected abstract getSQSMessage(): EventFetcherSQSMessage;
  protected abstract logLeverageEvent(): void;

  private sendSqsLeverageEvent(): void {
    const sqsMessage = JSON.stringify(this.getSQSMessage());
    const queueUrl = this.configService.getEventQueueURL();
    this.sqsService.sendMessage(queueUrl, sqsMessage);
  }
}
