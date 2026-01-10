'use client';

import { useState, useRef, useEffect } from 'react';
import { compressImage } from '@/lib/image-compression';

interface Props {
  onImageCapture: (imageData: string, metadata: {
    timestamp: number;
    lat: number;
    lon: number;
    deviceInfo: string;
  }) => void;
  onCancel: () => void;
  location: { lat: number; lon: number };
}

export function CheckpointCamera({ onImageCapture, onCancel, location }: Props) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Camera access denied. Please enable camera permissions.');
    }
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    
    const originalData = canvas.toDataURL('image/jpeg', 1.0);
    
    try {
      const compressedData = await compressImage(originalData, {
        maxWidth: 800,
        maxHeight: 600,
        quality: 0.7,
      });
      
      setCapturedImage(compressedData);

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      const deviceInfo = navigator.userAgent;

      onImageCapture(compressedData, {
        timestamp: Date.now(),
        lat: location.lat,
        lon: location.lon,
        deviceInfo,
      });
    } catch (error) {
      console.error('Image compression error:', error);
      setError('Failed to process image. Please try again.');
    }
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full mb-6">
        <h3 className="text-center text-2xl font-bold text-black tracking-tight mb-2">
          Capture Checkpoint
        </h3>
        <p className="text-center text-sm text-black/60">
          Take a photo of the checkpoint to verify its presence
        </p>
      </div>

      <div className="relative w-full max-w-md aspect-4/3 border-4 border-black rounded-lg overflow-hidden bg-black">
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured checkpoint"
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white p-4">
                <p className="text-center">{error}</p>
              </div>
            )}
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="w-full max-w-md mt-6 flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 glass-card text-black py-4 font-bold border-2 border-black/30 hover:border-black transition-all duration-300"
        >
          Cancel
        </button>
        {capturedImage ? (
          <>
            <button
              onClick={retake}
              className="flex-1 glass-card text-black py-4 font-bold border-2 border-black/30 hover:border-black transition-all duration-300"
            >
              Retake
            </button>
            <button
              onClick={async () => {
                if (capturedImage) {
                  try {
                    const compressedData = await compressImage(capturedImage, {
                      maxWidth: 800,
                      maxHeight: 600,
                      quality: 0.7,
                    });
                    
                    const deviceInfo = navigator.userAgent;
                    onImageCapture(compressedData, {
                      timestamp: Date.now(),
                      lat: location.lat,
                      lon: location.lon,
                      deviceInfo,
                    });
                  } catch (error) {
                    console.error('Image compression error:', error);
                    setError('Failed to process image. Please try again.');
                  }
                }
              }}
              className="flex-1 bg-black text-white py-4 font-bold border-2 border-black hover:bg-[#DC2626] hover:border-[#DC2626] transition-all duration-300"
            >
              Confirm & Submit
            </button>
          </>
        ) : (
          <button
            onClick={captureImage}
            disabled={!stream || !!error}
            className="flex-1 bg-black text-white py-4 font-bold border-2 border-black hover:bg-[#DC2626] hover:border-[#DC2626] disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed transition-all duration-300"
          >
            Capture Photo
          </button>
        )}
      </div>
    </div>
  );
}
