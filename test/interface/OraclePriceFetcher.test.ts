import {expect} from 'chai';
import {OraclePriceFetcherRPC} from '../../src/services/blockchain/OraclePriceFetcherRPC';
import dotenv from 'dotenv';
import {ConfigServiceAWS} from '../../src/services/config/ConfigServiceAWS';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

dotenv.config();

describe('Fetch on-chain price from Chainlink oracle', function() {
  const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
  const ETH = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
  let configService: ConfigServiceAWS;
  let oraclePriceFetcherRPC: OraclePriceFetcherRPC;

  before(async function() {
    const region = process.env.AWS_REGION as string;
    const environment = process.env.ENVIRONMENT as string;
    configService = new ConfigServiceAWS(environment, region);
    await configService.refreshConfig();
  });

  beforeEach(function() {
    oraclePriceFetcherRPC = new OraclePriceFetcherRPC(configService);
  });

  it('should throw an error if no oracle found for the token', async function() {
    await expect(oraclePriceFetcherRPC.getTokenWBTCPrice('0x123'))
        .to.be.rejectedWith('Oracle address not found for given token');
  });

  it('should fetch ETH price in WBTC', async function() {
    const USDCWBTCPrice: bigint = await oraclePriceFetcherRPC.getTokenWBTCPrice(ETH);

    expect(USDCWBTCPrice > 0n).to.be.true;
  });
});
