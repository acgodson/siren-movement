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
      <div className="flex items-center justify-center p-8 min-h-screen bg-white">
        <div className="text-black font-medium">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-6 min-h-screen bg-white border-4 border-black">
        <img src="/logo.png" alt="Siren" className="h-16 w-16 mb-4" />
        <h2 className="text-3xl font-bold text-black siren-wordmark">SIREN</h2>
        <p className="text-black text-center max-w-md font-medium">
          Sign in to start reporting civic signals and building your reputation
        </p>
        <button
          onClick={login}
          className="px-8 py-4 bg-black text-white font-bold border-2 border-black hover:bg-[#DC2626] hover:border-[#DC2626] transition-colors"
        >
          Sign In with Privy
        </button>
        <p className="text-sm text-black border-t-2 border-black pt-4">
          Sign in with Google, Twitter, Email, or other methods
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6 min-h-screen bg-white border-4 border-black">
      <img src="/logo.png" alt="Siren" className="h-16 w-16" />
      <div className="text-center border-2 border-black p-6">
        <h2 className="text-2xl font-bold text-black mb-2">Wallet Connected</h2>
        <p className="text-black mt-2">
          {user?.wallet?.address ? (
            <span className="font-mono text-sm border-b border-black">
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
          className="px-6 py-3 bg-black text-white font-bold border-2 border-black hover:bg-[#DC2626] hover:border-[#DC2626] transition-colors disabled:bg-gray-400 disabled:border-gray-400"
        >
          {isCreatingWallet ? 'Creating...' : 'Link Aptos Wallet'}
        </button>
        <button
          onClick={logout}
          className="px-6 py-3 bg-white text-black font-bold border-2 border-black hover:bg-[#F5F5F5] transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

