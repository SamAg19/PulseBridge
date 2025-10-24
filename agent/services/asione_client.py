"""
ASI:One Client Service

Integrates with Fetch.ai's ASI:One API for natural language processing.
Used for symptom enhancement and patient-friendly explanation generation.
"""

import os
import httpx
from typing import Optional, Dict
import logging

logger = logging.getLogger(__name__)


class ASIOneClient:
    """
    Client for ASI:One API integration

    Provides:
    - Symptom text enhancement and entity extraction
    - Medical terminology simplification
    - Patient-friendly explanation generation
    """

    def __init__(self):
        """Initialize ASI:One client with API credentials"""
        self.api_key = os.getenv("ASIONE_API_KEY")
        self.api_url = os.getenv("ASIONE_API_URL", "https://agentverse.ai/v1/chat/completions")
        self.model = os.getenv("ASIONE_MODEL", "asi-1")

        if not self.api_key:
            logger.warning("ASI:One API key not configured - AI enhancements will be disabled")
            self.enabled = False
        else:
            self.enabled = True
            logger.info("ASI:One client initialized successfully")

    async def preprocess_symptoms_for_metta(self, symptoms: str) -> Dict[str, any]:
        """
        Use ASI:One to preprocess and normalize symptoms for optimal MeTTa analysis

        This preprocessing optimizes informal/messy patient input for MeTTa reasoning:
        - Normalizes medical terminology
        - Identifies temporal patterns (acute vs chronic)
        - Extracts severity/quality descriptors
        - Structures unstructured text

        Args:
            symptoms: Raw patient symptom description (potentially informal)

        Returns:
            Dict containing:
            - preprocessed_text: Normalized medical description optimized for MeTTa
            - key_symptoms: List of primary symptoms identified
            - temporal_pattern: "acute", "chronic", "episodic", or None
            - severity: "mild", "moderate", "severe", or None
            - original_text: Original input for comparison
        """
        if not self.enabled:
            return {
                "preprocessed_text": symptoms,
                "key_symptoms": [],
                "temporal_pattern": None,
                "severity": None,
                "original_text": symptoms
            }

        try:
            prompt = f"""You are a medical NLP system preprocessing patient symptoms for AI analysis. Transform informal patient descriptions into structured medical format.

Patient input: "{symptoms}"

Extract and normalize:
1. Key symptoms (use medical terminology)
2. Temporal pattern (acute/sudden, chronic/ongoing, episodic/intermittent)
3. Severity indicators (mild, moderate, severe)
4. Associated factors (exertional, positional, radiating, etc.)

Output normalized medical description that preserves all important clinical details while using standard terminology.

Respond in JSON:
{{
  "preprocessed_text": "normalized medical description using proper terminology",
  "key_symptoms": ["symptom1", "symptom2"],
  "temporal_pattern": "acute/chronic/episodic",
  "severity": "mild/moderate/severe"
}}"""

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.api_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": "You are a medical NLP preprocessing system that normalizes patient descriptions for AI analysis."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.2,  # Low temperature for consistency
                        "max_tokens": 400
                    }
                )

                if response.status_code == 200:
                    result = response.json()
                    content = result.get("choices", [{}])[0].get("message", {}).get("content", "{}")

                    # Try to parse JSON from response
                    import json
                    try:
                        parsed = json.loads(content)
                        parsed["original_text"] = symptoms
                        logger.info(f"ASI:One preprocessed symptoms: '{symptoms[:50]}...' → '{parsed.get('preprocessed_text', '')[:50]}...'")
                        return parsed
                    except json.JSONDecodeError:
                        logger.warning("ASI:One preprocessing response not valid JSON")
                        return {
                            "preprocessed_text": symptoms,
                            "key_symptoms": [],
                            "temporal_pattern": None,
                            "severity": None,
                            "original_text": symptoms
                        }
                else:
                    logger.error(f"ASI:One API error: {response.status_code}")
                    return {
                        "preprocessed_text": symptoms,
                        "key_symptoms": [],
                        "temporal_pattern": None,
                        "severity": None,
                        "original_text": symptoms
                    }

        except Exception as e:
            logger.error(f"Error calling ASI:One preprocessing: {e}", exc_info=True)
            return {
                "preprocessed_text": symptoms,
                "key_symptoms": [],
                "temporal_pattern": None,
                "severity": None,
                "original_text": symptoms
            }

    async def enhance_symptom_description(self, symptoms: str) -> Dict[str, any]:
        """
        Use ASI:One to extract medical entities and enhance symptom description

        Args:
            symptoms: Raw patient symptom description

        Returns:
            Dict containing:
            - enhanced_text: Medically enhanced description
            - extracted_entities: List of medical terms identified
            - severity_indicators: Detected severity keywords
        """
        if not self.enabled:
            return {
                "enhanced_text": symptoms,
                "extracted_entities": [],
                "severity_indicators": []
            }

        try:
            prompt = f"""You are a medical AI assistant. Analyze the following patient symptoms and extract:
1. Medical entities (symptoms, body parts, temporal patterns)
2. Severity indicators (mild, moderate, severe, sudden, chronic)
3. An enhanced medical description

Patient symptoms: "{symptoms}"

Respond in JSON format:
{{
  "enhanced_text": "medically enhanced description",
  "extracted_entities": ["symptom1", "symptom2"],
  "severity_indicators": ["severity1"]
}}"""

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.api_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": "You are a medical AI assistant that extracts medical entities from patient descriptions."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.3,
                        "max_tokens": 500
                    }
                )

                if response.status_code == 200:
                    result = response.json()
                    content = result.get("choices", [{}])[0].get("message", {}).get("content", "{}")

                    # Try to parse JSON from response
                    import json
                    try:
                        parsed = json.loads(content)
                        logger.info(f"ASI:One enhanced symptoms: {len(parsed.get('extracted_entities', []))} entities extracted")
                        return parsed
                    except json.JSONDecodeError:
                        logger.warning("ASI:One response not valid JSON, using raw response")
                        return {
                            "enhanced_text": content,
                            "extracted_entities": [],
                            "severity_indicators": []
                        }
                else:
                    logger.error(f"ASI:One API error: {response.status_code}")
                    return {
                        "enhanced_text": symptoms,
                        "extracted_entities": [],
                        "severity_indicators": []
                    }

        except Exception as e:
            logger.error(f"Error calling ASI:One API: {e}", exc_info=True)
            return {
                "enhanced_text": symptoms,
                "extracted_entities": [],
                "severity_indicators": []
            }

    async def generate_patient_friendly_explanation(
        self,
        technical_diagnosis: str,
        metta_reasoning: Optional[Dict] = None,
        recommendations: list = None
    ) -> str:
        """
        Use ASI:One to convert technical medical output into patient-friendly language

        Args:
            technical_diagnosis: Technical diagnosis from specialist agent
            metta_reasoning: MeTTa reasoning details
            recommendations: List of clinical recommendations

        Returns:
            Patient-friendly explanation string
        """
        if not self.enabled:
            return technical_diagnosis

        try:
            # Build context from MeTTa reasoning
            metta_context = ""
            if metta_reasoning:
                metta_context = f"\nMedical Analysis Details:\n"
                metta_context += f"- {metta_reasoning.get('matched_rules', 0)} clinical rules evaluated\n"
                if metta_reasoning.get('risk_factors_identified'):
                    metta_context += f"- Risk factors: {', '.join(metta_reasoning['risk_factors_identified'])}\n"
                metta_context += f"- Confidence: {metta_reasoning.get('confidence_calculation', 'N/A')}\n"

            recommendations_text = ""
            if recommendations:
                recommendations_text = f"\nRecommendations:\n" + "\n".join([f"- {r}" for r in recommendations[:3]])

            prompt = f"""You are a compassionate medical AI assistant. Translate this technical medical diagnosis into patient-friendly language that is:
1. Clear and easy to understand
2. Reassuring but honest
3. Action-oriented
4. Uses proper medical specialty names (cardiologist, neurologist, dermatologist) NOT informal terms (heart doctor, brain doctor, skin doctor)

Technical Diagnosis:
{technical_diagnosis}

{metta_context}

{recommendations_text}

Create a brief, patient-friendly explanation (2-3 sentences) that helps the patient understand what's happening and what to do next. Use proper medical terminology for specialist names."""

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.api_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": "You are a compassionate medical AI assistant that explains medical information in simple, patient-friendly language. Always use proper medical specialty names like 'cardiologist', 'neurologist', 'dermatologist' instead of informal terms."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.7,
                        "max_tokens": 300
                    }
                )

                if response.status_code == 200:
                    result = response.json()
                    content = result.get("choices", [{}])[0].get("message", {}).get("content", "")

                    if content:
                        logger.info("ASI:One generated patient-friendly explanation")
                        return content.strip()
                    else:
                        return technical_diagnosis
                else:
                    logger.error(f"ASI:One API error: {response.status_code}")
                    return technical_diagnosis

        except Exception as e:
            logger.error(f"Error calling ASI:One API: {e}", exc_info=True)
            return technical_diagnosis

    async def enhance_consensus_reasoning(
        self,
        triage_analysis: str,
        specialist_analysis: str,
        specialty: str,
        confidence: float
    ) -> str:
        """
        Use ASI:One to generate natural, coherent consensus reasoning

        Args:
            triage_analysis: Triage agent's analysis
            specialist_analysis: Specialist agent's analysis
            specialty: Recommended specialty
            confidence: Overall confidence score

        Returns:
            Natural language consensus reasoning
        """
        if not self.enabled:
            return f"Triage routed to {specialty}. Specialist analysis: {specialist_analysis[:100]}..."

        try:
            prompt = f"""You are a medical AI coordinator. Multiple AI specialists have analyzed a patient's symptoms. Create a brief, coherent summary of their collaborative analysis.

Triage Assessment:
{triage_analysis}

{specialty} Specialist Assessment:
{specialist_analysis}

Overall Confidence: {confidence:.0%}

Create a concise 2-3 sentence summary that explains:
1. What the AI team concluded
2. The level of confidence
3. The recommended next step

Use natural, professional language with proper medical specialty names (cardiologist, neurologist, dermatologist)."""

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.api_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": "You are a medical AI coordinator that synthesizes multiple AI analyses into coherent summaries. Always use proper medical specialty names like 'cardiologist', 'neurologist', 'dermatologist'."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.6,
                        "max_tokens": 250
                    }
                )

                if response.status_code == 200:
                    result = response.json()
                    content = result.get("choices", [{}])[0].get("message", {}).get("content", "")

                    if content:
                        logger.info("ASI:One generated consensus reasoning")
                        return content.strip()
                    else:
                        return f"AI analysis complete. Routing to {specialty} with {confidence:.0%} confidence."
                else:
                    logger.error(f"ASI:One API error: {response.status_code}")
                    return f"AI analysis complete. Routing to {specialty} with {confidence:.0%} confidence."

        except Exception as e:
            logger.error(f"Error calling ASI:One API: {e}", exc_info=True)
            return f"AI analysis complete. Routing to {specialty} with {confidence:.0%} confidence."


# Singleton instance
_asione_client_instance = None

def get_asione_client() -> ASIOneClient:
    """Get singleton instance of ASIOneClient"""
    global _asione_client_instance
    if _asione_client_instance is None:
        _asione_client_instance = ASIOneClient()
    return _asione_client_instance
