"""
Dermatology Specialist Agent

Uses MeTTa reasoning for skin condition analysis
"""

import time
from typing import Optional, List
from metta.dermatology_knowledge import get_dermatology_knowledge
from api.models import AgentAnalysis, MeTTaReasoning
import logging

logger = logging.getLogger(__name__)


class DermatologyAgent:
    """
    Dermatology specialist agent powered by MeTTa reasoning engine

    Uses deep medical knowledge base with 30+ rules for:
    - Symptom-to-condition matching
    - Risk factor analysis
    - Urgency assessment
    - Clinical recommendations
    """

    def __init__(self):
        """Initialize Dermatology agent with MeTTa knowledge base"""
        self.agent_name = "Dermatology Specialist"
        self.agent_role = "dermatology"
        self.knowledge = get_dermatology_knowledge()
        logger.info(f"{self.agent_name} initialized with MeTTa reasoning engine")

    async def analyze(
        self,
        symptoms: str,
        patient_age: Optional[int] = None,
        patient_gender: Optional[str] = None,
        medical_history: Optional[List[str]] = None
    ) -> AgentAnalysis:
        """
        Analyze symptoms using MeTTa-powered dermatology reasoning

        Args:
            symptoms: Patient symptom description
            patient_age: Patient age
            patient_gender: Patient gender
            medical_history: List of medical history items (risk factors)

        Returns:
            AgentAnalysis with detailed MeTTa reasoning
        """
        start_time = time.time()

        try:
            # Use MeTTa knowledge base for analysis
            metta_result = self.knowledge.analyze_symptoms(
                symptoms=symptoms,
                patient_age=patient_age,
                risk_factors=medical_history
            )

            # Map MeTTa results to AgentAnalysis format
            analysis_text = self._generate_analysis_text(
                metta_result["condition"],
                metta_result["confidence"],
                symptoms,
                medical_history
            )

            # Convert risk level from urgency score
            risk_level = self._urgency_to_risk_level(metta_result["urgency"])

            # Create MeTTa reasoning object
            metta_reasoning = MeTTaReasoning(
                matched_rules=metta_result["matched_rules"],
                confidence_calculation=self._format_confidence_calculation(
                    metta_result["base_confidence"],
                    metta_result["risk_amplification"]
                ),
                risk_factors_identified=metta_result["risk_factors_identified"],
                urgency_score=metta_result["urgency"],
                key_findings=self._extract_key_findings(metta_result, symptoms)
            )

            processing_time = int((time.time() - start_time) * 1000)

            logger.info(
                f"{self.agent_name} analysis complete: {metta_result['condition']} "
                f"(confidence: {metta_result['confidence']}, {metta_result['matched_rules']} rules matched)"
            )

            return AgentAnalysis(
                agent_name=self.agent_name,
                agent_role=self.agent_role,
                analysis=analysis_text,
                confidence_score=metta_result["confidence"],
                risk_level=risk_level,
                recommendations=metta_result["recommendations"],
                metta_reasoning=metta_reasoning,
                processing_time_ms=processing_time
            )

        except Exception as e:
            logger.error(f"Error in {self.agent_name} analysis: {e}", exc_info=True)
            # Return fallback analysis
            return self._fallback_analysis(symptoms)

    def _generate_analysis_text(
        self,
        condition: str,
        confidence: float,
        symptoms: str,
        medical_history: Optional[List[str]]
    ) -> str:
        """Generate human-readable analysis text"""

        # Format condition name nicely
        condition_formatted = condition.replace('_', ' ').title()

        analysis = f"Based on MeTTa dermatological analysis, symptoms suggest possible {condition_formatted}. "

        # Add confidence context
        if confidence >= 0.80:
            analysis += f"Diagnosis confidence is high ({confidence:.0%}). "
        elif confidence >= 0.65:
            analysis += f"Diagnosis confidence is moderate ({confidence:.0%}). "
        else:
            analysis += f"Diagnosis confidence is preliminary ({confidence:.0%}). "

        # Add urgency context for critical conditions
        urgent_conditions = ['melanoma', 'cellulitis', 'basal_cell_carcinoma']
        if any(cond in condition for cond in urgent_conditions):
            analysis += "URGENT DERMATOLOGY EVALUATION RECOMMENDED. "

        analysis += "Skin examination and possible biopsy may be needed for confirmation."

        return analysis.strip()

    def _urgency_to_risk_level(self, urgency_score: float) -> str:
        """Convert urgency score to risk level"""
        if urgency_score >= 0.85:
            return "high"
        elif urgency_score >= 0.65:
            return "moderate"
        elif urgency_score >= 0.45:
            return "low"
        else:
            return "low"

    def _format_confidence_calculation(self, base_confidence: float, risk_amplification: float) -> str:
        """Format confidence calculation explanation"""
        if risk_amplification > 0:
            return f"Base MeTTa confidence: {base_confidence:.2f}, Risk amplification: +{risk_amplification:.2f}, Final: {(base_confidence + risk_amplification):.2f}"
        else:
            return f"Base MeTTa confidence: {base_confidence:.2f} (no additional risk factors)"

    def _extract_key_findings(self, metta_result: dict, symptoms: str) -> List[str]:
        """Extract key findings from MeTTa analysis"""
        findings = []

        # Add primary condition
        condition_formatted = metta_result["condition"].replace('_', ' ').title()
        findings.append(f"Condition identified: {condition_formatted}")

        # Add confidence
        findings.append(f"Diagnostic confidence: {metta_result['confidence']:.0%}")

        # Add urgency
        urgency_level = self._urgency_to_risk_level(metta_result["urgency"])
        findings.append(f"Urgency level: {urgency_level}")

        # Add risk factors if any
        if metta_result["risk_factors_identified"]:
            findings.append(f"Risk factors: {', '.join(metta_result['risk_factors_identified'])}")

        # Add matched rules
        findings.append(f"MeTTa rules evaluated: {metta_result['matched_rules']}")

        return findings

    def _fallback_analysis(self, symptoms: str) -> AgentAnalysis:
        """Fallback analysis if MeTTa reasoning fails"""
        return AgentAnalysis(
            agent_name=self.agent_name,
            agent_role=self.agent_role,
            analysis=f"Dermatological evaluation needed for symptoms: {symptoms[:100]}. MeTTa analysis encountered an issue.",
            confidence_score=0.50,
            risk_level="moderate",
            recommendations=[
                "Seek dermatologist consultation",
                "Monitor skin changes closely",
                "Document with photographs"
            ],
            processing_time_ms=50
        )


# Singleton instance
_dermatology_agent_instance = None

def get_dermatology_agent() -> DermatologyAgent:
    """Get singleton instance of DermatologyAgent"""
    global _dermatology_agent_instance
    if _dermatology_agent_instance is None:
        _dermatology_agent_instance = DermatologyAgent()
    return _dermatology_agent_instance
