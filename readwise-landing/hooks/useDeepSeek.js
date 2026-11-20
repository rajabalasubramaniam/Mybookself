'use client';

import { useState, useCallback } from 'react';
import { callDeepSeek, streamDeepSeek } from '@/lib/deepseek';

/**
 * React hook for interacting with DeepSeek API
 * Handles loading, error states, and conversation history
 */
export function useDeepSeek() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(
    async (userMessage, useStream = false) => {
      setLoading(true);
      setError(null);

      try {
        if (useStream) {
          let fullResponse = '';

          await streamDeepSeek(userMessage, (chunk) => {
            fullResponse += chunk;
            // Update UI in real-time if needed
          }, messages);

          const newMessages = [
            ...messages,
            { role: 'user', content: userMessage },
            { role: 'assistant', content: fullResponse },
          ];
          setMessages(newMessages);
          return fullResponse;
        } else {
          const response = await callDeepSeek(userMessage, messages);

          const newMessages = [
            ...messages,
            { role: 'user', content: userMessage },
            { role: 'assistant', content: response.message },
          ];
          setMessages(newMessages);
          return response.message;
        }
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [messages]
  );

  const clearConversation = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearConversation,
  };
}
