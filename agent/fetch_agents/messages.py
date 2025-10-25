"""
Inter-Agent Communication Message Models

Defines all message types for Fetch.ai agent-to-agent communication in PulseBridge.
Used for orchestrating multi-agent healthcare consultation workflow.
"""

from uagents import Model
from typing import List, Optional, Dict


# USER INTERACTION MESSAGES

class ChatMessage(Model):
    """
    Incoming chat message from user via ASI:One

    Received by: CoordinatorAgent
    """
    message: str
    session_id: str = "default"


class ChatResponse(Model):
    """
    Outgoing chat response to user via ASI:One

    Sent by: CoordinatorAgent
    Contains full diagnosis, doctor recommendations, and AI transparency info
    """
    response: str
    session_id: str = "default"
    metadata: Dict = {}


# TRIAGE WORKFLOW MESSAGES

class SymptomRoutingRequest(Model):
    """
    Request to triage agent for symptom routing

    Sent by: CoordinatorAgent
    Received by: TriageAgent

    Contains patient symptoms and context for intelligent routing to specialist
    """
    symptoms: str
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    medical_history: List[str] = []
    session_id: str


class SpecialtyRecommendation(Model):
    """
    Response from triage agent with specialty routing recommendation

    Sent by: TriageAgent
    Received by: CoordinatorAgent

    Contains MeTTa-powered routing decision with reasoning transparency
    """
    recommended_specialty: str  # "cardiology", "neurology", "dermatology"
    confidence: float  # 0.0 to 1.0
    urgency_level: str  # "critical", "high", "moderate", "low"
    reasoning: str  # Human-readable explanation of routing decision
    matched_rules: int  # Number of MeTTa rules that fired
    matched_keywords: List[str]  # Symptoms that triggered routing
    session_id: str


# SPECIALIST ANALYSIS MESSAGES

class SpecialistAnalysisRequest(Model):
    """
    Request to specialist agent for detailed medical analysis

    Sent by: CoordinatorAgent
    Received by: CardiologyAgent, NeurologyAgent, DermatologyAgent

    Contains patient information for specialist MeTTa reasoning
    """
    symptoms: str
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    medical_history: List[str] = []
    session_id: str


class SpecialistAnalysisResponse(Model):
    """
    Response from specialist agent with detailed diagnosis

    Sent by: CardiologyAgent, NeurologyAgent, DermatologyAgent
    Received by: CoordinatorAgent

    Contains MeTTa analysis results and ASI:One enhanced patient-friendly text
    """
    specialty: str  # "cardiology", "neurology", "dermatology"
    diagnosis: str  # Patient-friendly diagnosis (ASI:One enhanced)
    condition: str  # Medical condition name (from MeTTa)
    confidence: float  # 0.0 to 1.0
    urgency_score: float  # 0.0 to 1.0
    risk_level: str  # "critical", "high", "moderate", "low"
    recommendations: List[str]  # Clinical recommendations from MeTTa
    metta_rules_matched: int  # Number of MeTTa rules evaluated
    risk_factors_identified: List[str]  # Risk factors found
    asi_one_enhanced: bool  # Whether ASI:One was used for enhancement
    reasoning_summary: str  # Brief summary of MeTTa reasoning
    session_id: str


# ERROR HANDLING MESSAGES

class AgentErrorResponse(Model):
    """
    Error response from any agent when processing fails

    Sent by: Any agent
    Received by: CoordinatorAgent

    Used for graceful error handling in multi-agent workflow
    """
    agent_name: str
    error_type: str  # "timeout", "metta_error", "asi_one_error", "internal_error"
    error_message: str
    session_id: str
    fallback_available: bool = False


# AGENT STATUS MESSAGES

class AgentHealthCheck(Model):
    """
    Health check request to verify agent is responsive

    Sent by: CoordinatorAgent (optional for monitoring)
    Received by: All agents
    """
    requesting_agent: str
    timestamp: str


class AgentHealthResponse(Model):
    """
    Health check response confirming agent status

    Sent by: All agents
    Received by: CoordinatorAgent
    """
    agent_name: str
    status: str  # "healthy", "degraded", "error"
    metta_loaded: bool
    asi_one_available: bool = False
    timestamp: str
