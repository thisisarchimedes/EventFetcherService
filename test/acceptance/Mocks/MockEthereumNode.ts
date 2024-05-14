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
  private path: string;

  constructor(url: string) {
    super();
    const {baseUrl, path} = this.splitUrl(url);
    this.baseUrl = baseUrl;
    this.path = path;
  }

  public mockEventResponse(responsePath: string, address?: string) {
    const dataRaw = fs.readFileSync(responsePath, 'utf8');
    let mockData: ethers.providers.Log[] = JSON.parse(dataRaw);
    if (address) {
      mockData = mockData.map((log) => {
        log.address = address;
        return log;
      });
    }

    nock(this.baseUrl)
        .persist()
        .post(this.path, (body: EthereumRpcRequest) => body.method === 'eth_getLogs')
        .reply(200, (uri: string, body: EthereumRpcRequest) => ({
          jsonrpc: '2.0',
          id: body.id,
          result: mockData,
        }));
  }

  public mockChainId(chainId: string = '0x1') {
    nock(this.baseUrl)
        .persist()
        .post(this.path, (body: EthereumRpcRequest) => body.method === 'eth_chainId')
        .reply(200, (uri: string, body: EthereumRpcRequest) => ({
          jsonrpc: '2.0',
          id: body.id,
          result: chainId,
        }));
  }

  public mockBlockNumber(blockNumber: string = '0x5B8D80') {
    nock(this.baseUrl)
        .persist()
        .post(
            this.path,
            (body: EthereumRpcRequest) => body.method === 'eth_blockNumber',
        )
        .reply(200, (uri: string, body: EthereumRpcRequest) => ({
          jsonrpc: '2.0',
          id: body.id,
          result: blockNumber,
        }));
  }

  public mockGetBalance(balance: string = '0x8AC7230489E80000') {
    nock(this.baseUrl)
        .persist()
        .post(
            this.path,
            (body: EthereumRpcRequest) => body.method === 'eth_getBalance',
        )
        .reply(200, (uri: string, body: EthereumRpcRequest) => ({
          jsonrpc: '2.0',
          id: body.id,
          result: balance,
        }));
  }

  public cleanup() {
    nock.cleanAll();
  }


  private splitUrl(urlString: string): { baseUrl: string, path: string } {
    try {
      const url = new URL(urlString);
      return {
        baseUrl: `${url.protocol}//${url.host}`,
        path: `${url.pathname}${url.search}${url.hash}`,
      };
    } catch (error) {
      throw new Error('Invalid URL provided');
    }
  }
}
