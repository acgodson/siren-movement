import type { Aptos, Account, InputEntryFunctionData } from '@aptos-labs/ts-sdk';

export interface SubmitSignalParams {
  registryAddress: string;
  signalType: number;
  lat: number;
  lon: number;
}

export function buildSubmitSignalTx(
  moduleAddress: string,
  params: SubmitSignalParams
): InputEntryFunctionData {
  const latInt = Math.floor((params.lat + 90) * 1_000_000);
  const lonInt = Math.floor((params.lon + 180) * 1_000_000);

  return {
    function: `${moduleAddress}::core::submit_signal`,
    functionArguments: [
      params.registryAddress,
      params.signalType,
      latInt,
      lonInt,
    ],
  };
}

export function buildInitProfileTx(moduleAddress: string): InputEntryFunctionData {
  return {
    function: `${moduleAddress}::reputation::init_profile`,
    functionArguments: [],
  };
}

export async function submitTransaction(
  client: Aptos,
  account: Account,
  payload: InputEntryFunctionData
) {
  const transaction = await client.transaction.build.simple({
    sender: account.accountAddress,
    data: payload,
  });

  const committedTxn = await client.signAndSubmitTransaction({
    signer: account,
    transaction,
  });

  const executedTransaction = await client.waitForTransaction({
    transactionHash: committedTxn.hash,
  });

  return executedTransaction;
}
