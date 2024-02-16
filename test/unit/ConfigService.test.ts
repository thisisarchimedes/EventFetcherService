import {expect} from 'chai';
import fs from 'fs';
import util from 'util';

import {ContractInfoLeverage} from '../../src/types/ContractInfoLeverage';
import {ConfigServiceAdapter} from '../../test/adapters/ConfigServiceAdapter';
import dotenv from 'dotenv';

dotenv.config();
const readFile = util.promisify(fs.readFile);


describe('Config Service Test', function() {
  let configService: ConfigServiceAdapter;
  const leverageAddressesFile: string = 'test/data/leverageAddresses.json';


  beforeEach(async function() {
    configService = new ConfigServiceAdapter('demo');
    configService.setLeverageAddressesFile(leverageAddressesFile);
    await configService.refreshConfig();
  });

  it('should get the correct leverage contract addresses when run locally', async function() {
    const leverageContractAddresses = await fetchLeverageContractAddresses();

    validateLeverageContractAddress(
        leverageContractAddresses,
        'PositionOpener',
        configService.getLeveragePositionOpenerAddress(),
    );
    validateLeverageContractAddress(
        leverageContractAddresses,
        'PositionLiquidator',
        configService.getLeveragePositionLiquidatorAddress(),
    );
    validateLeverageContractAddress(
        leverageContractAddresses,
        'PositionCloser',
        configService.getLeveragePositionCloserAddress(),
    );
  });

  function validateLeverageContractAddress(
      addresses: ContractInfoLeverage[],
      contractName: string,
      actualAddress: string,
  ) {
    const expectedAddress = addresses.find((contract) => contract.name === contractName)?.address;
    expect(actualAddress).to.equal(expectedAddress);
  }

  async function fetchLeverageContractAddresses(): Promise<ContractInfoLeverage[]> {
    const data = await readFile(leverageAddressesFile, 'utf-8');
    return JSON.parse(data);
  }
});

/*

[X] Test locally: Can retrieve all the leverage contract addresses
[] Test locally: Can retrieve all the PSP contract addresses
[] Test locally: Can retrieve all the other correct values locally

[] Test AWS: Can retrieve all the leverage contract addresses
[] Test AWS: Can retrieve all the PSP contract addresses
[] Test AWS: Can retrieve all the other correct values locally

[] Can generate the correct config object (local/AWS)
[] Loads the correct values for demo/stable/prod


*/
