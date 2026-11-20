// Utility functions for DeepSeek API calls

/**
 * Call DeepSeek API with a message
 * @param {string} message - The user message
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<Object>} - Response with message and usage info
 */
export async function callDeepSeek(message, conversationHistory = []) {
  try {
    const response = await fetch('/api/deepseek/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversationHistory,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to call DeepSeek API');
    }

    return await response.json();
  } catch (error) {
    console.error('DeepSeek API error:', error);
    throw error;
  }
}

/**
 * Stream DeepSeek response for real-time updates
 * @param {string} message - The user message
 * @param {Function} onChunk - Callback for each streamed chunk
 * @param {Array} conversationHistory - Previous messages for context
 */
export async function streamDeepSeek(message, onChunk, conversationHistory = []) {
  try {
    const response = await fetch('/api/deepseek/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversationHistory,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to stream from DeepSeek API');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      onChunk(chunk);
    }
  } catch (error) {
    console.error('DeepSeek streaming error:', error);
    throw error;
  }
}
