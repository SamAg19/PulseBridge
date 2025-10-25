"""
Triage Fetch.ai Agent

Autonomous agent that receives symptom descriptions and routes to appropriate specialist.
Uses MeTTa reasoning with 30+ routing rules for intelligent specialty recommendation.
"""

from uagents import Agent, Context, Protocol
from fetch_agents.messages import (
    SymptomRoutingRequest,
    SpecialtyRecommendation,
    AgentHealthCheck,
    AgentHealthResponse
)
from metta.triage_knowledge import get_triage_knowledge
import os
from dotenv import load_dotenv
import logging
from datetime import datetime

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Agent configuration
AGENT_NAME = "triage-agent"
AGENT_SEED = os.getenv("TRIAGE_AGENT_SEED", "pulsebridge_triage_routing_seed_phrase")
AGENT_PORT = int(os.getenv("TRIAGE_AGENT_PORT", "8002"))

# Create the agent
agent = Agent(
    name=AGENT_NAME,
    seed=AGENT_SEED,
    port=AGENT_PORT,
    endpoint=[f"http://localhost:{AGENT_PORT}/submit"],
)

# Initialize MeTTa knowledge base
triage_knowledge = None

logger.info(f"Triage Agent Address: {agent.address}")


# TRIAGE ROUTING PROTOCOL

triage_protocol = Protocol(name="TriageRouting", version="1.0.0")


@triage_protocol.on_message(model=SymptomRoutingRequest, replies={SpecialtyRecommendation})
async def handle_routing_request(ctx: Context, sender: str, msg: SymptomRoutingRequest):
    """
    Handle symptom routing request from CoordinatorAgent

    Flow:
    1. Receive patient symptoms
    2. Use MeTTa knowledge base to route to specialist
    3. Return specialty recommendation with confidence
    """
    ctx.logger.info(f"Received routing request from {sender}: {msg.symptoms[:50]}...")

    try:
        # Ensure MeTTa knowledge is loaded
        global triage_knowledge
        if triage_knowledge is None:
            triage_knowledge = get_triage_knowledge()
            ctx.logger.info("MeTTa triage knowledge loaded")

        # Use MeTTa routing engine
        metta_result = triage_knowledge.route_symptoms(
            symptoms=msg.symptoms,
            patient_age=msg.patient_age
        )

        ctx.logger.info(
            f"MeTTa routing: {metta_result['recommended_specialty']} "
            f"(confidence: {metta_result['confidence']}, "
            f"rules: {metta_result['matched_rules']})"
        )

        # Map urgency score to urgency level
        urgency_level = _map_urgency_level(metta_result["urgency"])

        # Generate reasoning explanation
        reasoning = _generate_reasoning_text(
            metta_result["recommended_specialty"],
            metta_result["confidence"],
            metta_result["matched_keywords"],
            metta_result["matched_rules"],
            metta_result["urgency"]
        )

        # Send specialty recommendation back to coordinator
        await ctx.send(
            sender,
            SpecialtyRecommendation(
                recommended_specialty=metta_result["recommended_specialty"],
                confidence=metta_result["confidence"],
                urgency_level=urgency_level,
                reasoning=reasoning,
                matched_rules=metta_result["matched_rules"],
                matched_keywords=metta_result["matched_keywords"],
                session_id=msg.session_id
            )
        )

        ctx.logger.info(f"Routing recommendation sent to {sender}: {metta_result['recommended_specialty']}")

    except Exception as e:
        ctx.logger.error(f"Error processing routing request: {e}", exc_info=True)

        # Send fallback recommendation
        await ctx.send(
            sender,
            SpecialtyRecommendation(
                recommended_specialty="cardiology",
                confidence=0.50,
                urgency_level="moderate",
                reasoning="Triage routing encountered an issue. Defaulting to cardiology for evaluation.",
                matched_rules=0,
                matched_keywords=[],
                session_id=msg.session_id
            )
        )


def _map_urgency_level(urgency_score: float) -> str:
    """Map urgency score (0-1) to urgency level string"""
    if urgency_score >= 0.90:
        return "critical"
    elif urgency_score >= 0.75:
        return "high"
    elif urgency_score >= 0.50:
        return "moderate"
    else:
        return "low"


def _generate_reasoning_text(
    specialty: str,
    confidence: float,
    keywords: list,
    matched_rules: int,
    urgency: float
) -> str:
    """Generate human-readable reasoning explanation"""

    reasoning = f"MeTTa triage analysis routed symptoms to {specialty.title()} "
    reasoning += f"with {confidence:.0%} confidence. "

    if keywords:
        reasoning += f"Key symptoms identified: {', '.join(keywords[:3])}. "

    reasoning += f"Evaluated {matched_rules} MeTTa routing rules. "

    urgency_level = _map_urgency_level(urgency)
    reasoning += f"Urgency assessment: {urgency_level}."

    return reasoning


# Register protocol
agent.include(triage_protocol, publish_manifest=True)


# ==================== HEALTH CHECK PROTOCOL ====================

health_protocol = Protocol(name="HealthCheck", version="1.0.0")


@health_protocol.on_message(model=AgentHealthCheck, replies={AgentHealthResponse})
async def handle_health_check(ctx: Context, sender: str, msg: AgentHealthCheck):
    """Handle health check request"""
    global triage_knowledge

    metta_loaded = triage_knowledge is not None

    await ctx.send(
        sender,
        AgentHealthResponse(
            agent_name=AGENT_NAME,
            status="healthy" if metta_loaded else "degraded",
            metta_loaded=metta_loaded,
            asi_one_available=False,  # Triage doesn't use ASI:One
            timestamp=datetime.now().isoformat()
        )
    )


agent.include(health_protocol, publish_manifest=True)


# STARTUP & INTERVALS 

@agent.on_event("startup")
async def startup(ctx: Context):
    """Agent startup - load MeTTa knowledge"""
    ctx.logger.info("=" * 60)
    ctx.logger.info("Triage Agent Starting...")
    ctx.logger.info("=" * 60)
    ctx.logger.info(f"Agent Name: {AGENT_NAME}")
    ctx.logger.info(f"Agent Address: {agent.address}")
    ctx.logger.info(f"Port: {AGENT_PORT}")

    # Load MeTTa knowledge base
    global triage_knowledge
    try:
        triage_knowledge = get_triage_knowledge()
        ctx.logger.info("MeTTa triage knowledge base loaded (30+ routing rules)")
        ctx.logger.info("Triage Routing Protocol: ENABLED")
    except Exception as e:
        ctx.logger.error(f"Failed to load MeTTa knowledge: {e}")

    ctx.logger.info("Ready to route symptoms to specialists!")
    ctx.logger.info("=" * 60)


@agent.on_interval(period=3600.0)  # Every hour
async def heartbeat(ctx: Context):
    """Periodic heartbeat"""
    ctx.logger.info("Triage Agent: Active and ready")


# RUN AGENT

if __name__ == "__main__":
    logger.info("Starting Triage Fetch.ai Agent...")
    logger.info(f"Agent Address: {agent.address}")
    logger.info("This agent routes symptoms to appropriate specialists using MeTTa reasoning")
    agent.run()
