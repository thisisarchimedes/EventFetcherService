import {ethers} from 'ethers';
import {ConfigServicePSP, PSPStrategyConfig} from '../services/config/configServicePSP';
import {Logger} from '@thisisarchimedes/backend-sdk';
import {OnChainEventPSPDeposit} from './OnChainEventPSPDeposit';

const TOPIC_EVENT_PSP_DEPOSIT = '0xdcbc1c05240f31ff3ad067ef1ee35ce4997762752e3a095284754544f4c709d7';

export class EventFactory {
  private configService: ConfigServicePSP;
  private logger: Logger;

  constructor(configService: ConfigServicePSP, logger: Logger) {
    this.configService = configService;
    this.logger = logger;
  }

  public createEvent(eventLog: ethers.providers.Log): OnChainEventPSPDeposit {
    let strategyConfig;
    let errorMessage;

    switch (eventLog.topics[0]) {
      case TOPIC_EVENT_PSP_DEPOSIT:
        strategyConfig = this.findStrategyConfigByEventContractAddress(eventLog.address);
        return new OnChainEventPSPDeposit(eventLog, strategyConfig, this.logger);

      default:
        errorMessage = `Unhandled event topic: ${eventLog.topics[0]}`;
        this.logger.error(errorMessage);
        throw new Error(errorMessage);
    }
  }

  private findStrategyConfigByEventContractAddress(eventAddress: string): PSPStrategyConfig {
    const strategyCount = this.configService.getStrategyCount();
    for (let i = 0; i < strategyCount; i++) {
      const strategy = this.configService.getStrategyConfigByIndex(i);
      if (strategy?.strategyAddress.toLowerCase() === eventAddress.toLowerCase()) {
        return strategy;
      }
    }

    const errorMessage = `Unknown strategy address: ${eventAddress}`;
    this.logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}
