"""
API Models for PulseBridge Agent System
Pydantic models for request/response validation
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class SymptomAnalysisRequest(BaseModel):
    """
    Request for symptom analysis

    Frontend sends patient symptoms + metadata
    """
    symptoms: str = Field(
        ...,
        description="Patient's symptom description in natural language",
        min_length=10,
        max_length=2000
    )
    patient_age: Optional[int] = Field(
        None,
        ge=0,
        le=120,
        description="Patient age in years"
    )
    patient_gender: Optional[str] = Field(
        None,
        pattern="^(male|female|other)$",
        description="Patient gender"
    )
    medical_history: Optional[List[str]] = Field(
        None,
        description="List of chronic conditions or relevant medical history"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "symptoms": "I have been experiencing chest pain and shortness of breath for the past 2 days. The pain is sharp and gets worse when I climb stairs.",
                "patient_age": 45,
                "patient_gender": "male",
                "medical_history": ["hypertension", "diabetes type 2"]
            }
        }


class MeTTaReasoning(BaseModel):
    """
    MeTTa reasoning details for transparency
    """
    matched_rules: int = Field(..., description="Number of MeTTa rules that matched")
    confidence_calculation: str = Field(..., description="How confidence was calculated")
    risk_factors_identified: List[str] = Field(..., description="Risk factors found")
    urgency_score: float = Field(..., ge=0.0, le=1.0)
    key_findings: List[str] = Field(..., description="Key findings from reasoning")


class AgentAnalysis(BaseModel):
    """
    Individual agent's analysis result
    """
    agent_name: str = Field(..., description="Human-readable agent name")
    agent_role: str = Field(..., description="Agent role: triage, cardiology, neurology, etc.")
    analysis: str = Field(..., description="Natural language analysis from agent")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Confidence in analysis")
    risk_level: str = Field(..., pattern="^(low|moderate|high|critical)$")
    recommendations: List[str] = Field(..., description="Actionable recommendations")
    metta_reasoning: Optional[MeTTaReasoning] = Field(None, description="Detailed MeTTa reasoning")
    processing_time_ms: int = Field(..., description="Time taken by this agent in milliseconds")


class DoctorInfo(BaseModel):
    """
    Doctor information from DoctorRegistry contract
    """
    doctor_id: int
    name: str
    specialization: str
    profile_description: str
    email: str
    address: str = Field(..., description="Ethereum address")
    consultation_fee_per_hour: int = Field(..., description="Fee in USD")
    deposit_fee_stored: int
    legal_documents_ipfs_hash: str


class SymptomAnalysisResponse(BaseModel):
    """
    Complete response from symptom analysis

    This is what the frontend receives
    """

    # High-level summary
    preliminary_diagnosis: str = Field(
        ...,
        description="Primary diagnosis or concern identified"
    )
    recommended_specialization: str = Field(
        ...,
        description="Medical specialization recommended"
    )
    urgency_level: str = Field(
        ...,
        pattern="^(low|moderate|high|critical)$",
        description="Urgency of consultation"
    )
    overall_confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Overall confidence score across all agents"
    )

    # Transparent agent collaboration (THIS IS KEY FOR HACKATHON)
    agent_collaboration: Dict[str, AgentAnalysis] = Field(
        ...,
        description="Detailed breakdown of each agent's analysis"
    )
    consensus_reasoning: str = Field(
        ...,
        description="How agents reached consensus"
    )

    # Matched doctors from blockchain
    available_doctors: List[DoctorInfo] = Field(
        ...,
        description="Doctors matched from DoctorRegistry"
    )
    total_doctors_found: int

    # Metadata
    analysis_timestamp: str = Field(
        ...,
        description="ISO timestamp of analysis"
    )
    processing_time_ms: int = Field(
        ...,
        description="Total processing time"
    )
    asi_one_enhanced: bool = Field(
        default=False,
        description="Whether ASI:One was used for enhancement"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "preliminary_diagnosis": "Possible angina with high cardiac risk",
                "recommended_specialization": "Cardiology",
                "urgency_level": "high",
                "overall_confidence": 0.82,
                "agent_collaboration": {
                    "triage": {
                        "agent_name": "Triage Coordinator",
                        "agent_role": "triage",
                        "analysis": "Cardiac symptoms detected with multiple risk factors",
                        "confidence_score": 0.75,
                        "risk_level": "high",
                        "recommendations": ["Route to cardiology", "Assess urgency"],
                        "processing_time_ms": 150
                    },
                    "cardiology": {
                        "agent_name": "Cardiology Specialist",
                        "agent_role": "cardiology",
                        "analysis": "Patient presents with chest pain, hypertension, and diabetes...",
                        "confidence_score": 0.85,
                        "risk_level": "high",
                        "recommendations": ["Urgent consultation", "EKG recommended", "Stress test"],
                        "metta_reasoning": {
                            "matched_rules": 5,
                            "confidence_calculation": "Base 0.5 + symptom match 0.2 + risk factors 0.15",
                            "risk_factors_identified": ["hypertension", "diabetes", "age>40"],
                            "urgency_score": 0.85,
                            "key_findings": ["Multiple cardiac risk factors", "Chest pain with exertion"]
                        },
                        "processing_time_ms": 450
                    }
                },
                "consensus_reasoning": "Cardiology specialist identified 85% probability...",
                "available_doctors": [],
                "total_doctors_found": 0,
                "analysis_timestamp": "2025-01-24T10:30:00Z",
                "processing_time_ms": 850,
                "asi_one_enhanced": True
            }
        }


class HealthCheckResponse(BaseModel):
    """Health check response"""
    status: str
    agents_loaded: List[str]
    metta_engine_status: str
    contract_connected: bool
    asi_one_available: bool
    timestamp: str


class AgentStatusResponse(BaseModel):
    """Agent status response"""
    total_agents: int
    agents: Dict[str, Dict[str, Any]]
    system_health: str
