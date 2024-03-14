import {Logger} from '@thisisarchimedes/backend-sdk';
import {OnChainEvent} from '../OnChainEvent';
import {ConfigService} from '../../services/config/ConfigService';
import {EventFetcherMessage} from '../../types/EventFetcherMessage';
import {ethers} from 'ethers';

export abstract class OnChainEventPSP extends OnChainEvent {
  constructor(rawEventLog: ethers.providers.Log, logger: Logger, configService: ConfigService) {
    super(rawEventLog, logger, configService);
    this.parseEventLog(rawEventLog);
  }

  public process(): EventFetcherMessage|undefined {
    this.logPSPEvent();
    return undefined;
  }

  protected abstract logPSPEvent(): void;

  protected parseEventLog(eventLog: ethers.providers.Log): void {
    this.setUserAddressFromEventLog(eventLog);
    this.setAmountFromEventLogData(eventLog);
    this.strategyConfig = this.findStrategyConfigBStrategyAddress(eventLog.address);
  }

  protected abstract setAmountFromEventLogData(eventLog: ethers.providers.Log): void

  private setUserAddressFromEventLog(eventLog: ethers.providers.Log): void {
    const rawAddress = eventLog.topics[2];
    const trimmedAddress = '0x' + rawAddress.slice(26);
    this.userAddress = ethers.utils.getAddress(trimmedAddress);
  }
}
