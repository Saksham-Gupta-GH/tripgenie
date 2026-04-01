import axios from 'axios';
import type { ChatMessage } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const aiService = {
  sendMessage: async (message: string, history: ChatMessage[]): Promise<string> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/gemini-chat`, {
        message,
        history: history.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      });

      return response.data.reply;
    } catch (error) {
      console.error('Error sending message to AI:', error);
      throw new Error('Failed to get AI response');
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

    try {
      const response = await aiService.sendMessage(prompt, []);
      return response;
    } catch (error) {
      console.error('Error getting destination suggestions:', error);
      throw new Error('Failed to get destination suggestions');
    }
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

    try {
      const response = await aiService.sendMessage(prompt, []);
      return response;
    } catch (error) {
      console.error('Error improving travel plan:', error);
      throw new Error('Failed to improve travel plan');
    }
  },

  getTravelTips: async (destination: string, interests: string[]): Promise<string> => {
    const prompt = `Provide travel tips for ${destination} focusing on: ${interests.join(', ')}.
      Include local customs, best times to visit, transportation tips, and safety advice.`;

    try {
      const response = await aiService.sendMessage(prompt, []);
      return response;
    } catch (error) {
      console.error('Error getting travel tips:', error);
      throw new Error('Failed to get travel tips');
    }
  },
};
