from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import router as api_router
from app.websocket.connection_manager import manager
from app.websocket.transcription_handler import handle_transcription
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="VideoCaps API",
    description="Real-time AI Caption Generator API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "VideoCaps API",
        "version": "1.0.0"
    }


@app.websocket("/ws/transcribe")
async def websocket_transcribe(websocket: WebSocket):
    """
    WebSocket endpoint for real-time audio transcription
    
    Accepts audio chunks and returns transcribed text in real-time
    """
    client_id = await manager.connect(websocket)
    logger.info(f"Client {client_id} connected to transcription WebSocket")
    
    try:
        await handle_transcription(websocket, client_id)
    except WebSocketDisconnect:
        logger.info(f"Client {client_id} disconnected")
    except Exception as e:
        logger.error(f"Error in WebSocket connection {client_id}: {str(e)}")
    finally:
        manager.disconnect(client_id)
        logger.info(f"Client {client_id} connection closed")


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting VideoCaps API...")
    logger.info(f"CORS origins: {settings.CORS_ORIGINS}")
    logger.info(f"Model: {settings.MODEL_NAME}")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down VideoCaps API...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
