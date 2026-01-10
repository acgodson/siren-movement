import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

export const MOVEMENT_CONFIGS = {
  mainnet: {
    chainId: 126,
    name: "Movement Mainnet",
    fullnode: "https://full.mainnet.movementinfra.xyz/v1",
    explorer: "mainnet"
  },
  testnet: {
    chainId: 250,
    name: "Movement Testnet",
    fullnode: "https://testnet.movementnetwork.xyz/v1",
    explorer: "testnet"
  }
};

export const CURRENT_NETWORK = 'testnet' as keyof typeof MOVEMENT_CONFIGS;

export const aptos = new Aptos(
  new AptosConfig({
    network: Network.CUSTOM,
    fullnode: MOVEMENT_CONFIGS[CURRENT_NETWORK].fullnode,
  })
);

export const MODULE_ADDRESS = process.env.NEXT_PUBLIC_MODULE_ADDRESS || '0x1';
export const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || MODULE_ADDRESS;

export const toHex = (buffer: Uint8Array): string => {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

export const getExplorerUrl = (txHash: string): string => {
  const formattedHash = txHash.startsWith('0x') ? txHash : `0x${txHash}`;
  const network = MOVEMENT_CONFIGS[CURRENT_NETWORK].explorer;
  return `https://explorer.movementnetwork.xyz/txn/${formattedHash}?network=${network}`;
};
