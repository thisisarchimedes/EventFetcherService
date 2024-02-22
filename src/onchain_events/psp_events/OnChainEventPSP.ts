import {ethers} from 'ethers';

import {Logger, SQSService} from '@thisisarchimedes/backend-sdk';
import {EventFetcherLogEntryMessage} from '../../types/NewRelicLogEntry';
import {OnChainEvent} from '../OnChainEvent';
import {ConfigService} from '../../services/config/ConfigService';

export abstract class OnChainEventPSP extends OnChainEvent {
  constructor(rawEventLog: ethers.providers.Log, logger: Logger, sqsService: SQSService, configService: ConfigService) {
    super(rawEventLog, logger, sqsService, configService);
    this.parseEventLog(rawEventLog);
  }

  public process(): void {
    this.logPSPEvent();
  }

  protected parseEventLog(eventLog: ethers.providers.Log): void {
    this.setUserAddressFromEventLog(eventLog);
    this.setAmountFromEventLogData(eventLog);
    this.strategyConfig = this.findStrategyConfigBStrategyAddress(eventLog.address);
  }

  protected abstract setAmountFromEventLogData(eventLog: ethers.providers.Log): void

  private logPSPEvent(): void {
    const eventDetails: EventFetcherLogEntryMessage = {
      event: this.eventName,
      user: this.userAddress,
      strategy: this.strategyConfig.strategyName,
      depositAmount: this.depositAmount.toString(),
    };

    this.logger.info(JSON.stringify(eventDetails));
  }

  private setUserAddressFromEventLog(eventLog: ethers.providers.Log): void {
    const rawAddress = eventLog.topics[2];
    const trimmedAddress = '0x' + rawAddress.slice(26);
    this.userAddress = ethers.utils.getAddress(trimmedAddress);
  }
}
