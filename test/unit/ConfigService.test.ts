import {expect} from 'chai';
import AWS from 'aws-sdk';
import {ContractAddress} from '../../src/types/ContractAddress';
import {ConfigServiceLocal} from '../../src/services/config/ConfigServiceLocal';
import dotenv from 'dotenv';

dotenv.config();

describe('Config Service Test', function() {
  it('should get the correct leverage contract addresses when run locally', async function() {
    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });

    const params = {
      Bucket: process.env.S3_BUCKET_CONFIG || '',
      Key: process.env.S3_DEPLOYMENT_ADDRESS_KEY || '',
    };
    if (!params.Bucket || !params.Key) {
      throw new Error('S3 bucket or key is undefined.');
    }
    const data = await s3.getObject(params).promise();
    const expectedConfig = data.Body.toString();
    const leverageContractAddresses: ContractAddress[] = JSON.parse(expectedConfig);


    const configService = new ConfigServiceLocal('demo');
    await configService.refreshConfig();

    const positionOpenerAddress = leverageContractAddresses.find((contract) => contract.name === 'PositionOpener');
    console.log(positionOpenerAddress?.address, ' === ', configService.getLeveragePositionOpenerAddress());
    expect(configService.getLeveragePositionOpenerAddress()).to.equal(positionOpenerAddress?.address);

    const positionLiquidatorAddress = leverageContractAddresses.find((contract) =>
      contract.name === 'PositionLiquidator');
    expect(configService.getLeveragePositionLiquidatorAddress()).to.equal(positionLiquidatorAddress?.address);

    const positionCloserAddress = leverageContractAddresses.find((contract) => contract.name === 'PositionCloser');
    expect(configService.getLeveragePositionCloserAddress()).to.equal(positionCloserAddress?.address);

  });
});

/*

[] Test locally: Can retrieve all the leverage contract addresses
[] Test locally: Can retrieve all the PSP contract addresses
[] Test locally: Can retrieve all the other correct values locally

[] Test AWS: Can retrieve all the leverage contract addresses
[] Test AWS: Can retrieve all the PSP contract addresses
[] Test AWS: Can retrieve all the other correct values locally

[] Can generate the correct config object (local/AWS)
[] Loads the correct values for demo/stable/prod


*/
