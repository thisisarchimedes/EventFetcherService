import {ethers} from 'ethers';

import {Logger} from '@thisisarchimedes/backend-sdk';
import {IPSPStrategyConfig} from '../services/config/ConfigServicePSP';
import {EventFetcherLogEntryMessage} from '../types/NewRelicLogEntry';

export class OnChainEventPSP {
  protected eventName: string = '';
  protected strategyConfig: IPSPStrategyConfig;
  protected logger: Logger;

  protected amount: bigint = BigInt(0);
  protected userAddress: string = '';

  constructor(strategyConfig: IPSPStrategyConfig, logger: Logger) {
    this.strategyConfig = strategyConfig;
    this.logger = logger;
  }

  public process(): void {
    this.logDepositEvent();
  }

  protected parseEventLog(eventLog: ethers.providers.Log): void {
    this.setUserAddressFromEventLog(eventLog);
    this.setAmountFromEventLogData(eventLog);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected setAmountFromEventLogData(eventLog: ethers.providers.Log): void {
    // This method should be overridden by subclasses
  }

  private logDepositEvent(): void {
    const eventDetails: EventFetcherLogEntryMessage = {
      event: this.eventName,
      user: this.userAddress,
      strategy: this.strategyConfig.strategyName,
      amount: this.amount.toString(),
    };

    this.logger.info(JSON.stringify(eventDetails));
  }

  private setUserAddressFromEventLog(eventLog: ethers.providers.Log): void {
    const rawAddress = eventLog.topics[2];
    const trimmedAddress = '0x' + rawAddress.slice(26);
    this.userAddress = ethers.utils.getAddress(trimmedAddress);
  }
}
