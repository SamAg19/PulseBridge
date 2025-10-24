"""
API Middleware - CORS, logging, error handling
"""

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import time
import logging

logger = logging.getLogger(__name__)


def setup_cors(app):
    """
    Setup CORS middleware for frontend integration
    """
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    logger.info("CORS middleware configured")


async def log_requests(request: Request, call_next):
    """
    Log all API requests with timing
    """
    start_time = time.time()

    # Log request
    logger.info(f"→ {request.method} {request.url.path}")

    response = await call_next(request)

    # Log response with timing
    process_time = (time.time() - start_time) * 1000
    logger.info(f"← {request.method} {request.url.path} - {response.status_code} - {process_time:.0f}ms")

    return response


async def error_handler(request: Request, exc: Exception):
    """
    Global error handler
    """
    logger.error(f"Error processing request: {str(exc)}")

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "detail": str(exc),
            "path": request.url.path
        }
    )
