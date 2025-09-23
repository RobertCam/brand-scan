'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';
import { BrandAnalysisWithMetadata } from '@/types/brand-analysis';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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
    "How can we stop being so... corporate and actually connect with people?",
    "What would our competitors roast us for if they were being honest?",
    "Give us the tough love - what do we need to hear but don't want to?",
    "What's our biggest blind spot that we're probably ignoring?"
  ] : [
    "How can we improve our brand visibility and reputation?",
    "Generate a breakdown of areas we should focus on first, longer bets, and distractions.",
    "What does this competitive ranking mean for our business?",
    "Explain this weakness in more detail - how can we address it?",
    "How can we improve our SEO score?",
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
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close chat"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100vh-200px)]">
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
                    className="w-full text-left p-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
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
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
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
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={reportData.roastMode ? "Ask for some tough love about your brand..." : "Ask a question about your brand analysis..."}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
      </div>
    </>
  );
}
