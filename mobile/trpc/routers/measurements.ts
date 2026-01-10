import { z } from 'zod';
import { createTRPCRouter, baseProcedure } from '../init';
import { measurements } from '../../db/schema';
import { db } from '../../lib/db';
import { eq, desc } from 'drizzle-orm';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export const measurementsRouter = createTRPCRouter({
  analyzeNoise: baseProcedure
    .input(
      z.object({
        noiseData: z.object({
          max: z.number(),
          min: z.number(),
          avg: z.number(),
          samples: z.array(z.number()),
          duration: z.number(),
        }),
        location: z.object({
          lat: z.number(),
          lon: z.number(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `Analyze this noise measurement data and determine if it represents significant noise pollution:

Measurement Data:
- Maximum: ${input.noiseData.max} dB
- Minimum: ${input.noiseData.min} dB
- Average: ${input.noiseData.avg} dB
- Duration: ${input.noiseData.duration} seconds
- Sample count: ${input.noiseData.samples.length}

Context:
- 0-50 dB: Quiet (library, whisper)
- 51-65 dB: Moderate (normal conversation)
- 66-80 dB: Moderately Loud (busy traffic, TV)
- 81-95 dB: Loud (lawnmower, loud music)
- 96+ dB: Very Loud (power tools, concerts) - noise pollution

Consider:
- Is the average noise level sustained above normal ambient levels (>70 dB)?
- Are the peak values indicative of noise pollution (>85 dB)?
- Does the duration suggest persistent noise pollution?

Respond with a JSON object:
{
  "isNoisePollution": boolean,
  "confidence": number (0-100),
  "severity": string ("low", "moderate", "high", or "extreme"),
  "details": string (brief description of the noise characteristics)
}`;

      const result = await model.generateContent([prompt]);
      const response = await result.response;
      const text = response.text();

      console.log('Gemini noise analysis response:', text);

      let analysis;
      try {
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
        const jsonText = jsonMatch ? jsonMatch[1] : text;
        analysis = JSON.parse(jsonText);
        console.log('Parsed noise analysis:', analysis);
      } catch (parseError) {
        console.log('JSON parse failed, using fallback. Text:', text);
        // Fallback based on standard noise pollution thresholds
        const isNoisy = input.noiseData.avg >= 70 || input.noiseData.max >= 85;
        analysis = {
          isNoisePollution: isNoisy,
          confidence: 70,
          severity: input.noiseData.avg >= 85 ? 'high' : input.noiseData.avg >= 70 ? 'moderate' : 'low',
          details: `Average noise level: ${input.noiseData.avg.toFixed(1)} dB, Peak: ${input.noiseData.max.toFixed(1)} dB`,
        };
        console.log('Fallback noise analysis:', analysis);
      }

      return {
        success: true,
        analysis,
      };
    }),

  save: baseProcedure
    .input(
      z.object({
        privyUserId: z.string(),
        signalType: z.number(),
        lat: z.number(),
        lon: z.number(),
        noiseData: z
          .object({
            max: z.number(),
            min: z.number(),
            avg: z.number(),
            samples: z.array(z.number()),
            duration: z.number(),
          })
          .optional(),
        imageUrl: z.string().optional(),
        imageAnalysis: z.any().optional(),
        imageMetadata: z.any().optional(),
        txHash: z.string().optional(),
        onChainSignalId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [measurement] = await db
        .insert(measurements)
        .values({
          privyUserId: input.privyUserId,
          signalType: input.signalType,
          lat: input.lat,
          lon: input.lon,
          noiseData: input.noiseData || null,
          imageUrl: input.imageUrl || null,
          imageAnalysis: input.imageAnalysis || null,
          imageMetadata: input.imageMetadata || null,
          txHash: input.txHash || null,
          onChainSignalId: input.onChainSignalId || null,
        })
        .returning();

      return { success: true, measurement };
    }),

  getByUser: baseProcedure
    .input(z.object({ privyUserId: z.string() }))
    .query(async ({ input }) => {
      const userMeasurements = await db
        .select()
        .from(measurements)
        .where(eq(measurements.privyUserId, input.privyUserId))
        .orderBy(desc(measurements.createdAt));

      return userMeasurements;
    }),
});
