
import React, { useState, useEffect } from 'react';
import { DiffResult } from '../types';
import { summarizeChanges } from '../services/geminiService';
import { IconSparkles } from './Icons';

interface GeminiSummaryProps {
  diffResult: DiffResult;
}

export const GeminiSummary: React.FC<GeminiSummaryProps> = ({ diffResult }) => {
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await summarizeChanges(diffResult);
        setSummary(result);
      } catch (e) {
        console.error("Gemini summary error:", e);
        setError("Could not generate AI summary. Please check your API key and network connection.");
      } finally {
        setIsLoading(false);
      }
    };

    if (diffResult) {
      fetchSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diffResult]);

  const renderContent = () => {
    if (isLoading) {
      return (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">Gemini is analyzing the changes...</p>
        </div>
      );
    }

    if (error) {
      return <p className="text-red-600">{error}</p>;
    }
    
    // Using dangerouslySetInnerHTML to render markdown-like lists from Gemini
    const formattedSummary = summary
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-800">$1</strong>')
      .replace(/\* (.*?)\n/g, '<li class="ml-5 list-disc">$1</li>')
      .replace(/(\n<\/li>)/g, '</li>') // fix for lists
      .replace(/<\/li>(\s*?)<li/g, '</li><li');


    return <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: formattedSummary }} />;

  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <div className="flex items-center mb-4">
        <IconSparkles className="h-7 w-7 text-purple-500 mr-3" />
        <h2 className="text-xl font-bold text-gray-800">AI-Powered Summary</h2>
      </div>
      <div className="p-4 bg-purple-50 rounded-lg min-h-[80px] flex items-center justify-center">
          {renderContent()}
      </div>
    </div>
  );
};
