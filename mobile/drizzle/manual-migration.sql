-- Manual migration script for Privy-only wallet system
-- Run this in your database to update the schema

-- Step 1: Add new columns (if they don't exist)
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS privy_user_id TEXT;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS private_key TEXT;

-- Step 2: Drop old columns (after ensuring no data loss)
-- Only run these if you're sure you want to remove PIN-based wallets
-- ALTER TABLE wallets DROP COLUMN IF EXISTS pin_hash;
-- ALTER TABLE wallets DROP COLUMN IF EXISTS encrypted_private_key;

-- Step 3: Make privy_user_id unique and required
ALTER TABLE wallets ADD CONSTRAINT wallets_privy_user_id_unique UNIQUE (privy_user_id);
-- ALTER TABLE wallets ALTER COLUMN privy_user_id SET NOT NULL; -- Run after data migration

-- Step 4: Make private_key required
-- ALTER TABLE wallets ALTER COLUMN private_key SET NOT NULL; -- Run after data migration


