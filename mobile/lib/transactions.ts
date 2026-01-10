import {
  AccountAuthenticatorEd25519,
  Ed25519PublicKey,
  Ed25519Signature,
  generateSigningMessageForTransaction,
} from '@aptos-labs/ts-sdk';
import { aptos, toHex, MODULE_ADDRESS, REGISTRY_ADDRESS } from './aptos';

export interface SignRawHashFunction {
  (params: { address: string; chainType: 'aptos'; hash: `0x${string}` }): Promise<{
    signature: string;
  }>;
}

export function buildInitProfileTx() {
  return {
    function: `${MODULE_ADDRESS}::reputation::init_profile` as `${string}::${string}::${string}`,
    typeArguments: [],
    functionArguments: [],
  };
}

export function buildSubmitSignalTx(params: {
  signalType: number;
  lat: number;
  lon: number;
}) {
  const latInt = Math.floor((params.lat + 90) * 1_000_000);
  const lonInt = Math.floor((params.lon + 180) * 1_000_000);

  return {
    function: `${MODULE_ADDRESS}::core::submit_signal` as `${string}::${string}::${string}`,
    typeArguments: [],
    functionArguments: [REGISTRY_ADDRESS, params.signalType, latInt, lonInt],
  };
}

export async function submitTransaction(
  walletAddress: string,
  publicKeyHex: string,
  signRawHash: SignRawHashFunction,
  payload: any
): Promise<string> {
  try {
    const rawTxn = await aptos.transaction.build.simple({
      sender: walletAddress,
      data: payload,
    });

    const message = generateSigningMessageForTransaction(rawTxn);

    const { signature: rawSignature } = await signRawHash({
      address: walletAddress,
      chainType: 'aptos',
      hash: `0x${toHex(message)}`,
    });

    let cleanPublicKey = publicKeyHex.startsWith('0x') ? publicKeyHex.slice(2) : publicKeyHex;

    if (cleanPublicKey.length === 66) {
      cleanPublicKey = cleanPublicKey.slice(2);
    }

    const senderAuthenticator = new AccountAuthenticatorEd25519(
      new Ed25519PublicKey(cleanPublicKey),
      new Ed25519Signature(rawSignature.startsWith('0x') ? rawSignature.slice(2) : rawSignature)
    );

    const committedTransaction = await aptos.transaction.submit.simple({
      transaction: rawTxn,
      senderAuthenticator,
    });

    const executed = await aptos.waitForTransaction({
      transactionHash: committedTransaction.hash,
    });

    if (!executed.success) {
      throw new Error('Transaction failed');
    }

    return committedTransaction.hash;
  } catch (error) {
    console.error('Error submitting transaction:', error);
    throw error;
  }
}
