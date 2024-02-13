import {ethers} from 'ethers';
import {ConfigServicePSP, PSPStrategyConfig} from '../services/config/configServicePSP';
import {Logger} from '@thisisarchimedes/backend-sdk';
import {OnChainEventPSPDeposit} from './OnChainEventPSPDeposit';
import {OnChainEventPSPWithdraw} from './OnChainEventPSPWithdraw';
import {OnChainEventPSP} from './OnChainEventPSP';

const TOPIC_EVENT_PSP_DEPOSIT = '0xdcbc1c05240f31ff3ad067ef1ee35ce4997762752e3a095284754544f4c709d7';
const TOPIC_EVENT_PSP_WITHDRAW = '0xfbde797d201c681b91056529119e0b02407c7bb96a4a2c75c01fc9667232c8db';

export class EventFactory {
  private configService: ConfigServicePSP;
  private logger: Logger;

  constructor(configService: ConfigServicePSP, logger: Logger) {
    this.configService = configService;
    this.logger = logger;
  }

  public createEvent(eventLog: ethers.providers.Log): OnChainEventPSP {
    let errorMessage;

    const strategyConfig = this.findStrategyConfigByEventContractAddress(eventLog.address);

    switch (eventLog.topics[0]) {
      case TOPIC_EVENT_PSP_DEPOSIT:
        return new OnChainEventPSPDeposit(eventLog, strategyConfig, this.logger);

      case TOPIC_EVENT_PSP_WITHDRAW:
        return new OnChainEventPSPWithdraw(eventLog, strategyConfig, this.logger);

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
