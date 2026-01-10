import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';


export const MOVEMENT_CONFIGS = {
  testnet: {
    chainId: 250,
    name: "Movement Testnet",
    fullnode: "https://testnet.movementnetwork.xyz/v1",
    faucet: "https://faucet.testnet.movementnetwork.xyz",
    explorer: "testnet",
  },
  mainnet: {
    chainId: 126,
    name: "Movement Mainnet",
    fullnode: "https://full.mainnet.movementinfra.xyz/v1",
    explorer: "mainnet",
  },
} as const;

export type MovementNetwork = keyof typeof MOVEMENT_CONFIGS;


export function createClient(network: Network = Network.TESTNET) {
  const config = new AptosConfig({ network });
  return new Aptos(config);
}


export function createMovementClient(network: MovementNetwork = 'testnet'): Aptos {
  const config = new AptosConfig({
    network: Network.CUSTOM,
    fullnode: MOVEMENT_CONFIGS[network].fullnode,
    faucet: network === 'testnet' ? MOVEMENT_CONFIGS[network].faucet : undefined,
  });
  return new Aptos(config);
}

export const testnetClient = createClient(Network.TESTNET);
export const mainnetClient = createClient(Network.MAINNET);
