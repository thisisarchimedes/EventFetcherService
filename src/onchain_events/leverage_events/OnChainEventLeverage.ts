import {OnChainEvent} from '../OnChainEvent';
import {EventFetcherMessage} from '../../types/EventFetcherMessage';
import {ethers} from 'ethers';

export abstract class OnChainEventLeverage extends OnChainEvent {
  protected nftId!: number;

  public process(): EventFetcherMessage|undefined {
    this.logLeverageEvent();
    return this.getMessage();
  }

  protected abstract getMessage(): EventFetcherMessage;
  protected abstract logLeverageEvent(): void;

  protected setStrategyConfigFromEventLogTopic(eventLog: ethers.providers.Log, addressTopicIndex: number): void {
    const rawAddress = eventLog.topics[addressTopicIndex];
    const trimmedAddress = '0x' + rawAddress.slice(26);
    const strategyAddress = ethers.utils.getAddress(trimmedAddress);

    this.strategyConfig = {strategyName: strategyAddress};
  }
}
