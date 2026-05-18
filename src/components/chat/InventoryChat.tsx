'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Loader2, Bot, User, Sparkles, GripHorizontal } from 'lucide-react';
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

const STORAGE_KEY = 'ims-chat-position';
const BTN = 56; // button size px

export default function InventoryChat() {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Position ──────────────────────────────────────────────
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const hasDragged = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setPos(JSON.parse(saved)); return; } catch {}
    }
    setPos({ x: 24, y: window.innerHeight - BTN - 24 });
  }, []);

  const clamp = useCallback((x: number, y: number) => ({
    x: Math.max(0, Math.min(window.innerWidth  - BTN, x)),
    y: Math.max(0, Math.min(window.innerHeight - BTN, y)),
  }), []);

  const startDrag = (clientX: number, clientY: number) => {
    if (!pos) return;
    hasDragged.current = false;
    dragging.current = true;
    dragOffset.current = { x: clientX - pos.x, y: clientY - pos.y };
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      hasDragged.current = true;
      setPos(clamp(e.clientX - dragOffset.current.x, e.clientY - dragOffset.current.y));
    };
    const onMouseUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      setPos(p => { if (p) localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); return p; });
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current) return;
      hasDragged.current = true;
      const t = e.touches[0];
      setPos(clamp(t.clientX - dragOffset.current.x, t.clientY - dragOffset.current.y));
    };
    const onTouchEnd = () => {
      if (!dragging.current) return;
      dragging.current = false;
      setPos(p => { if (p) localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); return p; });
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [clamp]);

  // ── Panel position (smart: opens toward center of screen) ─
  const getPanelStyle = (): React.CSSProperties => {
    if (!pos) return {};
    const panelW = 370;
    const gap = 12;
    const openAbove = pos.y > window.innerHeight / 2;
    const openLeft  = pos.x + panelW > window.innerWidth - 20;
    return {
      position: 'fixed',
      width: panelW,
      maxHeight: '78vh',
      ...(openAbove
        ? { bottom: window.innerHeight - pos.y + gap }
        : { top: pos.y + BTN + gap }),
      ...(openLeft
        ? { right: window.innerWidth - pos.x - BTN }
        : { left: pos.x }),
      zIndex: 299,
    };
  };

  // ── Scroll & focus ────────────────────────────────────────
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 150); }, [isOpen]);

  // ── Send ──────────────────────────────────────────────────
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
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ message: msg, history: messages.map(m => ({ role: m.role, content: m.content })), language }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Ndodhi një gabim.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Ndodhi një gabim. Provo sërish.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = SUGGESTIONS[language as keyof typeof SUGGESTIONS] || SUGGESTIONS.sq;
  const isSq = language === 'sq';

  if (!pos) return null;

  return (
    <>
      {/* ── FLOATING BUTTON ───────────────────────────────── */}
      <button
        style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 300 }}
        onMouseDown={e => { startDrag(e.clientX, e.clientY); e.preventDefault(); }}
        onTouchStart={e => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
        onClick={() => { if (!hasDragged.current) setIsOpen(o => !o); }}
        title="AI Inventory Assistant"
        className={`w-14 h-14 text-white rounded-2xl shadow-2xl flex items-center justify-center select-none transition-colors duration-200
          ${isOpen ? 'bg-slate-900' : 'bg-red-600 shadow-red-600/40'}
          ${dragging.current ? 'cursor-grabbing' : 'cursor-grab hover:scale-110'}`}
      >
        {isOpen ? <X size={22} strokeWidth={3} /> : <Bot size={24} strokeWidth={2} />}
        {/* Grip indicator */}
        <span className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 shadow-md pointer-events-none">
          <GripHorizontal size={10} className="text-slate-400" />
        </span>
      </button>

      {/* ── CHAT PANEL ────────────────────────────────────── */}
      {isOpen && (
        <div
          style={getPanelStyle()}
          className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header — drag handle */}
          <div
            className="bg-slate-900 px-5 py-4 flex items-center gap-3 text-white flex-shrink-0 cursor-grab active:cursor-grabbing select-none"
            onMouseDown={e => { startDrag(e.clientX, e.clientY); e.preventDefault(); }}
            onTouchStart={e => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
          >
            <div className="bg-red-600 p-2 rounded-xl pointer-events-none">
              <Bot size={18} strokeWidth={2.5} />
            </div>
            <div className="flex-1 pointer-events-none">
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
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  onMouseDown={e => e.stopPropagation()}
                  onClick={() => setMessages([])}
                  className="text-[9px] text-slate-500 hover:text-red-400 font-bold uppercase tracking-wider transition-colors"
                >
                  {isSq ? 'Pastro' : 'Clear'}
                </button>
              )}
              <button
                onMouseDown={e => e.stopPropagation()}
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40 min-h-0">
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

            {messages.map((msg, i) => (
              <div key={i} className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`p-1.5 rounded-lg flex-shrink-0 mb-0.5 ${msg.role === 'user' ? 'bg-red-600' : 'bg-slate-900'}`}>
                  {msg.role === 'user' ? <User size={11} className="text-white" /> : <Bot size={11} className="text-white" />}
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
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} strokeWidth={2.5} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
