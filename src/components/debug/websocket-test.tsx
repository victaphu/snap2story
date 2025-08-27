"use client";

import { useState, useEffect } from 'react';
import { wsClient } from '@/lib/services/websocket-client';
import { Button } from '@/components/ui/button';

export function WebSocketTest() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  
  useEffect(() => {
    const connect = async () => {
      try {
        await wsClient.connect();
        setConnected(true);
        console.log('✅ WebSocket connected in test component');
        
        // Listen for any WebSocket messages
        const handler = (event: CustomEvent) => {
          const message = JSON.stringify(event.detail, null, 2);
          setMessages(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
          console.log('📨 WebSocket message:', event.detail);
        };
        
        window.addEventListener('websocket-message', handler as EventListener);
        
        return () => {
          window.removeEventListener('websocket-message', handler as EventListener);
        };
      } catch (error) {
        console.error('❌ WebSocket connection failed:', error);
        setConnected(false);
      }
    };
    
    connect();
  }, []);
  
  const testConnection = () => {
    if (wsClient.isConnected()) {
      console.log('🔄 WebSocket is connected');
      setMessages(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: Connection test - CONNECTED`]);
    } else {
      console.log('❌ WebSocket is NOT connected');
      setMessages(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: Connection test - DISCONNECTED`]);
    }
  };
  
  return (
    <div className="border rounded p-4 bg-muted/10">
      <h3 className="font-semibold mb-2">WebSocket Debug</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm">{connected ? 'Connected' : 'Disconnected'}</span>
          <Button size="sm" variant="outline" onClick={testConnection}>Test</Button>
        </div>
        
        {messages.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium">Recent Messages:</div>
            <div className="bg-black text-green-400 p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
              {messages.map((msg, i) => (
                <div key={i}>{msg}</div>
              ))}
            </div>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          Backend URL: {process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}
        </div>
      </div>
    </div>
  );
}