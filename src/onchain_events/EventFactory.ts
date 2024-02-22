import {ethers} from 'ethers';
import {ConfigService} from '../services/config/ConfigService';
import {Logger, SQSService} from '@thisisarchimedes/backend-sdk';
import {OnChainEventPSPDeposit} from './OnChainEventPSPDeposit';
import {OnChainEventPSPWithdraw} from './OnChainEventPSPWithdraw';
import {OnChainEvent} from './OnChainEvent';
import {OnChainEventLeveragePositionOpened} from './OnChainEventLeveragePositionOpened';
import {OnChainEventLeveragePositionClosed} from './OnChainEventLeveragePositionClosed';

const TOPIC_EVENT_PSP_DEPOSIT = '0xdcbc1c05240f31ff3ad067ef1ee35ce4997762752e3a095284754544f4c709d7';
const TOPIC_EVENT_PSP_WITHDRAW = '0xfbde797d201c681b91056529119e0b02407c7bb96a4a2c75c01fc9667232c8db';

const TOPIC_EVENT_LEVERAGE_POSITION_OPENED = '0x80feb7c33cd39a42e347b6b7577a63af2c7a96c236e85c200c8f39e11be679dd';
const TOPIC_EVENT_LEVERAGE_POSITION_CLOSED = '3120c845c5d2c39308641201562a412527c1e7aff294f09c0c936f1c60a1b067';

export class EventFactory {
  private configService: ConfigService;
  private logger: Logger;
  private sqsService: SQSService;

  constructor(configService: ConfigService, logger: Logger, sqsService: SQSService) {
    this.configService = configService;
    this.logger = logger;
    this.sqsService = sqsService;
  }

  /**
   *
   *
   * Make it async so we can process PSP and Leverage event in parallel
   * Seperate the switch and break it into two different functions
   * Also create folders for PSP and leverage events
   * 
   * Verify that we check the contract address and not just the topic for each event
   */
  public createEvent(eventLog: ethers.providers.Log): OnChainEvent {
    let errorMessage;

    switch (eventLog.topics[0]) {
      case TOPIC_EVENT_PSP_DEPOSIT:
        return new OnChainEventPSPDeposit(eventLog, this.logger, this.sqsService, this.configService);

      case TOPIC_EVENT_PSP_WITHDRAW:
        return new OnChainEventPSPWithdraw(eventLog, this.logger, this.sqsService, this.configService);

      case TOPIC_EVENT_LEVERAGE_POSITION_OPENED:
        return new OnChainEventLeveragePositionOpened(eventLog, this.logger, this.sqsService, this.configService);

      case TOPIC_EVENT_LEVERAGE_POSITION_CLOSED:
        return new OnChainEventLeveragePositionClosed(eventLog, this.logger, this.sqsService, this.configService);

      default:
        errorMessage = `Unhandled event topic: ${eventLog.topics[0]}`;
        this.logger.error(errorMessage);
        throw new Error(errorMessage);
    }
  }
}
