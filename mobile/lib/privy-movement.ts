import type { usePrivy } from '@privy-io/react-auth';
import { Aptos } from '@aptos-labs/ts-sdk';
import { createMovementClient, type MovementNetwork, MOVEMENT_CONFIGS } from '@siren/blockchain';

export { createMovementClient, type MovementNetwork, MOVEMENT_CONFIGS };


export function getPrivyWalletAddress(privy: ReturnType<typeof usePrivy>): string | null {
  const user = privy.user;
  if (!user?.wallet?.address) {
    return null;
  }
  return user.wallet.address;
}


export async function submitTransactionWithPrivy(
  privy: ReturnType<typeof usePrivy>,
  aptosClient: Aptos,
  aptosAccount: any, 
  transactionPayload: {
    function: `${string}::${string}::${string}`;
    functionArguments: any[];
  }
): Promise<{ hash: string; success: boolean }> {
  const user = privy.user;
  if (!user) {
    throw new Error('No Privy user found. Please login first.');
  }

  const transaction = await aptosClient.transaction.build.simple({
    sender: aptosAccount.accountAddress,
    data: transactionPayload,
  });

  const committedTxn = await aptosClient.signAndSubmitTransaction({
    signer: aptosAccount,
    transaction,
  });

  const executedTxn = await aptosClient.waitForTransaction({
    transactionHash: committedTxn.hash,
  });

  return {
    hash: executedTxn.hash,
    success: executedTxn.success ?? false,
  };
}


export function getMovementAddress(privy: ReturnType<typeof usePrivy>): string | null {
  const user = privy.user;
  if (!user?.id) {
    return null;
  }
  // The Movement address should be retrieved from database
  // using the Privy user ID, not from the wallet address directly
  // This is a placeholder - actual implementation queries database
  return null;
}

