"""
DoctorRegistry Contract Integration
Queries registered doctors from blockchain
"""

import os
from web3 import Web3
from typing import List, Dict, Optional
import logging
from blockchain.contract_loader import get_contract_loader

logger = logging.getLogger(__name__)


class DoctorRegistry:
    """
    Interface to DoctorRegistry smart contract

    Contract struct RegStruct:
        string Name;
        string specialization;
        string profileDescription;
        string email;
        address doctorAddress;
        uint256 consultationFeePerHour;
        uint256 depositFeeStored;
        bytes32 legalDocumentsIPFSHash;
    """

    def __init__(self):
        # Setup Web3
        provider_url = os.getenv("SEPOLIA_RPC_URL", "http://127.0.0.1:8545/")
        self.web3 = Web3(Web3.HTTPProvider(provider_url))

        if not self.web3.is_connected():
            logger.warning(f"⚠ Web3 not connected to {provider_url}")
        else:
            logger.info(f"✓ Web3 connected to {provider_url}")

        # Load contract
        loader = get_contract_loader()
        address, abi = loader.load_doctor_registry()

        self.contract = self.web3.eth.contract(
            address=self.web3.to_checksum_address(address),
            abi=abi
        )

        self.contract_address = address
        logger.info(f"DoctorRegistry contract initialized: {address}")

    def get_num_doctors(self) -> int:
        """
        Get total number of registered doctors

        Returns:
            Number of doctors
        """
        try:
            num_doctors = self.contract.functions.numDoctors().call()
            logger.info(f"Total doctors in registry: {num_doctors}")
            return num_doctors
        except Exception as e:
            logger.error(f"Failed to get numDoctors: {e}")
            return 0

    def get_doctor(self, doctor_id: int) -> Optional[Dict]:
        """
        Get doctor by ID

        Args:
            doctor_id: Doctor ID (starts from 1)

        Returns:
            Doctor dictionary or None if not found
        """
        try:
            doctor_data = self.contract.functions.getDoctor(doctor_id).call()

            # Parse RegStruct tuple
            doctor = {
                "doctor_id": doctor_id,
                "name": doctor_data[0],                    # Name
                "specialization": doctor_data[1],          # specialization
                "profile_description": doctor_data[2],     # profileDescription
                "email": doctor_data[3],                   # email
                "address": doctor_data[4],                 # doctorAddress
                "consultation_fee_per_hour": doctor_data[5],  # consultationFeePerHour
                "deposit_fee_stored": doctor_data[6],      # depositFeeStored
                "legal_documents_ipfs_hash": self._format_ipfs_hash(doctor_data[7])  # legalDocumentsIPFSHash
            }

            return doctor

        except Exception as e:
            logger.error(f"Failed to get doctor {doctor_id}: {e}")
            return None

    def get_all_doctors(self) -> List[Dict]:
        """
        Get all registered doctors

        Process:
        1. Call numDoctors() to get count
        2. Loop from 1 to numDoctors
        3. Call getDoctor(id) for each

        Returns:
            List of doctor dictionaries
        """
        num_doctors = self.get_num_doctors()

        if num_doctors == 0:
            logger.warning("No doctors registered in DoctorRegistry")
            return []

        doctors = []

        for doctor_id in range(1, num_doctors + 1):
            doctor = self.get_doctor(doctor_id)
            if doctor:
                doctors.append(doctor)

        logger.info(f"Successfully fetched {len(doctors)} doctors")
        return doctors

    def _format_ipfs_hash(self, hash_value) -> str:
        """
        Format IPFS hash (bytes32 to hex string)

        Args:
            hash_value: bytes32 value from contract

        Returns:
            Hex string
        """
        if isinstance(hash_value, bytes):
            return "0x" + hash_value.hex()
        return str(hash_value)


# Singleton instance
_registry_instance = None


def get_doctor_registry() -> DoctorRegistry:
    """Get singleton DoctorRegistry instance"""
    global _registry_instance
    if _registry_instance is None:
        _registry_instance = DoctorRegistry()
    return _registry_instance
