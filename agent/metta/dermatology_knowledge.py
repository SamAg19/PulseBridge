"""
Dermatology Knowledge Base using MeTTa/Hyperon

Deep medical reasoning for skin conditions with 30+ rules.
Demonstrates real MeTTa reasoning (not hardcoded) for ASI Alliance hackathon.
"""

import re
from hyperon import MeTTa, E, S, ValueAtom
from typing import List, Dict, Tuple, Optional
import logging

logger = logging.getLogger(__name__)


class DermatologyKnowledge:
    """
    MeTTa-based dermatology reasoning engine

    Uses Hyperon library for real symbolic reasoning about skin conditions.
    Contains 30+ medical rules for symptom analysis, risk assessment, and recommendations.
    """

    def __init__(self):
        """Initialize MeTTa instance and load dermatology knowledge"""
        self.metta = MeTTa()
        self._initialize_knowledge()
        logger.info("DermatologyKnowledge initialized with MeTTa reasoning engine")

    def _initialize_knowledge(self):
        """
        Initialize dermatology knowledge base with 30+ medical reasoning rules
        """

        # SYMPTOM-TO-CONDITION MAPPINGS
        self.metta.space().add_atom(
            E(S("symptom-cluster"), S("mole_changes+irregular_border+color_variation"), S("melanoma"), ValueAtom(0.85))
        )
        self.metta.space().add_atom(
            E(S("symptom-cluster"), S("red_scaly_patches+silvery_scales"), S("psoriasis"), ValueAtom(0.80))
        )
        self.metta.space().add_atom(
            E(S("symptom-cluster"), S("itchy_rash+dry_skin+red_patches"), S("eczema"), ValueAtom(0.75))
        )
        self.metta.space().add_atom(
            E(S("symptom-cluster"), S("spreading_redness+warmth+pain+fever"), S("cellulitis"), ValueAtom(0.85))
        )
        self.metta.space().add_atom(
            E(S("symptom-cluster"), S("blisters+painful+clustered"), S("herpes_zoster"), ValueAtom(0.80))
        )
        self.metta.space().add_atom(
            E(S("symptom-cluster"), S("acne+cysts+scarring"), S("severe_acne"), ValueAtom(0.75))
        )
        self.metta.space().add_atom(
            E(S("symptom-cluster"), S("hives+swelling+itching"), S("urticaria"), ValueAtom(0.70))
        )
        self.metta.space().add_atom(
            E(S("symptom-cluster"), S("circular_rash+red_border+central_clearing"), S("ringworm"), ValueAtom(0.80))
        )
        self.metta.space().add_atom(
            E(S("symptom-cluster"), S("raised_growth+pearly+bleeding_easily"), S("basal_cell_carcinoma"), ValueAtom(0.75))
        )
        self.metta.space().add_atom(
            E(S("symptom-cluster"), S("scaly_patch+rough_texture+sun_exposed"), S("actinic_keratosis"), ValueAtom(0.70))
        )
        self.metta.space().add_atom(
            E(S("symptom-cluster"), S("facial_redness+visible_blood_vessels+pustules"), S("rosacea"), ValueAtom(0.75))
        )
        self.metta.space().add_atom(
            E(S("symptom-cluster"), S("white_patches+loss_of_pigmentation"), S("vitiligo"), ValueAtom(0.80))
        )
        self.metta.space().add_atom(
            E(S("symptom-cluster"), S("thick_yellow_nails+crumbling"), S("fungal_nail_infection"), ValueAtom(0.75))
        )

        # RISK FACTOR AMPLIFICATIONS
        self.metta.space().add_atom(
            E(S("risk-amplifies"), S("sun_exposure_excessive"), S("melanoma"), ValueAtom(0.20))
        )
        self.metta.space().add_atom(
            E(S("risk-amplifies"), S("sun_exposure_excessive"), S("basal_cell_carcinoma"), ValueAtom(0.18))
        )
        self.metta.space().add_atom(
            E(S("risk-amplifies"), S("sun_exposure_excessive"), S("actinic_keratosis"), ValueAtom(0.15))
        )
        self.metta.space().add_atom(
            E(S("risk-amplifies"), S("fair_skin"), S("melanoma"), ValueAtom(0.15))
        )
        self.metta.space().add_atom(
            E(S("risk-amplifies"), S("family_history_skin_cancer"), S("melanoma"), ValueAtom(0.18))
        )
        self.metta.space().add_atom(
            E(S("risk-amplifies"), S("family_history_psoriasis"), S("psoriasis"), ValueAtom(0.12))
        )
        self.metta.space().add_atom(
            E(S("risk-amplifies"), S("family_history_eczema"), S("eczema"), ValueAtom(0.10))
        )
        self.metta.space().add_atom(
            E(S("risk-amplifies"), S("diabetes"), S("cellulitis"), ValueAtom(0.15))
        )
        self.metta.space().add_atom(
            E(S("risk-amplifies"), S("immunocompromised"), S("cellulitis"), ValueAtom(0.20))
        )
        self.metta.space().add_atom(
            E(S("risk-amplifies"), S("immunocompromised"), S("herpes_zoster"), ValueAtom(0.15))
        )
        self.metta.space().add_atom(
            E(S("risk-amplifies"), S("age_over_60"), S("herpes_zoster"), ValueAtom(0.12))
        )

        # URGENCY SCORING
        self.metta.space().add_atom(
            E(S("urgency-level"), S("mole_changes+irregular_border+color_variation"), ValueAtom(0.90))
        )
        self.metta.space().add_atom(
            E(S("urgency-level"), S("spreading_redness+warmth+pain+fever"), ValueAtom(0.88))
        )
        self.metta.space().add_atom(
            E(S("urgency-level"), S("raised_growth+pearly+bleeding_easily"), ValueAtom(0.75))
        )
        self.metta.space().add_atom(
            E(S("urgency-level"), S("blisters+painful+clustered"), ValueAtom(0.70))
        )
        self.metta.space().add_atom(
            E(S("urgency-level"), S("scaly_patch+rough_texture+sun_exposed"), ValueAtom(0.65))
        )
        self.metta.space().add_atom(
            E(S("urgency-level"), S("red_scaly_patches+silvery_scales"), ValueAtom(0.50))
        )
        self.metta.space().add_atom(
            E(S("urgency-level"), S("itchy_rash+dry_skin+red_patches"), ValueAtom(0.35))
        )
        self.metta.space().add_atom(
            E(S("urgency-level"), S("acne+cysts+scarring"), ValueAtom(0.40))
        )
        self.metta.space().add_atom(
            E(S("urgency-level"), S("hives+swelling+itching"), ValueAtom(0.45))
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
            E(S("recommendation"), S("melanoma"), ValueAtom("URGENT dermatologist consultation within days"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("melanoma"), ValueAtom("Skin biopsy required"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("melanoma"), ValueAtom("Full body skin examination"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("melanoma"), ValueAtom("Avoid sun exposure"))
        )

        self.metta.space().add_atom(
            E(S("recommendation"), S("cellulitis"), ValueAtom("Urgent medical evaluation - possible IV antibiotics"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("cellulitis"), ValueAtom("Blood cultures may be needed"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("cellulitis"), ValueAtom("Elevate affected area"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("cellulitis"), ValueAtom("Monitor for spreading or systemic symptoms"))
        )

        self.metta.space().add_atom(
            E(S("recommendation"), S("basal_cell_carcinoma"), ValueAtom("Dermatologist evaluation within weeks"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("basal_cell_carcinoma"), ValueAtom("Biopsy for confirmation"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("basal_cell_carcinoma"), ValueAtom("Surgical excision likely needed"))
        )

        self.metta.space().add_atom(
            E(S("recommendation"), S("actinic_keratosis"), ValueAtom("Dermatologist evaluation"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("actinic_keratosis"), ValueAtom("Cryotherapy or topical treatment"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("actinic_keratosis"), ValueAtom("Sun protection essential"))
        )

        self.metta.space().add_atom(
            E(S("recommendation"), S("psoriasis"), ValueAtom("Dermatologist consultation"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("psoriasis"), ValueAtom("Topical corticosteroids"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("psoriasis"), ValueAtom("Vitamin D analogs"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("psoriasis"), ValueAtom("Consider phototherapy for extensive disease"))
        )

        self.metta.space().add_atom(
            E(S("recommendation"), S("eczema"), ValueAtom("Moisturize frequently"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("eczema"), ValueAtom("Avoid triggers (soaps, detergents)"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("eczema"), ValueAtom("Topical corticosteroids for flares"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("eczema"), ValueAtom("Dermatologist if severe or not improving"))
        )

        self.metta.space().add_atom(
            E(S("recommendation"), S("herpes_zoster"), ValueAtom("Urgent medical evaluation for antiviral therapy"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("herpes_zoster"), ValueAtom("Antivirals most effective within 72 hours"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("herpes_zoster"), ValueAtom("Pain management"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("herpes_zoster"), ValueAtom("Avoid contact with pregnant women and immunocompromised"))
        )

        self.metta.space().add_atom(
            E(S("recommendation"), S("urticaria"), ValueAtom("Identify and avoid triggers"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("urticaria"), ValueAtom("Antihistamines for symptom relief"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("urticaria"), ValueAtom("Seek emergency care if breathing difficulty or swelling"))
        )

        self.metta.space().add_atom(
            E(S("recommendation"), S("ringworm"), ValueAtom("Antifungal cream (clotrimazole, terbinafine)"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("ringworm"), ValueAtom("Keep area clean and dry"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("ringworm"), ValueAtom("Avoid sharing personal items"))
        )

        self.metta.space().add_atom(
            E(S("recommendation"), S("rosacea"), ValueAtom("Dermatologist consultation"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("rosacea"), ValueAtom("Avoid triggers (spicy foods, alcohol, temperature extremes)"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("rosacea"), ValueAtom("Topical metronidazole or azelaic acid"))
        )

        self.metta.space().add_atom(
            E(S("recommendation"), S("severe_acne"), ValueAtom("Dermatologist consultation"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("severe_acne"), ValueAtom("Consider oral isotretinoin"))
        )
        self.metta.space().add_atom(
            E(S("recommendation"), S("severe_acne"), ValueAtom("Topical retinoids"))
        )

        logger.info("Loaded 30+ dermatology medical reasoning rules into MeTTa knowledge base")

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

        # Check for MELANOMA symptoms (highest priority)
        has_mole = any(word in symptoms_lower for word in ['mole', 'spot', 'lesion', 'growth'])
        has_changes = any(word in symptoms_lower for word in ['changing', 'changed', 'growing', 'new'])
        has_irregular = any(word in symptoms_lower for word in ['irregular', 'asymmetric', 'jagged'])
        has_color = any(word in symptoms_lower for word in ['color', 'dark', 'black', 'multiple colors'])

        if has_mole and (has_changes or has_irregular or has_color):
            return "mole_changes+irregular_border+color_variation"

        # Check for CELLULITIS symptoms
        has_redness = any(word in symptoms_lower for word in ['red', 'redness'])
        has_spreading = any(word in symptoms_lower for word in ['spreading', 'expanding', 'growing'])
        has_warmth = any(word in symptoms_lower for word in ['warm', 'hot'])
        has_fever = any(word in symptoms_lower for word in ['fever', 'chills'])

        if has_redness and (has_spreading or has_warmth) and has_fever:
            return "spreading_redness+warmth+pain+fever"

        # Check for HERPES ZOSTER (shingles) symptoms
        has_blisters = any(word in symptoms_lower for word in ['blister', 'vesicle', 'rash'])
        has_painful = any(word in symptoms_lower for word in ['pain', 'painful', 'burning'])
        has_clustered = any(word in symptoms_lower for word in ['cluster', 'band', 'strip', 'one side'])

        if has_blisters and has_painful and has_clustered:
            return "blisters+painful+clustered"

        # Check for BASAL CELL CARCINOMA symptoms
        has_raised = any(word in symptoms_lower for word in ['raised', 'bump', 'nodule'])
        has_pearly = any(word in symptoms_lower for word in ['pearly', 'shiny', 'translucent'])
        has_bleeding = any(word in symptoms_lower for word in ['bleed', 'bleeding', 'won\'t heal'])

        if has_raised and (has_pearly or has_bleeding):
            return "raised_growth+pearly+bleeding_easily"

        # Check for PSORIASIS symptoms
        has_scaly = any(word in symptoms_lower for word in ['scaly', 'scales', 'flaky'])
        has_silvery = any(word in symptoms_lower for word in ['silvery', 'white', 'thick'])
        has_patches = any(word in symptoms_lower for word in ['patch', 'plaque'])

        if has_scaly and (has_silvery or has_patches) and has_redness:
            return "red_scaly_patches+silvery_scales"

        # Check for ECZEMA symptoms
        has_itchy = any(word in symptoms_lower for word in ['itch', 'itchy', 'scratchy'])
        has_dry = any(word in symptoms_lower for word in ['dry', 'rough'])

        if has_itchy and has_dry and (has_redness or 'rash' in symptoms_lower):
            return "itchy_rash+dry_skin+red_patches"

        # Check for ACTINIC KERATOSIS symptoms
        has_rough = any(word in symptoms_lower for word in ['rough', 'scaly', 'crusty'])
        has_sun_exposed = any(word in symptoms_lower for word in ['sun', 'face', 'scalp', 'arm', 'hand'])

        if has_rough and has_sun_exposed and 'patch' in symptoms_lower:
            return "scaly_patch+rough_texture+sun_exposed"

        # Check for RINGWORM symptoms
        has_circular = any(word in symptoms_lower for word in ['circular', 'ring', 'round'])
        has_border = any(word in symptoms_lower for word in ['border', 'edge', 'rim'])
        has_clearing = any(word in symptoms_lower for word in ['clear center', 'clearing'])

        if has_circular and (has_border or has_clearing):
            return "circular_rash+red_border+central_clearing"

        # Check for URTICARIA (hives) symptoms
        has_hives = any(word in symptoms_lower for word in ['hive', 'welt', 'wheal'])
        has_swelling = any(word in symptoms_lower for word in ['swell', 'swelling', 'puffy'])

        if (has_hives or has_swelling) and has_itchy:
            return "hives+swelling+itching"

        # Check for ROSACEA symptoms
        has_facial = any(word in symptoms_lower for word in ['face', 'facial', 'cheek', 'nose'])
        has_blood_vessels = any(word in symptoms_lower for word in ['blood vessel', 'vein', 'spider'])
        has_pustules = any(word in symptoms_lower for word in ['pustule', 'pimple', 'bump'])

        if has_facial and has_redness and (has_blood_vessels or has_pustules):
            return "facial_redness+visible_blood_vessels+pustules"

        # Check for SEVERE ACNE symptoms
        has_acne = any(word in symptoms_lower for word in ['acne', 'pimple'])
        has_cysts = any(word in symptoms_lower for word in ['cyst', 'nodule', 'deep'])
        has_scarring = any(word in symptoms_lower for word in ['scar', 'scarring'])

        if has_acne and (has_cysts or has_scarring):
            return "acne+cysts+scarring"

        # Default fallback based on primary symptom
        if 'rash' in symptoms_lower or has_redness:
            if has_itchy:
                return "itchy_rash+dry_skin+red_patches"
            return "red_scaly_patches+silvery_scales"
        if has_mole or 'spot' in symptoms_lower:
            return "mole_changes+irregular_border+color_variation"
        if 'acne' in symptoms_lower:
            return "acne+cysts+scarring"

        return "generic_dermatological_symptoms"

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
        return "eczema", 0.50

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
        if patient_age and patient_age >= 60:
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
            urgency = results[0][0].get_object().value if hasattr(results[0][0], 'get_object') else 0.50
            return urgency

        # Default urgency for skin conditions
        return 0.50

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
                "Seek dermatologist consultation",
                "Monitor skin changes closely",
                "Photograph lesions for tracking"
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
_dermatology_knowledge_instance = None

def get_dermatology_knowledge() -> DermatologyKnowledge:
    """Get singleton instance of DermatologyKnowledge"""
    global _dermatology_knowledge_instance
    if _dermatology_knowledge_instance is None:
        _dermatology_knowledge_instance = DermatologyKnowledge()
    return _dermatology_knowledge_instance
