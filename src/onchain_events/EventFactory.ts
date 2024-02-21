import {ethers} from 'ethers';
import {ConfigService} from '../services/config/ConfigService';
import {Logger, SQSService} from '@thisisarchimedes/backend-sdk';
import {OnChainEventPSPDeposit} from './OnChainEventPSPDeposit';
import {OnChainEventPSPWithdraw} from './OnChainEventPSPWithdraw';
import {OnChainEvent} from './OnChainEvent';
import {ContractInfoPSP} from '../types/ContractInfoPSP';
import { OnChainEventLeveragePositionOpened } from './OnChainEventLeveragePositionOpened';
import { cons } from 'fp-ts/lib/ReadonlyNonEmptyArray';

const TOPIC_EVENT_PSP_DEPOSIT = '0xdcbc1c05240f31ff3ad067ef1ee35ce4997762752e3a095284754544f4c709d7';
const TOPIC_EVENT_PSP_WITHDRAW = '0xfbde797d201c681b91056529119e0b02407c7bb96a4a2c75c01fc9667232c8db';

const TOPIC_EVENT_LEVERAGE_POSITION_OPENED = '0x80feb7c33cd39a42e347b6b7577a63af2c7a96c236e85c200c8f39e11be679dd';

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

      default:
        errorMessage = `Unhandled event topic: ${eventLog.topics[0]}`;
        this.logger.error(errorMessage);
        throw new Error(errorMessage);
    }
  }
}
