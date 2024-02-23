import {ethers} from 'ethers';
import {OnChainEventPSP} from './OnChainEventPSP';
import {Logger, SQSService} from '@thisisarchimedes/backend-sdk';
import {ConfigService} from '../../services/config/ConfigService';
import { EventFetcherLogEntryMessage } from '../../types/NewRelicLogEntry';

export class OnChainEventPSPWithdraw extends OnChainEventPSP {
  private withdrawAmount!: bigint;

  constructor(rawEventLog: ethers.providers.Log, logger: Logger, sqsService: SQSService, configService: ConfigService) {
    super(rawEventLog, logger, sqsService, configService);
    this.eventName = 'Withdraw';
  }

  protected logPSPEvent(): void {
    const eventDetails: EventFetcherLogEntryMessage = {
      event: this.eventName,
      user: this.userAddress,
      strategy: this.strategyConfig.strategyName,
      depositAmount: this.withdrawAmount.toString(),
    };

    this.logger.info(JSON.stringify(eventDetails));
  }

  protected setAmountFromEventLogData(eventLog: ethers.providers.Log): void {
    this.withdrawAmount = BigInt((ethers.utils.defaultAbiCoder.decode(['uint256', 'uint256'], eventLog.data))[0]);
  }
}
