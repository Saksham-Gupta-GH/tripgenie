import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

type PlanCandidate = {
  id: string; title: string; destination: string; numberOfDays: number;
  budget: number; itinerary: string[];
};
type RankedPlan = PlanCandidate & { score?: number };

const MAX_MESSAGE_LENGTH = 2_000;
const MAX_CANDIDATES = 100;
const MAX_ITINERARY_DAYS = 14;
const TOP_K = 4;

const cleanText = (value: unknown, maxLength: number): string =>
  typeof value === 'string'
    ? [...value].map((character) => character.charCodeAt(0) < 32 ? ' ' : character).join('').trim().slice(0, maxLength)
    : '';

const sanitizePlans = (value: unknown): PlanCandidate[] => {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_CANDIDATES).flatMap((item): PlanCandidate[] => {
    if (!item || typeof item !== 'object') return [];
    const raw = item as Record<string, unknown>;
    const id = cleanText(raw.id, 100);
    const title = cleanText(raw.title, 160);
    const destination = cleanText(raw.destination, 160);
    if (!id || !title || !destination) return [];
    const itinerary = Array.isArray(raw.itinerary)
      ? raw.itinerary.slice(0, MAX_ITINERARY_DAYS).map((day) => cleanText(day, 500)).filter(Boolean)
      : [];
    return [{
      id, title, destination,
      numberOfDays: Number.isFinite(Number(raw.numberOfDays)) ? Number(raw.numberOfDays) : itinerary.length,
      budget: Number.isFinite(Number(raw.budget)) ? Number(raw.budget) : 0,
      itinerary,
    }];
  });
};

const keywordRank = (query: string, plans: PlanCandidate[]): RankedPlan[] => {
  const terms = [...new Set(query.toLowerCase().match(/[a-z0-9]+/g) ?? [])].filter((term) => term.length > 2);
  return plans.map((plan) => {
    const text = `${plan.title} ${plan.destination} ${plan.itinerary.join(' ')}`.toLowerCase();
    return { ...plan, score: terms.reduce((sum, term) => sum + (text.includes(term) ? 1 : 0), 0) };
  }).sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, TOP_K);
};

const semanticRank = async (query: string, plans: PlanCandidate[]): Promise<RankedPlan[]> => {
  const serviceUrl = process.env.RETRIEVAL_SERVICE_URL?.replace(/\/$/, '');
  if (!serviceUrl || plans.length === 0) return keywordRank(query, plans);
  try {
    const response = await fetch(`${serviceUrl}/rank`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.RETRIEVAL_SERVICE_TOKEN
          ? { Authorization: `Bearer ${process.env.RETRIEVAL_SERVICE_TOKEN}` } : {}),
      },
      body: JSON.stringify({ query, plans, top_k: TOP_K }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`retrieval returned ${response.status}`);
    const data = await response.json() as { plans?: RankedPlan[] };
    if (!Array.isArray(data.plans)) throw new Error('invalid retrieval response');
    return data.plans.slice(0, TOP_K);
  } catch (error) {
    console.warn('Semantic retrieval unavailable; using keyword retrieval:', error);
    return keywordRank(query, plans);
  }
};

const buildPrompt = (message: string, plans: RankedPlan[]): string => {
  const context = plans.length ? plans.map((plan, index) => [
    `[${index + 1}] ${plan.title} (plan ID: ${plan.id})`,
    `Destination: ${plan.destination}`,
    `Duration: ${plan.numberOfDays} days`,
    `Budget: INR ${plan.budget}`,
    `Itinerary: ${plan.itinerary.join(' | ') || 'Not provided'}`,
  ].join('\n')).join('\n\n') : 'No matching TripGenie plans were available.';

  return `You are TripGenie's travel assistant. Answer helpfully and concisely.
When recommending a TripGenie plan, use only the retrieved context. Never invent plan details.
Cite grounded recommendations with the plan title and plan ID. Say when no stored plan supports a claim.
You may give general travel advice, but label it as general advice rather than a stored plan.

RETRIEVED TRIPGENIE PLANS:
${context}

USER QUESTION:
${message}`;
};

const callGemini = async (prompt: string): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini is not configured');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest' });
  const result = await Promise.race([
    model.generateContent(prompt),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Gemini timed out')), 12_000)),
  ]);
  return (await result.response).text();
};

const callOpenRouter = async (prompt: string): Promise<string> => {
  if (!process.env.OPENROUTER_API_KEY || !process.env.OPENROUTER_MODEL) {
    throw new Error('OpenRouter is not configured');
  }
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'https://tripgenie-ashy.vercel.app',
      'X-Title': 'TripGenie',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_completion_tokens: 1_000,
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`OpenRouter returned ${response.status}`);
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const reply = data.choices?.[0]?.message?.content;
  if (!reply) throw new Error('OpenRouter returned an empty response');
  return reply;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_URL || 'https://tripgenie-ashy.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const message = cleanText(req.body?.message, MAX_MESSAGE_LENGTH);
  if (!message) return res.status(400).json({ error: 'Message is required' });

  const rankedPlans = await semanticRank(message, sanitizePlans(req.body?.plans));
  const prompt = buildPrompt(message, rankedPlans);
  try {
    const reply = await callGemini(prompt);
    return res.status(200).json({ reply, provider: 'gemini', retrieval: rankedPlans.length });
  } catch (geminiError) {
    console.warn('Gemini unavailable; attempting OpenRouter fallback:', geminiError);
    try {
      const reply = await callOpenRouter(prompt);
      return res.status(200).json({ reply, provider: 'openrouter', retrieval: rankedPlans.length });
    } catch (openRouterError) {
      console.error('Both AI providers failed:', openRouterError);
      return res.status(503).json({ error: 'AI services are temporarily unavailable. Please try again.' });
    }
  }
}
