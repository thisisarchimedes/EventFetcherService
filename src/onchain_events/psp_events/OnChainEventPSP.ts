import {Logger, ethers} from '@thisisarchimedes/backend-sdk';
import {OnChainEvent} from '../OnChainEvent';
import {ConfigService} from '../../services/config/ConfigService';
import {EventFetcherMessage} from '../../types/EventFetcherMessage';

export abstract class OnChainEventPSP extends OnChainEvent {
  constructor(rawEventLog: ethers.Log, logger: Logger, configService: ConfigService) {
    super(rawEventLog, logger, configService);
    this.parseEventLog(rawEventLog);
  }

  public process(): EventFetcherMessage|undefined {
    this.logPSPEvent();
    return;
  }

  protected abstract logPSPEvent(): void;

  protected parseEventLog(eventLog: ethers.Log): void {
    this.setUserAddressFromEventLog(eventLog);
    this.setAmountFromEventLogData(eventLog);
    this.strategyConfig = this.findStrategyConfigBStrategyAddress(eventLog.address);
  }

  protected abstract setAmountFromEventLogData(eventLog: ethers.Log): void

  private setUserAddressFromEventLog(eventLog: ethers.Log): void {
    const rawAddress = eventLog.topics[2];
    const trimmedAddress = '0x' + rawAddress.slice(26);
    this.userAddress = ethers.getAddress(trimmedAddress);
  }
}
