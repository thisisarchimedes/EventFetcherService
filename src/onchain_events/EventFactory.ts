import {ethers} from 'ethers';
import {ConfigService} from '../services/config/ConfigService';
import {Logger, SQSService} from '@thisisarchimedes/backend-sdk';
import {OnChainEventPSPDeposit} from './psp_events/OnChainEventPSPDeposit';
import {OnChainEventPSPWithdraw} from './psp_events/OnChainEventPSPWithdraw';
import {OnChainEvent} from './OnChainEvent';
import {OnChainEventLeveragePositionOpened} from './leverage_events/OnChainEventLeveragePositionOpened';
import {OnChainEventLeveragePositionClosed} from './leverage_events/OnChainEventLeveragePositionClosed';
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

  public async createEvent(eventLog: ethers.providers.Log): Promise<OnChainEvent> {
    let errorMessage;

    const results = await Promise.all([
      this.createPSPEvent(eventLog),
      this.createLeverageEvent(eventLog),
    ]);

    if (results[0] === undefined && results[1] === undefined) {
      errorMessage = `Unhandled event topic: ${eventLog.topics[0]}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    // this should NOT happen
    if (results[0] !== undefined && results[1] !== undefined) {
      errorMessage = `Two events detected, but expecting just one: ${eventLog.topics[0]}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    if (results[0] !== undefined) {
      return results[0] as OnChainEvent;
    }

    return results[1] as OnChainEvent;
  }

  private createPSPEvent(eventLog: ethers.providers.Log): OnChainEvent | undefined {
    if (this.isLogEventEmittedByPSPContract(eventLog) === false) {
      return undefined;
    }

    switch (eventLog.topics[0]) {
      case TOPIC_EVENT_PSP_DEPOSIT:
        return new OnChainEventPSPDeposit(eventLog, this.logger, this.sqsService, this.configService);

      case TOPIC_EVENT_PSP_WITHDRAW:
        return new OnChainEventPSPWithdraw(eventLog, this.logger, this.sqsService, this.configService);
    }

    return undefined;
  }

  private createLeverageEvent(eventLog: ethers.providers.Log): OnChainEvent | undefined {
    if (this.isLogEventEmittedByLeverageContract(eventLog) === false) {
      return undefined;
    }

    switch (eventLog.topics[0]) {
      case TOPIC_EVENT_LEVERAGE_POSITION_OPENED:
        return new OnChainEventLeveragePositionOpened(eventLog, this.logger, this.sqsService, this.configService);

      case TOPIC_EVENT_LEVERAGE_POSITION_CLOSED:
        return new OnChainEventLeveragePositionClosed(eventLog, this.logger, this.sqsService, this.configService);
    }

    return undefined;
  }

  private isLogEventEmittedByPSPContract(eventLog: ethers.providers.Log): boolean {
    const res = this.configService.getPSPStrategyInfoByAddress(eventLog.address);

    if (res === undefined) {
      return false;
    }
    return true;
  }

  private isLogEventEmittedByLeverageContract(eventLog: ethers.providers.Log): boolean {
    const emitterAddress = eventLog.address;

    if (this.configService.getLeveragePositionOpenerAddress() === emitterAddress ||
      this.configService.getLeveragePositionCloserAddress() === emitterAddress ||
      this.configService.getLeveragePositionLiquidatorAddress() === emitterAddress ||
      this.configService.getLeveragePositionExpiratorAddress() === emitterAddress) {
      return true;
    }
    return false;
  }
}
