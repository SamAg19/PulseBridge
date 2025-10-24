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

    # Initialize components
    logger.info("FastAPI server initialized")
    logger.info("API routes registered")
    logger.info("CORS middleware configured")

    # Initialize blockchain connection
    try:
        from services.doctor_matcher import get_doctor_matcher
        matcher = get_doctor_matcher()
        logger.info("Blockchain connection initialized")
        logger.info("DoctorRegistry contract loaded")
        logger.info("DoctorMatcher service ready")
    except Exception as e:
        logger.error(f"Blockchain initialization failed: {e}")
        logger.warning("System will continue but doctor queries may fail")

    # Initialize MeTTa engine and agents (Phase 3)
    try:
        from agents.cardiology_agent import get_cardiology_agent
        cardiology = get_cardiology_agent()
        logger.info("MeTTa reasoning engine initialized")
        logger.info("Cardiology agent loaded (30+ medical rules)")
        logger.info("Real MeTTa reasoning ready")
    except Exception as e:
        logger.error(f"MeTTa initialization failed: {e}")
        logger.warning("System will continue with reduced functionality")

    # TODO: Initialize Triage agent (Phase 4)
    # TODO: Setup ASI:One client (Phase 6)

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
