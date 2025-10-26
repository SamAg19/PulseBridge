import { NextRequest, NextResponse } from 'next/server';

// Coordinator agent HTTP endpoint - running on port 8001
const COORDINATOR_AGENT_URL = process.env.COORDINATOR_AGENT_URL || 'http://localhost:8001';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      );
    }

    // Prepare the message payload for the coordinator agent
    // Must match the RestChatRequest model structure
    const payload = {
      message: message
    };

    console.log(`[Chatbot API] Sending to coordinator: ${COORDINATOR_AGENT_URL}/chat`);
    console.log(`[Chatbot API] Message: ${message.substring(0, 100)}...`);
    console.log(`[Chatbot API] Payload:`, JSON.stringify(payload));

    // Make direct HTTP POST request to coordinator agent's REST endpoint
    const response = await fetch(`${COORDINATOR_AGENT_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log(`[Chatbot API] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Chatbot API] Agent returned error:`, errorText);

      return NextResponse.json({
        response: 'I apologize, but I was unable to process your request at this time. Please ensure the coordinator agent is running on port 8001.',
        success: false,
        error: `HTTP ${response.status}: ${errorText}`
      });
    }

    const data = await response.json();
    console.log(`[Chatbot API] Received response:`, data);

    // Extract response from the agent's RestChatResponse
    return NextResponse.json({
      response: data.response || 'No response from agent',
      success: true,
      sessionId: data.session_id,
      metadata: data.metadata || {}
    });

  } catch (error) {
    console.error('[Chatbot API] Error processing request:', error);

    return NextResponse.json(
      {
        response: 'An error occurred while processing your request. Please check if the coordinator agent is running on port 8001.',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
