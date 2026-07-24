'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { Brain, Send, Trash2, Stethoscope, Pill, HeartPulse, Baby, BrainCog } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  { icon: HeartPulse, label: 'Explain heart failure', prompt: 'Can you explain heart failure in simple terms, including key nursing interventions and what NCLEX might focus on?' },
  { icon: Pill, label: 'NCLEX pharmacology tips', prompt: 'What are the most important pharmacology concepts I should know for the NCLEX?' },
  { icon: Baby, label: 'Maternal-newborn priorities', prompt: 'What are the key priorities in maternal-newborn nursing for the NCLEX?' },
  { icon: Stethoscope, label: 'How to prioritize patients', prompt: 'How do I prioritize patients using Maslow\'s hierarchy and the ABC approach on the NCLEX?' },
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [inputValue]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? inputValue).trim();
    if (!content || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const apiMessages = newMessages.map((m) => ({
        role: (m.type === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      }));

      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response || 'I received your message but couldn\'t generate a response.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <Layout currentPageName="AI Assistant">
      <div className="min-h-[calc(100vh-5rem)] flex flex-col">
        <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col">
          <Card className="flex-1 flex flex-col shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-blue-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">AI Nursing Assistant</CardTitle>
                    <p className="text-sm text-gray-500">Your personal NCLEX study companion</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={clearChat}
                  disabled={messages.length === 0}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-blue-50/50 to-indigo-50/50 min-h-[400px]">
                {messages.length === 0 && !isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                      <BrainCog className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome to your AI Nursing Assistant</h3>
                    <p className="text-gray-500 max-w-md mb-6">
                      Ask me anything about nursing concepts, NCLEX preparation, pharmacology, patient care, and more.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                      {SUGGESTED_PROMPTS.map((prompt) => {
                        const Icon = prompt.icon;
                        return (
                          <button
                            key={prompt.label}
                            onClick={() => sendMessage(prompt.prompt)}
                            className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl text-left hover:border-blue-400 hover:shadow-md transition-all duration-200"
                          >
                            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Icon className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">{prompt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.type === 'assistant' && (
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                          <Brain className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.type === 'user'
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-sm'
                            : 'bg-white border border-gray-200 shadow-sm text-gray-800 rounded-tl-sm'
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                          {message.content}
                        </div>
                        <div
                          className={`text-xs mt-1.5 ${
                            message.type === 'user' ? 'text-blue-100' : 'text-gray-400'
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-sm text-gray-500">AI is thinking...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-blue-100 p-4 bg-white/80 backdrop-blur-sm">
                <div className="flex space-x-2 items-end">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about any nursing concept, NCLEX topic, or patient care scenario..."
                    className="flex-1 min-h-[50px] max-h-[150px] resize-none border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={() => sendMessage()}
                    disabled={!inputValue.trim() || isLoading}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl px-4 self-end h-[50px] gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Press Enter to send, Shift+Enter for a new line
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
