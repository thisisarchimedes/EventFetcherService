import {ethers} from 'ethers';

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

  protected setStrategyConfigFromEventLogTopic(eventLog: ethers.providers.Log, addressTopicIndex: number): void {
    const rawAddress = eventLog.topics[addressTopicIndex];
    const trimmedAddress = '0x' + rawAddress.slice(26);
    const strategyAddress = ethers.utils.getAddress(trimmedAddress);

    this.strategyConfig = this.findStrategyConfigBStrategyAddress(strategyAddress);
  }

  private sendSqsLeverageEvent(): void {
    const sqsMessage = JSON.stringify(this.getSQSMessage());
    const queueUrl = this.configService.getEventQueueURL();
    this.sqsService.sendMessage(queueUrl, sqsMessage);
  }
}
