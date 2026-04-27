import React from 'react';
import { Menu, Sparkles } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
  onAiSidebarToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  onAiSidebarToggle,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">
            TripGenie AI
          </h1>
        </div>

        <button
          onClick={onAiSidebarToggle}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-red-600 text-white rounded-lg hover:from-purple-700 hover:to-red-700 transition-all shadow-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">AI Assistant</span>
        </button>
      </div>
    </header>
  );
};
