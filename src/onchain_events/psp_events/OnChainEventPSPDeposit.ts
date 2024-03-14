import {OnChainEventPSP} from './OnChainEventPSP';
import {Logger} from '@thisisarchimedes/backend-sdk';
import {ConfigService} from '../../services/config/ConfigService';
import {EventFetcherLogEntryMessagePSP} from '../../types/NewRelicLogEntry';
import {ethers} from 'ethers';

export class OnChainEventPSPDeposit extends OnChainEventPSP {
  private depositAmount!: bigint;

  constructor(rawEventLog: ethers.providers.Log, logger: Logger, configService: ConfigService) {
    super(rawEventLog, logger, configService);
    this.eventName = 'Deposit';
  }

  protected logPSPEvent(): void {
    const eventDetails: EventFetcherLogEntryMessagePSP = {
      blockNumber: this.blockNumber,
      txHash: this.txHash,
      event: this.eventName,
      user: this.userAddress,
      strategy: this.strategyConfig.strategyName,
      amountAddedToStrategy: this.depositAmount.toString(),
      amountAddedToAdapter: BigInt(0).toString(),
    };

    this.logger.info(JSON.stringify(eventDetails));
  }

  protected setAmountFromEventLogData(eventLog: ethers.providers.Log): void {
    this.depositAmount = BigInt((ethers.utils.defaultAbiCoder.decode(['uint256', 'uint256'], eventLog.data))[1]);
  }
}
