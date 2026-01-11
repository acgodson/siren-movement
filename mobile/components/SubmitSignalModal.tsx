'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSignRawHash } from '@privy-io/react-auth/extended-chains';
import { submitTransaction, buildInitProfileTx, buildSubmitSignalTx } from '@/lib/transactions';
import { getExplorerUrl } from '@/lib/aptos';
import { trpc } from '@/trpc/client';
import { DecibelMeter } from './DecibelMeter';
import { CheckpointCamera } from './CheckpointCamera';

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

type MeasurementStep = 'select' | 'measure' | 'submitting' | 'complete';

export function SubmitSignalModal({ address, onClose, onSubmitted }: Props) {
  const { user } = usePrivy();
  const { signRawHash } = useSignRawHash();
  const [selectedType, setSelectedType] = useState<number>(0);
  const [step, setStep] = useState<MeasurementStep>('select');
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Measurement data
  const [noiseData, setNoiseData] = useState<{
    max: number;
    min: number;
    avg: number;
    samples: number[];
    duration: number;
  } | null>(null);
  const [checkpointImage, setCheckpointImage] = useState<{
    imageData: string;
    metadata: { timestamp: number; lat: number; lon: number; deviceInfo: string };
    analysis?: any;
  } | null>(null);

  const { data: balance } = trpc.siren.getBalance.useQuery({ address });
  const saveMeasurement = trpc.measurements.save.useMutation();
  const analyzeImage = trpc.image.analyze.useMutation();
  const analyzeNoise = trpc.measurements.analyzeNoise.useMutation();

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

  const handleNoiseMeasurementComplete = async (data: {
    max: number;
    min: number;
    avg: number;
    samples: number[];
    duration: number;
  }) => {
    setNoiseData(data);

    if (!userLocation) {
      setError('Location not available');
      return;
    }

    try {
      console.log('Starting noise analysis...');
      const result = await analyzeNoise.mutateAsync({
        noiseData: data,
        location: { lat: userLocation.lat, lon: userLocation.lon },
      });

      console.log('Noise analysis result:', result);
      console.log('Is noise pollution?', result.analysis?.isNoisePollution);

      if (result.success && result.analysis?.isNoisePollution) {
        console.log('Noise pollution detected, proceeding to submit...');
        handleSubmit(data);
      } else {
        console.log('No significant noise pollution detected');
        const confidence = result.analysis?.confidence || 0;
        const details = result.analysis?.details || 'Noise levels are within acceptable range.';
        const severity = result.analysis?.severity || 'low';
        setNoiseData(null);
        setStep('select');
        setError(`No significant noise pollution detected (${confidence}% confidence, severity: ${severity}). ${details}`);
      }
    } catch (err) {
      console.error('Noise analysis error:', err);
      setError('Failed to analyze noise data. Please try again.');
    }
  };

  const handleCheckpointImageCapture = async (imageData: string, metadata: {
    timestamp: number;
    lat: number;
    lon: number;
    deviceInfo: string;
  }) => {
    setCheckpointImage({ imageData, metadata });

    try {
      console.log('Starting image analysis...');
      const result = await analyzeImage.mutateAsync({
        imageData,
        location: { lat: metadata.lat, lon: metadata.lon },
        signalType: 0,
      });

      console.log('Image analysis result:', result);
      console.log('Analysis object:', result.analysis);
      console.log('Has checkpoint?', result.analysis?.hasCheckpoint);

      if (result.success && result.analysis?.hasCheckpoint) {
        console.log('Checkpoint detected, proceeding to submit...');
        setCheckpointImage(prev => prev ? { ...prev, analysis: result.analysis } : null);
        handleSubmit(null, { imageData, metadata, analysis: result.analysis });
      } else {
        console.log('No checkpoint detected or analysis failed');
        const confidence = result.analysis?.confidence || 0;
        const details = result.analysis?.details || 'No checkpoint detected in the image.';
        setCheckpointImage(null);
        setStep('select');
        setError(`Checkpoint not detected (${confidence}% confidence). ${details.substring(0, 150)}`);
      }
    } catch (err) {
      console.error('Image analysis error:', err);
      setError('Failed to analyze image. Please try again.');
    }
  };

  const handleSubmit = async (
    noiseMeasurementData?: typeof noiseData,
    checkpointData?: typeof checkpointImage
  ) => {
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

    setStep('submitting');
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
        console.log('Profile initialization completed');
      } catch (err) {
        console.warn('Profile init warning:', err instanceof Error ? err.message : String(err));
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

      if (noiseMeasurementData || checkpointData) {
        await saveMeasurement.mutateAsync({
          privyUserId: user.id,
          signalType: selectedType,
          lat: userLocation.lat,
          lon: userLocation.lon,
          noiseData: noiseMeasurementData || undefined,
          imageUrl: checkpointData?.imageData,
          imageAnalysis: checkpointData?.analysis,
          imageMetadata: checkpointData?.metadata,
          txHash: hash,
        });
      }

      setTxHash(hash);
      setSubmitting(false);
      setStep('complete');
    } catch (err) {
      console.error('Submit failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit signal');
      setSubmitting(false);
      setStep('select');
    }
  };

  if (step === 'complete' && txHash) {
    return (
      <div className="fixed inset-0 liquid-glass-dark flex items-center justify-center p-4 z-50 backdrop-blur-md">
        <div className="liquid-glass border-4 border-black p-8 max-w-md w-full text-center smooth-fade-in">
          <div className="text-6xl mb-4 liquid-pulse">✅</div>
          <h3 className="text-2xl font-bold mb-3 text-black tracking-tight">Signal Submitted!</h3>
          <p className="text-black/80 mb-6 text-sm">
            Your signal has been recorded on Movement blockchain.
          </p>
          <div className="glass-card border-2 border-black p-4 mb-6">
            <p className="text-xs text-black/60 font-medium mb-2 uppercase tracking-wide">Transaction Hash</p>
            <a
              href={getExplorerUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono break-all text-black hover:text-[#DC2626] border-b border-black/30 hover:border-[#DC2626] transition-colors duration-300 inline-block"
            >
              {txHash}
            </a>
          </div>
          <p className="text-lg font-bold text-[#DC2626] border-t-2 border-black pt-6 mb-6 tracking-tight">+10 Reputation Earned! 🎉</p>
          <button
            onClick={() => {
              onSubmitted();
              onClose();
            }}
            className="btn-siren w-full bg-black text-white py-4 font-bold border-2 border-black hover:bg-[#DC2626] hover:border-[#DC2626] transition-all duration-300"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Submitting step - show loading overlay
  if (step === 'submitting') {
    return (
      <div className="fixed inset-0 liquid-glass-dark flex items-center justify-center p-4 z-50 backdrop-blur-md">
        <div className="liquid-glass border-4 border-black p-8 max-w-md w-full text-center smooth-fade-in">
          <div className="flex justify-center mb-6">
            <svg className="animate-spin h-16 w-16 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-3 text-black tracking-tight">Processing Transaction</h3>
          <p className="text-black/80 mb-4 text-sm">
            Submitting your signal to the blockchain...
          </p>
          <p className="text-xs text-black/60">
            Please wait, this may take a few moments.
          </p>
        </div>
      </div>
    );
  }

  // Measurement step - Noise
  if (step === 'measure' && selectedType === 1) {
    return (
      <div className="fixed inset-0 liquid-glass-dark flex items-end z-50 backdrop-blur-md" onClick={onClose}>
        <div
          className="liquid-glass w-full border-t-4 border-black p-6 smooth-fade-in max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-1 bg-black/30 mx-auto mb-6 rounded-full"></div>
          <DecibelMeter
            onMeasurementComplete={handleNoiseMeasurementComplete}
            onCancel={() => setStep('select')}
          />
        </div>
      </div>
    );
  }

  // Measurement step - Checkpoint
  if (step === 'measure' && selectedType === 0 && userLocation) {
    return (
      <div className="fixed inset-0 liquid-glass-dark flex items-end z-50 backdrop-blur-md" onClick={onClose}>
        <div
          className="liquid-glass w-full border-t-4 border-black p-6 smooth-fade-in max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-1 bg-black/30 mx-auto mb-6 rounded-full"></div>
          <CheckpointCamera
            onImageCapture={handleCheckpointImageCapture}
            onCancel={() => setStep('select')}
            location={userLocation}
          />
        </div>
      </div>
    );
  }

  // Selection step
  return (
    <div className="fixed inset-0 liquid-glass-dark flex items-end z-50 backdrop-blur-md" onClick={onClose}>
      <div
        className="liquid-glass w-full border-t-4 border-black p-6 smooth-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-black/30 mx-auto mb-6 rounded-full"></div>
        <h3 className="text-2xl font-bold mb-6 text-black border-b-2 border-black pb-3 tracking-tight">Submit Signal</h3>

        <div className="mb-6">
          <p className="text-sm font-bold text-black mb-4 tracking-tight">Select signal type:</p>
          <div className="grid grid-cols-2 gap-3">
            {SIGNAL_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => {
                  setSelectedType(type.value);
                  // For noise and checkpoint, go to measurement step
                  if (type.value === 1 || type.value === 0) {
                    setStep('measure');
                  }
                }}
                className={`smooth-border glass-card p-5 transition-all duration-300 group relative ${selectedType === type.value
                    ? 'border-[#DC2626] border-2 scale-105 bg-white shadow-lg'
                    : 'border-black/30 hover:border-[#DC2626]/50'
                  }`}
              >
                {selectedType === type.value && (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-[#DC2626] rounded-full"></div>
                )}
                <div className={`text-4xl mb-2 transition-transform duration-300 ${selectedType === type.value ? 'scale-110' : 'group-hover:scale-110'
                  }`}>
                  {type.emoji}
                </div>
                <div className={`text-sm font-bold tracking-tight ${selectedType === type.value ? 'text-[#DC2626]' : 'text-black'
                  }`}>
                  {type.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {userLocation && (
          <div className="mb-6 p-4 glass-card border-2 border-black/30 smooth-fade-in">
            <p className="text-xs font-bold text-black/60 mb-2 uppercase tracking-wide">Your Location</p>
            <p className="text-sm font-mono text-black">
              {userLocation.lat.toFixed(6)}, {userLocation.lon.toFixed(6)}
            </p>
          </div>
        )}

        {!userLocation && (
          <div className="mb-6 p-4 glass-card border-2 border-black/30 text-center smooth-fade-in">
            <p className="text-sm text-black font-medium">📍 Getting your location...</p>
          </div>
        )}

        {isLowBalance && (
          <div className="mb-6 p-4 glass-card border-2 border-[#DC2626] smooth-fade-in">
            <p className="text-sm text-black font-medium">
              ⚠️ Low balance ({balanceMOVE.toFixed(4)} MOVE). Please fund your wallet before submitting.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 glass-card border-2 border-[#DC2626] bg-red-50/80 smooth-fade-in">
            <p className="text-sm text-[#DC2626] font-bold flex items-start gap-2">
              <span className="text-lg flex-shrink-0">⚠️</span>
              <span>{error}</span>
            </p>
          </div>
        )}

        {/* For non-measurement signal types, show direct submit */}
        {(selectedType === 2 || selectedType === 3) && (
          <div className="flex gap-3 mb-6">
            <button
              onClick={onClose}
              className="flex-1 glass-card text-black py-4 font-bold border-2 border-black/30 hover:border-black transition-all duration-300 hover:scale-[1.02]"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSubmit()}
              disabled={submitting || !userLocation || !user?.id || isLowBalance}
              className="btn-siren flex-1 bg-black text-white py-4 font-bold border-2 border-black hover:bg-[#DC2626] hover:border-[#DC2626] disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed relative overflow-hidden"
            >
              {submitting ? (
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="relative z-10">{isLowBalance ? 'Insufficient Balance' : 'Submit Signal'}</span>
              )}
            </button>
          </div>
        )}

        {/* For measurement types, button is in the measurement component */}
        {(selectedType === 0 || selectedType === 1) && (
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 glass-card text-black py-4 font-bold border-2 border-black/30 hover:border-black transition-all duration-300 hover:scale-[1.02]"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
