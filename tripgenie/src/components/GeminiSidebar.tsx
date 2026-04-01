import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Bot, User, Lightbulb } from 'lucide-react';
import { aiService } from '../services/aiService';
import type { ChatMessage } from '../types';

interface GeminiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTION_CHIPS = [
  'Suggest a 5-day budget trip in South India during monsoon',
  'Best places to visit in Rajasthan for history lovers',
  'Weekend getaway ideas near Mumbai under 5000 rupees',
  'Tips for solo female travelers in India',
];

export const GeminiSidebar: React.FC<GeminiSidebarProps> = ({
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I'm your TripGenie AI assistant. I can help you with travel suggestions, destination ideas, and travel tips. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string = inputMessage) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await aiService.sendMessage(
        userMessage.content,
        messages
      );

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          err instanceof Error
            ? `Error: ${err.message}`
            : 'I apologize, but I encountered an error. Please try again later.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-96 bg-white border-l border-gray-200 shadow-xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-blue-600">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-white" />
              <span className="text-lg font-semibold text-white">
                TripGenie AI
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {message.role === 'assistant' ? (
                      <Bot className="w-4 h-4 text-purple-600" />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        message.role === 'user'
                          ? 'text-blue-100'
                          : 'text-gray-500'
                      }`}
                    >
                      {message.role === 'user' ? 'You' : 'AI Assistant'}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4 text-purple-600" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          {messages.length <= 2 && (
            <div className="px-4 py-3 border-t border-gray-100">
              <div className="flex items-center space-x-1 mb-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <span className="text-xs text-gray-500">Try asking:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTION_CHIPS.map((chip, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(chip)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors text-left"
                  >
                    {chip.length > 40 ? chip.substring(0, 40) + '...' : chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-end space-x-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask me anything about travel..."
                className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm max-h-32"
                rows={1}
                style={{ minHeight: '40px' }}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              AI Assistant provides suggestions only. Core trip planning uses
              system logic.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
