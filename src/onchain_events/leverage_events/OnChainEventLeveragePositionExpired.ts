import {ethers} from 'ethers';
import {OnChainEventLeverage} from './OnChainEventLeverage';
import {Logger, SQSService} from '@thisisarchimedes/backend-sdk';
import {ConfigService} from '../../services/config/ConfigService';
import {SQSMessage} from '../../types/EventFetcherSQSMessage';
import {EventFetcherLogEntryMessage} from '../../types/NewRelicLogEntry';

export class OnChainEventLeveragePositionExpired extends OnChainEventLeverage {
  private claimableAmount!: bigint;

  constructor(rawEventLog: ethers.providers.Log, logger: Logger, sqsService: SQSService, configService: ConfigService) {
    super(rawEventLog, logger, sqsService, configService);
    this.eventName = 'LeveragedPositionExpired';
    this.parseEventLog(rawEventLog);
  }

  protected parseEventLog(eventLog: ethers.providers.Log): void {
    this.setNftIdFromEventLogTopic(eventLog);
    this.setUserAddressFromEventLog(eventLog);
    this.setPositionAmountsFromEventLogData(eventLog);
  }

  protected logLeverageEvent(): void {
    const eventDetails: EventFetcherLogEntryMessage = {
      event: this.eventName,
      user: this.userAddress,
      strategy: '',
      depositAmount: this.claimableAmount.toString(),
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
        ['uint256'],
        eventLog.data);

    this.claimableAmount = decodedData[0];
  }

  protected getSQSMessage(): SQSMessage {
    const msg: SQSMessage = {
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
