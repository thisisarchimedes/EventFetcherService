import {ethers} from 'ethers';
import {LogMessage} from '../types/LogMessage';
import {OnChainEvent} from './OnChainEvent';
import {PSPStrategyConfig} from '../services/config/configServicePSP';
import {Logger} from '@thisisarchimedes/backend-sdk';

export class OnChainEventPSPWithdraw extends OnChainEvent {
  constructor(eventLog: ethers.providers.Log, strategyConfig: PSPStrategyConfig, logger: Logger) {
    super(strategyConfig, logger);
    this.eventName = 'Withdraw';
    this.parseEventLog(eventLog);
  }

  public process(): void {
    this.logDepositEvent();
  }

  private logDepositEvent(): void {
    const eventDetails: LogMessage = {
      event: this.eventName,
      user: this.userAddress,
      strategy: this.strategyConfig.strategyName,
      amount: this.amount.toString(),
    };

    this.logger.info(JSON.stringify(eventDetails));
  }

  private parseEventLog(eventLog: ethers.providers.Log): void {
    this.setUserAddressFromEventLog(eventLog);
    this.setAmountFromEventLog(eventLog);
  }

  private setUserAddressFromEventLog(eventLog: ethers.providers.Log): void {
    const rawAddress = eventLog.topics[2];
    const trimmedAddress = '0x' + rawAddress.slice(26);
    this.userAddress = ethers.utils.getAddress(trimmedAddress);
  }

  private setAmountFromEventLog(eventLog: ethers.providers.Log): void {
    this.amount = (ethers.utils.defaultAbiCoder.decode(['uint256', 'uint256'], eventLog.data))[0];
  }
}
