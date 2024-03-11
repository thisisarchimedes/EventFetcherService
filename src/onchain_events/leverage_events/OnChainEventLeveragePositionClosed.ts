import {OnChainEventLeverage} from './OnChainEventLeverage';
import {Logger, ethers} from '@thisisarchimedes/backend-sdk';
import {ConfigService} from '../../services/config/ConfigService';
import {EventFetcherMessage} from '../../types/EventFetcherMessage';
import {EventFetcherLogEntryMessageLeverage} from '../../types/NewRelicLogEntry';

const ADDRESS_TOPIC_INDEX = 3;

export class OnChainEventLeveragePositionClosed extends OnChainEventLeverage {
  private receivedAmount!: bigint;
  private debtAmount!: bigint;

  constructor(rawEventLog: ethers.Log, logger: Logger, configService: ConfigService) {
    super(rawEventLog, logger, configService);
    this.eventName = 'LeveragedPositionClosed';
    this.parseEventLog(rawEventLog);
  }

  protected parseEventLog(eventLog: ethers.Log): void {
    this.setUserAddressFromEventLog(eventLog);
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
      user: this.userAddress,
      strategy: this.strategyConfig.strategyName,
      collateralAddedToStrategy: (BigInt(this.receivedAmount) * -1n).toString(),
      debtBorrowedFromProtocol: (BigInt(this.debtAmount) * -1n).toString(),
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
        ['uint256', 'uint256'],
        eventLog.data);

    this.receivedAmount = decodedData[0];
    this.debtAmount = decodedData[1];
  }

  protected getMessage(): EventFetcherMessage {
    const msg: EventFetcherMessage = {
      name: 'PositionClosed',
      contractType: 1,
      txHash: this.txHash,
      blockNumber: this.blockNumber,
      data: {
        nftId: this.nftId,
        user: this.userAddress,
        receivedAmount: this.receivedAmount.toString(),
        wbtcDebtAmount: this.debtAmount.toString(),
      },
    };

    return msg;
  }
}
