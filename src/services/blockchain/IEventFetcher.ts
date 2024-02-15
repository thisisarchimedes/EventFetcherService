import {ethers} from 'ethers';

export interface IEventFetcher {

    getOnChainEvents(blockNumberFrom: number, blockNumberTo: number): Promise<ethers.providers.Log[]>;


}
