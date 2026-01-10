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
    <div className="h-screen flex flex-col bg-gradient-to-br from-white via-gray-50 to-white">
      <header className="liquid-glass border-b-2 border-black px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src="/logo.png" alt="Siren" className="h-10 w-10 liquid-pulse" />
              <div className="absolute inset-0 bg-[#DC2626] opacity-0 hover:opacity-10 rounded-full transition-opacity duration-300"></div>
            </div>
        <div>
              <h1 className="text-xl font-bold text-black siren-wordmark tracking-tight">SIREN</h1>
              <button
                onClick={copyAddress}
                className="text-xs text-black hover:text-[#DC2626] font-mono flex items-center gap-1 border-b border-black hover:border-[#DC2626] transition-all duration-300 hover:scale-105"
              >
                {address.slice(0, 10)}...{address.slice(-8)}
                <span className="text-xs transition-transform duration-300">{copied ? '✓' : '📋'}</span>
              </button>
            </div>
          </div>
          <div className="text-right border-l-2 border-black pl-4 smooth-fade-in">
            <p className="text-xs text-black font-medium mb-1">Reputation</p>
            <p className="text-2xl font-bold text-[#DC2626] tracking-tight">
              {reputation?.reputation || 0}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 glass-card border-2 border-black smooth-border">
          <div>
            <p className="text-xs text-black font-medium mb-1">Balance</p>
            <p className={`text-sm font-bold transition-colors duration-300 ${isLowBalance ? 'text-[#DC2626]' : 'text-black'}`}>
              {balanceMOVE.toFixed(4)} MOVE
            </p>
          </div>
          <button
            onClick={handleFundWallet}
            disabled={fundWallet.isPending}
            className="btn-siren px-4 py-2 text-xs bg-black text-white font-semibold border-2 border-black hover:bg-[#DC2626] hover:border-[#DC2626] disabled:bg-gray-400 disabled:border-gray-400 relative overflow-hidden"
          >
            <span className="relative z-10">{fundWallet.isPending ? 'Funding...' : 'Fund Wallet'}</span>
          </button>
        </div>

        {isLowBalance && (
          <div className="mt-2 p-3 glass-card border-2 border-[#DC2626] text-xs text-black smooth-fade-in">
            ⚠️ Low balance! Fund your wallet to submit signals.
          </div>
        )}
      </header>

      <div className="flex-1 overflow-auto p-4 bg-gradient-to-b from-transparent to-gray-50/30">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-lg font-bold mb-6 text-black border-b-2 border-black pb-3 tracking-tight">
            Active Signals ({signals?.length || 0})
          </h2>

          <div className="space-y-4">
            {signals?.map((signal, index) => (
              <div
                key={signal.id}
                onClick={() => setSelectedSignal(signal)}
                className="smooth-border glass-card p-5 cursor-pointer group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                      {SIGNAL_TYPES[signal.signal_type as SignalType].emoji}
                    </div>
                    <div>
                      <p className="font-bold text-black text-base mb-1 tracking-tight">
                        {SIGNAL_TYPES[signal.signal_type as SignalType].label}
                      </p>
                      <p className="text-sm text-black/70 font-mono">
                        {signal.lat.toFixed(4)}, {signal.lon.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right border-l-2 border-black/20 group-hover:border-[#DC2626] pl-4 transition-colors duration-300">
                    <p className="text-xs text-black/60 font-medium mb-1">
                      {new Date(Number(signal.timestamp) * 1000).toLocaleTimeString()}
                    </p>
                    <p className="text-sm font-bold text-[#DC2626] tracking-tight">
                      {signal.confidence}% confidence
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {(!signals || signals.length === 0) && (
              <div className="text-center py-16 glass-card border-2 border-dashed border-black/30 smooth-fade-in">
                <div className="text-6xl mb-4 opacity-50">📍</div>
                <p className="text-black font-semibold mb-2 text-lg">No signals yet</p>
                <p className="text-sm text-black/60">Be the first to report!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowSubmitModal(true)}
        className="btn-siren fixed bottom-6 right-6 bg-black text-white p-5 border-2 border-black hover:bg-[#DC2626] hover:border-[#DC2626] shadow-2xl rounded-full"
      >
        <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
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
          className="fixed inset-0 liquid-glass-dark flex items-end z-50 backdrop-blur-sm"
          onClick={() => setSelectedSignal(null)}
        >
          <div
            className="liquid-glass w-full border-t-4 border-black p-6 smooth-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-black/30 mx-auto mb-6 rounded-full"></div>
            <h3 className="text-xl font-bold mb-6 text-black border-b-2 border-black pb-3 tracking-tight">Signal Details</h3>
            <div className="space-y-4">
              <div className="border-l-2 border-black/20 pl-4 smooth-fade-in">
                <span className="text-xs text-black/60 font-medium block mb-2 uppercase tracking-wide">Type</span>
                <p className="text-lg font-bold text-black tracking-tight">
                  {SIGNAL_TYPES[selectedSignal.signal_type as SignalType].emoji}{' '}
                  {SIGNAL_TYPES[selectedSignal.signal_type as SignalType].label}
                </p>
              </div>
              <div className="border-l-2 border-black/20 pl-4 smooth-fade-in">
                <span className="text-xs text-black/60 font-medium block mb-2 uppercase tracking-wide">Location</span>
                <p className="font-mono text-sm text-black">
                  {selectedSignal.lat.toFixed(6)}, {selectedSignal.lon.toFixed(6)}
                </p>
              </div>
              <div className="border-l-2 border-black/20 pl-4 smooth-fade-in">
                <span className="text-xs text-black/60 font-medium block mb-2 uppercase tracking-wide">Reporter</span>
                <p className="font-mono text-sm break-all text-black">
                  {selectedSignal.reporter}
                </p>
              </div>
              <div className="border-l-2 border-black/20 pl-4 smooth-fade-in">
                <span className="text-xs text-black/60 font-medium block mb-2 uppercase tracking-wide">Time</span>
                <p className="text-sm text-black">
                  {new Date(Number(selectedSignal.timestamp) * 1000).toLocaleString()}
                </p>
              </div>
              <div className="border-l-2 border-[#DC2626] pl-4 smooth-fade-in">
                <span className="text-xs text-black/60 font-medium block mb-2 uppercase tracking-wide">Confidence</span>
                <p className="text-sm font-bold text-[#DC2626] tracking-tight">{selectedSignal.confidence}%</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedSignal(null)}
              className="btn-siren mt-8 w-full bg-black text-white py-4 font-bold border-2 border-black hover:bg-[#DC2626] hover:border-[#DC2626] relative overflow-hidden"
            >
              <span className="relative z-10">Close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
