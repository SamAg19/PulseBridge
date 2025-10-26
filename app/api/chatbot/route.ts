import { NextRequest, NextResponse } from 'next/server';

// Coordinator agent address
const COORDINATOR_AGENT_ADDRESS = process.env.NEXT_PUBLIC_COORDINATOR_AGENT_ADDRESS ||
  'agent1qtp0vky7yjfv4wpnt9gamzy7llmw03pfc2kj54falmjtv46advqv2336tuc';

let clientInstance: any = null;

async function getClient() {
  if (!clientInstance) {
    const UAgentClientModule = await import('uagent-client');
    const UAgentClient = UAgentClientModule.default || UAgentClientModule;

    clientInstance = new (UAgentClient as any)({
      timeout: 60000,
      autoStartBridge: true
    });

    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  return clientInstance;
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      );
    }

    console.log(`[Chatbot API] Sending to coordinator: ${COORDINATOR_AGENT_ADDRESS}`);
    console.log(`[Chatbot API] Message: ${message.substring(0, 100)}`);

    const client = await getClient();

    // The uagent-client will wrap this in ChatMessage format (with TextContent)
    // and send it to our coordinator agent via the bridge
    const result = await client.query(COORDINATOR_AGENT_ADDRESS, message);

    console.log(`[Chatbot API] Result:`, result);

    // The result object has structure: { success, response?, error?, requestId }
    if (result && result.success && result.response) {
      return NextResponse.json({
        response: result.response,
        success: true
      });
    } else {
      return NextResponse.json({
        response: 'I apologize, but I was unable to process your request at this time.',
        success: false,
        error: result?.error || 'No response from agent'
      });
    }
  } catch (error) {
    console.error('[Chatbot API] Error:', error);

    return NextResponse.json(
      {
        response: 'An error occurred while processing your request.',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
