"use client";

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

type ChatMessage = { id: string; role: 'assistant' | 'user'; content: string };

export function EditorMode() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      role: 'assistant',
      content:
        "Hi! I’m your book editor. Tell me the hero’s name and age, and what kind of story you want (e.g., bedtime adventure, birthday surprise).",
    },
  ]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, pending]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text };
    setMessages((m) => [...m, userMsg]);
    // Stub assistant response for now
    setPending(true);
    setTimeout(() => {
      const reply: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content:
          "Great! I’ll sketch a simple outline: 1) Meet the hero, 2) A fun challenge, 3) A cozy ending. You can ask me to change any part.",
      };
      setMessages((m) => [...m, reply]);
      setPending(false);
    }, 700);
  };

  return (
    <div className="grid grid-rows-[auto_1fr_auto] gap-3 sm:gap-4 max-w-4xl mx-auto h-[70vh] sm:h-[72vh]">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Editor Mode</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Chat to plan scenes, tone, and details. We’ll build the book together.</p>
      </div>

      {/* Chat area */}
      <Card className="h-full overflow-hidden">
        <CardContent className="p-3 sm:p-4 h-full">
          <div ref={listRef} className="h-full overflow-y-auto space-y-3 sm:space-y-4 pr-1">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] sm:max-w-[70%] rounded-lg px-3 py-2 text-sm sm:text-base ${
                    m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {pending && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <LoadingSpinner size="sm" />
                Thinking…
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Composer */}
      <div className="flex items-center gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Describe your hero and story idea…"
          className="flex-1"
        />
        <Button onClick={send} disabled={!input.trim() || pending}>Send</Button>
      </div>
    </div>
  );
}

