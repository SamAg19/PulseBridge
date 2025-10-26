"""
Web3 Doctor Client for Coordinator Agent

Lightweight Web3 client for querying DoctorRegistry contract.
Used by CoordinatorAgent to fetch doctor recommendations.
"""

from web3 import Web3
from typing import List, Dict, Optional
import os
import logging

logger = logging.getLogger(__name__)


class Web3DoctorClient:
    """
    Lightweight Web3 client for DoctorRegistry queries

    Designed to be embedded in autonomous Fetch.ai agents without
    requiring the full FastAPI backend infrastructure.
    """

    def __init__(self):
        """Initialize Web3 connection and contract"""
        # Get configuration from environment
        rpc_url = os.getenv("SEPOLIA_RPC_URL", "http://127.0.0.1:8545/")
        contract_address = os.getenv("DOCTOR_REGISTRY_ADDRESS")

        if not contract_address:
            logger.warning("DOCTOR_REGISTRY_ADDRESS not configured - blockchain queries disabled")
            self.enabled = False
            return

        # Initialize Web3
        self.web3 = Web3(Web3.HTTPProvider(rpc_url))
        self.enabled = self.web3.is_connected()

        if not self.enabled:
            logger.warning(f"Web3 not connected to {rpc_url}")
            return

        logger.info(f"✓ Web3 connected to {rpc_url}")

        # Load contract ABI (minimal ABI for read-only operations)
        self.contract_abi = self._get_minimal_abi()

        try:
            self.contract = self.web3.eth.contract(
                address=self.web3.to_checksum_address(contract_address),
                abi=self.contract_abi
            )
            self.contract_address = contract_address
            logger.info(f"✓ DoctorRegistry contract loaded: {contract_address}")
        except Exception as e:
            logger.error(f"Failed to load contract: {e}")
            self.enabled = False

    def _get_minimal_abi(self) -> list:
        """
        Minimal ABI for DoctorRegistry read-only operations

        Only includes functions needed for doctor queries:
        - numDoctors()
        - getDoctor(uint32)
        """
        return [
            {
                "inputs": [],
                "name": "numDoctors",
                "outputs": [{"type": "uint32"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"name": "_docID", "type": "uint32"}],
                "name": "getDoctor",
                "outputs": [
                    {
                        "components": [
                            {"name": "Name", "type": "string"},
                            {"name": "specialization", "type": "string"},
                            {"name": "profileDescription", "type": "string"},
                            {"name": "email", "type": "string"},
                            {"name": "doctorAddress", "type": "address"},
                            {"name": "consultationFeePerHour", "type": "uint256"},
                            {"name": "depositFeeStored", "type": "uint256"},
                            {"name": "legalDocumentsIPFSHash", "type": "bytes32"}
                        ],
                        "type": "tuple"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            }
        ]

    def get_num_doctors(self) -> int:
        """Get total number of registered doctors"""
        if not self.enabled:
            return 0

        try:
            return self.contract.functions.numDoctors().call()
        except Exception as e:
            logger.error(f"Failed to get numDoctors: {e}")
            return 0

    def get_doctor(self, doctor_id: int) -> Optional[Dict]:
        """
        Get doctor by ID

        Args:
            doctor_id: Doctor ID (starts from 1)

        Returns:
            Dictionary with doctor info or None
        """
        if not self.enabled:
            return None

        try:
            doctor_data = self.contract.functions.getDoctor(doctor_id).call()

            return {
                "doctor_id": doctor_id,
                "name": doctor_data[0],
                "specialization": doctor_data[1],
                "profile_description": doctor_data[2],
                "email": doctor_data[3],
                "address": doctor_data[4],
                "consultation_fee_per_hour": doctor_data[5],
                "deposit_fee_stored": doctor_data[6],
                "ipfs_hash": doctor_data[7].hex() if doctor_data[7] else None
            }
        except Exception as e:
            logger.error(f"Failed to get doctor {doctor_id}: {e}")
            return None

    def find_doctors_by_specialty(self, specialty: str, max_results: int = 5) -> List[Dict]:
        """
        Find doctors matching a specialty

        Args:
            specialty: Specialty to search for (e.g., "Cardiology", "Neurology")
            max_results: Maximum number of results to return

        Returns:
            List of matching doctors
        """
        if not self.enabled:
            return []

        specialty_lower = specialty.lower()
        matching_doctors = []

        try:
            num_doctors = self.get_num_doctors()
            logger.info(f"Searching {num_doctors} doctors for specialty: {specialty}")

            for doctor_id in range(1, num_doctors + 1):
                if len(matching_doctors) >= max_results:
                    break

                doctor = self.get_doctor(doctor_id)
                if doctor and self._specialty_matches(doctor["specialization"], specialty_lower):
                    matching_doctors.append(doctor)

            logger.info(f"Found {len(matching_doctors)} doctors matching {specialty}")
            return matching_doctors

        except Exception as e:
            logger.error(f"Error searching doctors: {e}")
            return []

    def _specialty_matches(self, doctor_spec: str, requested_spec: str) -> bool:
        """
        Fuzzy match specializations

        Handles variations like:
        - "Cardiology" matches "Cardiologist"
        - "Neurology" matches "Neurologist"
        - Case insensitive
        """
        doctor_spec_lower = doctor_spec.lower()

        # Exact match
        if doctor_spec_lower == requested_spec:
            return True

        # Substring match (e.g., "cardio" in "cardiologist")
        if requested_spec in doctor_spec_lower or doctor_spec_lower in requested_spec:
            return True

        # Common variations
        variations = {
            "cardiology": ["cardiologist", "cardiac", "heart"],
            "neurology": ["neurologist", "neuro", "brain"],
            "dermatology": ["dermatologist", "derm", "skin"]
        }

        if requested_spec in variations:
            return any(v in doctor_spec_lower for v in variations[requested_spec])

        return False


# Singleton instance
_web3_doctor_client_instance = None

def get_web3_doctor_client() -> Web3DoctorClient:
    """Get singleton instance of Web3DoctorClient"""
    global _web3_doctor_client_instance
    if _web3_doctor_client_instance is None:
        _web3_doctor_client_instance = Web3DoctorClient()
    return _web3_doctor_client_instance
