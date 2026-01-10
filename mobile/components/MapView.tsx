'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { SubmitSignalModal } from './SubmitSignalModal';

interface Props {
  address: string;
}

type SignalType = 0 | 1 | 2 | 3;

const SIGNAL_TYPES = {
  0: { label: 'Checkpoint', color: '#EF4444', emoji: '🚔' },
  1: { label: 'Noise', color: '#F59E0B', emoji: '🔊' },
  2: { label: 'Hazard', color: '#10B981', emoji: '⚠️' },
  3: { label: 'Traffic', color: '#3B82F6', emoji: '🚗' },
};

export function MapView({ address }: Props) {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const { data: signals, refetch } = trpc.siren.getAllSignals.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const { data: reputation } = trpc.siren.getReputation.useQuery(
    { address },
    { refetchInterval: 10000 }
  );

  const { data: balance, refetch: refetchBalance } = trpc.siren.getBalance.useQuery(
    { address },
    { refetchInterval: 10000 }
  );

  const fundWallet = trpc.siren.fundWallet.useMutation({
    onSuccess: () => {
      refetchBalance();
    },
  });

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFundWallet = async () => {
    try {
      await fundWallet.mutateAsync({ address });
    } catch (error) {
      console.error('Failed to fund wallet:', error);
    }
  };

  const handleSignalSubmitted = () => {
    setShowSubmitModal(false);
    refetch();
  };

  const balanceMOVE = balance?.balanceMOVE || 0;
  const isLowBalance = balanceMOVE < 0.005;

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="bg-white border-b-2 border-black px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Siren" className="h-8 w-8" />
            <div>
              <h1 className="text-xl font-bold text-black siren-wordmark">SIREN</h1>
              <button
                onClick={copyAddress}
                className="text-xs text-black hover:text-[#DC2626] font-mono flex items-center gap-1 border-b border-black hover:border-[#DC2626] transition-colors"
              >
                {address.slice(0, 10)}...{address.slice(-8)}
                <span className="text-xs">{copied ? '✓' : '📋'}</span>
              </button>
            </div>
          </div>
          <div className="text-right border-l-2 border-black pl-3">
            <p className="text-xs text-black font-medium">Reputation</p>
            <p className="text-2xl font-bold text-[#DC2626]">
              {reputation?.reputation || 0}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-[#F5F5F5] border-2 border-black">
          <div>
            <p className="text-xs text-black font-medium">Balance</p>
            <p className={`text-sm font-bold ${isLowBalance ? 'text-[#DC2626]' : 'text-black'}`}>
              {balanceMOVE.toFixed(4)} MOVE
            </p>
          </div>
          <button
            onClick={handleFundWallet}
            disabled={fundWallet.isPending}
            className="px-4 py-2 text-xs bg-black text-white font-semibold border-2 border-black hover:bg-[#DC2626] hover:border-[#DC2626] disabled:bg-gray-400 disabled:border-gray-400 transition-colors"
          >
            {fundWallet.isPending ? 'Funding...' : 'Fund Wallet'}
          </button>
        </div>

        {isLowBalance && (
          <div className="mt-2 p-2 bg-white border-2 border-[#DC2626] text-xs text-black">
            ⚠️ Low balance! Fund your wallet to submit signals.
          </div>
        )}
      </header>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">
            Active Signals ({signals?.length || 0})
          </h2>

          <div className="space-y-3">
            {signals?.map((signal) => (
              <div
                key={signal.id}
                onClick={() => setSelectedSignal(signal)}
                className="border-l-4 p-4 bg-white rounded-lg shadow cursor-pointer hover:shadow-md transition"
                style={{ borderColor: SIGNAL_TYPES[signal.signal_type as SignalType].color }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {SIGNAL_TYPES[signal.signal_type as SignalType].emoji}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {SIGNAL_TYPES[signal.signal_type as SignalType].label}
                      </p>
                      <p className="text-sm text-gray-500 font-mono">
                        {signal.lat.toFixed(4)}, {signal.lon.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(Number(signal.timestamp) * 1000).toLocaleTimeString()}
                    </p>
                    <p className="text-sm font-medium text-gray-700">
                      {signal.confidence}% confidence
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {(!signals || signals.length === 0) && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📍</div>
                <p className="text-gray-500 mb-2">No signals yet</p>
                <p className="text-sm text-gray-400">Be the first to report!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowSubmitModal(true)}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white p-5 rounded-full shadow-2xl hover:bg-indigo-700 hover:scale-110 transition-all"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {showSubmitModal && (
        <SubmitSignalModal
          address={address}
          onClose={() => setShowSubmitModal(false)}
          onSubmitted={handleSignalSubmitted}
        />
      )}

      {selectedSignal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50"
          onClick={() => setSelectedSignal(null)}
        >
          <div
            className="bg-white w-full rounded-t-3xl p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
            <h3 className="text-xl font-bold mb-4">Signal Details</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Type</span>
                <p className="text-lg font-semibold">
                  {SIGNAL_TYPES[selectedSignal.signal_type as SignalType].emoji}{' '}
                  {SIGNAL_TYPES[selectedSignal.signal_type as SignalType].label}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Location</span>
                <p className="font-mono text-sm">
                  {selectedSignal.lat.toFixed(6)}, {selectedSignal.lon.toFixed(6)}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Reporter</span>
                <p className="font-mono text-sm break-all">
                  {selectedSignal.reporter}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Time</span>
                <p className="text-sm">
                  {new Date(Number(selectedSignal.timestamp) * 1000).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Confidence</span>
                <p className="text-sm">{selectedSignal.confidence}%</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedSignal(null)}
              className="mt-6 w-full bg-gray-100 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
