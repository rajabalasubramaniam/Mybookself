'use client';

import { useState } from 'react';
import { useDeepSeek } from '@/hooks/useDeepSeek';

export default function DeepSeekTestPage() {
  const { messages, loading, error, sendMessage, clearConversation } = useDeepSeek();
  const [input, setInput] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      await sendMessage(input);
      setInput('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">DeepSeek API Test</h1>

        {/* Status */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">API Status:</span> {error ? '❌ Error' : '✅ Connected'}
          </p>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>

        {/* Chat Messages */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 h-96 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center py-12">
              No messages yet. Send a message to get started!
            </p>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg">
                    Thinking...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
          <button
            type="button"
            onClick={clearConversation}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Clear
          </button>
        </form>
      </div>
    </div>
  );
}
