import {expect} from 'chai';
import AWS from 'aws-sdk';
import {LeverageContractInfo as LeverageContractInfo} from '../../src/types/LeverageContractInfo';
import {ConfigServiceLocal} from '../../src/services/config/ConfigServiceLocal';
import dotenv from 'dotenv';

dotenv.config();

describe('Config Service Test', function() {
  let awsS3Client: AWS.S3;
  let configService: ConfigServiceLocal;

  beforeEach(async function() {
    awsS3Client = createAwsS3Client();
    configService = new ConfigServiceLocal('demo');
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

  function createAwsS3Client() {
    return new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
  }

  async function fetchLeverageContractAddresses(): Promise<LeverageContractInfo[]> {
    const params = getS3Params();
    const data = await awsS3Client.getObject(params).promise();
    const configData = data.Body?.toString() ?? '';
    return JSON.parse(configData);
  }

  function getS3Params() {
    const bucket = process.env.S3_BUCKET_CONFIG || '';
    const key = process.env.S3_DEPLOYMENT_ADDRESS_KEY || '';
    if (!bucket || !key) throw new Error('S3 bucket or key is undefined.');
    return {Bucket: bucket, Key: key};
  }
});
