import {OnChainEvent} from '../OnChainEvent';
import {EventFetcherMessage} from '../../types/EventFetcherSQSMessage';
import {ethers} from '@thisisarchimedes/backend-sdk';

export abstract class OnChainEventLeverage extends OnChainEvent {
  protected nftId!: number;

  public process(): EventFetcherMessage|undefined {
    this.logLeverageEvent();
    return this.getMessage();
  }

  protected abstract getMessage(): EventFetcherMessage;
  protected abstract logLeverageEvent(): void;

  protected setStrategyConfigFromEventLogTopic(eventLog: ethers.Log, addressTopicIndex: number): void {
    const rawAddress = eventLog.topics[addressTopicIndex];
    const trimmedAddress = '0x' + rawAddress.slice(26);
    const strategyAddress = ethers.getAddress(trimmedAddress);

    this.strategyConfig = this.findStrategyConfigBStrategyAddress(strategyAddress);
  }
}
