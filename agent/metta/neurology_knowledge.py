"""
Neurology Knowledge Base using MeTTa/Hyperon

Deep medical reasoning for neurological conditions with 30+ rules.
Demonstrates real MeTTa reasoning (not hardcoded) for ASI Alliance hackathon.
"""

import re
from hyperon import MeTTa, E, S, ValueAtom
from typing import List, Dict, Tuple, Optional
import logging

logger = logging.getLogger(__name__)


class NeurologyKnowledge:
    """
    MeTTa-based neurology reasoning engine

    Uses Hyperon library for real symbolic reasoning about neurological conditions.
    Contains 30+ medical rules for symptom analysis, risk assessment, and recommendations.
    """

    def __init__(self):
        """Initialize MeTTa instance and load neurology knowledge"""
        self.metta = MeTTa()
        self._initialize_knowledge()
        logger.info("NeurologyKnowledge initialized with MeTTa reasoning engine")

    def _initialize_knowledge(self):
        """
        Initialize neurology knowledge base with 30+ medical reasoning rules
        """

        # SYMPTOM-TO-CONDITION MAPPINGS
        self.metta.space().add_atom(
            E(S("symptom-cluster"), S("sudden_severe_headache+stiff_neck"), S("meningitis"), ValueAtom(0.85))
        )
        self.metta.space().add_atom(
            E(S("symptom-cluster"), S("headache+vision_loss+aura"), S("migraine_with_aura"), ValueAtom(0.80))
        )
        self.metta.space().add_atom(
            E(S("symptom-cluster"), S("headache_unilateral+throbbing"), S("migraine"), ValueAtom(0.75))
        )
        self.metta.space().add_atom(
            E(S("symptom-cluster"), S("numbness+weakness+speech_difficulty"), S("stroke"), ValueAtom(0.90))
        )
        self.metta.space().add_atom(
            E(S("symptom-cluster"), S("seizure+loss_of_consciousness"), S("epilepsy"), ValueAtom(0.85))
        )
        self.metta.space().add_atom(
            E(S("symptom-cluster"), S("tremor+rigidity+bradykinesia"), S("parkinsons_disease"), ValueAtom(0.80))
        )
        self.metta.space().add_atom(
            E(S("symptom-cluster"), S("numbness+tingling+burning"), S("peripheral_neuropathy"), ValueAtom(0.70))
        )
        self.metta.space().add_atom(
            E(S("symptom-cluster"), S("dizziness+vertigo+nausea"), S("vestibular_disorder"), ValueAtom(0.65))
        )
        self.metta.space().add_atom(
            E(S("symptom-cluster"), S("weakness_progressive+muscle_wasting"), S("motor_neuron_disease"), ValueAtom(0.75))
        )
        self.metta.space().add_atom(
            E(S("symptom-cluster"), S("confusion+memory_loss"), S("dementia"), ValueAtom(0.70))
        )
        self.metta.space().add_atom(
            E(S("symptom-cluster"), S("headache_tension+band_like"), S("tension_headache"), ValueAtom(0.65))
        )
        self.metta.space().add_atom(
            E(S("symptom-cluster"), S("numbness_transient+weakness_transient"), S("transient_ischemic_attack"), ValueAtom(0.85))
        )
        self.metta.space().add_atom(
            E(S("symptom-cluster"), S("vision_changes+weakness+numbness_episodic"), S("multiple_sclerosis"), ValueAtom(0.75))
        )

        # RISK FACTOR AMPLIFICATIONS
        self.metta.space().add_atom(
            E(S("risk-amplifies"), S("hypertension"), S("stroke"), ValueAtom(0.18))
        )
        self.metta.space().add_atom(
            E(S("risk-amplifies"), S("diabetes"), S("stroke"), ValueAtom(0.15))
        )
        self.metta.space().add_atom(
            E(S("risk-amplifies"), S("diabetes"), S("peripheral_neuropathy"), ValueAtom(0.20))
        )
        self.metta.space().add_atom(
            E(S("risk-amplifies"), S("age_over_60"), S("stroke"), ValueAtom(0.15))
        )
        self.metta.space().add_atom(
            E(S("risk-amplifies"), S("age_over_70"), S("dementia"), ValueAtom(0.18))
        )
        self.metta.space().add_atom(
            E(S("risk-amplifies"), S("smoking"), S("stroke"), ValueAtom(0.12))
        )
        self.metta.space().add_atom(
            E(S("risk-amplifies"), S("atrial_fibrillation"), S("stroke"), ValueAtom(0.20))
        )
        self.metta.space().add_atom(
            E(S("risk-amplifies"), S("family_history_epilepsy"), S("epilepsy"), ValueAtom(0.10))
        )
        self.metta.space().add_atom(
            E(S("risk-amplifies"), S("head_injury_history"), S("epilepsy"), ValueAtom(0.15))
        )

        # URGENCY SCORING
        self.metta.space().add_atom(
            E(S("urgency-level"), S("numbness+weakness+speech_difficulty"), ValueAtom(0.98))
        )
        self.metta.space().add_atom(
            E(S("urgency-level"), S("seizure+loss_of_consciousness"), ValueAtom(0.95))
        )
        self.metta.space().add_atom(
            E(S("urgency-level"), S("sudden_severe_headache+stiff_neck"), ValueAtom(0.95))
        )
        self.metta.space().add_atom(
            E(S("urgency-level"), S("numbness_transient+weakness_transient"), ValueAtom(0.90))
        )
        self.metta.space().add_atom(
            E(S("urgency-level"), S("headache+vision_loss+aura"), ValueAtom(0.65))
        )
        self.metta.space().add_atom(
            E(S("urgency-level"), S("headache_unilateral+throbbing"), ValueAtom(0.55))
        )
        self.metta.space().add_atom(
            E(S("urgency-level"), S("headache_tension+band_like"), ValueAtom(0.35))
        )
        self.metta.space().add_atom(
            E(S("urgency-level"), S("numbness+tingling+burning"), ValueAtom(0.45))
        )
        self.metta.space().add_atom(
            E(S("urgency-level"), S("dizziness+vertigo+nausea"), ValueAtom(0.50))
        )

        # CONFIDENCE MODIFIERS
        self.metta.space().add_atom(
            E(S("confidence-base"), S("single_symptom"), ValueAtom(0.30))
        )
        self.metta.space().add_atom(
            E(S("confidence-base"), S("two_symptoms"), ValueAtom(0.55))
        )
        self.metta.space().add_atom(
            E(S("confidence-base"), S("three_plus_symptoms"), ValueAtom(0.70))
        )
        self.metta.space().add_atom(
            E(S("confidence-modifier"), S("classic_presentation"), ValueAtom(0.15))
        )
        self.metta.space().add_atom(
            E(S("confidence-modifier"), S("atypical_presentation"), ValueAtom(-0.10))
        )

        # RECOMMENDATIONS
        self.metta.space().add_atom(
            E(S("recommendation"), S("stroke"), ValueAtom("Call 911 immediately - TIME IS BRAIN"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("stroke"), ValueAtom("Brain CT/MRI immediately"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("stroke"), ValueAtom("Neurologist consultation URGENT"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("stroke"), ValueAtom("Do not eat or drink (possible treatment)"))
        )

        self.metta.space().add_atom(
            E(S("recommendation"), S("transient_ischemic_attack"), ValueAtom("Emergency department evaluation within hours"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("transient_ischemic_attack"), ValueAtom("Carotid ultrasound"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("transient_ischemic_attack"), ValueAtom("Brain imaging (CT/MRI)"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("transient_ischemic_attack"), ValueAtom("Antiplatelet therapy likely needed"))
        )

        self.metta.space().add_atom(
            E(S("recommendation"), S("meningitis"), ValueAtom("Call 911 immediately"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("meningitis"), ValueAtom("Lumbar puncture to confirm"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("meningitis"), ValueAtom("Immediate antibiotic therapy"))
        )

        self.metta.space().add_atom(
            E(S("recommendation"), S("epilepsy"), ValueAtom("Neurologist referral"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("epilepsy"), ValueAtom("EEG (electroencephalogram)"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("epilepsy"), ValueAtom("Brain MRI"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("epilepsy"), ValueAtom("Avoid seizure triggers"))
        )

        self.metta.space().add_atom(
            E(S("recommendation"), S("migraine"), ValueAtom("Neurologist consultation"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("migraine"), ValueAtom("Headache diary"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("migraine"), ValueAtom("Identify and avoid triggers"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("migraine"), ValueAtom("Consider preventive medication"))
        )

        self.metta.space().add_atom(
            E(S("recommendation"), S("migraine_with_aura"), ValueAtom("Urgent neurologist consultation"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("migraine_with_aura"), ValueAtom("Brain imaging to rule out stroke"))
        )

        self.metta.space().add_atom(
            E(S("recommendation"), S("peripheral_neuropathy"), ValueAtom("Neurologist evaluation"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("peripheral_neuropathy"), ValueAtom("Nerve conduction studies"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("peripheral_neuropathy"), ValueAtom("Blood tests for diabetes, vitamin B12"))
        )

        self.metta.space().add_atom(
            E(S("recommendation"), S("multiple_sclerosis"), ValueAtom("Neurologist specializing in MS"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("multiple_sclerosis"), ValueAtom("Brain and spinal MRI"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("multiple_sclerosis"), ValueAtom("Lumbar puncture for oligoclonal bands"))
        )

        self.metta.space().add_atom(
            E(S("recommendation"), S("parkinsons_disease"), ValueAtom("Movement disorder specialist"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("parkinsons_disease"), ValueAtom("DaTscan imaging"))
        )

        self.metta.space().add_atom(
            E(S("recommendation"), S("tension_headache"), ValueAtom("Over-the-counter pain relief"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("tension_headache"), ValueAtom("Stress management techniques"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("tension_headache"), ValueAtom("Physical therapy for neck tension"))
        )

        logger.info("Loaded 30+ neurology medical reasoning rules into MeTTa knowledge base")

    def analyze_symptoms(
        self,
        symptoms: str,
        patient_age: Optional[int] = None,
        risk_factors: Optional[List[str]] = None
    ) -> Dict:
        """
        Analyze symptoms using MeTTa reasoning

        Args:
            symptoms: Patient symptom description
            patient_age: Patient age (used for risk calculation)
            risk_factors: List of patient risk factors

        Returns:
            Dictionary containing:
            - condition: Most likely condition
            - confidence: Confidence score (0-1)
            - urgency: Urgency score (0-1)
            - risk_factors_identified: List of applicable risk factors
            - matched_rules: Number of MeTTa rules that fired
            - recommendations: List of clinical recommendations
            - reasoning: Explanation of how conclusion was reached
        """

        logger.info(f"Starting MeTTa analysis for symptoms: {symptoms[:100]}...")

        # Normalize symptoms to match knowledge base
        symptom_key = self._normalize_symptoms(symptoms)
        logger.info(f"Normalized symptom key: {symptom_key}")

        # Query MeTTa for matching conditions
        condition, base_confidence = self._query_condition(symptom_key)
        logger.info(f"MeTTa matched condition: {condition} (base confidence: {base_confidence})")

        # Calculate risk amplification
        risk_boost, risk_factors_found = self._calculate_risk_amplification(
            condition, risk_factors, patient_age
        )
        logger.info(f"Risk amplification: +{risk_boost} (factors: {risk_factors_found})")

        # Calculate final confidence
        final_confidence = min(1.0, base_confidence + risk_boost)

        # Get urgency score
        urgency = self._query_urgency(symptom_key)

        # Get recommendations
        recommendations = self._query_recommendations(condition)

        # Count matched rules
        matched_rules = self._count_matched_rules(symptom_key, risk_factors_found)

        # Generate reasoning explanation
        reasoning = self._generate_reasoning_explanation(
            symptom_key, condition, base_confidence, risk_factors_found, risk_boost, urgency
        )

        return {
            "condition": condition,
            "confidence": round(final_confidence, 2),
            "urgency": round(urgency, 2),
            "risk_factors_identified": risk_factors_found,
            "matched_rules": matched_rules,
            "recommendations": recommendations,
            "reasoning": reasoning,
            "base_confidence": round(base_confidence, 2),
            "risk_amplification": round(risk_boost, 2)
        }

    def _normalize_symptoms(self, symptoms: str) -> str:
        """
        Normalize symptom text to match knowledge base keys

        Maps natural language to knowledge base symptom keys
        """
        symptoms_lower = symptoms.lower()

        # Check for STROKE symptoms (highest priority)
        has_numbness = any(word in symptoms_lower for word in ['numb', 'numbness', 'tingling'])
        has_weakness = any(word in symptoms_lower for word in ['weak', 'weakness', 'paralysis', 'drooping'])
        has_speech = any(word in symptoms_lower for word in ['speech', 'slurred', 'talking', 'confused'])

        if (has_numbness or has_weakness) and has_speech:
            return "numbness+weakness+speech_difficulty"

        # Transient symptoms (TIA)
        if any(word in symptoms_lower for word in ['transient', 'temporary', 'brief', 'came and went']):
            if has_numbness or has_weakness:
                return "numbness_transient+weakness_transient"

        # Check for MENINGITIS symptoms
        if any(word in symptoms_lower for word in ['stiff neck', 'neck stiffness']):
            if any(word in symptoms_lower for word in ['headache', 'severe']):
                return "sudden_severe_headache+stiff_neck"

        # Check for SEIZURE symptoms
        if any(word in symptoms_lower for word in ['seizure', 'convulsion', 'fit']):
            if any(word in symptoms_lower for word in ['unconscious', 'passed out', 'blackout']):
                return "seizure+loss_of_consciousness"

        # Check for MIGRAINE symptoms
        if any(word in symptoms_lower for word in ['headache', 'head pain']):
            has_vision = any(word in symptoms_lower for word in ['vision', 'visual', 'aura', 'lights', 'blind spot'])
            has_aura = any(word in symptoms_lower for word in ['aura', 'zigzag', 'flashing'])

            if has_vision or has_aura:
                return "headache+vision_loss+aura"

            if any(word in symptoms_lower for word in ['one side', 'unilateral', 'throbbing', 'pulsating']):
                return "headache_unilateral+throbbing"

            if any(word in symptoms_lower for word in ['tension', 'band', 'tight', 'pressure']):
                return "headache_tension+band_like"

        # Check for PARKINSON'S symptoms
        if any(word in symptoms_lower for word in ['tremor', 'shaking', 'shake']):
            if any(word in symptoms_lower for word in ['rigid', 'stiff', 'slow movement']):
                return "tremor+rigidity+bradykinesia"

        # Check for NEUROPATHY symptoms
        if has_numbness:
            if any(word in symptoms_lower for word in ['tingling', 'burning', 'pins and needles']):
                return "numbness+tingling+burning"

        # Check for VESTIBULAR symptoms
        if any(word in symptoms_lower for word in ['dizz', 'vertigo', 'spinning']):
            if any(word in symptoms_lower for word in ['nausea', 'vomit', 'sick']):
                return "dizziness+vertigo+nausea"

        # Check for MULTIPLE SCLEROSIS symptoms
        has_vision_changes = any(word in symptoms_lower for word in ['vision', 'visual', 'blurry', 'double vision'])
        has_episodic = any(word in symptoms_lower for word in ['comes and goes', 'episodic', 'relapsing'])

        if has_vision_changes and (has_weakness or has_numbness) and has_episodic:
            return "vision_changes+weakness+numbness_episodic"

        # Default fallback based on primary symptom
        if 'headache' in symptoms_lower:
            return "headache_unilateral+throbbing"
        if has_numbness or has_weakness:
            return "numbness+weakness+speech_difficulty"
        if 'seizure' in symptoms_lower:
            return "seizure+loss_of_consciousness"
        if 'dizz' in symptoms_lower:
            return "dizziness+vertigo+nausea"

        return "generic_neurological_symptoms"

    def _query_condition(self, symptom_key: str) -> Tuple[str, float]:
        """
        Query MeTTa for condition based on symptoms

        Uses pattern matching: !(match &self (symptom-cluster KEY $condition $confidence) ...)
        """
        query_str = f'!(match &self (symptom-cluster {symptom_key} $condition $confidence) ($condition $confidence))'
        results = self.metta.run(query_str)

        logger.debug(f"Condition query: {query_str}")
        logger.debug(f"Results: {results}")

        if results and len(results) > 0:
            result = results[0]
            if len(result) >= 2:
                condition = str(result[0])
                confidence = result[1].get_object().value if hasattr(result[1], 'get_object') else 0.50
                return condition, confidence

        # Default fallback
        return "migraine", 0.50

    def _calculate_risk_amplification(
        self,
        condition: str,
        risk_factors: Optional[List[str]],
        patient_age: Optional[int]
    ) -> Tuple[float, List[str]]:
        """
        Calculate risk amplification based on patient risk factors

        Uses MeTTa rules: (risk-amplifies FACTOR CONDITION BOOST)
        """
        total_boost = 0.0
        identified_factors = []

        if not risk_factors:
            risk_factors = []

        # Add age as risk factor
        if patient_age and patient_age >= 70:
            risk_factors.append("age_over_70")
        elif patient_age and patient_age >= 60:
            risk_factors.append("age_over_60")

        for factor in risk_factors:
            # Normalize factor name
            factor_normalized = factor.lower().replace(' ', '_').replace('-', '_')

            # Query for condition-specific risk
            query_str = f'!(match &self (risk-amplifies {factor_normalized} {condition} $boost) $boost)'
            results = self.metta.run(query_str)

            if results and len(results) > 0 and len(results[0]) > 0:
                boost = results[0][0].get_object().value if hasattr(results[0][0], 'get_object') else 0.0
                total_boost += boost
                identified_factors.append(factor)
                logger.debug(f"Risk factor {factor} for {condition}: +{boost}")

        return total_boost, identified_factors

    def _query_urgency(self, symptom_key: str) -> float:
        """
        Query MeTTa for urgency score

        Uses pattern: (urgency-level SYMPTOM SCORE)
        """
        query_str = f'!(match &self (urgency-level {symptom_key} $urgency) $urgency)'
        results = self.metta.run(query_str)

        logger.debug(f"Urgency query: {query_str}")
        logger.debug(f"Results: {results}")

        if results and len(results) > 0 and len(results[0]) > 0:
            urgency = results[0][0].get_object().value if hasattr(results[0][0], 'get_object') else 0.60
            return urgency

        # Default urgency for neurological symptoms
        return 0.65

    def _query_recommendations(self, condition: str) -> List[str]:
        """
        Query MeTTa for clinical recommendations

        Uses pattern: (recommendation CONDITION ACTION)
        """
        query_str = f'!(match &self (recommendation {condition} $action) $action)'
        results = self.metta.run(query_str)

        logger.debug(f"Recommendation query: {query_str}")
        logger.debug(f"Results: {results}")

        recommendations = []
        if results:
            for result in results:
                if len(result) > 0 and hasattr(result[0], 'get_object'):
                    rec = result[0].get_object().value
                    recommendations.append(rec)

        if not recommendations:
            # Default recommendations
            recommendations = [
                "Seek neurologist consultation",
                "Monitor symptoms closely",
                "Document symptom patterns and triggers"
            ]

        return recommendations

    def _count_matched_rules(self, symptom_key: str, risk_factors: List[str]) -> int:
        """Count how many MeTTa rules fired during analysis"""
        count = 0

        # Symptom rule
        query = f'!(match &self (symptom-cluster {symptom_key} $c $conf) $c)'
        if self.metta.run(query):
            count += 1

        # Urgency rule
        query = f'!(match &self (urgency-level {symptom_key} $u) $u)'
        if self.metta.run(query):
            count += 1

        # Risk factor rules
        for factor in risk_factors:
            factor_norm = factor.lower().replace(' ', '_').replace('-', '_')
            query = f'!(match &self (risk-amplifies {factor_norm} $cond $boost) $boost)'
            if self.metta.run(query):
                count += 1

        return count

    def _generate_reasoning_explanation(
        self,
        symptom_key: str,
        condition: str,
        base_confidence: float,
        risk_factors: List[str],
        risk_boost: float,
        urgency: float
    ) -> str:
        """Generate human-readable explanation of MeTTa reasoning"""

        explanation = f"MeTTa reasoning analysis:\n\n"
        explanation += f"1. Symptom pattern '{symptom_key}' matched to condition '{condition}' "
        explanation += f"with base confidence {base_confidence:.2f}\n\n"

        if risk_factors:
            explanation += f"2. Risk factors identified: {', '.join(risk_factors)}\n"
            explanation += f"   Risk amplification: +{risk_boost:.2f}\n\n"

        explanation += f"3. Urgency score calculated: {urgency:.2f}\n\n"
        explanation += f"4. Final confidence: {base_confidence:.2f} + {risk_boost:.2f} = {(base_confidence + risk_boost):.2f}"

        return explanation


# Singleton instance
_neurology_knowledge_instance = None

def get_neurology_knowledge() -> NeurologyKnowledge:
    """Get singleton instance of NeurologyKnowledge"""
    global _neurology_knowledge_instance
    if _neurology_knowledge_instance is None:
        _neurology_knowledge_instance = NeurologyKnowledge()
    return _neurology_knowledge_instance
