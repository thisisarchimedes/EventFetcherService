import {Signer, providers} from 'ethers';
import * as factories from '../types/leverage-contracts/factories';
import EthereumAddress from '../utils/EthereumAddress';

export default class InteractionContracts {
  static readonly erc20 = (address: EthereumAddress, provider: Signer | providers.Provider) =>
    factories.ERC20__factory.connect(address.toString(), provider);

  static readonly multiPoolStrategy = (address: EthereumAddress, provider: Signer | providers.Provider) =>
    factories.MultiPoolStrategy__factory.connect(address.toString(), provider);

  static readonly adapter = (address: EthereumAddress, provider: Signer | providers.Provider) =>
    factories.IAdapter__factory.connect(address.toString(), provider);

  static readonly auraComposableStablePoolAdapter = (address: EthereumAddress, provider: Signer | providers.Provider) =>
    factories.AuraComposableStablePoolAdapter__factory.connect(address.toString(), provider);

  static readonly auraStablePoolAdapter = (address: EthereumAddress, provider: Signer | providers.Provider) =>
    factories.AuraStablePoolAdapter__factory.connect(address.toString(), provider);

  static readonly auraWeightedPoolAdapter = (address: EthereumAddress, provider: Signer | providers.Provider) =>
    factories.AuraWeightedPoolAdapter__factory.connect(address.toString(), provider);

  static readonly convexPoolAdapter = (address: EthereumAddress, provider: Signer | providers.Provider) =>
    factories.ConvexPoolAdapter__factory.connect(address.toString(), provider);

  static readonly curvePool = (address: EthereumAddress, provider: Signer | providers.Provider) =>
    factories.CurvePool__factory.connect(address.toString(), provider);
}
