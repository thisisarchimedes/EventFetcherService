import {ethers} from 'ethers';
import {ConfigService} from '../services/config/ConfigService';
import {Logger} from '@thisisarchimedes/backend-sdk';
import {OnChainEventPSPDeposit} from './OnChainEventPSPDeposit';
import {OnChainEventPSPWithdraw} from './OnChainEventPSPWithdraw';
import {OnChainEventPSP} from './OnChainEventPSP';
import {ContractInfoPSP} from '../types/ContractInfoPSP';

const TOPIC_EVENT_PSP_DEPOSIT = '0xdcbc1c05240f31ff3ad067ef1ee35ce4997762752e3a095284754544f4c709d7';
const TOPIC_EVENT_PSP_WITHDRAW = '0xfbde797d201c681b91056529119e0b02407c7bb96a4a2c75c01fc9667232c8db';

export class EventFactory {
  private configService: ConfigService;
  private logger: Logger;

  constructor(configService: ConfigService, logger: Logger) {
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

  private findStrategyConfigByEventContractAddress(eventAddress: string): ContractInfoPSP {
    const res = this.configService.getPSPStrategyInfoByAddress(eventAddress);
    if (res === undefined) {
      throw new Error(`Unknown strategy address: ${eventAddress}`);
    }

    return res;
  }
}
