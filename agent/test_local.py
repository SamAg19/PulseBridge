import asyncio
from uagents import Agent, Context, Protocol
from fetch_agents.messages import ChatMessage, ChatResponse

# Create test user agent
test_user = Agent(
    name="test-user",
    seed="test_user_seed_local",
    port=9000,
    endpoint=["http://localhost:9000/submit"],
)

COORDINATOR_ADDRESS = "agent1qtp0vky7yjfv4wpnt9gamzy7llmw03pfc2kj54falmjtv46advqv2336tuc"  # Your CoordinatorAgent address

@test_user.on_event("startup")
async def send_test_message(ctx: Context):
    await asyncio.sleep(2)  # Wait for startup

    # Test symptom
    await ctx.send(
        COORDINATOR_ADDRESS,
        ChatMessage(
            message="I have severe chest pain when I exercise and shortness of breath",
            session_id="test-local-1"
        )
    )

@test_user.on_message(model=ChatResponse)
async def handle_response(ctx: Context, sender: str, msg: ChatResponse):
    ctx.logger.info("=" * 60)
    ctx.logger.info("RECEIVED RESPONSE:")
    ctx.logger.info(msg.response)
    ctx.logger.info("=" * 60)

if __name__ == "__main__":
    test_user.run()