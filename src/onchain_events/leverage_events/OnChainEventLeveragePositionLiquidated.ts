import {OnChainEventLeverage} from './OnChainEventLeverage';
import {Logger} from '@thisisarchimedes/backend-sdk';
import {ConfigService} from '../../services/config/ConfigService';
import {EventFetcherMessage} from '../../types/EventFetcherMessage';
import {
  EventFetcherLogEntryMessageLeverage,
  EventSpecificDataLeveragePositionLiquidated,
} from '../../types/NewRelicLogEntry';
import {ethers} from 'ethers';
import {ContractType} from '../../types/EventDescriptor';

const ADDRESS_TOPIC_INDEX = 2;

export class OnChainEventLeveragePositionLiquidated extends OnChainEventLeverage {
  private debtPaid!: bigint;
  private claimableAmount!: bigint;
  private liquidationFee!: bigint;

  constructor(rawEventLog: ethers.providers.Log, logger: Logger, configService: ConfigService) {
    super(rawEventLog, logger, configService);
    this.eventName = 'LeveragedPositionLiquidated';
    this.parseEventLog(rawEventLog);
  }

  protected parseEventLog(eventLog: ethers.providers.Log): void {
    this.setNftIdFromEventLogTopic(eventLog);
    this.setStrategyConfigFromEventLogTopic(eventLog, ADDRESS_TOPIC_INDEX);
    this.setPositionAmountsFromEventLogData(eventLog);

    this.userAddress = '0';
  }

  protected logLeverageEvent(): void {
    const eventSpecificDetails: EventSpecificDataLeveragePositionLiquidated = {
      liquidationFee: this.liquidationFee.toString(),
    };

    const eventDetails: EventFetcherLogEntryMessageLeverage = {
      nftID: this.nftId,
      blockNumber: this.blockNumber,
      txHash: this.txHash,
      event: this.eventName,
      strategy: this.strategyConfig.strategyName,
      collateralAddedToStrategy: (BigInt(this.claimableAmount) * -1n).toString(),
      debtBorrowedFromProtocol: (BigInt(this.debtPaid) * -1n).toString(),
      eventSpecificData: eventSpecificDetails,
    };

    this.logger.info(JSON.stringify(eventDetails));
  }

  private setNftIdFromEventLogTopic(eventLog: ethers.providers.Log): void {
    this.nftId = Number(eventLog.topics[1]);
  }

  private setPositionAmountsFromEventLogData(eventLog: ethers.providers.Log): void {
    const decodedData = ethers.utils.defaultAbiCoder.decode(
        ['uint256', 'uint256', 'uint256'],
        eventLog.data);

    this.debtPaid = decodedData[0];
    this.claimableAmount = decodedData[1];
    this.liquidationFee = decodedData[2];
  }

  protected getMessage(): EventFetcherMessage {
    const msg: EventFetcherMessage = {
      name: 'PositionLiquidated',
      contractType: ContractType.Liquidator,
      txHash: this.txHash,
      blockNumber: this.blockNumber,
      data: {
        nftId: this.nftId,
        strategy: this.strategyConfig.strategyName,
        wbtcDebtPaid: this.debtPaid.toString(),
        claimableAmount: this.claimableAmount.toString(),
        liquidationFee: this.liquidationFee.toString(),
      },
    };

    return msg;
  }
}
