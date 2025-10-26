"""
Dermatology Specialist Fetch.ai Agent

Autonomous agent that provides detailed dermatological analysis using MeTTa reasoning.
Includes ASI:One integration for patient-friendly diagnosis generation.
"""

from uagents import Agent, Context, Protocol
from fetch_agents.messages import (
    SpecialistAnalysisRequest,
    SpecialistAnalysisResponse,
    AgentHealthCheck,
    AgentHealthResponse
)
from metta.dermatology_knowledge import get_dermatology_knowledge
import os
from dotenv import load_dotenv
import httpx
import json
import logging
from datetime import datetime

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Agent configuration
AGENT_NAME = "dermatology-specialist-agent"
AGENT_SEED = os.getenv("DERMATOLOGY_AGENT_SEED", "pulsebridge_dermatology_specialist_seed_phrase")
AGENT_PORT = int(os.getenv("DERMATOLOGY_AGENT_PORT", "8005"))

# ASI:One configuration
ASIONE_API_KEY = os.getenv("ASIONE_API_KEY")
ASIONE_API_URL = os.getenv("ASIONE_API_URL", "https://agentverse.ai/v1/chat/completions")
ASIONE_MODEL = os.getenv("ASIONE_MODEL", "asi-1")
ASIONE_ENABLED = bool(ASIONE_API_KEY)

# Create the agent
agent = Agent(
    name=AGENT_NAME,
    seed=AGENT_SEED,
    port=AGENT_PORT,
    mailbox=True,
    publish_agent_details=True
)

# Initialize MeTTa knowledge base
dermatology_knowledge = None

logger.info(f"Dermatology Agent Address: {agent.address}")
logger.info(f"ASI:One Integration: {'ENABLED' if ASIONE_ENABLED else 'DISABLED'}")


# DERMATOLOGY ANALYSIS PROTOCOL

dermatology_protocol = Protocol(name="DermatologyAnalysis", version="1.0.0")


@dermatology_protocol.on_message(model=SpecialistAnalysisRequest, replies={SpecialistAnalysisResponse})
async def handle_analysis_request(ctx: Context, sender: str, msg: SpecialistAnalysisRequest):
    """
    Handle specialist analysis request from CoordinatorAgent

    Flow:
    1. Receive patient symptoms
    2. Use MeTTa knowledge base for dermatological analysis
    3. Use ASI:One to generate patient-friendly diagnosis
    4. Return detailed analysis with recommendations
    """
    ctx.logger.info(f"Received analysis request from {sender}: {msg.symptoms[:50]}...")

    try:
        # Ensure MeTTa knowledge is loaded
        global dermatology_knowledge
        if dermatology_knowledge is None:
            dermatology_knowledge = get_dermatology_knowledge()
            ctx.logger.info("MeTTa dermatology knowledge loaded (30+ rules)")

        # Use MeTTa reasoning engine
        metta_result = dermatology_knowledge.analyze_symptoms(
            symptoms=msg.symptoms,
            patient_age=msg.patient_age,
            risk_factors=msg.medical_history
        )

        ctx.logger.info(
            f"MeTTa analysis: {metta_result['condition']} "
            f"(confidence: {metta_result['confidence']}, "
            f"rules: {metta_result['matched_rules']})"
        )

        # Generate patient-friendly diagnosis using ASI:One
        diagnosis_text = metta_result["condition"].replace('_', ' ').title()
        asi_one_enhanced = False

        if ASIONE_ENABLED:
            try:
                patient_friendly_text = await _generate_patient_friendly_diagnosis(
                    condition=metta_result["condition"],
                    confidence=metta_result["confidence"],
                    symptoms=msg.symptoms,
                    recommendations=metta_result["recommendations"]
                )
                if patient_friendly_text:
                    diagnosis_text = patient_friendly_text
                    asi_one_enhanced = True
                    ctx.logger.info("ASI:One enhanced diagnosis generated")
            except Exception as e:
                ctx.logger.warning(f"ASI:One enhancement failed, using MeTTa diagnosis: {e}")

        # Map urgency to risk level
        risk_level = _map_risk_level(metta_result["urgency"])

        # Generate reasoning summary
        reasoning_summary = _generate_reasoning_summary(metta_result)

        # Send analysis response back to coordinator
        await ctx.send(
            sender,
            SpecialistAnalysisResponse(
                specialty="dermatology",
                diagnosis=diagnosis_text,
                condition=metta_result["condition"],
                confidence=metta_result["confidence"],
                urgency_score=metta_result["urgency"],
                risk_level=risk_level,
                recommendations=metta_result["recommendations"],
                metta_rules_matched=metta_result["matched_rules"],
                risk_factors_identified=metta_result["risk_factors_identified"],
                asi_one_enhanced=asi_one_enhanced,
                reasoning_summary=reasoning_summary,
                session_id=msg.session_id
            )
        )

        ctx.logger.info(f"Analysis sent to {sender}: {metta_result['condition']}")

    except Exception as e:
        ctx.logger.error(f"Error processing analysis request: {e}", exc_info=True)

        # Send fallback response
        await ctx.send(
            sender,
            SpecialistAnalysisResponse(
                specialty="dermatology",
                diagnosis="Dermatology evaluation needed. Analysis encountered an issue.",
                condition="dermatological_evaluation_needed",
                confidence=0.50,
                urgency_score=0.50,
                risk_level="moderate",
                recommendations=["Seek dermatologist consultation", "Monitor skin changes", "Photograph lesions"],
                metta_rules_matched=0,
                risk_factors_identified=[],
                asi_one_enhanced=False,
                reasoning_summary="Analysis encountered technical difficulties.",
                session_id=msg.session_id
            )
        )


