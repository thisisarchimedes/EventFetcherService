import { OnChainEventPSP } from './OnChainEventPSP';
import { ConfigService } from '../../services/config/ConfigService';
import { EventFetcherLogEntryMessagePSP } from '../../types/NewRelicLogEntry';
import { ethers } from 'ethers';
import { Logger } from '../../services/logger/Logger';

export class OnChainEventPSPWithdraw extends OnChainEventPSP {
  private withdrawAmount!: bigint;

  constructor(rawEventLog: ethers.providers.Log, logger: Logger, configService: ConfigService) {
    super(rawEventLog, logger, configService);
    this.eventName = 'Withdraw';
  }

  protected logPSPEvent(): void {
    const eventDetails: EventFetcherLogEntryMessagePSP = {
      blockNumber: this.blockNumber,
      txHash: this.txHash,
      event: this.eventName,
      user: this.userAddress,
      strategy: this.strategyConfig.strategyName,
      amountAddedToStrategy: BigInt(this.withdrawAmount * -1n).toString(),
      amountAddedToAdapter: BigInt(0).toString(),
    };

    this.logger.info(JSON.stringify(eventDetails));
  }

  protected setAmountFromEventLogData(eventLog: ethers.providers.Log): void {
    this.withdrawAmount = BigInt((ethers.utils.defaultAbiCoder.decode(['uint256', 'uint256'], eventLog.data))[0]);
  }
}
