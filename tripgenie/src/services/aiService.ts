import axios from 'axios';
import type { Plan } from '../types';

const API_BASE_URL = ''; // Vercel handles /api routes automatically

export const aiService = {
  sendMessage: async (message: string, plans: Plan[] = []): Promise<string> => {
    console.log('AIService: Sending message to /api/gemini...', message);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/gemini`, {
        message,
        plans: plans.map(({ id, title, destination, numberOfDays, budget, itinerary }) => ({
          id, title, destination, numberOfDays, budget, itinerary,
        })),
      });

      if (response.data && response.data.reply) {
        return response.data.reply;
      }
      throw new Error('Invalid response format from AI server');
    } catch (error: unknown) {
      console.error('AIService: Detailed Error', error);

      const responseData = axios.isAxiosError(error)
        ? error.response?.data as { error?: string; details?: { message?: string } } | undefined
        : undefined;
      const serverMessage = responseData?.error || responseData?.details?.message;
      const finalMessage = serverMessage || (error instanceof Error ? error.message : 'AI request failed');
      
      throw new Error(finalMessage);
    }
  },

  getDestinationSuggestions: async (
    budget: number,
    days: number,
    interests: string[],
    season?: string
  ): Promise<string> => {
    const prompt = `Suggest a ${days}-day trip destination with a budget of $${budget}. 
      Interests: ${interests.join(', ')}. 
      ${season ? `Preferred season: ${season}.` : ''}
      Please provide destination recommendations with brief descriptions.`;

    return aiService.sendMessage(prompt);
  },

  improveTravelPlan: async (
    destination: string,
    budget: number,
    days: number,
    currentPlan: string
  ): Promise<string> => {
    const prompt = `Please review and improve this travel plan:
      Destination: ${destination}
      Budget: $${budget}
      Duration: ${days} days
      Current Plan: ${currentPlan}
      
      Provide suggestions for optimization, better time management, and any missing highlights.`;

    return aiService.sendMessage(prompt);
  },

  getTravelTips: async (destination: string, interests: string[]): Promise<string> => {
    const prompt = `Provide travel tips for ${destination} focusing on: ${interests.join(', ')}.
      Include local customs, best times to visit, transportation tips, and safety advice.`;

    return aiService.sendMessage(prompt);
  },
};
