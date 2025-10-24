"""
API Routes for PulseBridge Agent System
"""

from fastapi import APIRouter, HTTPException
from api.models import (
    SymptomAnalysisRequest,
    SymptomAnalysisResponse,
    HealthCheckResponse,
    AgentStatusResponse,
    AgentAnalysis,
    MeTTaReasoning
)
from datetime import datetime
import time
import logging
from services.doctor_matcher import get_doctor_matcher
from services.asione_client import get_asione_client
from agents.cardiology_agent import get_cardiology_agent
from agents.triage_agent import get_triage_agent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Analysis"])


@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """
    Health check endpoint

    Returns system status and component health
    """
    # Check blockchain connection
    contract_connected = False
    try:
        matcher = get_doctor_matcher()
        # Test connectivity by calling a simple read function
        num_doctors = matcher.registry.get_num_doctors()
        contract_connected = True
        logger.info(f"Health check: DoctorRegistry has {num_doctors} doctors")
    except Exception as e:
        logger.warning(f"Health check: Blockchain connection failed - {e}")

    return HealthCheckResponse(
        status="healthy" if contract_connected else "degraded",
        agents_loaded=["triage", "cardiology"],
        metta_engine_status="pending",  # Will be "active" in Phase 3
        contract_connected=contract_connected,
        asi_one_available=False,  # Will be True in Phase 6
        timestamp=datetime.now().isoformat()
    )


@router.get("/agents/status", response_model=AgentStatusResponse)
async def agent_status():
    """
    Get status of all agents
    """
    return AgentStatusResponse(
        total_agents=2,
        agents={
            "triage": {
                "status": "active",
                "role": "routing",
                "knowledge_base": "triage.metta"
            },
            "cardiology": {
                "status": "active",
                "role": "specialist",
                "knowledge_base": "cardiology.metta",
                "rules_count": 20
            }
        },
        system_health="operational"
    )


@router.post("/analyze-symptoms", response_model=SymptomAnalysisResponse)
async def analyze_symptoms(request: SymptomAnalysisRequest):
    """
    Analyze patient symptoms using multi-agent system

    Flow:
    1. Triage agent receives symptoms
    2. Routes to appropriate specialist agents
    3. Agents collaborate using MeTTa reasoning
    4. Reach consensus
    5. Query DoctorRegistry for matching doctors
    6. Return comprehensive analysis

    This endpoint is the main integration point for the frontend.
    """
    start_time = time.time()

    try:
        # Phase 4: Use real MeTTa-powered Triage agent for routing
        triage_agent = get_triage_agent()

        # Step 1: Triage agent routes symptoms to appropriate specialty
        triage_analysis, recommended_specialty = await triage_agent.analyze(
            symptoms=request.symptoms,
            patient_age=request.patient_age,
            patient_gender=request.patient_gender,
            medical_history=request.medical_history
        )

        logger.info(f"Triage agent routed to: {recommended_specialty} (confidence: {triage_analysis.confidence_score})")

        # Step 2: Route to appropriate specialist agent
        # For now, we only have Cardiology implemented (Neurology/Dermatology in Phase 8)
        specialist_analysis = None

        if recommended_specialty.lower() == "cardiology":
            cardiology_agent = get_cardiology_agent()
            specialist_analysis = await cardiology_agent.analyze(
                symptoms=request.symptoms,
                patient_age=request.patient_age,
                patient_gender=request.patient_gender,
                medical_history=request.medical_history
            )
            logger.info(f"Cardiology agent completed analysis: {specialist_analysis.confidence_score} confidence")
        else:
            # For non-cardiology specialties not yet implemented, route to cardiology as fallback
            logger.warning(f"{recommended_specialty} agent not yet implemented, using cardiology fallback")
            cardiology_agent = get_cardiology_agent()
            specialist_analysis = await cardiology_agent.analyze(
                symptoms=request.symptoms,
                patient_age=request.patient_age,
                patient_gender=request.patient_gender,
                medical_history=request.medical_history
            )
            recommended_specialty = "cardiology"

        # Step 3: Query real doctors from blockchain
        matcher = get_doctor_matcher()
        # Capitalize for doctor search
        specialty_search = recommended_specialty.title()
        matching_doctors = await matcher.find_doctors(specialty_search)

        logger.info(f"Found {len(matching_doctors)} doctors for {specialty_search}")

        asione_client = get_asione_client()
        asi_one_used = False

        # Generate preliminary diagnosis from specialist analysis
        preliminary_diagnosis = specialist_analysis.analysis

        # Use ASI:One to create patient-friendly explanation (if enabled)
        if asione_client.enabled:
            patient_friendly_diagnosis = await asione_client.generate_patient_friendly_explanation(
                technical_diagnosis=preliminary_diagnosis,
                metta_reasoning=specialist_analysis.metta_reasoning.dict() if specialist_analysis.metta_reasoning else None,
                recommendations=specialist_analysis.recommendations
            )
            # Use ASI:One version if different from original
            if patient_friendly_diagnosis != preliminary_diagnosis:
                preliminary_diagnosis = patient_friendly_diagnosis
                asi_one_used = True
                logger.info("ASI:One enhanced preliminary diagnosis")

        # Generate consensus reasoning showing multi-agent collaboration
        technical_consensus = f"Multi-agent collaboration: Triage agent (MeTTa routing: {triage_analysis.metta_reasoning.matched_rules if triage_analysis.metta_reasoning else 0} rules) "
        technical_consensus += f"routed to {recommended_specialty.title()} with {triage_analysis.confidence_score:.0%} confidence. "
        technical_consensus += f"\n\n{recommended_specialty.title()} specialist (MeTTa reasoning: {specialist_analysis.metta_reasoning.matched_rules if specialist_analysis.metta_reasoning else 0} rules) "
        technical_consensus += f"identified {specialist_analysis.confidence_score:.0%} probability of condition requiring attention. "
        technical_consensus += f"\n\nUrgency level: {specialist_analysis.risk_level}. "
        technical_consensus += f"Consensus: Patient should consult {recommended_specialty.title()} specialist. {len(matching_doctors)} qualified specialists available."

        # Use ASI:One to enhance consensus reasoning (if enabled)
        consensus_reasoning = technical_consensus
        if asione_client.enabled:
            enhanced_consensus = await asione_client.enhance_consensus_reasoning(
                triage_analysis=triage_analysis.analysis,
                specialist_analysis=specialist_analysis.analysis,
                specialty=recommended_specialty.title(),
                confidence=specialist_analysis.confidence_score
            )
            if enhanced_consensus != technical_consensus:
                consensus_reasoning = enhanced_consensus
                asi_one_used = True
                logger.info("ASI:One enhanced consensus reasoning")

        # Build agent collaboration dict
        agent_collaboration = {
            "triage": triage_analysis,
            recommended_specialty.lower(): specialist_analysis  # Dynamic key based on routed specialty
        }

        response = SymptomAnalysisResponse(
            preliminary_diagnosis=preliminary_diagnosis,
            recommended_specialization=specialty_search,  # Properly capitalized
            urgency_level=specialist_analysis.risk_level,
            overall_confidence=specialist_analysis.confidence_score,
            agent_collaboration=agent_collaboration,
            consensus_reasoning=consensus_reasoning,
            available_doctors=matching_doctors,
            total_doctors_found=len(matching_doctors),
            analysis_timestamp=datetime.now().isoformat(),
            processing_time_ms=int((time.time() - start_time) * 1000),
            asi_one_enhanced=asi_one_used  # True when ASI:One successfully enhanced the response
        )

        return response

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing symptoms: {str(e)}"
        )
