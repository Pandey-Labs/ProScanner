import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', content: 'Hello! I am your ProScanner AI assistant. I can help you analyze sales data, suggest inventory restocking, or answer questions about retail management. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatSession = useRef<any>(null);

  useEffect(() => {
    // Initialize chat session
    chatSession.current = ai.chats.create({
      model: 'gemini-3.1-pro-preview',
      config: {
        systemInstruction: 'You are a senior retail POS domain specialist and AI assistant for the ProScanner SaaS platform. You help shop owners analyze their sales, optimize inventory, and answer questions about retail management. Keep your answers concise, professional, and helpful.'
      }
    });
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await chatSession.current.sendMessageStream({ message: userMsg });
      
      const modelMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: modelMsgId, role: 'model', content: '' }]);

      for await (const chunk of response) {
        if (chunk.text) {
          setMessages(prev => prev.map(msg => 
            msg.id === modelMsgId 
              ? { ...msg, content: msg.content + chunk.text }
              : msg
          ));
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get response from AI');
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <h2 className="text-3xl font-bold mb-6">AI Assistant</h2>
      
      <Card className="flex-1 flex flex-col overflow-hidden border-gray-200 shadow-sm">
        <CardHeader className="bg-gray-50 border-b py-4">
          <CardTitle className="flex items-center text-lg">
            <Bot className="w-5 h-5 mr-2 text-indigo-600" />
            ProScanner Retail AI
          </CardTitle>
        </CardHeader>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`px-4 py-3 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-sm' 
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                }`}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-gray-100 text-gray-800 rounded-tl-sm flex items-center">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-white border-t">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about inventory, sales trends, or retail advice..." 
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()} className="bg-indigo-600 hover:bg-indigo-700">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
