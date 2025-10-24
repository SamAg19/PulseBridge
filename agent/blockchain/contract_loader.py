"""
Smart Contract Loader
Loads contract addresses and ABIs from deployment files
"""

import json
import os
from pathlib import Path
from typing import Tuple
import logging

logger = logging.getLogger(__name__)


class ContractLoader:
    """
    Loads contract artifacts and deployment info
    """

    def __init__(self, network: str = None, use_mocks: bool = None):
        self.network = network or os.getenv("NETWORK", "localhost")
        self.use_mocks = use_mocks if use_mocks is not None else (
            os.getenv("USE_MOCKS", "true").lower() == "true"
        )

        # Find contracts directory (up one level from agent/)
        self.contracts_dir = Path(__file__).parent.parent.parent / "contracts"

        logger.info(f"ContractLoader initialized:")
        logger.info(f"  Network: {self.network}")
        logger.info(f"  Use Mocks: {self.use_mocks}")
        logger.info(f"  Contracts Dir: {self.contracts_dir}")

    def load_doctor_registry(self) -> Tuple[str, list]:
        """
        Load DoctorRegistry contract address and ABI

        Returns:
            Tuple[address, abi]
        """
        try:
            # Load deployment address
            address = self._load_deployment_address("doctorRegistry")

            # Load ABI
            abi = self._load_abi("DoctorRegistry")

            logger.info(f"DoctorRegistry loaded: {address}")
            return address, abi

        except Exception as e:
            logger.error(f"Failed to load DoctorRegistry: {e}")
            raise

    def _load_deployment_address(self, contract_name: str) -> str:
        """
        Load contract address from deployment file

        Args:
            contract_name: Name of contract in deployment file (e.g., "doctorRegistry")

        Returns:
            Contract address
        """
        if self.use_mocks:
            deployment_file = f"{self.network}-mocks.json"
        else:
            deployment_file = f"{self.network}.json"

        deployment_path = self.contracts_dir / "deployments" / deployment_file

        if not deployment_path.exists():
            raise FileNotFoundError(
                f"Deployment file not found: {deployment_path}\n"
                f"Please deploy contracts first: npm run deploy:{self.network}"
            )

        with open(deployment_path, "r") as f:
            deployment_data = json.load(f)

        if "contracts" not in deployment_data or contract_name not in deployment_data["contracts"]:
            raise ValueError(
                f"Contract '{contract_name}' not found in deployment file.\n"
                f"Available contracts: {list(deployment_data.get('contracts', {}).keys())}"
            )

        return deployment_data["contracts"][contract_name]

    def _load_abi(self, contract_name: str) -> list:
        """
        Load contract ABI from artifacts

        Args:
            contract_name: Contract name (e.g., "DoctorRegistry")

        Returns:
            Contract ABI
        """
        artifact_path = (
            self.contracts_dir / "artifacts" / "contracts" / contract_name /
            f"{contract_name}.sol" / f"{contract_name}.json"
        )

        if not artifact_path.exists():
            raise FileNotFoundError(
                f"Contract artifact not found: {artifact_path}\n"
                f"Please compile contracts: npx hardhat compile"
            )

        with open(artifact_path, "r") as f:
            artifact_data = json.load(f)

        if "abi" not in artifact_data:
            raise ValueError(f"ABI not found in artifact file: {artifact_path}")

        return artifact_data["abi"]


# Singleton instance
_loader_instance = None


def get_contract_loader() -> ContractLoader:
    """Get singleton ContractLoader instance"""
    global _loader_instance
    if _loader_instance is None:
        _loader_instance = ContractLoader()
    return _loader_instance
