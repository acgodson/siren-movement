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
      <div className="flex items-center justify-center p-8 min-h-screen bg-gradient-to-br from-white via-gray-50 to-white">
        <div className="text-black font-medium tracking-tight">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-8 min-h-screen bg-gradient-to-br from-white via-gray-50 to-white">
        <div className="liquid-glass border-4 border-black p-12 max-w-md w-full text-center smooth-fade-in">
          <div className="relative inline-block mb-6">
            <img src="/logo.png" alt="Siren" className="h-20 w-20 mx-auto liquid-pulse" />
            <div className="absolute inset-0 bg-[#DC2626] opacity-0 hover:opacity-10 rounded-full transition-opacity duration-500"></div>
          </div>
          <h2 className="text-4xl font-bold text-black siren-wordmark mb-4 tracking-tight">SIREN</h2>
          <p className="text-black/80 text-center mb-8 font-medium leading-relaxed">
            Sign in to start reporting civic signals and building your reputation
          </p>
          <button
            onClick={login}
            className="btn-siren px-10 py-4 bg-black text-white font-bold border-2 border-black hover:bg-[#DC2626] hover:border-[#DC2626] relative overflow-hidden w-full"
          >
            <span className="relative z-10">Sign In with Privy</span>
          </button>
          <p className="text-sm text-black/60 border-t-2 border-black/20 pt-6 mt-6 tracking-tight">
            Sign in with Google, Twitter, Email, or other methods
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-8 min-h-screen bg-gradient-to-br from-white via-gray-50 to-white">
      <div className="liquid-glass border-4 border-black p-12 max-w-md w-full text-center smooth-fade-in">
        <div className="relative inline-block mb-6">
          <img src="/logo.png" alt="Siren" className="h-20 w-20 mx-auto liquid-pulse" />
        </div>
        <div className="glass-card border-2 border-black p-6 mb-6">
          <h2 className="text-2xl font-bold text-black mb-3 tracking-tight">Wallet Connected</h2>
          <p className="text-black">
            {user?.wallet?.address ? (
              <span className="font-mono text-sm border-b-2 border-black/30 hover:border-[#DC2626] transition-colors duration-300">
                {user.wallet.address.slice(0, 6)}...{user.wallet.address.slice(-4)}
              </span>
            ) : (
              'No wallet address found'
            )}
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setIsCreatingWallet(true)}
            disabled={isCreatingWallet}
            className="btn-siren flex-1 px-6 py-3 bg-black text-white font-bold border-2 border-black hover:bg-[#DC2626] hover:border-[#DC2626] disabled:bg-gray-400 disabled:border-gray-400 relative overflow-hidden"
          >
            <span className="relative z-10">{isCreatingWallet ? 'Creating...' : 'Link Aptos Wallet'}</span>
          </button>
          <button
            onClick={logout}
            className="flex-1 glass-card text-black font-bold border-2 border-black/30 hover:border-black transition-all duration-300 hover:scale-[1.02] py-3"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

