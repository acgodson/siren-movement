import { createTRPCRouter, baseProcedure } from '../init';
import { sirenRouter } from './siren';

export const appRouter = createTRPCRouter({
  siren: sirenRouter,
  health: baseProcedure.query(async () => {
    return {
      success: true,
      message: 'Siren API running',
      timestamp: new Date().toISOString(),
    };
  }),
});

export type AppRouter = typeof appRouter;
