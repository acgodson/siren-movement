import { z } from 'zod';
import { createTRPCRouter, baseProcedure } from '../init';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export const imageRouter = createTRPCRouter({
  analyze: baseProcedure
    .input(
      z.object({
        imageData: z.string(),
        location: z.object({
          lat: z.number(),
          lon: z.number(),
        }),
        signalType: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      if (!input.imageData) {
        throw new Error('No image data provided');
      }

      const base64Data = input.imageData.replace(/^data:image\/\w+;base64,/, '');

      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      let prompt = '';
      if (input.signalType === 0) {
        prompt = `Analyze this image and determine if there is a police checkpoint, security checkpoint, or law enforcement presence visible. 
      
Consider:
- Police vehicles (marked or unmarked)
- Police officers in uniform
- Checkpoint barriers or signs
- Security personnel
- Law enforcement equipment

Respond with a JSON object:
{
  "hasCheckpoint": boolean,
  "confidence": number (0-100),
  "details": string (brief description of what you see)
}`;
      } else if (input.signalType === 2) {
        prompt = `Analyze this image and determine if there is a road hazard, obstacle, or dangerous condition visible.

Respond with a JSON object:
{
  "hasHazard": boolean,
  "confidence": number (0-100),
  "details": string (brief description of the hazard)
}`;
      } else {
        throw new Error('Invalid signal type for image analysis');
      }

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: 'image/jpeg',
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();

      console.log('Gemini response text:', text);

      let analysis;
      try {
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
        const jsonText = jsonMatch ? jsonMatch[1] : text;
        analysis = JSON.parse(jsonText);
        console.log('Parsed analysis:', analysis);
      } catch (parseError) {
        console.log('JSON parse failed, using fallback. Text:', text);
        const lowerText = text.toLowerCase();
        analysis = {
          hasCheckpoint: lowerText.includes('checkpoint') || lowerText.includes('police') || lowerText.includes('law enforcement'),
          confidence: 50,
          details: text,
        };
        console.log('Fallback analysis:', analysis);
      }

      console.log('Final analysis result:', analysis);

      return {
        success: true,
        analysis,
      };
    }),
});
