"""
Doctor Matcher Service
Queries doctors from blockchain and filters by specialization
"""

from typing import List
from api.models import DoctorInfo
from blockchain.doctor_registry import get_doctor_registry
import logging

logger = logging.getLogger(__name__)


class DoctorMatcher:
    """
    Matches doctors from DoctorRegistry based on specialization

    Uses fuzzy matching to handle variations in specialization names
    """

    def __init__(self):
        self.registry = get_doctor_registry()
        self._doctors_cache = None
        logger.info("✓ DoctorMatcher initialized")

    async def find_doctors(self, specialization: str) -> List[DoctorInfo]:
        """
        Find doctors matching the recommended specialization

        Args:
            specialization: Recommended specialization (e.g., "Cardiology")

        Returns:
            List of matching doctors
        """
        try:
            all_doctors = self._get_all_doctors_cached()

            if not all_doctors:
                logger.warning("No doctors found in registry")
                return []

            matching_doctors = [
                doctor for doctor in all_doctors
                if self._specialization_matches(doctor["specialization"], specialization)
            ]

            logger.info(
                f"Found {len(matching_doctors)}/{len(all_doctors)} doctors "
                f"matching specialization: {specialization}"
            )

            return [self._to_doctor_info(d) for d in matching_doctors]

        except Exception as e:
            logger.error(f"Error finding doctors: {e}")
            return []

    def _get_all_doctors_cached(self) -> List[dict]:
        """
        Get all doctors with simple caching

        Cache is cleared on service restart
        In production, implement TTL-based caching
        """
        if self._doctors_cache is None:
            self._doctors_cache = self.registry.get_all_doctors()
        return self._doctors_cache

    def invalidate_cache(self):
        """Invalidate the doctors cache"""
        self._doctors_cache = None
        logger.info("Doctors cache invalidated")

    def _specialization_matches(self, doctor_spec: str, requested_spec: str) -> bool:
        """
        Fuzzy match specializations

        Handles variations like:
        - "Cardiology" matches "Cardiologist"
        - "Neuro" matches "Neurologist"
        - Case-insensitive

        Args:
            doctor_spec: Doctor's registered specialization
            requested_spec: Requested specialization from agent

        Returns:
            True if they match
        """
        doctor_spec_lower = doctor_spec.lower().strip()
        requested_spec_lower = requested_spec.lower().strip()

        # Exact match
        if doctor_spec_lower == requested_spec_lower:
            return True

        # Substring match (either direction)
        if requested_spec_lower in doctor_spec_lower or doctor_spec_lower in requested_spec_lower:
            return True

        # Common variations mapping
        variations = {
            "cardiology": ["cardiologist", "cardiac", "heart specialist"],
            "neurology": ["neurologist", "neuro", "neurological", "brain specialist"],
            "dermatology": ["dermatologist", "derm", "skin specialist"],
            "general": ["general practice", "general practitioner", "gp", "family medicine"],
            "orthopedics": ["orthopedic", "ortho", "orthopedist"],
            "psychiatry": ["psychiatrist", "mental health"],
            "pediatrics": ["pediatrician", "child specialist"]
        }

        # Check if either specialization matches any variation
        for base, synonyms in variations.items():
            if base in requested_spec_lower or any(syn in requested_spec_lower for syn in synonyms):
                if base in doctor_spec_lower or any(syn in doctor_spec_lower for syn in synonyms):
                    return True

        return False

    def _to_doctor_info(self, doctor_dict: dict) -> DoctorInfo:
        """
        Convert doctor dictionary to DoctorInfo Pydantic model

        Args:
            doctor_dict: Dictionary from blockchain query

        Returns:
            DoctorInfo model
        """
        return DoctorInfo(
            doctor_id=doctor_dict["doctor_id"],
            name=doctor_dict["name"],
            specialization=doctor_dict["specialization"],
            profile_description=doctor_dict["profile_description"],
            email=doctor_dict["email"],
            address=doctor_dict["address"],
            consultation_fee_per_hour=doctor_dict["consultation_fee_per_hour"],
            deposit_fee_stored=doctor_dict["deposit_fee_stored"],
            legal_documents_ipfs_hash=doctor_dict["legal_documents_ipfs_hash"]
        )


# Singleton instance
_matcher_instance = None


def get_doctor_matcher() -> DoctorMatcher:
    """Get singleton DoctorMatcher instance"""
    global _matcher_instance
    if _matcher_instance is None:
        _matcher_instance = DoctorMatcher()
    return _matcher_instance
