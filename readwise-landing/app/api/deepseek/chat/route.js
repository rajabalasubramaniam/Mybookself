// API route to interact with DeepSeek
// Usage: POST /api/deepseek/chat

import deepseekConfig from '@/config/deepseek';

export async function POST(req) {
  try {
    const { message, conversationHistory = [] } = await req.json();

    if (!message) {
      return Response.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!deepseekConfig.apiKey) {
      return Response.json(
        { error: 'DeepSeek API key is not configured' },
        { status: 500 }
      );
    }

    // Prepare messages for DeepSeek API
    const messages = [
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // Call DeepSeek API
    const response = await fetch(`${deepseekConfig.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: deepseekConfig.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('DeepSeek API error:', error);
      return Response.json(
        { error: 'Failed to get response from DeepSeek' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    return Response.json({
      message: assistantMessage,
      usage: data.usage,
    });

  } catch (error) {
    console.error('DeepSeek API route error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
