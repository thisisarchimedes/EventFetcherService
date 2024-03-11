import {OnChainEventLeverage} from './OnChainEventLeverage';
import {Logger, ethers} from '@thisisarchimedes/backend-sdk';
import {ConfigService} from '../../services/config/ConfigService';
import {EventFetcherMessage} from '../../types/EventFetcherMessage';
import {EventFetcherLogEntryMessageLeverage} from '../../types/NewRelicLogEntry';

const ADDRESS_TOPIC_INDEX = 2;

export class OnChainEventLeveragePositionExpired extends OnChainEventLeverage {
  private claimableAmount!: bigint;
  private debtPaid!: bigint;

  constructor(rawEventLog: ethers.Log, logger: Logger, configService: ConfigService) {
    super(rawEventLog, logger, configService);
    this.eventName = 'LeveragedPositionExpired';
    this.parseEventLog(rawEventLog);
  }

  protected parseEventLog(eventLog: ethers.Log): void {
    this.setNftIdFromEventLogTopic(eventLog);
    this.setStrategyConfigFromEventLogTopic(eventLog, ADDRESS_TOPIC_INDEX);
    this.setPositionAmountsFromEventLogData(eventLog);
  }

  protected logLeverageEvent(): void {
    const eventDetails: EventFetcherLogEntryMessageLeverage = {
      nftID: this.nftId,
      blockNumber: this.blockNumber,
      txHash: this.txHash,
      event: this.eventName,
      strategy: this.strategyConfig.strategyName,
      collateralAddedToStrategy: (BigInt(this.claimableAmount) * -1n).toString(),
      debtBorrowedFromProtocol: (BigInt(this.debtPaid) * -1n).toString(),
    };

    this.logger.info(JSON.stringify(eventDetails));
  }

  private setNftIdFromEventLogTopic(eventLog: ethers.Log): void {
    this.nftId = Number(eventLog.topics[1]);
  }

  private setPositionAmountsFromEventLogData(eventLog: ethers.Log): void {
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const decodedData = abiCoder.decode(
        ['uint256', 'uint256'],
        eventLog.data);

    this.debtPaid = decodedData[0];
    this.claimableAmount = decodedData[1];
  }

  protected getMessage(): EventFetcherMessage {
    const msg: EventFetcherMessage = {
      name: 'PositionExpired',
      contractType: 3,
      txHash: this.txHash,
      blockNumber: this.blockNumber,
      data: {
        nftId: this.nftId,
        user: this.userAddress,
        claimableAmount: this.claimableAmount.toString(),
      },
    };

    return msg;
  }
}
