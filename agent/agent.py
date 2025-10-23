import os
import json
import asyncio
from pathlib import Path
from dotenv import load_dotenv
from uagents import Agent, Context
from web3 import Web3

# Load environment variables
load_dotenv()

# Helper functions to load contract data
def load_contract_address(network: str = "localhost", use_mocks: bool = True) -> str:
    if use_mocks:
        deployment_file = f"{network}-mocks.json"
    else:
        deployment_file = f"{network}.json"

    contracts_dir = Path(__file__).parent.parent / "contracts"
    deployment_path = contracts_dir / "deployments" / deployment_file

    if not deployment_path.exists():
        raise FileNotFoundError(
            f"Deployment file not found: {deployment_path}\n"
            f"Please deploy the contracts first using: npm run deploy:{network}"
        )

    with open(deployment_path, "r") as f:
        deployment_data = json.load(f)

    return deployment_data["contracts"]["consultationEscrow"]

def load_contract_abi() -> list:
    contracts_dir = Path(__file__).parent.parent / "contracts"
    artifact_path = (
        contracts_dir / "artifacts" / "contracts" / "ConsultationEscrow" /
        "ConsultationEscrow.sol" / "ConsultationEscrow.json"
    )

    if not artifact_path.exists():
        raise FileNotFoundError(
            f"Contract artifact not found: {artifact_path}\n"
            f"Please compile the contracts first using: npx hardhat compile"
        )

    with open(artifact_path, "r") as f:
        artifact_data = json.load(f)

    return artifact_data["abi"]

agent = Agent(
    name="EthereumAgent",
    port=8000,
    seed=os.getenv("AGENT_SECRET_KEY"),
    endpoint=["http://localhost:8000/submit"]
)

NETWORK = os.getenv("NETWORK", "localhost") 
USE_MOCKS = os.getenv("USE_MOCKS", "true").lower() == "true"

provider_url = os.getenv("SEPOLIA_RPC_URL", "http://127.0.0.1:8545/")
web3 = Web3(Web3.HTTPProvider(provider_url))

private_key = os.getenv("PRIVATE_KEY")
if not private_key:
    raise ValueError("PRIVATE_KEY not found in environment variables")

# Derive Ethereum address from private key
account = web3.eth.account.from_key(private_key)
eth_address = account.address

try:
    CONTRACT_ADDRESS = load_contract_address(network=NETWORK, use_mocks=USE_MOCKS)
    CONTRACT_ABI = load_contract_abi()

    print(f"Loaded ConsultationEscrow contract:")
    print(f"  Network: {NETWORK}")
    print(f"  Use Mocks: {USE_MOCKS}")
    print(f"  Address: {CONTRACT_ADDRESS}")

except FileNotFoundError as e:
    print(f"Error loading contract: {e}")
    print("Using placeholder values...")
    CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"
    CONTRACT_ABI = []

# Initialize contract
if CONTRACT_ABI and CONTRACT_ADDRESS != "0x0000000000000000000000000000000000000000":
    contract = web3.eth.contract(
        address=web3.to_checksum_address(CONTRACT_ADDRESS),
        abi=CONTRACT_ABI
    )
else:
    contract = None
    print("Warning: Contract not initialized. Please deploy contracts first.")

event_listener_task = None

async def listen_for_session_created_events(ctx: Context):
    """Listen for SessionCreated events from the contract"""
    if not contract:
        ctx.logger.error("Contract not initialized. Cannot listen for events.")
        return

    ctx.logger.info("Starting SessionCreated event listener...")

    event_filter = contract.events.SessionCreated.create_filter(from_block='latest')

    try:
        while True:
            for event in event_filter.get_new_entries():
                session_id = event['args']['sessionId']
                doctor_id = event['args']['doctorId']
                patient = event['args']['patient']
                fee_usd = event['args']['feeUSD']
                pyusd_amount = event['args']['pyusdAmount']

                ctx.logger.info("=" * 60)
                ctx.logger.info("🚨 NEW SESSION CREATED EVENT DETECTED!")
                ctx.logger.info("=" * 60)
                ctx.logger.info(f"Session ID: {session_id}")
                ctx.logger.info(f"Doctor ID: {doctor_id}")
                ctx.logger.info(f"Patient: {patient}")
                ctx.logger.info(f"Fee (USD): {fee_usd}")
                ctx.logger.info(f"PYUSD Amount: {pyusd_amount}")
                ctx.logger.info(f"Block Number: {event['blockNumber']}")
                ctx.logger.info(f"Transaction Hash: {event['transactionHash'].hex()}")
                ctx.logger.info("=" * 60)

            ctx.logger.info("[Event Listener] Waiting for new events...")
            await asyncio.sleep(5)

    except Exception as e:
        ctx.logger.error(f"Error in event listener: {str(e)}")

# startup handler
@agent.on_event("startup")
async def check_balance(ctx: Context):
    """Check ETH balance and contract info on agent startup"""
    global event_listener_task

    try:
        # Get balance in Wei
        balance_wei = web3.eth.get_balance(eth_address)
        # Convert to ETH
        balance_eth = web3.from_wei(balance_wei, 'ether')

        ctx.logger.info("=" * 50)
        ctx.logger.info("Agent Startup Information")
        ctx.logger.info("=" * 50)
        ctx.logger.info(f"Ethereum Address: {eth_address}")
        ctx.logger.info(f"Current Balance: {balance_eth} ETH")
        ctx.logger.info(f"Network: {NETWORK}")
        ctx.logger.info(f"Using Mocks: {USE_MOCKS}")

        if contract:
            ctx.logger.info(f"ConsultationEscrow Contract: {CONTRACT_ADDRESS}")
            ctx.logger.info(f"Contract loaded successfully")

            # Start the event listener in the background
            event_listener_task = asyncio.create_task(listen_for_session_created_events(ctx))
            ctx.logger.info("SessionCreated event listener started")
        else:
            ctx.logger.warning("Contract not loaded. Please deploy contracts.")

        ctx.logger.info("=" * 50)
    except Exception as e:
        ctx.logger.error(f"Failed to get balance: {str(e)}")

@agent.on_interval(period=5)
async def periodic_session_check(ctx: Context):
    """Periodically check session count in the contract"""
    try:
        numSessions = contract.functions.numSessions().call()

        ctx.logger.info(f"[Periodic Check] Consultation Escrow: {CONTRACT_ADDRESS}")
        ctx.logger.info(f"[Periodic Check] Current Sessions: {numSessions}")
    except Exception as e:
        ctx.logger.error(f"[Periodic Check] Failed to get sessions: {str(e)}")

if __name__ == "__main__":
    agent.run()
