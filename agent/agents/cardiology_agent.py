"""
Cardiology Specialist Agent

Uses MeTTa reasoning for cardiac condition analysis
"""

import time
from typing import Optional, List
from metta.cardiology_knowledge import get_cardiology_knowledge
from api.models import AgentAnalysis, MeTTaReasoning
import logging

logger = logging.getLogger(__name__)


class CardiologyAgent:
    """
    Cardiology specialist agent powered by MeTTa reasoning engine

    Uses deep medical knowledge base with 30+ rules for:
    - Symptom-to-condition matching
    - Risk factor analysis
    - Urgency assessment
    - Clinical recommendations
    """

    def __init__(self):
        """Initialize Cardiology agent with MeTTa knowledge base"""
        self.agent_name = "Cardiology Specialist"
        self.agent_role = "cardiology"
        self.knowledge = get_cardiology_knowledge()
        logger.info(f"{self.agent_name} initialized with MeTTa reasoning engine")

    async def analyze(
        self,
        symptoms: str,
        patient_age: Optional[int] = None,
        patient_gender: Optional[str] = None,
        medical_history: Optional[List[str]] = None
    ) -> AgentAnalysis:
        """
        Analyze symptoms using MeTTa-powered cardiology reasoning

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

        # Format condition name
        condition_formatted = condition.replace('_', ' ').title()

        analysis = f"Based on MeTTa reasoning analysis, patient symptoms suggest possible {condition_formatted}. "

        # Add confidence context
        if confidence >= 0.80:
            analysis += f"The confidence level is high ({confidence:.0%}) based on symptom pattern matching and risk factor analysis. "
        elif confidence >= 0.60:
            analysis += f"The confidence level is moderate to high ({confidence:.0%}). "
        else:
            analysis += f"The confidence level is moderate ({confidence:.0%}). "

        # Add risk factor context
        if medical_history:
            analysis += f"Patient has {len(medical_history)} significant risk factors including {', '.join(medical_history[:2])}. "

        # Add urgency context
        if "myocardial_infarction" in condition or "dissection" in condition:
            analysis += "This is a potentially life-threatening condition requiring immediate medical attention. "
        elif "angina" in condition:
            analysis += "Urgent cardiology consultation is recommended within 24-48 hours. "

        return analysis.strip()

    def _urgency_to_risk_level(self, urgency_score: float) -> str:
        """Convert urgency score to risk level"""
        if urgency_score >= 0.90:
            return "critical"
        elif urgency_score >= 0.75:
            return "high"
        elif urgency_score >= 0.50:
            return "moderate"
        else:
            return "low"

    def _format_confidence_calculation(self, base_confidence: float, risk_boost: float) -> str:
        """Format confidence calculation for transparency"""
        calc = f"Base confidence: {base_confidence:.2f} (from symptom pattern matching)"

        if risk_boost > 0:
            calc += f" + Risk amplification: {risk_boost:.2f} (from patient risk factors)"
            calc += f" = Final confidence: {(base_confidence + risk_boost):.2f}"
        else:
            calc += f" = Final confidence: {base_confidence:.2f} (no risk amplification)"

        return calc

    def _extract_key_findings(self, metta_result: dict, symptoms: str) -> List[str]:
        """Extract key findings from MeTTa analysis"""
        findings = []

        # Add condition finding
        condition_formatted = metta_result["condition"].replace('_', ' ').title()
        findings.append(f"Primary concern: {condition_formatted}")

        # Add symptom pattern
        findings.append(f"Symptom analysis: {symptoms[:60]}...")

        # Add risk factors
        if metta_result["risk_factors_identified"]:
            findings.append(f"Risk factors: {', '.join(metta_result['risk_factors_identified'][:3])}")

        # Add urgency
        if metta_result["urgency"] >= 0.80:
            findings.append(f"High urgency score: {metta_result['urgency']:.2f}")

        # Add matched rules
        findings.append(f"MeTTa rules matched: {metta_result['matched_rules']}")

        return findings

    def _fallback_analysis(self, symptoms: str) -> AgentAnalysis:
        """Fallback analysis if MeTTa reasoning fails"""
        return AgentAnalysis(
            agent_name=self.agent_name,
            agent_role=self.agent_role,
            analysis=f"Unable to complete MeTTa reasoning analysis. Basic assessment: patient reports {symptoms[:100]}. Recommend cardiology consultation for detailed evaluation.",
            confidence_score=0.50,
            risk_level="moderate",
            recommendations=[
                "Seek cardiology consultation",
                "Monitor symptoms closely",
                "Avoid strenuous activity until evaluated"
            ],
            processing_time_ms=50
        )


# Singleton instance
_cardiology_agent_instance = None

def get_cardiology_agent() -> CardiologyAgent:
    """Get singleton instance of CardiologyAgent"""
    global _cardiology_agent_instance
    if _cardiology_agent_instance is None:
        _cardiology_agent_instance = CardiologyAgent()
    return _cardiology_agent_instance
