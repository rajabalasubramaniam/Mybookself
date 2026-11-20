// Streaming API route for real-time responses
// Usage: POST /api/deepseek/stream

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

    // Call DeepSeek API with streaming
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
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('DeepSeek API error:', error);
      return Response.json(
        { error: 'Failed to stream from DeepSeek' },
        { status: response.status }
      );
    }

    // Create a ReadableStream from the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(new TextEncoder().encode(content));
                  }
                } catch (e) {
                  // Ignore parse errors
                }
              }
            }
          }
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('DeepSeek streaming error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
