import {ConfigService} from '../config/ConfigService';
import {Oracle} from './Oracle';
import {OracleETHAsBTC} from './OracleETHAsBTC';
import {isUndefined} from 'lodash';

const ETH = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'.toLowerCase();
const WBTC = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'.toLowerCase();

export class OracleFactory {
  private readonly configService: ConfigService;
  private static oracleMap: { [key: string]: typeof Oracle } = {};

  constructor(configService: ConfigService) {
    this.configService = configService;
  }

  static initializeOracleMap(): void {
    this.oracleMap[`${ETH}->${WBTC}`] = OracleETHAsBTC;
  }

  getOracle(fromTokenAddress: string, toTokenAddress: string): Oracle {
    const key = `${fromTokenAddress.toLowerCase()}->${toTokenAddress.toLowerCase()}`;

    const oracleType = OracleFactory.oracleMap[key];
    if (isUndefined(oracleType)) {
      throw new Error('Unsupported token pair for oracle');
    }
    return new oracleType(this.configService);
  }
}
