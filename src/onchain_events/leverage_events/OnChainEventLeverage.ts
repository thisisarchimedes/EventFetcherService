import {OnChainEvent} from '../OnChainEvent';
import {Logger, SQSService} from '@thisisarchimedes/backend-sdk';
import {ConfigService} from '../../services/config/ConfigService';
import {EventFetcherLogEntryMessage} from '../../types/NewRelicLogEntry';
import {SQSMessage} from '../../types/SQSMessage';
import {ethers} from 'ethers';

export abstract class OnChainEventLeverage extends OnChainEvent {
  protected nftId!: number;

  public process(): void {
    this.logLeverageEvent();
    this.sendSqsLeverageEvent();
  }

  protected abstract getSQSMessage(): SQSMessage;
  protected abstract logLeverageEvent(): void;

  private sendSqsLeverageEvent(): void {
    const sqsMessage = JSON.stringify(this.getSQSMessage());
    const queueUrl = this.configService.getEventQueueURL();
    this.sqsService.sendMessage(queueUrl, sqsMessage);
  }
}
