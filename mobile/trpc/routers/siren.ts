import { z } from 'zod';
import { createTRPCRouter, baseProcedure } from '../init';
import {
  createMovementClient,
  getAllSignals,
  getReputation,
} from '@siren/blockchain';
import { fundNewUserWallet, checkNeedsFunding } from '../../lib/sponsor-funding';

const MODULE_ADDRESS = process.env.NEXT_PUBLIC_MODULE_ADDRESS || '0x1';
const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || MODULE_ADDRESS;
const MOVEMENT_NETWORK = (process.env.NEXT_PUBLIC_MOVEMENT_NETWORK || 'testnet') as 'testnet' | 'mainnet';
const movementClient = createMovementClient(MOVEMENT_NETWORK);

export const sirenRouter = createTRPCRouter({
  getBalance: baseProcedure
    .input(z.object({ address: z.string() }))
    .query(async ({ input }) => {
      try {
        const balance = await movementClient.getAccountAPTAmount({
          accountAddress: input.address,
        });

        return { balance, balanceMOVE: balance / 100_000_000 };
      } catch (error) {
        return { balance: 0, balanceMOVE: 0 };
      }
    }),

  fundWallet: baseProcedure
    .input(z.object({ address: z.string() }))
    .mutation(async ({ input }) => {
      const needsFunding = await checkNeedsFunding(input.address, MOVEMENT_NETWORK);

      if (!needsFunding) {
        return { success: true, alreadyFunded: true };
      }

      const result = await fundNewUserWallet(input.address, MOVEMENT_NETWORK);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fund wallet');
      }

      return { success: true, alreadyFunded: false, txHash: result.txHash };
    }),

  getAllSignals: baseProcedure.query(async () => {
    try {
      if (MODULE_ADDRESS === '0x1' || MODULE_ADDRESS.includes('YOUR_MODULE_ADDRESS')) {
        console.warn('MODULE_ADDRESS not configured, returning empty signals');
        return [];
      }
      const signals = await getAllSignals(movementClient, MODULE_ADDRESS, REGISTRY_ADDRESS);
      return signals;
    } catch (error) {
      console.error('Error fetching signals:', error);
      return [];
    }
  }),

  getReputation: baseProcedure
    .input(z.object({ address: z.string() }))
    .query(async ({ input }) => {
      try {
        if (MODULE_ADDRESS === '0x1' || MODULE_ADDRESS.includes('YOUR_MODULE_ADDRESS')) {
          console.warn('MODULE_ADDRESS not configured, returning 0 reputation');
          return { reputation: 0 };
        }
        const reputation = await getReputation(movementClient, MODULE_ADDRESS, input.address);
        return { reputation };
      } catch (error) {
        console.error('Error fetching reputation:', error);
        return { reputation: 0 };
      }
    }),
});
