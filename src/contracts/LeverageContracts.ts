import {Signer, providers} from 'ethers';
import * as factories from '../types/leverage-contracts/factories';
import EthereumAddress from '../utils/EthereumAddress';

export default class LeverageContracts {
  static readonly expiredVault = (address: EthereumAddress, provider: Signer | providers.Provider) =>
    factories.ExpiredVault__factory.connect(address.toString(), provider);

  static readonly leverageDepositor = (address: EthereumAddress, provider: Signer | providers.Provider) =>
    factories.LeverageDepositor__factory.connect(address.toString(), provider);

  static readonly leveragedStrategy = (address: EthereumAddress, provider: Signer | providers.Provider) =>
    factories.LeveragedStrategy__factory.connect(address.toString(), provider);

  static readonly oracleManager = (address: EthereumAddress, provider: Signer | providers.Provider) =>
    factories.OracleManager__factory.connect(address.toString(), provider);

  static readonly positionCloser = (address: EthereumAddress, provider: Signer | providers.Provider) =>
    factories.PositionCloser__factory.connect(address.toString(), provider);

  static readonly positionLedger = (address: EthereumAddress, provider: Signer | providers.Provider) =>
    factories.PositionLedger__factory.connect(address.toString(), provider);

  static readonly positionLiquidator = (address: EthereumAddress, provider: Signer | providers.Provider) =>
    factories.PositionLiquidator__factory.connect(address.toString(), provider);

  static readonly positionExpirator = (address: EthereumAddress, provider: Signer | providers.Provider) =>
    factories.PositionExpirator__factory.connect(address.toString(), provider);

  static readonly positionOpener = (address: EthereumAddress, provider: Signer | providers.Provider) =>
    factories.PositionOpener__factory.connect(address.toString(), provider);

  static readonly positionToken = (address: EthereumAddress, provider: Signer | providers.Provider) =>
    factories.PositionToken__factory.connect(address.toString(), provider);

  static readonly protocolParameters = (address: EthereumAddress, provider: Signer | providers.Provider) =>
    factories.ProtocolParameters__factory.connect(address.toString(), provider);

  static readonly proxyAdmin = (address: EthereumAddress, provider: Signer | providers.Provider) =>
    factories.ProxyAdmin__factory.connect(address.toString(), provider);

  static readonly swapManager = (address: EthereumAddress, provider: Signer | providers.Provider) =>
    factories.SwapManager__factory.connect(address.toString(), provider);

  static readonly wbtcVault = (address: EthereumAddress, provider: Signer | providers.Provider) =>
    factories.WBTCVault__factory.connect(address.toString(), provider);
}
