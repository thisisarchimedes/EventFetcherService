import {ethers} from 'ethers';
import {ConfigService} from '../config/ConfigService';

const BTCETH_ORACLE = '0xdeb288F737066589598e9214E782fa5A8eD689e8';
const ETH = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
export class OraclePriceFetcherRPC {
  private readonly configService: ConfigService;
  private readonly mainProvider: ethers.providers.Provider;
  private readonly altProvider: ethers.providers.Provider;
  private readonly tokenToWBTCOracleMap: Map<string, string> = new Map([
    [ETH, BTCETH_ORACLE],
  ]);

  constructor(configService: ConfigService) {
    this.configService = configService;
    this.mainProvider = new ethers.providers.JsonRpcProvider(configService.getMainRPCURL());
    this.altProvider = new ethers.providers.JsonRpcProvider(configService.getAlternativeRPCURL());
  }

  public async getTokenWBTCPrice(tokenAddress: string): Promise<bigint> {
    const oracleAddress = this.tokenToWBTCOracleMap.get(tokenAddress);
    if (!oracleAddress) {
      throw new Error('Oracle address not found for given token');
    }

    const oracleContract = new ethers.Contract(oracleAddress, [
      'function latestAnswer() view returns (int256)',
    ], this.mainProvider);

    const price = await oracleContract.latestAnswer();


    return BigInt(price);
  }
}
