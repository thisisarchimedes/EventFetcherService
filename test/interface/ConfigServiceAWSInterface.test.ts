import {expect} from 'chai';
import AWS from 'aws-sdk';
import dotenv from 'dotenv';

import {ConfigServiceAWS} from '../../src/services/config/ConfigServiceAWS';
import {ContractInfoPSP} from '../../src/types/ContractInfoPSP';

dotenv.config();

describe('Config Service Test', function() {
  let configService: ConfigServiceAWS;
  const ADDRESS_LENGTH = 42;

  beforeEach(async function() {
    await initalizeObjectUnderTest();
  });

  async function initalizeObjectUnderTest(): Promise<void> {
    configService = new ConfigServiceAWS('Demo', 'us-east-1');
    await configService.refreshConfig();
  }

  it('should get the correct leverage contract addresses from AWS', async function() {
    let address: string;

    address = await configService.getLeveragePositionOpenerAddress();
    expect(address.startsWith('0x')).to.be.true;
    expect(address.length).to.equal(ADDRESS_LENGTH);

    address = await configService.getLeveragePositionLiquidatorAddress();
    expect(address.startsWith('0x')).to.be.true;
    expect(address.length).to.equal(ADDRESS_LENGTH);

    address = await configService.getLeveragePositionCloserAddress();
    expect(address.startsWith('0x')).to.be.true;
    expect(address.length).to.equal(ADDRESS_LENGTH);
  });

  it('should get the correct PSP contract addresses from AWS', async function() {
    const ExpectedPSPContractInfo: ContractInfoPSP[] = await JSON.parse(await fetchStringFromS3(
        process.env.S3_BUCKET_CONFIG ?? '',
        process.env.PSP_STRATEGY_CONFIG_FILE ?? '',
    ));
    expect(ExpectedPSPContractInfo.length).to.be.greaterThan(0);

    ExpectedPSPContractInfo.forEach((contract) => {
      const expectedAddress = getExpectedPSPContractAddress(ExpectedPSPContractInfo, contract.strategyName);
      expect(expectedAddress).to.equal(configService.getPSPContractAddressByStrategyName(contract.strategyName));
    });

    const strategyCount: number = configService.getPSPStrategyCount();
    expect(strategyCount).to.equal(ExpectedPSPContractInfo.length);
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

  it('should retrieve last block scanned from AWS', function() {
    const lastBlockScanned: number = configService.getLastBlockScanned();
    expect(lastBlockScanned).to.be.gte(6000000);
  });

  it('should set last block scanned', async function() {
    const OriginalBlockScanned: number = configService.getLastBlockScanned();

    await configService.setLastScannedBlock(OriginalBlockScanned - 1);
    const newBlockScanned: number = configService.getLastBlockScanned();

    expect(newBlockScanned).to.not.be.undefined;
    expect(newBlockScanned).to.be.a('number');
    expect(newBlockScanned).to.be.equal(OriginalBlockScanned - 1);

    // reset the block scanned to original value
    await configService.setLastScannedBlock(OriginalBlockScanned);
  });

  it('should get main and alt RPC URL from AWS', function() {
    const mainRpcURL: string = configService.getMainRPCURL();
    expect(mainRpcURL.startsWith('http')).to.be.true;

    const altRpcURL: string = configService.getAlternativeRPCURL();
    expect(altRpcURL.startsWith('http')).to.be.true;
  });

  it('should retrieve page size from AWS', function() {
    const pageSize: number = configService.getEventsFetchPageSize();
    expect(pageSize).to.be.gte(100);
  });

  it('should retrieve event queue URL from AWS', function() {
    const url: string = configService.getEventQueueURL();
    expect(url.startsWith('https://')).to.be.true;
  });
});


