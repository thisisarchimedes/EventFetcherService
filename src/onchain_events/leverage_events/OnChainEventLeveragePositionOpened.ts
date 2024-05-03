import {OnChainEventLeverage} from './OnChainEventLeverage';
import {ConfigService} from '../../services/config/ConfigService';
import {
  EventFetcherLogEntryMessageLeverage,
  EventSpecificDataLeveragePositionOpened,
} from '../../types/NewRelicLogEntry';
import {EventFetcherMessage} from '../../types/EventFetcherMessage';
import {ethers} from 'ethers';
import {ContractType} from '../../types/EventDescriptor';
import {Logger} from '../../services/logger/Logger';

const ADDRESS_TOPIC_INDEX = 3;

export class OnChainEventLeveragePositionOpened extends OnChainEventLeverage {
  private collateralAmount!: bigint;
  private borrowedAmount!: bigint;
  private positionExpireBlock!: number;
  private sharesReceived!: bigint;

  constructor(rawEventLog: ethers.providers.Log, logger: Logger, configService: ConfigService) {
    super(rawEventLog, logger, configService);
    this.eventName = 'LeveragedPositionOpened';
    this.parseEventLog(rawEventLog);
  }

  protected parseEventLog(eventLog: ethers.providers.Log): void {
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

  private setNftIdFromEventLogTopic(eventLog: ethers.providers.Log): void {
    this.nftId = Number(eventLog.topics[1]);
  }

  private setUserAddressFromEventLog(eventLog: ethers.providers.Log): void {
    const rawAddress = eventLog.topics[2];
    const trimmedAddress = '0x' + rawAddress.slice(26);
    this.userAddress = ethers.utils.getAddress(trimmedAddress);
  }

  private setPositionAmountsFromEventLogData(eventLog: ethers.providers.Log): void {
    const decodedData = ethers.utils.defaultAbiCoder.decode(
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
      contractType: ContractType.Opener,
      txHash: this.txHash,
      blockNumber: this.blockNumber,
      data: {
        nftId: this.nftId,
        user: this.userAddress,
        strategy: this.strategyConfig.strategyName,
        collateralAmount: this.collateralAmount.toString(),
        wbtcToBorrow: this.borrowedAmount.toString(),
        positionExpireBlock: this.positionExpireBlock.toString(),
        sharesReceived: this.sharesReceived.toString(),
      },
    };

    return msg;
  }
}
