"""
Coordinator Agent - User-Facing Orchestrator with Web3 Integration

This is the main user-facing agent that:
1. Accepts chat from users via DeltaV/ASI:One
2. Orchestrates triage and specialist agents
3. Queries blockchain for doctor recommendations
4. Returns complete formatted response to users
"""

from uagents import Agent, Context, Protocol, Model
from fetch_agents.messages import (
    ChatMessage,
    ChatResponse,
    SymptomRoutingRequest,
    SpecialtyRecommendation,
    SpecialistAnalysisRequest,
    SpecialistAnalysisResponse,
    AgentHealthCheck,
    AgentHealthResponse
)
from fetch_agents.web3_doctor_client import get_web3_doctor_client
from typing import Dict, List, Any
import os
from dotenv import load_dotenv
import logging
from datetime import datetime
import asyncio
from uuid import UUID, uuid4

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Agent configuration
AGENT_NAME = "coordinator-agent"
AGENT_SEED = os.getenv("COORDINATOR_AGENT_SEED", "pulsebridge_coordinator_user_facing_seed_phrase")
AGENT_PORT = int(os.getenv("COORDINATOR_AGENT_PORT", "8001"))

# Agent addresses (configured after deployment)
TRIAGE_AGENT_ADDRESS = os.getenv("TRIAGE_AGENT_ADDRESS", "")
CARDIOLOGY_AGENT_ADDRESS = os.getenv("CARDIOLOGY_AGENT_ADDRESS", "")
NEUROLOGY_AGENT_ADDRESS = os.getenv("NEUROLOGY_AGENT_ADDRESS", "")
DERMATOLOGY_AGENT_ADDRESS = os.getenv("DERMATOLOGY_AGENT_ADDRESS", "")

# Create the agent
agent = Agent(
    name=AGENT_NAME,
    seed=AGENT_SEED,
    port=AGENT_PORT,
    mailbox=True,
    publish_agent_details=True
)

# Initialize Web3 client
web3_client = None

# Session storage for multi-step conversations
active_sessions = {}

logger.info(f"Coordinator Agent Address: {agent.address}")


# CHAT PROTOCOL (User-Facing)

chat_protocol = Protocol(name="Chat", version="1.0.0")


@chat_protocol.on_message(model=ChatMessage)
async def handle_chat_message(ctx: Context, sender: str, msg: ChatMessage):
    """
    Handle incoming chat from user via DeltaV/ASI:One

    Complete flow:
    1. Receive symptoms from user
    2. Route to Triage Agent for specialty recommendation
    3. Forward to appropriate Specialist Agent for diagnosis
    4. Query blockchain for matching doctors
    5. Format and return complete response
    """
    ctx.logger.info(f"Received chat from user {sender}: {msg.message[:50]}...")

    # Check for greeting
    if _is_greeting(msg.message):
        await ctx.send(
            sender,
            ChatResponse(
                response=_get_welcome_message(),
                session_id=msg.session_id,
                metadata={"type": "greeting"}
            )
        )
        return

    # Process symptom analysis
    try:
        # Create session tracking
        session_id = msg.session_id
        active_sessions[session_id] = {
            "user": sender,
            "symptoms": msg.message,
            "timestamp": datetime.now().isoformat(),
            "triage_response": None,
            "specialist_response": None
        }

        ctx.logger.info(f"Session {session_id}: Starting multi-agent consultation")

        # STEP 1: Send to Triage Agent for routing
        if not TRIAGE_AGENT_ADDRESS:
            await _send_error_response(ctx, sender, session_id, "Triage agent not configured")
            return

        ctx.logger.info(f"Session {session_id}: Sending to Triage Agent...")

        # Send acknowledgment to user
        await ctx.send(
            sender,
            ChatResponse(
                response="🔍 Analyzing your symptoms... Please wait while I consult our medical AI specialists.",
                session_id=session_id,
                metadata={"type": "processing"}
            )
        )

        # Send to triage agent
        await ctx.send(
            TRIAGE_AGENT_ADDRESS,
            SymptomRoutingRequest(
                symptoms=msg.message,
                patient_age=None,
                patient_gender=None,
                medical_history=[],
                session_id=session_id
            )
        )

        # Response will be handled by handle_triage_response below

    except Exception as e:
        ctx.logger.error(f"Error processing chat: {e}", exc_info=True)
        await _send_error_response(ctx, sender, session_id, str(e))


