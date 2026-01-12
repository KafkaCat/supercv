import React from 'react';
import { AISuggestion } from '../services/ai';
import { useTranslation } from 'react-i18next';
import { Check, X, Wand2 } from 'lucide-react';

interface AISuggestionsPanelProps {
  suggestions: AISuggestion[];
  isLoading: boolean;
  onAccept: (suggestion: AISuggestion) => void;
  onReject: (id: string) => void;
  onClose: () => void;
}

export const AISuggestionsPanel: React.FC<AISuggestionsPanelProps> = ({ 
  suggestions, isLoading, onAccept, onReject, onClose 
}) => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col transform transition-transform">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-purple-50">
        <div className="flex items-center gap-2 text-purple-800 font-bold">
          <Wand2 size={20} />
          {t('ai.suggestions')}
        </div>
        <button onClick={onClose} className="p-1 hover:bg-purple-100 rounded-full text-purple-800">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 space-y-3 text-purple-600">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span>{t('ai.analyzing')}</span>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {t('ai.no_suggestions')}
          </div>
        ) : (
          suggestions.map((suggestion) => (
            <div key={suggestion.id} className="border border-purple-100 rounded-lg bg-white shadow-sm overflow-hidden">
              <div className="p-3 bg-purple-50/50 border-b border-purple-100 text-sm text-purple-800">
                {suggestion.explanation}
              </div>
              <div className="p-3 space-y-3">
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1 uppercase">{t('ai.original')}</div>
                  <div className="text-sm text-gray-600 line-through bg-red-50 p-2 rounded">
                    {suggestion.original}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1 uppercase">{t('ai.improved')}</div>
                  <div className="text-sm text-gray-800 bg-green-50 p-2 rounded font-medium">
                    {suggestion.improved}
                  </div>
                </div>
              </div>
              <div className="flex border-t border-purple-100 divide-x divide-purple-100">
                <button 
                  onClick={() => onReject(suggestion.id)}
                  className="flex-1 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1"
                >
                  <X size={16} /> {t('ai.reject')}
                </button>
                <button 
                  onClick={() => onAccept(suggestion)}
                  className="flex-1 py-2 text-sm text-purple-700 hover:bg-purple-50 font-medium flex items-center justify-center gap-1"
                >
                  <Check size={16} /> {t('ai.accept')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
