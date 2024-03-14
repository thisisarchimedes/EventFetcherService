import {ConfigService} from '../services/config/ConfigService';
import {Logger} from '@thisisarchimedes/backend-sdk';

import {OnChainEvent} from './OnChainEvent';
import {OnChainEventPSPDeposit} from './psp_events/OnChainEventPSPDeposit';
import {OnChainEventPSPWithdraw} from './psp_events/OnChainEventPSPWithdraw';
import {OnChainEventLeveragePositionOpened} from './leverage_events/OnChainEventLeveragePositionOpened';
import {OnChainEventLeveragePositionClosed} from './leverage_events/OnChainEventLeveragePositionClosed';
import {OnChainEventLeveragePositionLiquidated} from './leverage_events/OnChainEventLeveragePositionLiquidated';
import {OnChainEventLeveragePositionExpired} from './leverage_events/OnChainEventLeveragePositionExpired';

import {
  TOPIC_EVENT_LEVERAGE_POSITION_CLOSED,
  TOPIC_EVENT_LEVERAGE_POSITION_EXPIRED,
  TOPIC_EVENT_LEVERAGE_POSITION_LIQUIDATED,
  TOPIC_EVENT_LEVERAGE_POSITION_OPENED,
  TOPIC_EVENT_PSP_DEPOSIT,
  TOPIC_EVENT_PSP_WITHDRAW,
} from './EventTopic';
import {ethers} from 'ethers';

export class EventFactoryUnknownEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EventFactoryUnknownEventError';
  }
}

export class EventFactory {
  private configService: ConfigService;
  private logger: Logger;

  constructor(configService: ConfigService, logger: Logger) {
    this.configService = configService;
    this.logger = logger;
  }

  public createEvent(eventLog: ethers.providers.Log): OnChainEvent {
    let results: [OnChainEvent | undefined, OnChainEvent | undefined];

    if (eventLog === undefined) {
      throw new EventFactoryUnknownEventError('Event log has no topics');
    }

    try {
      results=[this.createPSPEvent(eventLog), this.createLeverageEvent(eventLog)];
    } catch (error) {
      this.logger.error(`Error creating event: ${error}`);
      throw error;
    }

    const event = this.getEventObjectOrThrowError(results, eventLog);

    return event;
  }

  private createPSPEvent(eventLog: ethers.providers.Log): OnChainEvent | undefined {
    if (this.isLogEventEmittedByPSPContract(eventLog) === false) {
      return undefined;
    }

    switch (eventLog.topics[0]) {
      case TOPIC_EVENT_PSP_DEPOSIT:
        return new OnChainEventPSPDeposit(eventLog, this.logger, this.configService);

      case TOPIC_EVENT_PSP_WITHDRAW:
        return new OnChainEventPSPWithdraw(eventLog, this.logger, this.configService);
    }

    return undefined;
  }

  private createLeverageEvent(eventLog: ethers.providers.Log): OnChainEvent | undefined {
    if (this.isLogEventEmittedByLeverageContract(eventLog) === false) {
      return undefined;
    }

    switch (eventLog.topics[0]) {
      case TOPIC_EVENT_LEVERAGE_POSITION_OPENED:
        return new OnChainEventLeveragePositionOpened(eventLog, this.logger, this.configService);

      case TOPIC_EVENT_LEVERAGE_POSITION_CLOSED:
        return new OnChainEventLeveragePositionClosed(eventLog, this.logger, this.configService);

      case TOPIC_EVENT_LEVERAGE_POSITION_LIQUIDATED:
        return new OnChainEventLeveragePositionLiquidated(eventLog, this.logger, this.configService);

      case TOPIC_EVENT_LEVERAGE_POSITION_EXPIRED:
        return new OnChainEventLeveragePositionExpired(eventLog, this.logger, this.configService);
    }

    return undefined;
  }

  private getEventObjectOrThrowError(results: [OnChainEvent | undefined, OnChainEvent | undefined],
      eventLog: ethers.providers.Log): OnChainEvent {
    if (results.every((result) => result === undefined)) {
      const errorMessage = `Unknown event topic, ${eventLog.topics[0]}`;
      this.logger.error(errorMessage);
      throw new EventFactoryUnknownEventError(errorMessage);
    }

    // this should NOT happen
    if (results.every((result) => result !== undefined)) {
      const errorMessage = `Multiple events detected, but expecting just one: ${eventLog.topics[0]}`;
      this.logger.error(errorMessage);
      throw new EventFactoryUnknownEventError(errorMessage);
    }

    const event = results.find((result) => result !== undefined);
    this.logger.info(`Event created: ${event?.getEventName()}`);

    return event as unknown as OnChainEvent;
  }

  private isLogEventEmittedByPSPContract(eventLog: ethers.providers.Log): boolean {
    const emitterAddress = eventLog.address;

    const res = this.configService.getPSPStrategyInfoByAddress(emitterAddress);
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
