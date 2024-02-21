import {ethers} from 'ethers';
import {OnChainEventLeverage} from './OnChainEventLeverage';
import {Logger, SQSService} from '@thisisarchimedes/backend-sdk';
import {ConfigService} from '../services/config/ConfigService';

export class OnChainEventLeveragePositionOpened extends OnChainEventLeverage {
  constructor(eventLog: ethers.providers.Log, logger: Logger, sqsService: SQSService, configService: ConfigService) {
    super(logger, sqsService, configService);
    this.eventName = 'LeveragedPositionOpened';
    this.parseEventLog(eventLog);
  }

  protected parseEventLog(eventLog: ethers.providers.Log): void {
    this.setUserAddressFromEventLog(eventLog);
    this.setStrategyConfigFromEventLogTopic(eventLog);
    this.setNftIdFromEventLogTopic(eventLog);

    this.setPositionAmountsFromEventLogData(eventLog);
  }

  private setUserAddressFromEventLog(eventLog: ethers.providers.Log): void {
    const rawAddress = eventLog.topics[2];
    const trimmedAddress = '0x' + rawAddress.slice(26);
    this.userAddress = ethers.utils.getAddress(trimmedAddress);
  }

  private setStrategyConfigFromEventLogTopic(eventLog: ethers.providers.Log): void {
    const rawAddress = eventLog.topics[3];
    const trimmedAddress = '0x' + rawAddress.slice(26);
    const strategyAddress = ethers.utils.getAddress(trimmedAddress);

    this.strategyConfig = this.findStrategyConfigBStrategyAddress(strategyAddress);
  }

  private setNftIdFromEventLogTopic(eventLog: ethers.providers.Log): void {
    this.nftId = Number(eventLog.topics[1]);
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
}
