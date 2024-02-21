import { ethers } from 'ethers';
import { OnChainEventPSP } from './OnChainEventPSP';
import { Logger, SQSService } from '@thisisarchimedes/backend-sdk';
import { ConfigService } from '../services/config/ConfigService';

export class OnChainEventPSPDeposit extends OnChainEventPSP {
  constructor(eventLog: ethers.providers.Log, logger: Logger, sqsService: SQSService, configService: ConfigService) {
    super(eventLog, logger, sqsService, configService);
    this.eventName = 'Deposit';
  }

  protected setAmountFromEventLogData(eventLog: ethers.providers.Log): void {
    this.depositAmount = (ethers.utils.defaultAbiCoder.decode(['uint256', 'uint256'], eventLog.data))[1];
  }
}
