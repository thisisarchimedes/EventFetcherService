import {expect} from 'chai';
import AWS from 'aws-sdk';
import dotenv from 'dotenv';

import {ContractInfoLeverage as ContractInfoLeverage} from '../../src/types/ContractInfoLeverage';
import {ConfigServiceLocal} from '../../src/services/config/ConfigServiceLocal';
import {ContractInfoPSP} from '../../src/types/ContractInfoPSP';

dotenv.config();

describe('Config Service Test', function() {
  let configService: ConfigServiceLocal;

  beforeEach(async function() {
    await initalizeObjectUnderTest();
  });

  async function initalizeObjectUnderTest(): Promise<void> {
    const s3ConfigBucket = process.env.S3_BUCKET_CONFIG || '';
    const s3LeverageInfoKey = process.env.S3_DEPLOYMENT_ADDRESS_KEY || '';
    const s3PSPInfoKey = process.env.PSP_STRATEGY_CONFIG_FILE || '';

    configService = new ConfigServiceLocal(s3ConfigBucket, s3LeverageInfoKey, s3PSPInfoKey);
    await configService.refreshConfig();
  }

  it('should get the correct leverage contract addresses when run locally', async function() {
    const ExpectedLeverageContractAddresses: ContractInfoLeverage[] = await JSON.parse(await fetchStringFromS3(
        process.env.S3_BUCKET_CONFIG ?? '',
        process.env.S3_DEPLOYMENT_ADDRESS_KEY ?? '',
    ));

    validateLeverageContractAddress(
        ExpectedLeverageContractAddresses,
        'PositionOpener',
        configService.getLeveragePositionOpenerAddress(),
    );
    validateLeverageContractAddress(
        ExpectedLeverageContractAddresses,
        'PositionLiquidator',
        configService.getLeveragePositionLiquidatorAddress(),
    );
    validateLeverageContractAddress(
        ExpectedLeverageContractAddresses,
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

  it('should get the correct PSP contract addresses when run locally', async function() {
    const ExpectedPSPContractInfo: ContractInfoPSP[] = await JSON.parse(await fetchStringFromS3(
        process.env.S3_BUCKET_CONFIG ?? '',
        process.env.PSP_STRATEGY_CONFIG_FILE ?? '',
    ));
    expect(ExpectedPSPContractInfo.length).to.be.greaterThan(0);

    ExpectedPSPContractInfo.forEach((contract) => {
      const expectedAddress = getExpectedPSPContractAddress(ExpectedPSPContractInfo, contract.strategyName);
      expect(expectedAddress).to.equal(configService.getPSPContractAddress(contract.strategyName));
    });
  });

  function getExpectedPSPContractAddress(
      addresses: ContractInfoPSP[],
      strategyName: string,
  ): string {
    return (addresses.find((contract) => contract.strategyName === strategyName)?.strategyAddress) as string;
  }

  async function fetchStringFromS3(bucket: string, key: string): Promise<string> {
    const awsS3Client = createAwsS3Client();

    const params = {Bucket: bucket, Key: key};
    const data = await awsS3Client.getObject(params).promise();
    const configData = data.Body?.toString() ?? '';
    return configData;
  }

  function createAwsS3Client() {
    return new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
  }
});


