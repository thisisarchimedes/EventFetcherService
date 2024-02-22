import {ethers} from 'ethers';
import {ConfigService} from '../services/config/ConfigService';
import {Logger, SQSService} from '@thisisarchimedes/backend-sdk';
import {OnChainEventPSPDeposit} from './OnChainEventPSPDeposit';
import {OnChainEventPSPWithdraw} from './OnChainEventPSPWithdraw';
import {OnChainEvent} from './OnChainEvent';
import {OnChainEventLeveragePositionOpened} from './OnChainEventLeveragePositionOpened';
import {OnChainEventLeveragePositionClosed} from './OnChainEventLeveragePositionClosed';
import {
  TOPIC_EVENT_LEVERAGE_POSITION_CLOSED,
  TOPIC_EVENT_LEVERAGE_POSITION_OPENED,
  TOPIC_EVENT_PSP_DEPOSIT,
  TOPIC_EVENT_PSP_WITHDRAW,
} from './EventTopic';

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