@chat_protocol.on_message(model=SpecialtyRecommendation)
async def handle_triage_response(ctx: Context, sender: str, msg: SpecialtyRecommendation):
    """
    Handle specialty recommendation from Triage Agent

    Flow:
    1. Receive routing recommendation
    2. Route to appropriate specialist agent
    """
    ctx.logger.info(f"Received triage recommendation: {msg.recommended_specialty} ({msg.confidence:.0%})")

    session_id = msg.session_id
    if session_id not in active_sessions:
        ctx.logger.warning(f"Session {session_id} not found")
        return

    # Store triage response
    active_sessions[session_id]["triage_response"] = {
        "specialty": msg.recommended_specialty,
        "confidence": msg.confidence,
        "urgency": msg.urgency_level,
        "reasoning": msg.reasoning,
        "matched_rules": msg.matched_rules
    }

    # STEP 2: Route to specialist agent
    specialist_address = _get_specialist_address(msg.recommended_specialty)

    if not specialist_address:
        ctx.logger.warning(f"Specialist agent not configured for {msg.recommended_specialty}")
        user = active_sessions[session_id]["user"]
        await _send_error_response(ctx, user, session_id, f"{msg.recommended_specialty} agent not available")
        return

    ctx.logger.info(f"Session {session_id}: Routing to {msg.recommended_specialty} specialist...")

    await ctx.send(
        specialist_address,
        SpecialistAnalysisRequest(
            symptoms=active_sessions[session_id]["symptoms"],
            patient_age=None,
            patient_gender=None,
            medical_history=[],
            session_id=session_id
        )
    )


@chat_protocol.on_message(model=SpecialistAnalysisResponse)
async def handle_specialist_response(ctx: Context, sender: str, msg: SpecialistAnalysisResponse):
    """
    Handle diagnosis from Specialist Agent

    Flow:
    1. Receive specialist diagnosis
    2. Query blockchain for doctors
    3. Format complete response
    4. Send to user
    """
    ctx.logger.info(f"Received specialist analysis: {msg.condition} ({msg.confidence:.0%})")

    session_id = msg.session_id
    if session_id not in active_sessions:
        ctx.logger.warning(f"Session {session_id} not found")
        return

    # Store specialist response
    active_sessions[session_id]["specialist_response"] = {
        "specialty": msg.specialty,
        "diagnosis": msg.diagnosis,
        "condition": msg.condition,
        "confidence": msg.confidence,
        "risk_level": msg.risk_level,
        "recommendations": msg.recommendations,
        "metta_rules": msg.metta_rules_matched,
        "asi_one_enhanced": msg.asi_one_enhanced
    }

    # STEP 3: Query blockchain for doctors
    ctx.logger.info(f"Session {session_id}: Querying blockchain for {msg.specialty} doctors...")

    global web3_client
    if web3_client is None:
        web3_client = get_web3_doctor_client()

    doctors = []
    if web3_client.enabled:
        doctors = web3_client.find_doctors_by_specialty(msg.specialty, max_results=3)
        ctx.logger.info(f"Found {len(doctors)} doctors on blockchain")

    # STEP 4: Format complete response
    formatted_response = _format_complete_response(
        triage=active_sessions[session_id]["triage_response"],
        specialist=active_sessions[session_id]["specialist_response"],
        doctors=doctors
    )

    # Build response
    chat_response = ChatResponse(
        response=formatted_response,
        session_id=session_id,
        metadata={
            "specialty": msg.specialty,
            "condition": msg.condition,
            "urgency": msg.risk_level,
            "doctors_found": len(doctors),
            "metta_rules_total": active_sessions[session_id]["triage_response"]["matched_rules"] + msg.metta_rules_matched,
            "asi_one_enhanced": msg.asi_one_enhanced
        }
    )

    # Check if this is bridge mode (uagent-client), REST mode, or message mode
    if active_sessions[session_id].get("bridge_mode"):
        # BRIDGE MODE: Send response in ChatMessage format for uagent-client
        user = active_sessions[session_id]["user"]
        ctx.logger.info(f"Session {session_id}: Bridge mode - sending ChatMessage response")

        try:
            from uagents_core.contrib.protocols.chat import (
                ChatMessage as BridgeChatMessage,
                TextContent as BridgeTextContent
            )
            from uuid import uuid4
            from datetime import datetime

            response = BridgeChatMessage(
                timestamp=datetime.utcnow(),
                msg_id=uuid4(),
                content=[BridgeTextContent(type="text", text=formatted_response)]
            )
            await ctx.send(user, response)
            ctx.logger.info(f"Session {session_id}: Complete response sent to bridge client")
        except ImportError:
            ctx.logger.error("Bridge chat protocol not available!")

        # Cleanup session
        del active_sessions[session_id]

    elif active_sessions[session_id].get("rest_mode"):
        # REST MODE: Store response for REST handler to return
        ctx.logger.info(f"Session {session_id}: REST mode - storing response")
        active_sessions[session_id]["final_response"] = chat_response
        active_sessions[session_id]["response_ready"] = True
        # Don't delete session - REST handler will clean up
    else:
        # MESSAGE MODE: Send response back to user via mailbox
        user = active_sessions[session_id]["user"]
        await ctx.send(user, chat_response)
        ctx.logger.info(f"Session {session_id}: Complete response sent to user")
        # Cleanup session
        del active_sessions[session_id]


