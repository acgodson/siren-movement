import { Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import { createMovementClient, type MovementNetwork } from "@siren/blockchain";

const SPONSOR_PRIVATE_KEY = process.env.SPONSOR_PRIVATE_KEY;
const SPONSOR_ADDRESS = process.env.SPONSOR_ADDRESS;
const FUNDING_AMOUNT_OCTAS = 10_000_000;

if (!SPONSOR_PRIVATE_KEY || !SPONSOR_ADDRESS) {
  console.warn("⚠️  SPONSOR_PRIVATE_KEY or SPONSOR_ADDRESS not set. Auto-funding will be disabled.");
}

export async function fundNewUserWallet(
  recipientAddress: string,
  network: MovementNetwork = "testnet"
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    if (!SPONSOR_PRIVATE_KEY || !SPONSOR_ADDRESS) {
      return {
        success: false,
        error: "Sponsor credentials not configured",
      };
    }

    const aptos = createMovementClient(network);
    const privateKey = new Ed25519PrivateKey(SPONSOR_PRIVATE_KEY);
    const sponsorAccount = Account.fromPrivateKey({ privateKey });

    console.log(`💰 Funding ${recipientAddress} with ${FUNDING_AMOUNT_OCTAS / 1_000_000} MOVE...`);

    const transaction = await aptos.transaction.build.simple({
      sender: sponsorAccount.accountAddress,
      data: {
        function: "0x1::aptos_account::transfer",
        functionArguments: [recipientAddress, FUNDING_AMOUNT_OCTAS],
      },
    });

    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: sponsorAccount,
      transaction,
    });

    const executedTxn = await aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    console.log(`✅ Funded ${recipientAddress} - TX: ${executedTxn.hash}`);

    return {
      success: true,
      txHash: executedTxn.hash,
    };
  } catch (error) {
    console.error("❌ Failed to fund user wallet:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function checkNeedsFunding(
  address: string,
  network: MovementNetwork = "testnet"
): Promise<boolean> {
  try {
    const aptos = createMovementClient(network);
    const balance = await aptos.getAccountAPTAmount({
      accountAddress: address,
    });

    const MINIMUM_BALANCE = 5_000_000;
    return balance < MINIMUM_BALANCE;
  } catch (error) {
    if (error instanceof Error && error.message.includes("Account not found")) {
      return true;
    }
    console.error("Error checking balance:", error);
    return false;
  }
}
