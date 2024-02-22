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
  TOPIC_EVENT_LEVERAGE_POSITION_LIQUIDATED,
  TOPIC_EVENT_LEVERAGE_POSITION_OPENED,
  TOPIC_EVENT_PSP_DEPOSIT,
  TOPIC_EVENT_PSP_WITHDRAW,
} from './EventTopic';
import { OnChainEventLeveragePositionLiquidated } from './leverage_events/OnChainEventLeveragePositionLiquidated';

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
    const results = await Promise.all([
      this.createPSPEvent(eventLog),
      this.createLeverageEvent(eventLog),
    ]);

    const event = this.getEventObjectOrThrowError(results, eventLog);

    return event;
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

      case TOPIC_EVENT_LEVERAGE_POSITION_LIQUIDATED:
        return new OnChainEventLeveragePositionLiquidated(eventLog, this.logger, this.sqsService, this.configService);
    }

    return undefined;
  }

  private getEventObjectOrThrowError(results: [OnChainEvent | undefined, OnChainEvent | undefined],
      eventLog: ethers.providers.Log): OnChainEvent {
    if (results.every((result) => result === undefined)) {
      const errorMessage = `Unhandled event topic, ${eventLog.topics[0]}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    // this should NOT happen
    if (results.every((result) => result !== undefined)) {
      const errorMessage = `Multiple events detected, but expecting just one: ${eventLog.topics[0]}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    const event = results.find((result) => result !== undefined);

    return event as unknown as OnChainEvent;
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
