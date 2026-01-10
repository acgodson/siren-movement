-- Migration: Remove PIN-based fields, add Privy support
-- Run this manually if drizzle-kit push is interactive

-- Drop old columns if they exist
ALTER TABLE wallets DROP COLUMN IF EXISTS pin_hash;
ALTER TABLE wallets DROP COLUMN IF EXISTS encrypted_private_key;

-- Add new columns
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS privy_user_id TEXT UNIQUE;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS private_key TEXT NOT NULL;

-- Make privy_user_id required (after data migration if needed)
-- ALTER TABLE wallets ALTER COLUMN privy_user_id SET NOT NULL;


