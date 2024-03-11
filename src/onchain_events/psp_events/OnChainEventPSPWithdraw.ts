import {OnChainEventPSP} from './OnChainEventPSP';
import {Logger, ethers} from '@thisisarchimedes/backend-sdk';
import {ConfigService} from '../../services/config/ConfigService';
import {EventFetcherLogEntryMessagePSP} from '../../types/NewRelicLogEntry';

export class OnChainEventPSPWithdraw extends OnChainEventPSP {
  private withdrawAmount!: bigint;

  constructor(rawEventLog: ethers.Log, logger: Logger, configService: ConfigService) {
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

  protected setAmountFromEventLogData(eventLog: ethers.Log): void {
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    this.withdrawAmount = BigInt((abiCoder.decode(['uint256', 'uint256'], eventLog.data))[0]);
  }
}
