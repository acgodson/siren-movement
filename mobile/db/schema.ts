import { pgTable, text, timestamp, integer, real, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const wallets = pgTable('wallets', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  privyUserId: text('privy_user_id').notNull().unique(),
  privyWalletId: text('privy_wallet_id'),
  movementAddress: text('movement_address').notNull(),
  privateKey: text('private_key'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const measurements = pgTable('measurements', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  privyUserId: text('privy_user_id').notNull(),
  signalType: integer('signal_type').notNull(), // 0=checkpoint, 1=noise, 2=hazard, 3=traffic
  lat: real('lat').notNull(),
  lon: real('lon').notNull(),
  
  // Noise measurement data
  noiseData: jsonb('noise_data'), // { max: number, min: number, avg: number, samples: number[], duration: number }
  
  // Checkpoint image data
  imageUrl: text('image_url'), // URL to stored image
  imageAnalysis: jsonb('image_analysis'), // AI analysis result
  imageMetadata: jsonb('image_metadata'), // { timestamp, location, deviceInfo }
  
  // On-chain reference
  txHash: text('tx_hash'), // Movement transaction hash
  onChainSignalId: integer('on_chain_signal_id'), // Signal ID on Movement
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Wallet = typeof wallets.$inferSelect;
export type NewWallet = typeof wallets.$inferInsert;
export type Measurement = typeof measurements.$inferSelect;
export type NewMeasurement = typeof measurements.$inferInsert;
