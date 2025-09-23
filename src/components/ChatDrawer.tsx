'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';
import { BrandAnalysisWithMetadata } from '@/types/brand-analysis';
import { SentimentBarChart, CompetitiveRadarChart, CompetitiveScoreChart } from './charts';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  chart?: {
    type: string;
    title: string;
    description: string;
    data: any;
    insights: string[];
  };
}

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: BrandAnalysisWithMetadata;
}

export default function ChatDrawer({ isOpen, onClose, reportData }: ChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'chat' | 'charts'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // Create a placeholder for the streaming response
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage,
          reportData,
          conversationHistory: messages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
                        try {
                          const data = JSON.parse(line.slice(6));

                          if (data.content) {
                            setMessages(prev => prev.map(msg =>
                              msg.id === assistantMessageId
                                ? { ...msg, content: msg.content + data.content }
                                : msg
                            ));
                          }

                          if (data.chart) {
                            setMessages(prev => prev.map(msg =>
                              msg.id === assistantMessageId
                                ? { ...msg, chart: data.chart }
                                : msg
                            ));
                          }

                          if (data.done) {
                            setIsLoading(false);
                            return;
                          }

                          if (data.error) {
                            throw new Error(data.error);
                          }
                        } catch (parseError) {
                          console.error('Error parsing streaming data:', parseError);
                        }
          }
        }
      }
    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: 'Sorry, I encountered an error. Please try again.' }
          : msg
      ));
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

  const suggestedQuestions = reportData.roastMode ? [
    "Alright, give it to us straight - what's really holding us back?",
    "What would Bill Murray say about our brand strategy?",
    "Break down our weaknesses like Marc Maron would - brutally honest but constructive.",
    "What's the most embarrassing thing about our competitive position?",
    "Show me a chart of our sentiment scores - let's see how bad it really is",
    "Create a competitive radar chart so we can see where we're getting crushed",
    "Give us the tough love - what do we need to hear but don't want to?",
    "What's our biggest blind spot that we're probably ignoring?"
  ] : [
    "How can we improve our brand visibility and reputation?",
    "Generate a breakdown of areas we should focus on first, longer bets, and distractions.",
    "Show me a bar chart comparing our sentiment scores across channels",
    "Create a competitive radar chart to visualize our positioning",
    "Generate a chart showing our score breakdown vs competitors",
    "What opportunities should we prioritize for our brand?",
    "What are our biggest competitive advantages right now?",
    "How can we better differentiate ourselves from competitors?"
  ];

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
  };

  return (
    <>
      {/* No backdrop needed for right-side drawer */}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${reportData.roastMode ? 'border-orange-200 bg-gradient-to-r from-orange-50 to-red-50' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <MessageCircle className={`w-5 h-5 ${reportData.roastMode ? 'text-orange-600' : 'text-blue-600'}`} />
            <h2 className={`text-lg font-semibold ${reportData.roastMode ? 'text-orange-900' : 'text-gray-900'}`}>
              {reportData.roastMode ? '🔥 Ask Questions (Burn Mode)' : 'Ask Questions'}
            </h2>
          </div>
          
          {/* Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setMode('chat')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                mode === 'chat' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              💬 Chat
            </button>
            <button
              onClick={() => setMode('charts')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                mode === 'charts' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Charts
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close chat"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100vh-200px)]">
          {mode === 'chat' ? (
            <>
              {messages.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-4">
                    {reportData.roastMode 
                      ? "Ready for some tough love? Ask me anything about your brand analysis! I'll give you the brutally honest insights your team needs to hear."
                      : "Ask me anything about your brand analysis! I'm here to help your team understand the insights and take action."
                    }
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {reportData.roastMode ? 'Burn Mode Questions:' : 'Suggested Questions:'}
                    </p>
                    {suggestedQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestedQuestion(question)}
                        className="w-full text-left p-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 text-gray-900"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      {/* Render chart if available */}
                      {message.chart && (
                        <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg">
                          <h4 className="font-semibold text-gray-900 text-sm mb-2">{message.chart.title}</h4>
                          <p className="text-xs text-gray-600 mb-3">{message.chart.description}</p>
                          
                          {/* Render appropriate chart component */}
                          {message.chart.type === 'sentiment_bar' && (
                            <SentimentBarChart data={reportData} title="" className="border-0 p-0" />
                          )}
                          {message.chart.type === 'competitive_radar' && (
                            <CompetitiveRadarChart data={reportData} title="" className="border-0 p-0" />
                          )}
                          {message.chart.type === 'score_breakdown' && (
                            <CompetitiveScoreChart data={reportData} title="" className="border-0 p-0" />
                          )}
                          
                          {/* Chart insights */}
                          {message.chart.insights && message.chart.insights.length > 0 && (
                            <div className="mt-3">
                              <h5 className="font-medium text-gray-900 text-xs mb-1">Key Insights:</h5>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {message.chart.insights.map((insight, index) => (
                                  <li key={index}>• {insight}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <p className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-600'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Charts Mode */
            <div className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Create visualizations from your brand analysis data
                </p>
              </div>
              
              {/* Chart Templates */}
              <div className="space-y-4">
                <SentimentBarChart data={reportData} />
                <CompetitiveRadarChart data={reportData} />
                <CompetitiveScoreChart data={reportData} />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input - Only show in chat mode */}
        {mode === 'chat' && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={reportData.roastMode ? "Ask for some tough love about your brand..." : "Ask a question about your brand analysis..."}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder-gray-600"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className={`px-3 py-2 text-white rounded-lg disabled:cursor-not-allowed transition-colors ${
                  reportData.roastMode 
                    ? 'bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300' 
                    : 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
