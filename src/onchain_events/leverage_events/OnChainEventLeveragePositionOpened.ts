import {OnChainEventLeverage} from './OnChainEventLeverage';
import {Logger, ethers} from '@thisisarchimedes/backend-sdk';
import {ConfigService} from '../../services/config/ConfigService';
import {
  EventFetcherLogEntryMessageLeverage,
  EventSpecificDataLeveragePositionOpened,
} from '../../types/NewRelicLogEntry';
import {EventFetcherMessage} from '../../types/EventFetcherSQSMessage';

const ADDRESS_TOPIC_INDEX = 3;

export class OnChainEventLeveragePositionOpened extends OnChainEventLeverage {
  private collateralAmount!: bigint;
  private borrowedAmount!: bigint;
  private positionExpireBlock!: number;
  private sharesReceived!: bigint;

  constructor(rawEventLog: ethers.Log, logger: Logger, configService: ConfigService) {
    super(rawEventLog, logger, configService);
    this.eventName = 'LeveragedPositionOpened';
    this.parseEventLog(rawEventLog);
  }

  protected parseEventLog(eventLog: ethers.Log): void {
    this.setUserAddressFromEventLog(eventLog);
    this.setStrategyConfigFromEventLogTopic(eventLog, ADDRESS_TOPIC_INDEX);
    this.setNftIdFromEventLogTopic(eventLog);

    this.setPositionAmountsFromEventLogData(eventLog);
  }

  protected logLeverageEvent(): void {
    const eventSpecificDetails: EventSpecificDataLeveragePositionOpened = {
      positionExpireBlock: this.positionExpireBlock.toString(),
      sharesReceived: this.sharesReceived.toString(),
    };

    const eventDetails: EventFetcherLogEntryMessageLeverage = {
      nftID: this.nftId,
      blockNumber: this.blockNumber,
      txHash: this.txHash,
      event: this.eventName,
      user: this.userAddress,
      strategy: this.strategyConfig.strategyName,
      collateralAddedToStrategy: this.collateralAmount.toString(),
      debtBorrowedFromProtocol: this.borrowedAmount.toString(),
      eventSpecificData: eventSpecificDetails,
    };

    this.logger.info(JSON.stringify(eventDetails));
  }

  private setNftIdFromEventLogTopic(eventLog: ethers.Log): void {
    this.nftId = Number(eventLog.topics[1]);
  }

  private setUserAddressFromEventLog(eventLog: ethers.Log): void {
    const rawAddress = eventLog.topics[2];
    const trimmedAddress = '0x' + rawAddress.slice(26);
    this.userAddress = ethers.getAddress(trimmedAddress);
  }

  private setPositionAmountsFromEventLogData(eventLog: ethers.Log): void {
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const decodedData = abiCoder.decode(
        ['uint256', 'uint256', 'uint256', 'uint256'],
        eventLog.data);

    this.collateralAmount = decodedData[0];
    this.borrowedAmount = decodedData[1];
    this.positionExpireBlock = decodedData[2];
    this.sharesReceived = decodedData[3];
  }

  protected getMessage(): EventFetcherMessage {
    const msg: EventFetcherMessage = {
      name: 'PositionOpened',
      contractType: 0,
      txHash: this.txHash,
      blockNumber: this.blockNumber,
      data: {
        nftId: this.nftId,
        user: this.userAddress,
        strategy: this.strategyConfig.strategyAddress,
        collateralAmount: this.collateralAmount.toString(),
        wbtcToBorrow: this.borrowedAmount.toString(),
        positionExpireBlock: this.positionExpireBlock.toString(),
        sharesReceived: this.sharesReceived.toString(),
      },
    };

    return msg;
  }
}
