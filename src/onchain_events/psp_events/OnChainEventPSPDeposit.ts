import { ethers } from 'ethers';
import { OnChainEventPSP } from './OnChainEventPSP';
import { Logger, SQSService } from '@thisisarchimedes/backend-sdk';
import { ConfigService } from '../../services/config/ConfigService';

export class OnChainEventPSPDeposit extends OnChainEventPSP {
  constructor(rawEventLog: ethers.providers.Log, logger: Logger, sqsService: SQSService, configService: ConfigService) {
    super(rawEventLog, logger, sqsService, configService);
    this.eventName = 'Deposit';
  }

  protected setAmountFromEventLogData(eventLog: ethers.providers.Log): void {
    this.depositAmount = (ethers.utils.defaultAbiCoder.decode(['uint256', 'uint256'], eventLog.data))[1];
  }
}
