"""
Triage Agent

Uses MeTTa reasoning for intelligent symptom routing to specialists
"""

import time
from typing import Optional, List
from metta.triage_knowledge import get_triage_knowledge
from api.models import AgentAnalysis, MeTTaReasoning
import logging

logger = logging.getLogger(__name__)


class TriageAgent:
    """
    Triage coordinator agent powered by MeTTa routing engine

    Uses deep routing knowledge base with 30+ rules for:
    - Symptom-to-specialty routing
    - Multi-symptom pattern recognition
    - Age-based routing modifiers
    - Urgency assessment
    - Secondary consultation recommendations
    """

    def __init__(self):
        """Initialize Triage agent with MeTTa knowledge base"""
        self.agent_name = "Triage Coordinator"
        self.agent_role = "triage"
        self.knowledge = get_triage_knowledge()
        logger.info(f"{self.agent_name} initialized with MeTTa routing engine")

    async def analyze(
        self,
        symptoms: str,
        patient_age: Optional[int] = None,
        patient_gender: Optional[str] = None,
        medical_history: Optional[List[str]] = None
    ) -> tuple[AgentAnalysis, str]:
        """
        Analyze symptoms and route to appropriate specialist using MeTTa

        Args:
            symptoms: Patient symptom description
            patient_age: Patient age
            patient_gender: Patient gender
            medical_history: List of medical history items

        Returns:
            Tuple of (AgentAnalysis, recommended_specialty_string)
        """
        start_time = time.time()

        try:
            # Use MeTTa knowledge base for routing
            metta_result = self.knowledge.route_symptoms(
                symptoms=symptoms,
                patient_age=patient_age
            )

            # Map MeTTa results to AgentAnalysis format
            analysis_text = self._generate_analysis_text(
                metta_result["recommended_specialty"],
                metta_result["confidence"],
                metta_result["matched_keywords"],
                metta_result["secondary_specialty"]
            )

            # Convert urgency to risk level
            risk_level = self._urgency_to_risk_level(metta_result["urgency"])

            # Generate recommendations
            recommendations = self._generate_recommendations(
                metta_result["recommended_specialty"],
                metta_result["urgency"],
                metta_result["secondary_specialty"]
            )

            # Create MeTTa reasoning object
            metta_reasoning = MeTTaReasoning(
                matched_rules=metta_result["matched_rules"],
                confidence_calculation=f"Routing confidence based on {metta_result['matched_rules']} MeTTa rules matching symptom patterns",
                risk_factors_identified=metta_result["matched_keywords"],
                urgency_score=metta_result["urgency"],
                key_findings=self._extract_key_findings(metta_result)
            )

            processing_time = int((time.time() - start_time) * 1000)

            logger.info(
                f"{self.agent_name} routing complete: {metta_result['recommended_specialty']} "
                f"(confidence: {metta_result['confidence']}, {metta_result['matched_rules']} rules matched)"
            )

            analysis = AgentAnalysis(
                agent_name=self.agent_name,
                agent_role=self.agent_role,
                analysis=analysis_text,
                confidence_score=metta_result["confidence"],
                risk_level=risk_level,
                recommendations=recommendations,
                metta_reasoning=metta_reasoning,
                processing_time_ms=processing_time
            )

            # Return both the analysis and the recommended specialty
            return analysis, metta_result["recommended_specialty"]

        except Exception as e:
            logger.error(f"Error in {self.agent_name} routing: {e}", exc_info=True)
            # Return fallback analysis
            return self._fallback_analysis(symptoms), "cardiology"

    def _generate_analysis_text(
        self,
        specialty: str,
        confidence: float,
        keywords: List[str],
        secondary_specialty: Optional[str]
    ) -> str:
        """Generate human-readable analysis text"""

        specialty_formatted = specialty.title()

        analysis = f"Triage assessment complete. Based on MeTTa routing analysis of symptom patterns ({', '.join(keywords)}), "
        analysis += f"patient should be routed to {specialty_formatted}. "

        # Add confidence context
        if confidence >= 0.85:
            analysis += f"Routing confidence is very high ({confidence:.0%}). "
        elif confidence >= 0.70:
            analysis += f"Routing confidence is high ({confidence:.0%}). "
        else:
            analysis += f"Routing confidence is moderate ({confidence:.0%}). "

        # Add secondary specialty if recommended
        if secondary_specialty:
            analysis += f"Secondary consultation with {secondary_specialty.title()} may be beneficial. "

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

    def _generate_recommendations(
        self,
        specialty: str,
        urgency: float,
        secondary_specialty: Optional[str]
    ) -> List[str]:
        """Generate routing recommendations"""
        recommendations = [
            f"Route to {specialty.title()} specialist"
        ]

        # Add urgency-based recommendations
        if urgency >= 0.90:
            recommendations.append("HIGH PRIORITY: Immediate consultation recommended")
        elif urgency >= 0.75:
            recommendations.append("Urgent consultation within 24-48 hours")
        else:
            recommendations.append("Schedule consultation at earliest convenience")

        # Add secondary specialty if recommended
        if secondary_specialty:
            recommendations.append(f"Consider secondary consultation with {secondary_specialty.title()}")

        recommendations.append("Await specialist assessment for detailed evaluation")

        return recommendations

    def _extract_key_findings(self, metta_result: dict) -> List[str]:
        """Extract key findings from MeTTa routing analysis"""
        findings = []

        # Add specialty recommendation
        findings.append(f"Recommended specialty: {metta_result['recommended_specialty'].title()}")

        # Add matched symptoms
        findings.append(f"Key symptoms: {', '.join(metta_result['matched_keywords'][:3])}")

        # Add rule count
        findings.append(f"MeTTa routing rules matched: {metta_result['matched_rules']}")

        # Add alternative specialties if any
        if len(metta_result["all_specialty_scores"]) > 1:
            alternatives = [s for s in metta_result["all_specialty_scores"].keys()
                          if s != metta_result["recommended_specialty"]]
            if alternatives:
                findings.append(f"Alternative specialties considered: {', '.join([a.title() for a in alternatives[:2]])}")

        return findings

    def _fallback_analysis(self, symptoms: str) -> AgentAnalysis:
        """Fallback analysis if MeTTa routing fails"""
        return AgentAnalysis(
            agent_name=self.agent_name,
            agent_role=self.agent_role,
            analysis=f"Triage routing encountered an issue. Default routing to Cardiology for evaluation. Symptoms: {symptoms[:100]}",
            confidence_score=0.50,
            risk_level="moderate",
            recommendations=[
                "Route to Cardiology specialist (default)",
                "Await specialist assessment"
            ],
            processing_time_ms=50
        )


# Singleton instance
_triage_agent_instance = None

def get_triage_agent() -> TriageAgent:
    """Get singleton instance of TriageAgent"""
    global _triage_agent_instance
    if _triage_agent_instance is None:
        _triage_agent_instance = TriageAgent()
    return _triage_agent_instance
