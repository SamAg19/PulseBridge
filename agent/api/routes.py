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
from agents.cardiology_agent import get_cardiology_agent

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
        # Phase 3: Use real MeTTa-powered Cardiology agent
        cardiology_agent = get_cardiology_agent()

        # Run Cardiology agent analysis with real MeTTa reasoning
        cardiology_analysis = await cardiology_agent.analyze(
            symptoms=request.symptoms,
            patient_age=request.patient_age,
            patient_gender=request.patient_gender,
            medical_history=request.medical_history
        )

        logger.info(f"Cardiology agent completed analysis: {cardiology_analysis.confidence_score} confidence")

        # Extract recommended specialization from analysis
        recommended_specialization = "Cardiology"  # For now, always cardiology (will add triage agent in Phase 4)

        # Query real doctors from blockchain
        matcher = get_doctor_matcher()
        matching_doctors = await matcher.find_doctors(recommended_specialization)

        logger.info(f"Found {len(matching_doctors)} doctors for {recommended_specialization}")

        # Generate preliminary diagnosis from Cardiology analysis
        preliminary_diagnosis = cardiology_analysis.analysis

        # Create mock triage agent (will be real in Phase 4)
        triage_analysis = AgentAnalysis(
            agent_name="Triage Coordinator",
            agent_role="triage",
            analysis=f"Patient symptoms indicate potential cardiac issue. Routing to cardiology specialist for detailed assessment. {len(matching_doctors)} cardiologists available.",
            confidence_score=0.75,
            risk_level=cardiology_analysis.risk_level,
            recommendations=[
                "Route to cardiology specialist",
                "Assess urgency level based on symptom severity"
            ],
            processing_time_ms=50
        )

        # Generate consensus reasoning
        consensus_reasoning = f"After collaborative analysis, Cardiology specialist (MeTTa-powered) identified {cardiology_analysis.confidence_score:.0%} probability of {preliminary_diagnosis.split('suggest possible ')[1].split('.')[0] if 'suggest possible' in preliminary_diagnosis else 'cardiac condition'}. "
        consensus_reasoning += f"MeTTa reasoning matched {cardiology_analysis.metta_reasoning.matched_rules if cardiology_analysis.metta_reasoning else 0} medical rules. "
        consensus_reasoning += f"Urgency level: {cardiology_analysis.risk_level}. "
        consensus_reasoning += f"Consensus: Primary concern is cardiovascular, requiring specialist consultation."

        response = SymptomAnalysisResponse(
            preliminary_diagnosis=preliminary_diagnosis,
            recommended_specialization=recommended_specialization,
            urgency_level=cardiology_analysis.risk_level,
            overall_confidence=cardiology_analysis.confidence_score,
            agent_collaboration={
                "triage": triage_analysis,
                "cardiology": cardiology_analysis  # Real MeTTa-powered analysis!
            },
            consensus_reasoning=consensus_reasoning,
            available_doctors=matching_doctors,
            total_doctors_found=len(matching_doctors),
            analysis_timestamp=datetime.now().isoformat(),
            processing_time_ms=int((time.time() - start_time) * 1000),
            asi_one_enhanced=False  # Will be True in Phase 6 when ASI:One is integrated
        )

        return response

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing symptoms: {str(e)}"
        )
