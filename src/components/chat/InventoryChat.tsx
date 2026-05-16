'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';

type Message = { role: 'user' | 'assistant'; content: string };

const SUGGESTIONS = {
  sq: [
    "Cilat produkte janë afër mbarimit?",
    "Sa është vlera totale e inventarit?",
    "Cilat produkte kanë stok 0?",
    "Lëvizjet e fundit të stokut?",
  ],
  en: [
    "Which products are running low?",
    "What is the total inventory value?",
    "Which products are out of stock?",
    "Recent stock movements?",
  ],
};

export default function InventoryChat() {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const suggestions = SUGGESTIONS[language as keyof typeof SUGGESTIONS] || SUGGESTIONS.sq;
  const isSq = language === 'sq';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 150);
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (isOpen && chatRef.current && !chatRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;
    setInput('');

    const updated: Message[] = [...messages, { role: 'user', content: msg }];
    setMessages(updated);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/ai/inventory-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          message: msg,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          language,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Ndodhi një gabim.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Ndodhi një gabim. Provo sërish.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={chatRef}>
      {/* BUTONI LUNDRUES */}
      <button
        onClick={() => setIsOpen(o => !o)}
        title="AI Inventory Assistant"
        className="fixed bottom-6 left-6 z-[300] w-14 h-14 bg-red-600 hover:bg-slate-900 text-white rounded-2xl shadow-2xl shadow-red-600/40 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
      >
        {isOpen
          ? <X size={22} strokeWidth={3} />
          : <Bot size={24} strokeWidth={2} />
        }
      </button>

      {/* PANELI I CHAT-IT */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 z-[299] w-[370px] bg-white rounded-[2rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
          style={{ maxHeight: '78vh' }}
        >
          {/* Header */}
          <div className="bg-slate-900 px-5 py-4 flex items-center gap-3 text-white flex-shrink-0">
            <div className="bg-red-600 p-2 rounded-xl">
              <Bot size={18} strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h3 className="font-black uppercase tracking-tighter text-sm flex items-center gap-2">
                IMS Assistant
                <span className="flex items-center gap-1 text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  Live
                </span>
              </h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                {isSq ? 'I fokusuar vetëm në inventarin tuaj' : 'Focused only on your inventory'}
              </p>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="text-[9px] text-slate-500 hover:text-red-400 font-bold uppercase tracking-wider transition-colors"
              >
                {isSq ? 'Pastro' : 'Clear'}
              </button>
            )}
          </div>

          {/* Mesazhet */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40 min-h-0">

            {/* Gjendja fillestare */}
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="bg-slate-900 p-1.5 rounded-lg flex-shrink-0 mt-0.5">
                    <Bot size={12} className="text-white" />
                  </div>
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <p className="text-xs font-medium text-slate-700 leading-relaxed">
                      {isSq
                        ? 'Përshëndetje! 👋 Jam asistenti AI i inventarit tuaj. Mund t\'ju ndihmoj me pyetje rreth produkteve, stokut, kategorive dhe biznesit tuaj.'
                        : 'Hello! 👋 I\'m your inventory AI assistant. I can help you with questions about products, stock, categories and your business.'
                      }
                    </p>
                  </div>
                </div>

                <div className="ml-7 space-y-1.5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
                    {isSq ? 'Pyetje të shpeshta:' : 'Common questions:'}
                  </p>
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s)}
                      className="w-full text-left text-[10px] font-bold px-3 py-2.5 bg-white hover:bg-red-50 hover:text-red-600 border border-slate-100 hover:border-red-200 rounded-xl transition-all text-slate-600 flex items-center gap-2"
                    >
                      <Sparkles size={10} className="text-slate-300 flex-shrink-0" />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mesazhet */}
            {messages.map((msg, i) => (
              <div key={i} className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`p-1.5 rounded-lg flex-shrink-0 mb-0.5 ${msg.role === 'user' ? 'bg-red-600' : 'bg-slate-900'}`}>
                  {msg.role === 'user'
                    ? <User size={11} className="text-white" />
                    : <Bot size={11} className="text-white" />
                  }
                </div>
                <div className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-xs font-medium leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-red-600 text-white rounded-br-sm shadow-sm'
                    : 'bg-white border border-slate-100 text-slate-700 rounded-bl-sm shadow-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex items-end gap-2">
                <div className="bg-slate-900 p-1.5 rounded-lg flex-shrink-0 mb-0.5">
                  <Bot size={11} className="text-white" />
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-100 bg-white flex-shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={isSq ? 'Pyet për inventarin...' : 'Ask about your inventory...'}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-red-400 focus:bg-white transition-all disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className="p-2.5 bg-red-600 hover:bg-slate-900 disabled:opacity-40 disabled:hover:bg-red-600 text-white rounded-xl transition-all active:scale-95"
              >
                {isLoading
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Send size={14} strokeWidth={2.5} />
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