def _is_greeting(message: str) -> bool:
    """Check if message is a greeting"""
    greetings = ['hi', 'hello', 'hey', 'help', 'start', 'greetings']
    return any(g in message.lower() for g in greetings)


def _get_welcome_message() -> str:
    """Generate welcome message"""
    return """👋 Welcome to PulseBridge - AI-Powered Healthcare Consultation

I'm your intelligent health assistant powered by:
• **MeTTa Reasoning** - 90+ medical rules across specialties
• **ASI:One** - Advanced natural language understanding
• **Multi-Agent Collaboration** - Triage + Specialist agents
• **Blockchain** - Verified doctor recommendations

**How it works:**
1. Describe your symptoms in natural language
2. Our triage agent routes to the right specialist
3. Specialist agent provides detailed analysis
4. Get matched with verified doctors on blockchain

**Example:** "I have severe chest pain when I exercise and shortness of breath"

Please describe your symptoms to begin your consultation."""


def _get_specialist_address(specialty: str) -> str:
    """Get agent address for specialty"""
    specialty_map = {
        "cardiology": CARDIOLOGY_AGENT_ADDRESS,
        "neurology": NEUROLOGY_AGENT_ADDRESS,
        "dermatology": DERMATOLOGY_AGENT_ADDRESS
    }
    return specialty_map.get(specialty.lower(), "")


def _format_complete_response(triage: dict, specialist: dict, doctors: list) -> str:
    """Format the complete response for user"""

    response = "🏥 **PulseBridge AI Medical Consultation**\n\n"

    # Diagnosis
    response += f"**Analysis:**\n{specialist['diagnosis']}\n\n"

    # Specialty & Confidence
    response += f"**Recommended Specialist:** {specialist['specialty'].title()}\n"
    response += f"**Diagnostic Confidence:** {specialist['confidence']:.0%}\n\n"

    # Urgency
    urgency_emoji = {"critical": "🚨", "high": "⚠️", "moderate": "📋", "low": "✅"}.get(specialist['risk_level'], "📋")
    response += f"**Urgency Level:** {urgency_emoji} {specialist['risk_level'].title()}\n\n"

    # Recommendations
    if specialist['recommendations']:
        response += "**Recommendations:**\n"
        for i, rec in enumerate(specialist['recommendations'][:3], 1):
            response += f"{i}. {rec}\n"
        response += "\n"

    # Doctors from blockchain
    if doctors:
        response += f"**Available Specialists ({len(doctors)} found on blockchain):**\n"
        for i, doctor in enumerate(doctors[:3], 1):
            response += f"{i}. Dr. {doctor['name']} - {doctor['specialization']}\n"
            if doctor.get('email'):
                response += f"   📧 {doctor['email']}\n"
        response += "\n"
    else:
        response += "**Note:** Doctor matching temporarily unavailable\n\n"

    # AI Transparency
    response += "**AI Reasoning Transparency:**\n"
    total_rules = triage['matched_rules'] + specialist['metta_rules']
    response += f"• 🧠 {total_rules} MeTTa reasoning rules evaluated\n"
    response += f"• 🤖 Triage routing confidence: {triage['confidence']:.0%}\n"

    if specialist['asi_one_enhanced']:
        response += "• ✨ Enhanced with ASI:One natural language processing\n"

    response += "\n⚠️ **Important:** This is an AI assessment tool. Always consult with a qualified healthcare professional for proper diagnosis and treatment."

    return response


