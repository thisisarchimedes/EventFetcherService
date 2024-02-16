import {ethers} from 'ethers';
import {OnChainEventPSP} from './OnChainEventPSP';
import {PSPContractInfo} from '../services/config/ConfigServicePSP';
import {Logger} from '@thisisarchimedes/backend-sdk';

export class OnChainEventPSPWithdraw extends OnChainEventPSP {
  constructor(eventLog: ethers.providers.Log, strategyConfig: PSPContractInfo, logger: Logger) {
    super(strategyConfig, logger);
    this.eventName = 'Withdraw';
    this.parseEventLog(eventLog);
  }

  protected setAmountFromEventLogData(eventLog: ethers.providers.Log): void {
    this.amount = (ethers.utils.defaultAbiCoder.decode(['uint256', 'uint256'], eventLog.data))[0];
  }
}
