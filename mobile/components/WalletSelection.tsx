'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useState } from 'react';

/**
 * Wallet Selection Component
 * 
 * Allows users to:
 * 1. Login with Privy (social login)
 * 2. Create/link Aptos wallet
 * 3. Switch between wallet types
 */
export function WalletSelection() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);

  if (!ready) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <h2 className="text-2xl font-bold">Welcome to Siren</h2>
        <p className="text-gray-600 text-center max-w-md">
          Sign in to start reporting civic signals and building your reputation
        </p>
        <button
          onClick={login}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Sign In with Privy
        </button>
        <p className="text-sm text-gray-500">
          Sign in with Google, Twitter, Email, or other methods
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Wallet Connected</h2>
        <p className="text-gray-600 mt-2">
          {user?.wallet?.address ? (
            <span className="font-mono text-sm">
              {user.wallet.address.slice(0, 6)}...{user.wallet.address.slice(-4)}
            </span>
          ) : (
            'No wallet address found'
          )}
        </p>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={() => setIsCreatingWallet(true)}
          disabled={isCreatingWallet}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {isCreatingWallet ? 'Creating...' : 'Link Aptos Wallet'}
        </button>
        <button
          onClick={logout}
          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

