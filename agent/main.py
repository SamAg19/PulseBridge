"""
PulseBridge Agent System - Main Entry Point

AI-Powered Multi-Specialist Consultation Network
"""

import os
import logging
from fastapi import FastAPI
from dotenv import load_dotenv
from api.routes import router
from api.middleware import setup_cors, log_requests

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="PulseBridge Agent System",
    description="AI-Powered Multi-Specialist Consultation Network using ASI:One and MeTTa reasoning",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Setup middleware
setup_cors(app)
app.middleware("http")(log_requests)

# Include routers
app.include_router(router)


@app.on_event("startup")
async def startup_event():
    """
    Startup event - initialize all systems
    """
    logger.info("=" * 60)
    logger.info("PulseBridge Agent System Starting...")
    logger.info("=" * 60)

    # Log configuration
    logger.info(f"Environment: {os.getenv('NETWORK', 'localhost')}")
    logger.info(f"API Port: {os.getenv('AGENT_PORT', 8000)}")

    # Initialize components (will be added in later phases)
    logger.info("FastAPI server initialized")
    logger.info("API routes registered")
    logger.info("CORS middleware configured")

    # TODO: Initialize MeTTa engine
    # TODO: Initialize agents
    # TODO: Connect to blockchain
    # TODO: Setup ASI:One client

    logger.info("=" * 60)
    logger.info("System Ready - Waiting for requests")
    logger.info("=" * 60)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "PulseBridge Agent System",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
        "health": "/api/health"
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("AGENT_PORT", 8000))

    logger.info(f"\nStarting server on port {port}...")
    logger.info(f"API docs available at: http://localhost:{port}/docs\n")

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
