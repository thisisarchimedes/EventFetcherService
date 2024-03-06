import fs from 'fs';
import nock from 'nock';
import {ethers} from 'ethers';
import {Mock} from './Mock';

interface EthereumRpcRequest {
  jsonrpc: string;
  method: string;
  params: string;
  id?: number | string;
}

export class MockEthereumNode extends Mock {
  private baseUrl: string;

  constructor(baseUrl: string) {
    super();
    this.baseUrl = baseUrl;
  }

  public mockEventResponse(responsePath: string) {
    const dataRaw = fs.readFileSync(responsePath, 'utf8');
    const mockData: ethers.providers.Log[] = JSON.parse(dataRaw);

    nock(this.baseUrl)
        .persist()
        .post('/', (body: EthereumRpcRequest) => body.method === 'eth_getLogs')
        .reply(200, (uri: string, body: EthereumRpcRequest) => ({
          jsonrpc: '2.0',
          id: body.id,
          result: mockData,
        }));
  }

  public mockChainId(chainId: string = '0x1') {
    nock(this.baseUrl)
        .persist()
        .post('/', (body: EthereumRpcRequest) => body.method === 'eth_chainId')
        .reply(200, (uri: string, body: EthereumRpcRequest) => ({
          jsonrpc: '2.0',
          id: body.id,
          result: chainId,
        }));
  }

  public mockBlockNumber(blockNumber: string = '0x5B8D80') {
    nock(this.baseUrl)
        .persist()
        .post('/', (body: EthereumRpcRequest) => body.method === 'eth_blockNumber')
        .reply(200, (uri: string, body: EthereumRpcRequest) => ({
          jsonrpc: '2.0',
          id: body.id,
          result: blockNumber,
        }));
  }

  public cleanup() {
    nock.cleanAll();
  }
}