async def _send_error_response(ctx: Context, user: str, session_id: str, error: str):
    """Send error response to user"""
    await ctx.send(
        user,
        ChatResponse(
            response=f"I apologize, but I encountered an error: {error}\n\nPlease try again or seek immediate medical attention if urgent.",
            session_id=session_id,
            metadata={"type": "error", "error": error}
        )
    )


# Register protocol
agent.include(chat_protocol, publish_manifest=True)


# HEALTH CHECK PROTOCOL

health_protocol = Protocol(name="HealthCheck", version="1.0.0")


@health_protocol.on_message(model=AgentHealthCheck, replies={AgentHealthResponse})
async def handle_health_check(ctx: Context, sender: str, msg: AgentHealthCheck):
    """Handle health check request"""
    global web3_client

    if web3_client is None:
        web3_client = get_web3_doctor_client()

    await ctx.send(
        sender,
        AgentHealthResponse(
            agent_name=AGENT_NAME,
            status="healthy",
            metta_loaded=False,  # Coordinator doesn't use MeTTa
            asi_one_available=False,  # Coordinator doesn't use ASI:One
            timestamp=datetime.now().isoformat()
        )
    )


agent.include(health_protocol, publish_manifest=True)


# STANDARD CHAT PROTOCOL (for uagent-client bridge compatibility)

