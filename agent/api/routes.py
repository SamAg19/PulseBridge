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
        # Get recommended specialization (will be from MeTTa in later phases)
        # For now, using "Cardiology" as default for mock response
        recommended_specialization = "Cardiology"

        # Query real doctors from blockchain
        matcher = get_doctor_matcher()
        matching_doctors = await matcher.find_doctors(recommended_specialization)

        logger.info(f"Found {len(matching_doctors)} doctors for {recommended_specialization}")

        # MOCK RESPONSE FOR NOW - Will be replaced with real orchestrator
        # This allows frontend to start integrating immediately

        mock_response = SymptomAnalysisResponse(
            preliminary_diagnosis="Based on your symptoms of chest pain and shortness of breath, along with your medical history of hypertension and diabetes, there is a possibility of angina or other cardiac condition.",
            recommended_specialization="Cardiology",
            urgency_level="high",
            overall_confidence=0.82,
            agent_collaboration={
                "triage": AgentAnalysis(
                    agent_name="Triage Coordinator",
                    agent_role="triage",
                    analysis="Patient symptoms indicate potential cardiac issue. Multiple risk factors present including hypertension and diabetes. Routing to cardiology specialist for detailed assessment.",
                    confidence_score=0.75,
                    risk_level="high",
                    recommendations=[
                        "Route to cardiology specialist",
                        "Assess urgency level",
                        "Consider neurology consultation for dizziness"
                    ],
                    processing_time_ms=120
                ),
                "cardiology": AgentAnalysis(
                    agent_name="Cardiology Specialist",
                    agent_role="cardiology",
                    analysis="Patient presents with chest pain that worsens with activity, combined with hypertension and diabetes. MeTTa reasoning indicates high probability (85%) of angina. Multiple cardiac risk factors identified. Urgent consultation recommended within 24 hours. EKG and stress test advised.",
                    confidence_score=0.85,
                    risk_level="high",
                    recommendations=[
                        "Urgent cardiology consultation within 24 hours",
                        "EKG recommended",
                        "Stress test advised",
                        "Avoid strenuous activity until consultation",
                        "Monitor symptoms closely"
                    ],
                    metta_reasoning=MeTTaReasoning(
                        matched_rules=5,
                        confidence_calculation="Base confidence 0.5 (chest pain match) + symptom pattern 0.2 (pain with activity) + risk factors 0.15 (HTN + diabetes)",
                        risk_factors_identified=["hypertension", "diabetes", "age>40", "chest pain with exertion"],
                        urgency_score=0.85,
                        key_findings=[
                            "Chest pain with exertional component",
                            "Multiple cardiac risk factors",
                            "Classic angina presentation",
                            "High urgency score"
                        ]
                    ),
                    processing_time_ms=450
                )
            },
            consensus_reasoning="After collaborative analysis, Cardiology specialist identified 85% probability of cardiac condition. Triage assessment confirmed high priority routing. Consensus: Primary concern is cardiovascular, requiring urgent specialist consultation. Patient should be seen by cardiologist within 24 hours.",
            available_doctors=matching_doctors,
            total_doctors_found=len(matching_doctors),
            analysis_timestamp=datetime.now().isoformat(),
            processing_time_ms=int((time.time() - start_time) * 1000),
            asi_one_enhanced=True
        )

        return mock_response

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing symptoms: {str(e)}"
        )
