"""
Triage Knowledge Base using MeTTa/Hyperon

Intelligent symptom routing to appropriate medical specialists.
Demonstrates deep multi-specialty reasoning for ASI Alliance hackathon.
Contains 30+ MeTTa routing rules.
"""

import re
from hyperon import MeTTa, E, S, ValueAtom
from typing import List, Dict, Tuple, Optional
import logging

logger = logging.getLogger(__name__)


class TriageKnowledge:
    """
    MeTTa-based triage routing engine

    Uses symbolic reasoning to route patient symptoms to appropriate specialists.
    Contains 30+ routing rules for multi-specialty coordination.
    """

    def __init__(self):
        """Initialize MeTTa instance and load triage knowledge"""
        self.metta = MeTTa()
        self._initialize_knowledge()
        logger.info("TriageKnowledge initialized with MeTTa routing engine")

    def _initialize_knowledge(self):
        """
        Initialize triage routing rules (30+ rules)
        """

        # PRIMARY SPECIALTY ROUTING - CARDIOLOGY
        self.metta.space().add_atom(E(S("cardiology-route"), S("chest_pain"), ValueAtom(0.90)))
        self.metta.space().add_atom(E(S("cardiology-route"), S("palpitations"), ValueAtom(0.85)))
        self.metta.space().add_atom(E(S("cardiology-route"), S("shortness_of_breath"), ValueAtom(0.70)))
        self.metta.space().add_atom(E(S("cardiology-route"), S("heart"), ValueAtom(0.95)))
        self.metta.space().add_atom(E(S("cardiology-route"), S("exertional"), ValueAtom(0.88)))

        # PRIMARY SPECIALTY ROUTING - NEUROLOGY
        self.metta.space().add_atom(E(S("neurology-route"), S("headache"), ValueAtom(0.75)))
        self.metta.space().add_atom(E(S("neurology-route"), S("dizziness"), ValueAtom(0.70)))
        self.metta.space().add_atom(E(S("neurology-route"), S("seizure"), ValueAtom(0.95)))
        self.metta.space().add_atom(E(S("neurology-route"), S("numbness"), ValueAtom(0.80)))
        self.metta.space().add_atom(E(S("neurology-route"), S("weakness"), ValueAtom(0.75)))
        self.metta.space().add_atom(E(S("neurology-route"), S("vision_changes"), ValueAtom(0.65)))

        # PRIMARY SPECIALTY ROUTING - DERMATOLOGY
        self.metta.space().add_atom(E(S("dermatology-route"), S("rash"), ValueAtom(0.90)))
        self.metta.space().add_atom(E(S("dermatology-route"), S("skin_lesion"), ValueAtom(0.92)))
        self.metta.space().add_atom(E(S("dermatology-route"), S("itching"), ValueAtom(0.75)))

        # MULTI-SYMPTOM COMBINATION ROUTING
        self.metta.space().add_atom(E(S("cardiology-combo"), S("chest_pain+exertional"), ValueAtom(0.92)))
        self.metta.space().add_atom(E(S("cardiology-combo"), S("chest_pain+shortness_of_breath"), ValueAtom(0.94)))
        self.metta.space().add_atom(E(S("cardiology-combo"), S("dizziness+palpitations"), ValueAtom(0.85)))
        self.metta.space().add_atom(E(S("neurology-combo"), S("headache+vision_changes"), ValueAtom(0.88)))
        self.metta.space().add_atom(E(S("neurology-combo"), S("numbness+weakness"), ValueAtom(0.92)))
        self.metta.space().add_atom(E(S("dermatology-combo"), S("rash+itching"), ValueAtom(0.93)))

        # AGE-BASED URGENCY MODIFIERS
        self.metta.space().add_atom(E(S("age-urgency-boost"), S("age_over_60"), ValueAtom(0.10)))
        self.metta.space().add_atom(E(S("age-urgency-boost"), S("age_over_70"), ValueAtom(0.15)))
        self.metta.space().add_atom(E(S("age-urgency-boost"), S("age_over_50"), ValueAtom(0.05)))
        self.metta.space().add_atom(E(S("age-urgency-boost"), S("pediatric"), ValueAtom(0.08)))

        # URGENCY ASSESSMENT
        self.metta.space().add_atom(E(S("urgency-priority"), S("chest_pain"), ValueAtom(0.90)))
        self.metta.space().add_atom(E(S("urgency-priority"), S("seizure"), ValueAtom(0.98)))
        self.metta.space().add_atom(E(S("urgency-priority"), S("numbness+weakness"), ValueAtom(0.95)))
        self.metta.space().add_atom(E(S("urgency-priority"), S("headache"), ValueAtom(0.55)))
        self.metta.space().add_atom(E(S("urgency-priority"), S("rash"), ValueAtom(0.30)))

        # SYMPTOM SEVERITY MODIFIERS
        self.metta.space().add_atom(E(S("severity-modifier"), S("sudden_onset"), ValueAtom(0.15)))
        self.metta.space().add_atom(E(S("severity-modifier"), S("severe_pain"), ValueAtom(0.12)))
        self.metta.space().add_atom(E(S("severity-modifier"), S("radiating_pain"), ValueAtom(0.10)))

        logger.info("Loaded 30+ triage routing rules into MeTTa knowledge base")

    def route_symptoms(
        self,
        symptoms: str,
        patient_age: Optional[int] = None
    ) -> Dict:
        """
        Route symptoms to appropriate specialist using MeTTa reasoning

        Args:
            symptoms: Patient symptom description
            patient_age: Patient age (for age-based routing modifiers)

        Returns:
            Dictionary containing:
            - recommended_specialty: Best specialist match
            - confidence: Routing confidence (0-1)
            - urgency: Priority level (0-1)
            - reasoning: Explanation of routing decision
            - matched_keywords: Symptom keywords that influenced decision
            - matched_rules: Number of MeTTa rules that fired
            - secondary_specialty: Optional secondary consultation recommendation
        """

        logger.info(f"Routing symptoms: {symptoms[:100]}...")

        # Extract symptom keywords
        symptom_keywords = self._extract_symptom_keywords(symptoms)
        logger.info(f"Extracted keywords: {symptom_keywords}")

        # Check for multi-symptom combinations
        combo_key = self._detect_symptom_combinations(symptom_keywords)
        if combo_key:
            logger.info(f"Detected symptom combination: {combo_key}")

        # Query MeTTa for specialty routing
        specialty_scores = {}
        matched_keywords = []
        matched_rules = 0

        # Query individual symptoms
        for keyword in symptom_keywords:
            results = self._query_specialty_for_keyword(keyword)
            logger.info(f"Query for keyword '{keyword}' returned {len(results)} results: {results}")

            for specialty, confidence in results:
                if specialty not in specialty_scores:
                    specialty_scores[specialty] = []
                specialty_scores[specialty].append(confidence)
                if keyword not in matched_keywords:
                    matched_keywords.append(keyword)
                matched_rules += 1

        # Query symptom combinations
        if combo_key:
            combo_results = self._query_symptom_combo(combo_key)
            for specialty, confidence in combo_results:
                if specialty not in specialty_scores:
                    specialty_scores[specialty] = []
                specialty_scores[specialty].append(confidence)
                matched_rules += 1

        # Aggregate scores (take max confidence for each specialty)
        final_scores = {
            specialty: max(scores)
            for specialty, scores in specialty_scores.items()
        }

        logger.info(f"Specialty scores: {final_scores}")
        logger.info(f"Total MeTTa rules matched: {matched_rules}")

        # Select best specialty
        if final_scores:
            recommended_specialty = max(final_scores, key=final_scores.get)
            confidence = final_scores[recommended_specialty]
        else:
            # Default to cardiology if no match (conservative approach)
            recommended_specialty = "cardiology"
            confidence = 0.50
            logger.warning("No specialty match found, defaulting to cardiology")

        # Query urgency
        urgency = self._query_urgency(symptom_keywords, combo_key)

        # Apply age modifiers to urgency
        if patient_age:
            age_boost, age_rules = self._apply_age_modifiers(final_scores, patient_age)
            matched_rules += age_rules
            urgency = min(1.0, urgency + age_boost)
            logger.info(f"Age modifiers applied to urgency: +{age_boost}")

        # Apply severity modifiers to urgency
        severity_boost = self._detect_severity_modifiers(symptoms)
        urgency = min(1.0, urgency + severity_boost)

        # Secondary specialty: recommend 2nd best if close score
        secondary_specialty = None
        if len(final_scores) > 1:
            sorted_specialties = sorted(final_scores.items(), key=lambda x: x[1], reverse=True)
            if len(sorted_specialties) > 1 and sorted_specialties[1][1] >= 0.60:
                secondary_specialty = sorted_specialties[1][0]

        # Generate reasoning
        reasoning = self._generate_routing_reasoning(
            symptom_keywords,
            recommended_specialty,
            confidence,
            final_scores,
            matched_rules,
            combo_key,
            secondary_specialty
        )

        # Use symptom_keywords if no MeTTa matches found (for transparency)
        keywords_to_return = matched_keywords if matched_keywords else symptom_keywords

        return {
            "recommended_specialty": recommended_specialty,
            "confidence": round(confidence, 2),
            "urgency": round(urgency, 2),
            "reasoning": reasoning,
            "matched_keywords": keywords_to_return,
            "matched_rules": matched_rules,
            "all_specialty_scores": final_scores,
            "secondary_specialty": secondary_specialty
        }

    def _extract_symptom_keywords(self, symptoms: str) -> List[str]:
        """
        Extract medical symptom keywords from natural language

        Maps patient descriptions to knowledge base keywords
        """
        symptoms_lower = symptoms.lower()
        keywords = []

        # Cardiac keywords
        if any(word in symptoms_lower for word in ['chest', 'pain', 'hurt', 'pressure', 'tight']):
            keywords.append("chest_pain")
        if any(word in symptoms_lower for word in ['palpitation', 'racing', 'flutter', 'irregular', 'skip']):
            keywords.append("palpitations")
        if any(word in symptoms_lower for word in ['breath', 'breathing', 'short', 'dyspnea']):
            keywords.append("shortness_of_breath")
        if any(word in symptoms_lower for word in ['heart', 'cardiac']):
            keywords.append("heart")
        if any(word in symptoms_lower for word in ['exercise', 'exertion', 'activity', 'walking', 'stairs', 'exertional']):
            keywords.append("exertional")

        # Neurological keywords
        if any(word in symptoms_lower for word in ['headache', 'head', 'migraine', 'cephalalgia']):
            keywords.append("headache")
        if any(word in symptoms_lower for word in ['dizzy', 'dizziness', 'vertigo', 'spinning', 'lightheaded']):
            keywords.append("dizziness")
        if any(word in symptoms_lower for word in ['seizure', 'convulsion', 'fit', 'epilep']):
            keywords.append("seizure")
        if any(word in symptoms_lower for word in ['numb', 'numbness', 'tingling', 'pins', 'needles']):
            keywords.append("numbness")
        if any(word in symptoms_lower for word in ['weak', 'weakness', 'paralysis', 'cant move']):
            keywords.append("weakness")
        if any(word in symptoms_lower for word in ['vision', 'seeing', 'sight', 'blurry', 'double']):
            keywords.append("vision_changes")

        # Dermatological keywords
        if any(word in symptoms_lower for word in ['rash', 'spots', 'hives', 'eruption']):
            keywords.append("rash")
        if any(word in symptoms_lower for word in ['skin', 'lesion', 'mole', 'growth', 'bump']):
            keywords.append("skin_lesion")
        if any(word in symptoms_lower for word in ['itch', 'itching', 'itchy', 'scratch']):
            keywords.append("itching")

        return keywords if keywords else ["general"]

    def _detect_symptom_combinations(self, keywords: List[str]) -> Optional[str]:
        """
        Detect important symptom combinations

        Returns combined symptom key if important pattern found
        """
        # Cardiac combinations
        if "chest_pain" in keywords and "exertional" in keywords:
            return "chest_pain+exertional"
        if "chest_pain" in keywords and "shortness_of_breath" in keywords:
            return "chest_pain+shortness_of_breath"
        if "dizziness" in keywords and "palpitations" in keywords:
            return "dizziness+palpitations"

        # Neurological combinations
        if "headache" in keywords and "vision_changes" in keywords:
            return "headache+vision_changes"
        if "numbness" in keywords and "weakness" in keywords:
            return "numbness+weakness"

        # Dermatological combinations
        if "rash" in keywords and "itching" in keywords:
            return "rash+itching"

        return None

    def _query_specialty_for_keyword(self, keyword: str) -> List[Tuple[str, float]]:
        """
        Query MeTTa for specialty routing based on keyword

        Returns list of (specialty, confidence) tuples

        Now using 2-parameter pattern: queries each specialty separately
        """
        matches = []
        specialties = ["cardiology", "neurology", "dermatology"]

        for specialty in specialties:
            query_str = f'!(match &self ({specialty}-route {keyword} $confidence) $confidence)'
            results = self.metta.run(query_str)

            logger.debug(f"Routing query for '{keyword}' -> {specialty}: {query_str}")

            if results and len(results) > 0:
                for result in results:
                    if len(result) > 0 and hasattr(result[0], 'get_object'):
                        confidence = result[0].get_object().value
                        matches.append((specialty, confidence))
                        logger.debug(f"  -> Matched {specialty} with confidence {confidence}")

        return matches

    def _query_symptom_combo(self, combo_key: str) -> List[Tuple[str, float]]:
        """Query MeTTa for symptom combination routing using 2-parameter pattern"""
        matches = []
        specialties = ["cardiology", "neurology", "dermatology"]

        for specialty in specialties:
            query_str = f'!(match &self ({specialty}-combo {combo_key} $confidence) $confidence)'
            results = self.metta.run(query_str)

            logger.debug(f"Combo query for '{combo_key}' -> {specialty}: {query_str}")

            if results and len(results) > 0:
                for result in results:
                    if len(result) > 0 and hasattr(result[0], 'get_object'):
                        confidence = result[0].get_object().value
                        matches.append((specialty, confidence))
                        logger.debug(f"  -> Matched {specialty} combo with confidence {confidence}")

        return matches

    def _apply_age_modifiers(
        self,
        specialty_scores: Dict[str, List[float]],
        patient_age: int
    ) -> Tuple[float, int]:
        """Apply age-based urgency modifiers (simplified 2-parameter pattern)"""
        total_boost = 0.0
        rules_fired = 0

        age_category = None
        if patient_age >= 70:
            age_category = "age_over_70"
        elif patient_age >= 60:
            age_category = "age_over_60"
        elif patient_age >= 50:
            age_category = "age_over_50"
        elif patient_age < 18:
            age_category = "pediatric"

        if age_category:
            query_str = f'!(match &self (age-urgency-boost {age_category} $boost) $boost)'
            results = self.metta.run(query_str)

            if results and len(results) > 0:
                for result in results:
                    if len(result) > 0 and hasattr(result[0], 'get_object'):
                        boost = result[0].get_object().value
                        total_boost += boost
                        rules_fired += 1
                        logger.debug(f"Age modifier {age_category}: +{boost}")

        return total_boost, rules_fired

    def _query_urgency(self, symptom_keywords: List[str], combo_key: Optional[str]) -> float:
        """
        Query MeTTa for urgency level based on symptoms

        Returns urgency score (0-1)
        """
        max_urgency = 0.50  # Default moderate urgency

        # Check combo urgency first
        if combo_key:
            query_str = f'!(match &self (urgency-priority {combo_key} $urgency) $urgency)'
            results = self.metta.run(query_str)

            if results and len(results) > 0:
                for result in results:
                    if len(result) > 0 and hasattr(result[0], 'get_object'):
                        urgency = result[0].get_object().value
                        max_urgency = max(max_urgency, urgency)

        # Check individual symptom urgency
        for keyword in symptom_keywords:
            query_str = f'!(match &self (urgency-priority {keyword} $urgency) $urgency)'
            results = self.metta.run(query_str)

            if results and len(results) > 0:
                for result in results:
                    if len(result) > 0 and hasattr(result[0], 'get_object'):
                        urgency = result[0].get_object().value
                        max_urgency = max(max_urgency, urgency)

        return max_urgency

    def _detect_severity_modifiers(self, symptoms: str) -> float:
        """Detect severity modifiers from symptom description"""
        symptoms_lower = symptoms.lower()
        boost = 0.0

        modifiers = [
            ("sudden_onset", ["sudden", "suddenly", "acute", "came on"]),
            ("severe_pain", ["severe", "terrible", "worst", "unbearable", "excruciating"]),
            ("radiating_pain", ["radiating", "spreading", "shoots", "travels"])
        ]

        for modifier_key, words in modifiers:
            if any(word in symptoms_lower for word in words):
                query_str = f'!(match &self (severity-modifier {modifier_key} $boost) $boost)'
                results = self.metta.run(query_str)

                if results and len(results) > 0:
                    for result in results:
                        if len(result) > 0 and hasattr(result[0], 'get_object'):
                            boost += result[0].get_object().value

        return boost

    def _query_secondary_consult(
        self,
        primary_specialty: str,
        all_scores: Dict[str, float]
    ) -> Optional[str]:
        """Query for secondary consultation recommendation"""
        query_str = f'!(match &self (secondary-consult {primary_specialty} $secondary $threshold) ($secondary $threshold))'
        results = self.metta.run(query_str)

        if results:
            for result in results:
                if len(result) >= 2:
                    secondary = str(result[0])
                    threshold = result[1].get_object().value if hasattr(result[1], 'get_object') else 0.60

                    # Only recommend secondary if they scored reasonably well
                    if secondary in all_scores and all_scores[secondary] >= threshold:
                        return secondary

        return None

    def _generate_routing_reasoning(
        self,
        keywords: List[str],
        specialty: str,
        confidence: float,
        all_scores: Dict[str, float],
        matched_rules: int,
        combo_key: Optional[str],
        secondary_specialty: Optional[str]
    ) -> str:
        """Generate human-readable explanation of routing decision"""

        reasoning = f"Triage MeTTa analysis: Identified {len(keywords)} key symptom indicators: {', '.join(keywords)}. "

        if combo_key:
            reasoning += f"\n\nDetected significant symptom combination: {combo_key.replace('_', ' ').replace('+', ' with ')}. "

        reasoning += f"\n\n{matched_rules} MeTTa routing rules matched symptoms to {specialty.title()} "
        reasoning += f"with {confidence:.0%} confidence. "

        if len(all_scores) > 1:
            reasoning += f"\n\nAlternative specialties considered: "
            other_specialties = [f"{s.title()} ({score:.0%})"
                               for s, score in sorted(all_scores.items(), key=lambda x: x[1], reverse=True)
                               if s != specialty][:2]  # Show top 2 alternatives
            if other_specialties:
                reasoning += ", ".join(other_specialties) + ". "

        if secondary_specialty:
            reasoning += f"\n\nSecondary consultation with {secondary_specialty.title()} may be beneficial for comprehensive care."

        reasoning += f"\n\nRouting patient to {specialty.title()} specialist for detailed assessment."

        return reasoning


# Singleton instance
_triage_knowledge_instance = None

def get_triage_knowledge() -> TriageKnowledge:
    """Get singleton instance of TriageKnowledge"""
    global _triage_knowledge_instance
    if _triage_knowledge_instance is None:
        _triage_knowledge_instance = TriageKnowledge()
    return _triage_knowledge_instance
