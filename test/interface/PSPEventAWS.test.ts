import {S3Service, SQSService, Logger} from '@thisisarchimedes/backend-sdk';

import {expect} from 'chai';
import {ethers} from 'hardhat';
import {Contract} from 'ethers';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';
import {ConfigServicePSP} from '../../src/services/ConfigServicePSP';


// Set up Chai to use the sinonChai and chaiAsPromised plugins
chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('AWS Interface Test', function() {

  it('should be able to read strategy address from the JSON file on AWS S3', async function() {

    const pspConfig = new ConfigServicePSP('smart-contract-backend-config', 'strategies-production.json');

    await pspConfig.refreshStrategyConfig();
    const address = pspConfig.getStrategyConfigByIndex(0)?.strategyAddress;

    expect(address).to.be.an('string');
    expect(address).to.have.lengthOf(42);

  });

  
});

