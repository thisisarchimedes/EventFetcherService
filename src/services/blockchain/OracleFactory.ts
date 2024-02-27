import {ConfigService} from '../config/ConfigService';
import {Oracle} from './Oracle';
import {OracleETHAsBTC} from './oracles/OracleETHAsBTC';
import {isUndefined} from 'lodash';

const ETH = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'.toLowerCase();
const WBTC = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'.toLowerCase();

export class UnsupportedTokenPairError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedTokenPairError';
    Object.setPrototypeOf(this, UnsupportedTokenPairError.prototype);
  }
}

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

    const OracleType = OracleFactory.oracleMap[key];
    if (isUndefined(OracleType)) {
      throw new UnsupportedTokenPairError('Unsupported token pair for oracle');
    }
    return new OracleType(this.configService);
  }
}
