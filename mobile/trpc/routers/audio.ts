import { z } from 'zod';
import { createTRPCRouter, baseProcedure } from '../init';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  createMovementClient,
  getAllSignals,
} from '@siren/blockchain';
import { calculateDistance, formatDistance } from '../../lib/geo-utils';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const MODULE_ADDRESS = process.env.NEXT_PUBLIC_MODULE_ADDRESS || '0x8929dbe48bae9c96036e7cb03c80d7686aa79d525571f93e98b48ef41e26389c';
const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || MODULE_ADDRESS;
const MOVEMENT_NETWORK = (process.env.NEXT_PUBLIC_MOVEMENT_NETWORK || 'testnet') as 'testnet' | 'mainnet';
const movementClient = createMovementClient(MOVEMENT_NETWORK);

const SIGNAL_LABELS: Record<number, string> = {
  0: 'checkpoint',
  1: 'noise complaint',
  2: 'road hazard',
  3: 'traffic congestion',
};

export const audioRouter = createTRPCRouter({
  generateSummary: baseProcedure
    .input(
      z.object({
        userLat: z.number().min(-90).max(90),
        userLon: z.number().min(-180).max(180),
        radiusKm: z.number().default(0.1),
      })
    )
    .mutation(async ({ input }) => {
      try {

        if (MODULE_ADDRESS === '0x1' || MODULE_ADDRESS.includes('YOUR_MODULE_ADDRESS')) {
          return {
            success: false,
            error: 'NO_SIGNALS',
            message: 'Signal system not configured',
          };
        }

        const signals = await getAllSignals(movementClient, MODULE_ADDRESS, REGISTRY_ADDRESS);

        const nearbySignals = signals
          .map((signal) => ({
            signal,
            distance: calculateDistance(
              input.userLat,
              input.userLon,
              signal.lat,
              signal.lon
            ),
          }))
          .filter((item) => item.distance <= input.radiusKm)
          .sort((a, b) => a.distance - b.distance);

        if (nearbySignals.length === 0) {
          return {
            success: false,
            error: 'NO_SIGNALS',
            message: 'No signals detected within 100 meters',
          };
        }

        const topSignals = nearbySignals.slice(0, 5); // Limit to top 5 closest
        const signalSummary = topSignals
          .map((item) => {
            const label = SIGNAL_LABELS[item.signal.signal_type] || 'unknown signal';
            return `${label} at ${formatDistance(item.distance)}`;
          })
          .join(', ');

        const prompt = `You are a navigation assistant. Generate a natural, conversational audio alert (2-3 sentences) for a driver based on these nearby civic signals: ${signalSummary}. Focus on the most relevant information and safety. Be concise and clear.`;

        let summaryText: string;
        try {
          const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
          const result = await model.generateContent([prompt]);
          summaryText = result.response.text();
          console.log('Gemini summary generated:', summaryText);
        } catch (geminiError) {
          console.error('Gemini API error:', geminiError);
          summaryText = `You have ${nearbySignals.length} signal${
            nearbySignals.length > 1 ? 's' : ''
          } nearby: ${signalSummary}`;
        }

        const apiKey = process.env.GOOGLE_AI_API_KEY;
        if (!apiKey) {
          return {
            success: false,
            error: 'API_KEY_MISSING',
            message: 'Google AI API key not configured',
            summary: summaryText,
          };
        }

        const ttsUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
        const ttsRequest = {
          input: { text: summaryText },
          voice: {
            languageCode: 'en-US',
            name: 'en-US-Neural2-D',
            ssmlGender: 'MALE',
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0,
            volumeGainDb: 0,
          },
        };

        const ttsResponse = await fetch(ttsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ttsRequest),
        });

        if (!ttsResponse.ok) {
          const errorText = await ttsResponse.text();
          console.error('TTS API error:', errorText);
          return {
            success: false,
            error: 'TTS_FAILED',
            message: 'Failed to generate audio',
            summary: summaryText,
          };
        }

        const ttsData = await ttsResponse.json();

        if (!ttsData.audioContent) {
          return {
            success: false,
            error: 'TTS_NO_AUDIO',
            message: 'No audio content in response',
            summary: summaryText,
          };
        }
        return {
          success: true,
          audioContent: ttsData.audioContent, 
          summary: summaryText,
          signalCount: nearbySignals.length,
          nearestDistance: nearbySignals[0].distance,
          signals: topSignals.map((item) => ({
            type: item.signal.signal_type,
            distance: item.distance,
          })),
        };
      } catch (error) {
        console.error('Error generating audio summary:', error);
        return {
          success: false,
          error: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate audio summary',
        };
      }
    }),
});
