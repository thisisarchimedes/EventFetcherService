import {OnChainEventPSP} from './OnChainEventPSP';
import {Logger, ethers} from '@thisisarchimedes/backend-sdk';
import {ConfigService} from '../../services/config/ConfigService';
import {EventFetcherLogEntryMessagePSP} from '../../types/NewRelicLogEntry';

export class OnChainEventPSPDeposit extends OnChainEventPSP {
  private depositAmount!: bigint;

  constructor(rawEventLog: ethers.Log, logger: Logger, configService: ConfigService) {
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

  protected setAmountFromEventLogData(eventLog: ethers.Log): void {
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    this.depositAmount = BigInt((abiCoder.decode(['uint256', 'uint256'], eventLog.data))[1]);
  }
}
