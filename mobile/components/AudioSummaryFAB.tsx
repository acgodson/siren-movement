'use client';

import { useState, useRef, useEffect } from 'react';
import { trpc } from '@/trpc/client';

interface AudioSummaryFABProps {
  userLocation: { lat: number; lon: number } | null;
}

export function AudioSummaryFAB({ userLocation }: AudioSummaryFABProps) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const generateSummary = trpc.audio.generateSummary.useMutation();

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const handleGenerateAudio = async () => {
    if (!userLocation) {
      setError('Location not available. Please enable location services.');
      setTimeout(() => setError(null), 4000);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await generateSummary.mutateAsync({
        userLat: userLocation.lat,
        userLon: userLocation.lon,
        radiusKm: 0.1, // 100 meters
      });

      // Type guard: check if result is an error response
      if (!result.success || 'error' in result) {
        // Handle specific error cases
        const errorResult = result as { success: false; error: string; message: string; summary?: string };
        if (errorResult.error === 'NO_SIGNALS') {
          setError('No signals detected within 100 meters');
        } else if (errorResult.error === 'TTS_FAILED') {
          setError('Failed to generate audio. Please try again.');
        } else {
          setError(errorResult.message || 'Failed to generate audio summary');
        }
        setTimeout(() => setError(null), 4000);
        setLoading(false);
        return;
      }

      // At this point, result is a success response
      const successResult = result as { 
        success: true; 
        audioContent?: string; 
        summary: string; 
        signalCount: number; 
        nearestDistance: number; 
        signals: Array<{ type: number; distance: number }> 
      };

      if (!successResult.audioContent) {
        setError('No audio content received');
        setTimeout(() => setError(null), 4000);
        setLoading(false);
        return;
      }

      // Convert base64 to blob and create audio URL
      const audioBlob = base64ToBlob(successResult.audioContent, 'audio/mpeg');
      const audioUrl = URL.createObjectURL(audioBlob);

      // Stop and clean up any existing audio
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      // Create and configure new audio element
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setPlaying(false);
        URL.revokeObjectURL(audioUrl);
        setLoading(false);
      };
      audioRef.current.onerror = () => {
        setError('Failed to play audio. Please try again.');
        setTimeout(() => setError(null), 4000);
        setPlaying(false);
        setLoading(false);
        URL.revokeObjectURL(audioUrl);
      };

      // Play audio
      await audioRef.current.play();
      setPlaying(true);
      setLoading(false);

      console.log(`Audio summary: ${successResult.summary}`);
      console.log(`Signals nearby: ${successResult.signalCount}`);
    } catch (err) {
      console.error('Audio generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate audio summary');
      setTimeout(() => setError(null), 4000);
      setLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current.src) {
          URL.revokeObjectURL(audioRef.current.src);
        }
      }
    };
  }, []);

  return (
    <>
      <button
        onClick={handleGenerateAudio}
        disabled={loading || !userLocation}
        aria-label="Generate audio summary of nearby signals"
        className="fixed bottom-6 left-6 bg-black text-white w-16 h-16 border-2 border-black hover:bg-[#DC2626] hover:border-[#DC2626] shadow-2xl rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-2xl disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {loading ? (
          <svg
            className="animate-spin h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : playing ? (
          <svg
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        ) : (
          <span className="text-3xl" aria-hidden="true">
            🔔
          </span>
        )}
      </button>

      {/* Loading status text */}
      {loading && (
        <div className="fixed bottom-24 left-6 glass-card px-4 py-2 border-2 border-black smooth-fade-in">
          <p className="text-xs text-black font-medium">Generating audio...</p>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-24 left-6 glass-card px-4 py-2 border-2 border-[#DC2626] bg-red-50/80 smooth-fade-in max-w-xs">
          <p className="text-xs text-[#DC2626] font-bold flex items-start gap-2">
            <span className="shrink-0">⚠️</span>
            <span>{error}</span>
          </p>
        </div>
      )}
    </>
  );
}