# Try to import the standard chat protocol from uagents
try:
    from uagents_core.contrib.protocols.chat import (
        ChatMessage as BridgeChatMessage,
        TextContent as BridgeTextContent,
        ChatAcknowledgement
    )
    STANDARD_CHAT_AVAILABLE = True
    logger.info("✓ Standard chat protocol imported from uagents_core")

    @agent.on_message(model=ChatAcknowledgement)
    async def handle_chat_acknowledgement(ctx: Context, sender: str, msg: ChatAcknowledgement):
        """Handle acknowledgements from the bridge or other agents"""
        ctx.logger.info(f"Received chat acknowledgement from {sender} for message {msg.acknowledged_msg_id}")
        # No action needed - just log it

    @agent.on_message(model=BridgeChatMessage)
    async def handle_bridge_chat(ctx: Context, sender: str, msg: BridgeChatMessage):
        """
        Handle standard chat protocol messages from uagent-client bridge
        Uses the official uagents chat protocol for compatibility.

        This handler processes messages from the uagent-client library and
        orchestrates the full multi-agent medical consultation workflow.
        """
        ctx.logger.info(f"Received bridge chat message from {sender}")
        ctx.logger.info(f"Message ID: {msg.msg_id}, Timestamp: {msg.timestamp}")

        # Extract text from content list
        message_text = ""
        for item in msg.content:
            if hasattr(item, 'text'):
                message_text = item.text
                break

        if not message_text:
            ctx.logger.warning("No text content found in bridge chat message")
            error_response = BridgeChatMessage(
                timestamp=datetime.utcnow(),
                msg_id=uuid4(),
                content=[BridgeTextContent(type="text", text="❌ No text content received in message")]
            )
            await ctx.send(sender, error_response)
            return

        ctx.logger.info(f"Extracted text: {message_text[:100]}...")

        # Send acknowledgement
        await ctx.send(sender, ChatAcknowledgement(
            timestamp=datetime.utcnow(),
            acknowledged_msg_id=msg.msg_id
        ))

        # Handle greeting
        if _is_greeting(message_text):
            response_text = _get_welcome_message()
            response = BridgeChatMessage(
                timestamp=datetime.utcnow(),
                msg_id=uuid4(),
                content=[BridgeTextContent(type="text", text=response_text)]
            )
            await ctx.send(sender, response)
            return

        # FULL MULTI-AGENT WORKFLOW
        # Generate session ID
        session_id = f"bridge-{datetime.now().timestamp()}"

        # Create session for async workflow - store sender for response
        active_sessions[session_id] = {
            "user": sender,
            "symptoms": message_text,
            "timestamp": datetime.now().isoformat(),
            "triage_response": None,
            "specialist_response": None,
            "bridge_mode": True,  # Flag to indicate this is from uagent-client bridge
            "response_ready": False,
            "final_response": None
        }

        ctx.logger.info(f"Session {session_id}: Starting multi-agent consultation (bridge mode)")

        # Check if triage agent is configured
        if not TRIAGE_AGENT_ADDRESS:
            error_text = "⚠️ System configuration error: Triage agent not available. Please contact support."
            error_response = BridgeChatMessage(
                timestamp=datetime.utcnow(),
                msg_id=uuid4(),
                content=[BridgeTextContent(type="text", text=error_text)]
            )
            await ctx.send(sender, error_response)
            return

        # DON'T send intermediate processing message - uagent-client returns on first response
        # The client.query() will wait for the final response
        ctx.logger.info(f"Session {session_id}: Processing query, will respond when complete...")

        # Send to triage agent
        await ctx.send(
            TRIAGE_AGENT_ADDRESS,
            SymptomRoutingRequest(
                symptoms=message_text,
                patient_age=None,
                patient_gender=None,
                medical_history=[],
                session_id=session_id
            )
        )

        # DON'T WAIT HERE - Let the handler return so the agent can process incoming messages
        # The response will be sent by handle_specialist_response when the workflow completes
        ctx.logger.info(f"Session {session_id}: Triage request sent, waiting for async response...")

except ImportError as e:
    logger.warning(f"⚠ Standard chat protocol not available: {e}")
    STANDARD_CHAT_AVAILABLE = False


# WEB QUERY HANDLER (uagent-client Integration)

# Simple string message model for uagent-client queries
class WebQuery(Model):
    """Query model for uagent-client integration"""
    message: str

class WebQueryResponse(Model):
    """Response model for uagent-client queries"""
    response: str
    success: bool = True

# Message handler for uagent-client.query() calls via mailbox
@agent.on_message(model=WebQuery)
async def handle_web_query(ctx: Context, sender: str, msg: WebQuery):
    """
    Message handler for uagent-client.query() integration via mailbox

    Receives a simple string query from the frontend and returns the diagnosis.
    Works from anywhere via agent mailbox - no need for local HTTP access.
    """
    message = msg.message
    ctx.logger.info(f"Received web query from {sender}: {message[:50]}...")

    # Generate session ID
    session_id = f"web-{datetime.now().timestamp()}"

    # Check for greeting
    if _is_greeting(message):
        await ctx.send(
            sender,
            WebQueryResponse(
                response=_get_welcome_message(),
                success=True
            )
        )
        return

    # Create session for async workflow
    active_sessions[session_id] = {
        "user": sender,
        "symptoms": message,
        "timestamp": datetime.now().isoformat(),
        "triage_response": None,
        "specialist_response": None,
        "rest_mode": True,
        "response_ready": False,
        "final_response": None
    }

    ctx.logger.info(f"Session {session_id}: Starting multi-agent consultation")

    # Check if triage agent is configured
    if not TRIAGE_AGENT_ADDRESS:
        await ctx.send(
            sender,
            WebQueryResponse(
                response="⚠️ System configuration error: Triage agent not available. Please contact support.",
                success=False
            )
        )
        return

    # Send to triage agent
    await ctx.send(
        TRIAGE_AGENT_ADDRESS,
        SymptomRoutingRequest(
            symptoms=message,
            patient_age=None,
            patient_gender=None,
            medical_history=[],
            session_id=session_id
        )
    )

    # Wait for response (with timeout)
    max_wait = 60  # 60 seconds
    wait_interval = 0.5
    elapsed = 0

    while elapsed < max_wait:
        await asyncio.sleep(wait_interval)
        elapsed += wait_interval

        if active_sessions.get(session_id, {}).get("response_ready"):
            final_response = active_sessions[session_id]["final_response"]
            # Clean up session
            del active_sessions[session_id]
            ctx.logger.info(f"Session {session_id}: Sending response back to {sender}")
            await ctx.send(
                sender,
                WebQueryResponse(
                    response=final_response.response,
                    success=True
                )
            )
            return

    # Timeout
    ctx.logger.warning(f"Session {session_id}: Query timeout after {max_wait}s")
    if session_id in active_sessions:
        del active_sessions[session_id]

    await ctx.send(
        sender,
        WebQueryResponse(
            response="⏳ Sorry, the analysis is taking longer than expected. Please try again in a moment.",
            success=False
        )
    )


