'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DecibelDisplay } from './DecibelDisplay';
import { NoiseMeter } from '@/lib/noise-meter';

interface Props {
  onMeasurementComplete: (data: {
    max: number;
    min: number;
    avg: number;
    samples: number[];
    duration: number;
  }) => void;
  onCancel: () => void;
}

export function DecibelMeter({ onMeasurementComplete, onCancel }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentReading, setCurrentReading] = useState(0);
  const [max, setMax] = useState(0);
  const [min, setMin] = useState(100);
  const [avg, setAvg] = useState(0);
  const [time, setTime] = useState('00:00');
  const [samples, setSamples] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  
  const noiseMeterRef = useRef<NoiseMeter | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (noiseMeterRef.current) {
        noiseMeterRef.current.stop();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const meter = new NoiseMeter();
      const started = await meter.start();
      
      if (!started) {
        alert('Microphone access denied. Please enable microphone permissions.');
        return;
      }

      noiseMeterRef.current = meter;
      setIsRecording(true);
      setIsPaused(false);
      setStartTime(Date.now());
      setSamples([]);
      setMax(0);
      setMin(100);
      setCurrentReading(0);

      // Start monitoring
      meter.startMonitoring((db, isNoise) => {
        setCurrentReading(db);
        setSamples((prev) => [...prev, db]);
        
        setMax((prev) => Math.max(prev, db));
        setMin((prev) => Math.min(prev, db));
      });

      // Update time
      intervalRef.current = setInterval(() => {
        if (startTime) {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const minutes = Math.floor(elapsed / 60);
          const seconds = elapsed % 60;
          setTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to start noise measurement. Please try again.');
    }
  };

  const stopRecording = () => {
    if (noiseMeterRef.current) {
      noiseMeterRef.current.stopMonitoring();
      noiseMeterRef.current.stop();
      noiseMeterRef.current = null;
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsRecording(false);
    setIsPaused(true);

    // Calculate average
    const average = samples.length > 0
      ? samples.reduce((sum, val) => sum + val, 0) / samples.length
      : 0;
    setAvg(average);

    const duration = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    
    // Pass data to parent
    onMeasurementComplete({
      max,
      min: min === 100 ? 0 : min,
      avg: average,
      samples,
      duration,
    });
  };

  const handleSubmit = () => {
    if (isRecording) {
      stopRecording();
    } else if (isPaused) {
      // Finalize and proceed - data already passed in stopRecording
      // This is just a confirmation step
      const average = samples.length > 0
        ? samples.reduce((sum, val) => sum + val, 0) / samples.length
        : avg;
      
      const duration = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
      
      onMeasurementComplete({
        max,
        min: min === 100 ? 0 : min,
        avg: average,
        samples,
        duration,
      });
    } else {
      // Start recording
      startRecording();
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full mb-4">
        <h3 className="text-center text-xl font-bold text-black tracking-tight mb-1">
          {isRecording ? 'Measuring Decibels' : 'Noise Measurement'}
        </h3>
        {!isRecording && !isPaused && (
          <p className="text-center text-xs text-black/60">
            Click "Start Measuring" to begin recording noise levels
          </p>
        )}
      </div>

      <DecibelDisplay
        currentReading={currentReading}
        max={max}
        min={min === 100 ? 0 : min}
        avg={avg}
        time={time}
        paused={isPaused}
      />

      <div className="w-full max-w-sm mt-4 flex flex-col items-center gap-3">
        {isPaused && (
          <div className="w-full glass-card border-2 border-black/30 p-3 text-center smooth-fade-in">
            <p className="text-xs font-medium text-black mb-1">Measurement Complete</p>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div>
                <div className="text-black/60">Max</div>
                <div className="font-bold text-black">{Math.round(max)} dB</div>
              </div>
              <div>
                <div className="text-black/60">Avg</div>
                <div className="font-bold text-black">{Math.round(avg)} dB</div>
              </div>
              <div>
                <div className="text-black/60">Duration</div>
                <div className="font-bold text-black">{time}</div>
              </div>
            </div>
          </div>
        )}

        <div className="w-full flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 glass-card text-black py-4 font-bold border-2 border-black/30 hover:border-black transition-all duration-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-black text-white py-4 font-bold border-2 border-black hover:bg-[#DC2626] hover:border-[#DC2626] transition-all duration-300 relative overflow-hidden"
          >
            <span className="relative z-10">
              {isRecording ? 'Stop Measuring' : isPaused ? 'Confirm & Submit' : 'Start Measuring'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
