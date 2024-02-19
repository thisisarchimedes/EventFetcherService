import {expect} from 'chai';
import {ContractInfoPSP} from '../../src/types/ContractInfoPSP';
import {AppConfigClient} from '../../src/services/config/AppConfigClient';
import {ContractInfoLeverage} from '../../src/types/ContractInfoLeverage';


describe('Config Service - Demo Environment', function() {
  let appConfigClient: AppConfigClient;

  beforeEach(function() {
    appConfigClient = new AppConfigClient('Demo', 'us-east-1');
  });

  it('should fetch PSP strategies via AWS AppConfig', async function() {
    const strategies = JSON.parse(await appConfigClient.fetchConfigRawString('PSPStrategyInfo')) as ContractInfoPSP[];
    expect(strategies).to.not.be.undefined;
    expect(strategies!.length).to.be.greaterThan(1);
  });

  it('should fetch Leverage addresses via AWS AppConfig', async function() {
    const strategies = JSON.parse(await appConfigClient.fetchConfigRawString('LeverageContractInfo')) as ContractInfoLeverage[];
    expect(strategies).to.not.be.undefined;

    expect(strategies).to.not.be.undefined;
    expect(strategies!.length).to.be.greaterThan(1);

    const positionOpener = strategies.find((contract) => contract.name === 'PositionOpener');
    expect(positionOpener).to.not.be.undefined;

    const positionLiquidator = strategies.find((contract) => contract.name === 'PositionLiquidator');
    expect(positionLiquidator).to.not.be.undefined;

    const positionCloser = strategies.find((contract) => contract.name === 'PositionCloser');
    expect(positionCloser).to.not.be.undefined;
  });

  it('should fetch last block scanned', async function() {
    const lastBlockScannedStr = await appConfigClient.fetchConfigRawString('LastBlockScanned');
    const lastBlockScanned = parseInt(lastBlockScannedStr, 10);

    expect(lastBlockScanned).to.not.be.undefined;
    expect(lastBlockScanned).to.be.a('number');
    expect(lastBlockScanned).to.be.greaterThan(19243000);
  });

  it('should fetch RPC URL', async function() {
    const rpcURL = await appConfigClient.fetchConfigRawString('RpcUrl');

    expect(rpcURL).to.not.be.undefined;
    expect(rpcURL).to.be.a('string');
    expect(rpcURL).to.match(/^(http|https|wss):\/\//);
  });

  it('should fetch Alt RPC URL', async function() {
    const rpcURL = await appConfigClient.fetchConfigRawString('AltRpcUrl');

    expect(rpcURL).to.not.be.undefined;
    expect(rpcURL).to.be.a('string');
    expect(rpcURL).to.match(/^(http|https|wss):\/\//);
  });

  it('should fetch Events Fetch Page Size', async function() {
    const EventsFetchPageSizeStr = await appConfigClient.fetchConfigRawString('EventsFetchPageSize');
    const EventsFetchPageSize = parseInt(EventsFetchPageSizeStr, 10);

    expect(EventsFetchPageSize).to.not.be.undefined;
    expect(EventsFetchPageSize).to.be.a('number');
    expect(EventsFetchPageSize).to.be.greaterThan(1);
  });

  it('should fetch NewEventsQueueURL', async function() {
    const rpcURL = await appConfigClient.fetchConfigRawString('NewEventsQueueURL');

    expect(rpcURL).to.not.be.undefined;
    expect(rpcURL).to.be.a('string');
    expect(rpcURL).to.match(/^(http|https|wss):\/\//);
  });
});