async def _generate_patient_friendly_diagnosis(
    condition: str,
    confidence: float,
    symptoms: str,
    recommendations: list
) -> str:
    """
    Use ASI:One to generate patient-friendly diagnosis explanation

    Args:
        condition: Medical condition from MeTTa
        confidence: Confidence score
        symptoms: Original symptoms
        recommendations: Clinical recommendations

    Returns:
        Patient-friendly diagnosis text
    """
    if not ASIONE_ENABLED:
        return None

    condition_formatted = condition.replace('_', ' ').title()

    prompt = f"""You are a medical communication assistant. Create a patient-friendly explanation of this dermatological diagnosis.

Diagnosis: {condition_formatted}
Confidence: {confidence:.0%}
Patient Symptoms: {symptoms}
Recommendations: {', '.join(recommendations[:3])}

Create a brief, patient-friendly explanation (2-3 sentences) that:
1. Explains the condition clearly without medical jargon
2. Is reassuring but honest
3. Emphasizes the importance of professional consultation
4. Uses proper medical specialty name "dermatologist" (not "skin doctor")

Output only the patient-friendly text, no additional formatting."""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                ASIONE_API_URL,
                headers={
                    "Authorization": f"Bearer {ASIONE_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": ASIONE_MODEL,
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a medical communication assistant. Always use proper medical specialty names like 'dermatologist', not informal terms."
                        },
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.3,
                    "max_tokens": 200
                }
            )

            if response.status_code == 200:
                result = response.json()
                content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                return content.strip() if content else None

    except Exception as e:
        logger.warning(f"ASI:One API call failed: {e}")
        return None

    return None


def _map_risk_level(urgency_score: float) -> str:
    """Map urgency score (0-1) to risk level string"""
    if urgency_score >= 0.85:
        return "high"
    elif urgency_score >= 0.65:
        return "moderate"
    elif urgency_score >= 0.45:
        return "low"
    else:
        return "low"


def _generate_reasoning_summary(metta_result: dict) -> str:
    """Generate brief summary of MeTTa reasoning"""
    summary = f"MeTTa analysis identified {metta_result['condition'].replace('_', ' ')} "
    summary += f"with {metta_result['confidence']:.0%} confidence. "

    if metta_result['risk_factors_identified']:
        summary += f"Risk factors: {', '.join(metta_result['risk_factors_identified'])}. "

    summary += f"Evaluated {metta_result['matched_rules']} medical reasoning rules."

    return summary


# Register protocol
agent.include(dermatology_protocol, publish_manifest=True)


# HEALTH CHECK PROTOCOL

health_protocol = Protocol(name="HealthCheck", version="1.0.0")


@health_protocol.on_message(model=AgentHealthCheck, replies={AgentHealthResponse})
async def handle_health_check(ctx: Context, sender: str, msg: AgentHealthCheck):
    """Handle health check request"""
    global dermatology_knowledge

    metta_loaded = dermatology_knowledge is not None

    await ctx.send(
        sender,
        AgentHealthResponse(
            agent_name=AGENT_NAME,
            status="healthy" if metta_loaded else "degraded",
            metta_loaded=metta_loaded,
            asi_one_available=ASIONE_ENABLED,
            timestamp=datetime.now().isoformat()
        )
    )


agent.include(health_protocol, publish_manifest=True)


# STARTUP & INTERVALS

@agent.on_event("startup")
async def startup(ctx: Context):
    """Agent startup - load MeTTa knowledge"""
    ctx.logger.info("=" * 60)
    ctx.logger.info("Dermatology Specialist Agent Starting...")
    ctx.logger.info("=" * 60)
    ctx.logger.info(f"Agent Name: {AGENT_NAME}")
    ctx.logger.info(f"Agent Address: {agent.address}")
    ctx.logger.info(f"Port: {AGENT_PORT}")

    # Load MeTTa knowledge base
    global dermatology_knowledge
    try:
        dermatology_knowledge = get_dermatology_knowledge()
        ctx.logger.info("MeTTa dermatology knowledge base loaded (30+ rules)")
    except Exception as e:
        ctx.logger.error(f"Failed to load MeTTa knowledge: {e}")

    # Check ASI:One
    if ASIONE_ENABLED:
        ctx.logger.info("ASI:One Integration: ENABLED")
        ctx.logger.info("Patient-friendly diagnosis generation available")
    else:
        ctx.logger.warning("ASI:One Integration: DISABLED (no API key)")

    ctx.logger.info("Dermatology Analysis Protocol: ENABLED")
    ctx.logger.info("Ready to analyze skin conditions!")
    ctx.logger.info("=" * 60)


@agent.on_interval(period=3600.0)  # Every hour
async def heartbeat(ctx: Context):
    """Periodic heartbeat"""
    ctx.logger.info("Dermatology Agent: Active and ready")


# RUN AGENT

if __name__ == "__main__":
    logger.info("Starting Dermatology Specialist Fetch.ai Agent...")
    logger.info(f"Agent Address: {agent.address}")
    logger.info("This agent provides dermatological analysis using MeTTa reasoning + ASI:One")
    agent.run()
