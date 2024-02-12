import {ethers} from 'ethers';

export interface EventFetcher {

    getOnChainEvents(blockNumberFrom: number, blockNumberTo: number): Promise<ethers.providers.Log[]>;


}
