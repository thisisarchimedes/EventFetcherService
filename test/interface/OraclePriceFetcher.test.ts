import {expect} from 'chai';
import dotenv from 'dotenv';
import {ConfigServiceAWS} from '../../src/services/config/ConfigServiceAWS';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {OracleFactory} from '../../src/services/blockchain/OracleFactory';

chai.use(chaiAsPromised);

dotenv.config();

describe('Fetch on-chain price from Chainlink oracle', function() {
  const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
  const ETH = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
  const WBTC = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';

  let configService: ConfigServiceAWS;
  let oracleFactory: OracleFactory;

  before(async function() {
    const region = process.env.AWS_REGION as string;
    const environment = process.env.ENVIRONMENT as string;
    configService = new ConfigServiceAWS(environment, region);
    await configService.refreshConfig();

    oracleFactory = new OracleFactory(configService);
    OracleFactory.initializeOracleMap();
  });


  it('should throw an error if no oracle found for the token', function() {
    expect(() => oracleFactory.getOracle('0x1', '0x2'))
        .to.throw('Unsupported token pair for oracle');
  });

  it('should fetch ETH price in WBTC', async function() {
    const oracle = oracleFactory.getOracle(ETH, WBTC);
    const USDCWBTCPrice: number = await oracle.getTokenPrice();
    expect(USDCWBTCPrice > 0).to.be.true;
  });
});
