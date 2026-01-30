import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { INTENTS } from './intents';
import { ENTITY_TYPES } from './entities';

const classificationSchema = z.object({
  intent: z.string(),
  confidence: z.number().min(0).max(1),
  detected_language: z.enum(['en', 'hi', 'hinglish']),
  entities: z.record(z.string(), z.object({
    value: z.union([z.string(), z.number(), z.object({ start: z.string(), end: z.string() })]),
    type: z.string()
  }))
});

function buildPrompt(text: string) {
  const intentList = INTENTS.map(i => {
    const examples = i.examples?.length ? `\n    Examples: ${i.examples.map(e => `"${e}"`).join(', ')}` : '';
    return `  - ${i.name}: ${i.description}${examples}`;
  }).join('\n');

  const entityList = Object.entries(ENTITY_TYPES).map(([name, e]: [string, any]) => {
    const extra = e.values ? ` (values: ${e.values.join(', ')})` : '';
    return `  - ${name}: ${e.description}${extra}`;
  }).join('\n');

  return `You are an intent classifier for a P2P energy trading app.

INTENTS (choose exactly one):
${intentList}

ENTITIES (extract if present):
${entityList}

RULES:
1. Return the single best matching intent
2. Set confidence 0-1 based on how well the input matches
3. Detect language: "en" (English), "hi" (Hindi/Devanagari), "hinglish" (romanized Hindi or mix)
4. Extract and normalize entities to typed values (e.g., "fifty" → 50)
5. If input is unrelated to energy trading, use "off_topic"

USER INPUT: "${text}"`;
}

export async function classifyIntent(text: string) {
  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: classificationSchema,
    prompt: buildPrompt(text)
  });
  return object;
}
