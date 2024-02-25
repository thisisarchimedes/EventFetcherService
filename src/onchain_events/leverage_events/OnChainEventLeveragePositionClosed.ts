import {ethers} from 'ethers';
import {OnChainEventLeverage} from './OnChainEventLeverage';
import {Logger, SQSService} from '@thisisarchimedes/backend-sdk';
import {ConfigService} from '../../services/config/ConfigService';
import {EventFetcherSQSMessage} from '../../types/EventFetcherSQSMessage';
import {EventFetcherLogEntryMessageLeverage} from '../../types/NewRelicLogEntry';

export class OnChainEventLeveragePositionClosed extends OnChainEventLeverage {
  private receivedAmount!: bigint;
  private debtAmount!: bigint;

  constructor(rawEventLog: ethers.providers.Log, logger: Logger, sqsService: SQSService, configService: ConfigService) {
    super(rawEventLog, logger, sqsService, configService);
    this.eventName = 'LeveragedPositionClosed';
    this.parseEventLog(rawEventLog);
  }

  protected parseEventLog(eventLog: ethers.providers.Log): void {
    this.setUserAddressFromEventLog(eventLog);
    this.setNftIdFromEventLogTopic(eventLog);
    this.setStrategyConfigFromEventLogTopic(eventLog);

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

  private setNftIdFromEventLogTopic(eventLog: ethers.providers.Log): void {
    this.nftId = Number(eventLog.topics[1]);
  }

  private setStrategyConfigFromEventLogTopic(eventLog: ethers.providers.Log): void {
    const rawAddress = eventLog.topics[3];
    const trimmedAddress = '0x' + rawAddress.slice(26);
    const strategyAddress = ethers.utils.getAddress(trimmedAddress);

    this.strategyConfig = this.findStrategyConfigBStrategyAddress(strategyAddress);
  }

  private setUserAddressFromEventLog(eventLog: ethers.providers.Log): void {
    const rawAddress = eventLog.topics[2];
    const trimmedAddress = '0x' + rawAddress.slice(26);
    this.userAddress = ethers.utils.getAddress(trimmedAddress);
  }

  private setPositionAmountsFromEventLogData(eventLog: ethers.providers.Log): void {
    const decodedData = ethers.utils.defaultAbiCoder.decode(
        ['uint256', 'uint256'],
        eventLog.data);

    this.receivedAmount = decodedData[0];
    this.debtAmount = decodedData[1];
  }

  protected getSQSMessage(): EventFetcherSQSMessage {
    const msg: EventFetcherSQSMessage = {
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
