import {ethers} from 'ethers';
import {OnChainEventPSP} from './OnChainEventPSP';
import {Logger, SQSService} from '@thisisarchimedes/backend-sdk';
import {ConfigService} from '../../services/config/ConfigService';
import {EventFetcherLogEntryMessage} from '../../types/NewRelicLogEntry';

export class OnChainEventPSPDeposit extends OnChainEventPSP {
  private depositAmount!: bigint;

  constructor(rawEventLog: ethers.providers.Log, logger: Logger, sqsService: SQSService, configService: ConfigService) {
    super(rawEventLog, logger, sqsService, configService);
    this.eventName = 'Deposit';
  }

  protected logPSPEvent(): void {
    const eventDetails: EventFetcherLogEntryMessage = {
      event: this.eventName,
      user: this.userAddress,
      strategy: this.strategyConfig.strategyName,
      depositAmount: this.depositAmount.toString(),
    };

    this.logger.info(JSON.stringify(eventDetails));
  }

  protected setAmountFromEventLogData(eventLog: ethers.providers.Log): void {
    this.depositAmount = BigInt((ethers.utils.defaultAbiCoder.decode(['uint256', 'uint256'], eventLog.data))[1]);
  }
}
