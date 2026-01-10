'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useCreateWallet } from '@privy-io/react-auth/extended-chains';
import { WalletSelection } from '@/components/WalletSelection';
import { MapView } from '@/components/MapView';
import { trpc } from '@/trpc/client';

export default function HomePage() {
  const { ready, authenticated, user } = usePrivy();
  const { createWallet } = useCreateWallet();
  const [movementAddress, setMovementAddress] = useState<string>('');
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [isFunding, setIsFunding] = useState(false);

  const fundWallet = trpc.siren.fundWallet.useMutation();

  useEffect(() => {
    const setupMovementWallet = async () => {
      // Prevent re-running if already set or in progress
      if (!authenticated || !user || isCreatingWallet || movementAddress) return;

      const moveWallet = user.linkedAccounts?.find(
        (account: any) => account.chainType === 'aptos'
      ) as any;

      if (moveWallet) {
        const address = moveWallet.address as string;
        setMovementAddress(address);
        console.log('Privy Movement Wallet Address:', address);

        setIsFunding(true);
        try {
          await fundWallet.mutateAsync({ address });
          console.log('Wallet funded successfully');
        } catch (error) {
          console.error('Failed to fund wallet:', error);
        } finally {
          setIsFunding(false);
        }
      } else {
        console.log('No Movement wallet found. Creating one now...');
        setIsCreatingWallet(true);
        try {
          const wallet = await createWallet({ chainType: 'aptos' });
          const address = (wallet as any).address;
          setMovementAddress(address);
          console.log('Created Privy Movement Wallet Address:', address);

          setIsFunding(true);
          try {
            await fundWallet.mutateAsync({ address });
            console.log('Wallet funded successfully');
          } catch (error) {
            console.error('Failed to fund wallet:', error);
          } finally {
            setIsFunding(false);
          }
        } catch (error) {
          console.error('Error creating Movement wallet:', error);
        } finally {
          setIsCreatingWallet(false);
        }
      }
    };

    setupMovementWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, user, createWallet]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-white">
        <div className="text-black font-medium tracking-tight">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return <WalletSelection />;
  }

  if (!movementAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-white">
        <div className="liquid-glass border-4 border-black p-10 max-w-md w-full text-center smooth-fade-in">
          <div className="relative inline-block mb-6">
            <img src="/logo.png" alt="Siren" className="h-16 w-16 mx-auto liquid-pulse" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-black siren-wordmark tracking-tight">Setting Up Wallet</h2>
          <p className="text-black mb-8 font-medium text-sm">
            Creating your Movement wallet...
          </p>
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-black/20 border-t-[#DC2626] mx-auto"></div>
            <div className="absolute inset-0 animate-spin rounded-full h-14 w-14 border-4 border-transparent border-r-black/10 mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return <MapView address={movementAddress} />;
}
