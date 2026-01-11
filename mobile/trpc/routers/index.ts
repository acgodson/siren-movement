import { createTRPCRouter, baseProcedure } from '../init';
import { sirenRouter } from './siren';
import { measurementsRouter } from './measurements';
import { imageRouter } from './image';
import { audioRouter } from './audio';

export const appRouter = createTRPCRouter({
  siren: sirenRouter,
  measurements: measurementsRouter,
  image: imageRouter,
  audio: audioRouter,
  health: baseProcedure.query(async () => {
    return {
      success: true,
      message: 'Siren API running',
      timestamp: new Date().toISOString(),
    };
  }),
});

export type AppRouter = typeof appRouter;
