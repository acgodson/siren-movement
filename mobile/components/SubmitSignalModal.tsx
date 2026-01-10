'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSignRawHash } from '@privy-io/react-auth/extended-chains';
import { submitTransaction, buildInitProfileTx, buildSubmitSignalTx } from '@/lib/transactions';
import { trpc } from '@/trpc/client';

interface Props {
  address: string;
  onClose: () => void;
  onSubmitted: () => void;
}

const SIGNAL_TYPES = [
  { value: 0, label: 'Checkpoint', emoji: '🚔', color: 'bg-red-500' },
  { value: 1, label: 'Noise', emoji: '🔊', color: 'bg-orange-500' },
  { value: 2, label: 'Hazard', emoji: '⚠️', color: 'bg-green-500' },
  { value: 3, label: 'Traffic', emoji: '🚗', color: 'bg-blue-500' },
];

export function SubmitSignalModal({ address, onClose, onSubmitted }: Props) {
  const { user } = usePrivy();
  const { signRawHash } = useSignRawHash();
  const [selectedType, setSelectedType] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: balance } = trpc.siren.getBalance.useQuery({ address });

  const balanceMOVE = balance?.balanceMOVE || 0;
  const isLowBalance = balanceMOVE < 0.002;

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          setUserLocation({ lat: 37.7749, lon: -122.4194 });
        }
      );
    } else {
      setUserLocation({ lat: 37.7749, lon: -122.4194 });
    }
  }, []);

  const handleSubmit = async () => {
    if (!userLocation) {
      setError('Location not available');
      return;
    }

    if (!user) {
      setError('User not authenticated');
      return;
    }

    const moveWallet = user.linkedAccounts?.find(
      (account: any) => account.chainType === 'aptos'
    ) as any;

    if (!moveWallet) {
      setError('Movement wallet not found');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      try {
        const initPayload = buildInitProfileTx();
        await submitTransaction(
          address,
          moveWallet.publicKey,
          signRawHash,
          initPayload
        );
      } catch (err) {
        console.log('Profile init skipped:', err);
      }

      const signalPayload = buildSubmitSignalTx({
        signalType: selectedType,
        lat: userLocation.lat,
        lon: userLocation.lon,
      });

      const hash = await submitTransaction(
        address,
        moveWallet.publicKey,
        signRawHash,
        signalPayload
      );

      setTxHash(hash);
      setTimeout(() => {
        onSubmitted();
      }, 2000);
    } catch (err) {
      console.error('Submit failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit signal');
      setSubmitting(false);
    }
  };

  if (txHash) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white border-4 border-black p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-2xl font-bold mb-2 text-black">Signal Submitted!</h3>
          <p className="text-black mb-4">
            Your signal has been recorded on Movement blockchain.
          </p>
          <div className="bg-[#F5F5F5] border-2 border-black p-3 mb-4">
            <p className="text-xs text-black font-medium mb-1">Transaction Hash</p>
            <p className="text-xs font-mono break-all text-black">
              {txHash}
            </p>
          </div>
          <p className="text-lg font-bold text-[#DC2626] border-t-2 border-black pt-4">+10 Reputation Earned! 🎉</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50" onClick={onClose}>
      <div
        className="bg-white w-full border-t-4 border-black p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-black mx-auto mb-4"></div>
        <h3 className="text-2xl font-bold mb-6 text-black border-b-2 border-black pb-2">Submit Signal</h3>

        <div className="mb-6">
          <p className="text-sm font-bold text-black mb-3">Select signal type:</p>
          <div className="grid grid-cols-2 gap-3">
            {SIGNAL_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`p-4 border-2 transition-all ${
                  selectedType === type.value
                    ? 'border-[#DC2626] bg-white scale-105'
                    : 'border-black hover:border-[#DC2626]'
                }`}
              >
                <div className="text-4xl mb-2">{type.emoji}</div>
                <div className="text-sm font-bold text-black">{type.label}</div>
              </button>
            ))}
          </div>
        </div>

        {userLocation && (
          <div className="mb-6 p-4 bg-[#F5F5F5] border-2 border-black">
            <p className="text-xs font-bold text-black mb-1">Your Location</p>
            <p className="text-sm font-mono text-black">
              {userLocation.lat.toFixed(6)}, {userLocation.lon.toFixed(6)}
            </p>
          </div>
        )}

        {!userLocation && (
          <div className="mb-6 p-4 bg-white border-2 border-black text-center">
            <p className="text-sm text-black font-medium">📍 Getting your location...</p>
          </div>
        )}

        {isLowBalance && (
          <div className="mb-6 p-4 bg-white border-2 border-[#DC2626]">
            <p className="text-sm text-black font-medium">
              ⚠️ Low balance ({balanceMOVE.toFixed(4)} MOVE). Please fund your wallet before submitting.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-white border-2 border-[#DC2626]">
            <p className="text-sm text-black font-medium">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-white text-black py-3 font-bold border-2 border-black hover:bg-[#F5F5F5] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !userLocation || !user?.id || isLowBalance}
            className="flex-1 bg-black text-white py-3 font-bold border-2 border-black hover:bg-[#DC2626] hover:border-[#DC2626] disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Submitting...' : isLowBalance ? 'Insufficient Balance' : 'Submit Signal'}
          </button>
        </div>
      </div>
    </div>
  );
}
