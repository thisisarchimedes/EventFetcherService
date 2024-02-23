import {ethers} from 'ethers';
import {OnChainEventLeverage} from './OnChainEventLeverage';
import {Logger, SQSService} from '@thisisarchimedes/backend-sdk';
import {ConfigService} from '../../services/config/ConfigService';
import {EventFetcherSQSMessage} from '../../types/EventFetcherSQSMessage';
import {EventFetcherLogEntryMessage} from '../../types/NewRelicLogEntry';

export class OnChainEventLeveragePositionLiquidated extends OnChainEventLeverage {
  private debtPaid!: bigint;
  private claimableAmount!: bigint;
  private liquidationFee!: bigint;

  constructor(rawEventLog: ethers.providers.Log, logger: Logger, sqsService: SQSService, configService: ConfigService) {
    super(rawEventLog, logger, sqsService, configService);
    this.eventName = 'LeveragedPositionLiquidated';
    this.parseEventLog(rawEventLog);
  }

  protected parseEventLog(eventLog: ethers.providers.Log): void {
    this.setNftIdFromEventLogTopic(eventLog);
    this.setStrategyConfigFromEventLogTopic(eventLog);
    this.setPositionAmountsFromEventLogData(eventLog);

    this.userAddress = '0';
  }

  protected logLeverageEvent(): void {
    const eventDetails: EventFetcherLogEntryMessage = {
      event: this.eventName,
      user: this.userAddress,
      strategy: this.strategyConfig.strategyName,
      depositAmount: this.claimableAmount.toString(),
      borrowedAmount: this.liquidationFee.toString(),
    };

    this.logger.info(JSON.stringify(eventDetails));
  }

  private setNftIdFromEventLogTopic(eventLog: ethers.providers.Log): void {
    this.nftId = Number(eventLog.topics[1]);
  }

  private setStrategyConfigFromEventLogTopic(eventLog: ethers.providers.Log): void {
    const rawAddress = eventLog.topics[2];
    const trimmedAddress = '0x' + rawAddress.slice(26);
    const strategyAddress = ethers.utils.getAddress(trimmedAddress);

    this.strategyConfig = this.findStrategyConfigBStrategyAddress(strategyAddress);
  }

  private setPositionAmountsFromEventLogData(eventLog: ethers.providers.Log): void {
    const decodedData = ethers.utils.defaultAbiCoder.decode(
        ['uint256', 'uint256', 'uint256'],
        eventLog.data);

    this.debtPaid = decodedData[0];
    this.claimableAmount = decodedData[1];
    this.liquidationFee = decodedData[2];
  }

  protected getSQSMessage(): EventFetcherSQSMessage {
    const msg: EventFetcherSQSMessage = {
      name: 'PositionLiquidated',
      contractType: 2,
      txHash: this.txHash,
      blockNumber: this.blockNumber,
      data: {
        nftId: this.nftId,
        strategy: this.strategyConfig.strategyAddress,
        wbtcDebtPaid: this.debtPaid.toString(),
        claimableAmount: this.claimableAmount.toString(),
        liquidationFee: this.liquidationFee.toString(),
      },
    };

    return msg;
  }
}