# STARTUP & INTERVALS

@agent.on_event("startup")
async def startup(ctx: Context):
    """Agent startup"""
    ctx.logger.info("=" * 60)
    ctx.logger.info("Coordinator Agent (User-Facing) Starting...")
    ctx.logger.info("=" * 60)
    ctx.logger.info(f"Agent Name: {AGENT_NAME}")
    ctx.logger.info(f"Agent Address: {agent.address}")
    ctx.logger.info(f"Port: {AGENT_PORT}")

    # Initialize Web3 client
    global web3_client
    try:
        web3_client = get_web3_doctor_client()
        if web3_client.enabled:
            num_doctors = web3_client.get_num_doctors()
            ctx.logger.info(f"✓ Web3 integration enabled ({num_doctors} doctors in registry)")
        else:
            ctx.logger.warning("⚠ Web3 integration disabled (no contract address)")
    except Exception as e:
        ctx.logger.error(f"Web3 initialization failed: {e}")

    # Check agent addresses
    ctx.logger.info("\nConfigured Agent Addresses:")
    ctx.logger.info(f"  Triage Agent: {TRIAGE_AGENT_ADDRESS or 'NOT CONFIGURED'}")
    ctx.logger.info(f"  Cardiology Agent: {CARDIOLOGY_AGENT_ADDRESS or 'NOT CONFIGURED'}")
    ctx.logger.info(f"  Neurology Agent: {NEUROLOGY_AGENT_ADDRESS or 'NOT CONFIGURED'}")
    ctx.logger.info(f"  Dermatology Agent: {DERMATOLOGY_AGENT_ADDRESS or 'NOT CONFIGURED'}")

    ctx.logger.info("\nChat Protocol: ENABLED")
    ctx.logger.info("Ready for DeltaV/ASI:One user interactions!")
    ctx.logger.info("=" * 60)


@agent.on_interval(period=3600.0)  # Every hour
async def heartbeat(ctx: Context):
    """Periodic heartbeat"""
    ctx.logger.info(f"Coordinator Agent: Active ({len(active_sessions)} active sessions)")


@agent.on_interval(period=120.0)  # Every 2 minutes
async def cleanup_stale_sessions(ctx: Context):
    """Clean up sessions that have timed out"""
    from datetime import datetime, timedelta

    current_time = datetime.now()
    timeout_threshold = timedelta(minutes=5)  # 5 minute timeout

    stale_sessions = []
    for session_id, session_data in active_sessions.items():
        session_time = datetime.fromisoformat(session_data["timestamp"])
        if current_time - session_time > timeout_threshold:
            stale_sessions.append(session_id)

    for session_id in stale_sessions:
        ctx.logger.warning(f"Cleaning up stale session: {session_id}")
        del active_sessions[session_id]

    if stale_sessions:
        ctx.logger.info(f"Cleaned up {len(stale_sessions)} stale session(s)")


# RUN AGENT

if __name__ == "__main__":
    logger.info("Starting Coordinator Agent (User-Facing)...")
    logger.info(f"Agent Address: {agent.address}")
    logger.info("This agent orchestrates triage + specialist agents and queries blockchain")
    agent.run()
