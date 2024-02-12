import {ethers} from 'ethers';
import {OnChainEvent} from './OnChainEvent';
import {PSPStrategyConfig} from '../services/config/configServicePSP';
import {Logger} from '@thisisarchimedes/backend-sdk';

export class OnChainEventPSPDeposit extends OnChainEvent {
  private amount: bigint = BigInt(0);

  constructor(eventLog: ethers.providers.Log, strategyConfig: PSPStrategyConfig, logger: Logger) {
    super(strategyConfig, logger);
    this.eventName = 'Deposit';
    this.parseEventLog(eventLog);
  }

  public process(): void {
    this.logDepositEvent();
  }

  private logDepositEvent(): void {
    const eventDetails = JSON.stringify({
      event: this.eventName,
      user: this.userAddress,
      strategy: this.strategyConfig.strategyName,
      amount: this.amount.toString(),
    });

    this.logger.info(eventDetails);
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
    const rawData = eventLog.data.slice(-64);
    this.amount = BigInt('0x' + rawData);
  }
}
