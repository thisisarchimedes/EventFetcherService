import { ethers } from 'ethers';
import { ConfigServicePSP, PSPStrategyConfig } from '../services/config/configServicePSP';
import { Logger, ethers } from '@thisisarchimedes/backend-sdk';
import { cons } from 'fp-ts/lib/ReadonlyNonEmptyArray';
import { stat } from 'fs';
import { state } from 'fp-ts';
import { OnChainEventPSPDeposit } from './OnChainEventPSPDeposit';

const TOPIC_EVENT_PSP_DEPOSIT = '0xdcbc1c05240f31ff3ad067ef1ee35ce4997762752e3a095284754544f4c709d7';


export class EventFactory {
  private configService: ConfigServicePSP;
  private logger: Logger;

  constructor(configService: ConfigServicePSP, logger: Logger) {
    this.configService = configService;
    this.logger = logger;
  }

  public createEvent(eventLog: ethers.providers.Log): OnChainEvent {
    const strategyConfig = this.getPSPContractNameByAddress(eventLog);

    switch (eventLog.topics[0]) {
      case TOPIC_EVENT_PSP_DEPOSIT:
        return new OnChainEventPSPDeposit(eventLog, strategyConfig, this.logger);
    }
  }

  private getPSPContractNameByAddress(eventLog: ethers.providers.Log): PSPStrategyConfig {
    const count = this.configService.getStrategyCount();

    for (let i = 0; i < count; i++) {
      const strategy = this.configService.getStrategyConfigByIndex(i);
      if (strategy && strategy.strategyAddress.toLowerCase() === eventLog.address.toLowerCase()) {
        return strategy;
      }
    }

    throw new Error('Unknown strategy address');
  }
}
