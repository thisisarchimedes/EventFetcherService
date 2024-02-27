import {ethers} from 'ethers';
import {Oracle} from './Oracle';

const ORACLE_CHAINLINK_BTCETH = '0xdeb288F737066589598e9214E782fa5A8eD689e8';
const ORACLE_DECIMALS = 8;

export class OracleETHAsBTC extends Oracle {
  public async getTokenPrice(): Promise<number> {
    const oracleContract = new ethers.Contract(ORACLE_CHAINLINK_BTCETH, [
      'function latestAnswer() view returns (int256)',
    ], this.mainProvider);

    const price = BigInt(await oracleContract.latestAnswer()) / BigInt(Math.pow(10, ORACLE_DECIMALS));
    return Number(price);
  }
}
