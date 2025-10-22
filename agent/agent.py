import os
from dotenv import load_dotenv
from uagents import Agent, Context
from web3 import Web3

# Load environment variables
load_dotenv()

# Your agent configuration
agent = Agent(
    name="EthereumAgent",
    port=8000,
    seed=os.getenv("AGENT_SECRET_KEY"),
    endpoint=["http://localhost:8000/submit"]
)

# Set up Ethereum connection (Sepolia)
# Using a public Sepolia RPC endpoint
provider_url = os.getenv("SEPOLIA_RPC_URL", "https://eth-sepolia.public.blastapi.io")
web3 = Web3(Web3.HTTPProvider(provider_url))

# Get private key from environment and derive address
private_key = os.getenv("PRIVATE_KEY")
if not private_key:
    raise ValueError("PRIVATE_KEY not found in environment variables")

# Derive Ethereum address from private key
account = web3.eth.account.from_key(private_key)
eth_address = account.address

# startup handler
@agent.on_event("startup")
async def check_balance(ctx: Context):
    """Check ETH balance on agent startup"""
    try:
        # Get balance in Wei
        balance_wei = web3.eth.get_balance(eth_address)
        # Convert to ETH
        balance_eth = web3.from_wei(balance_wei, 'ether')
        
        ctx.logger.info(f"Ethereum Address: {eth_address}")
        ctx.logger.info(f"Current Balance: {balance_eth} ETH")
    except Exception as e:
        ctx.logger.error(f"Failed to get balance: {str(e)}")

@agent.on_interval(period=5)  # Check every 5 minutes
async def periodic_balance_check(ctx: Context):
    """Periodically check ETH balance"""
    try:
        balance_wei = web3.eth.get_balance(eth_address)
        balance_eth = web3.from_wei(balance_wei, 'ether')
        
        ctx.logger.info(f"[Periodic Check] Ethereum Address: {eth_address}")
        ctx.logger.info(f"[Periodic Check] Current Balance: {balance_eth} ETH")
    except Exception as e:
        ctx.logger.error(f"[Periodic Check] Failed to get balance: {str(e)}")

if __name__ == "__main__":
    agent.run()
