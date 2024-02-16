import {expect} from 'chai';
import AWS from 'aws-sdk';
import {LeverageContractInfo as LeverageContractInfo} from '../../src/types/LeverageContractInfo';
import {ConfigServiceLocal} from '../../src/services/config/ConfigServiceLocal';
import dotenv from 'dotenv';

dotenv.config();

describe('Config Service Test', function() {
  let configService: ConfigServiceLocal;

  beforeEach(async function() {
    await initalizeObjectUnderTest();
  });

  async function initalizeObjectUnderTest(): Promise<void> {
    const s3ConfigBucket = process.env.S3_BUCKET_CONFIG || '';
    const s3LeverageInfoKey = process.env.S3_DEPLOYMENT_ADDRESS_KEY || '';
    configService = new ConfigServiceLocal(s3ConfigBucket, s3LeverageInfoKey);
    await configService.refreshConfig();
  }

  it('should get the correct leverage contract addresses when run locally', async function() {
    const ExpectedLeverageContractAddresses: LeverageContractInfo[] = await JSON.parse(await fetchStringFromS3(
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

  it('should get the correct PSP contract addresses when run locally', async function() {
    // const pspContractAddresses = await fetchPspContractAddresses();
  });

  function validateLeverageContractAddress(
      addresses: LeverageContractInfo[],
      contractName: string,
      actualAddress: string,
  ) {
    const expectedAddress = addresses.find((contract) => contract.name === contractName)?.address;
    expect(actualAddress).to.equal(expectedAddress);
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


