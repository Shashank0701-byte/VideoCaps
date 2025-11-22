from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="VideoCaps API",
    description="Real-time AI Caption Generator API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "VideoCaps API",
        "version": "1.0.0"
    }


@app.websocket("/ws/transcribe")
async def websocket_transcribe(websocket: WebSocket):
    """
    WebSocket endpoint for real-time audio transcription.
    Receives audio blobs and returns captions in real-time.
    """
    await websocket.accept()
    logger.info("Client connected to /ws/transcribe")
    
    try:
        # Import transcription modules
        from app.models.whisper_model import transcribe_chunk
        from transcription.audio_pipeline import create_pipeline
        
        # Initialize audio pipeline
        pipeline = create_pipeline(sample_rate=16000, chunk_duration=5.0)
        
        # Send connection confirmation
        await websocket.send_json({
            "type": "connection",
            "status": "connected",
            "message": "Ready to receive audio"
        })
        
        while True:
            # Receive audio data from client
            data = await websocket.receive()
            
            if "bytes" in data:
                # Process binary audio data
                audio_bytes = data["bytes"]
                logger.info(f"Received audio chunk: {len(audio_bytes)} bytes")
                
                try:
                    # Process audio through pipeline
                    normalized_audio, wav_bytes = pipeline.process_stream_chunk(audio_bytes)
                    
                    # Transcribe audio chunk
                    result = transcribe_chunk(audio_bytes, language="en")
                    
                    # Send transcription result back to client
                    response = {
                        "type": "transcription",
                        "text": result.get("text", ""),
                        "language": result.get("language", "en"),
                        "timestamp": None,
                        "confidence": 1.0
                    }
                    
                    await websocket.send_json(response)
                    logger.info(f"Sent transcription: {result.get('text', '')[:50]}...")
                    
                except Exception as e:
                    logger.error(f"Error processing audio: {e}")
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Transcription error: {str(e)}"
                    })
            
            elif "text" in data:
                # Handle text messages (control commands)
                message = data["text"]
                logger.info(f"Received text message: {message}")
                
                try:
                    command = json.loads(message)
                    
                    if command.get("type") == "ping":
                        await websocket.send_json({
                            "type": "pong",
                            "message": "Server is alive"
                        })
                    
                except json.JSONDecodeError:
                    logger.warning(f"Invalid JSON message: {message}")
                    
    except WebSocketDisconnect:
        logger.info("Client disconnected from /ws/transcribe")
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
        try:
            await websocket.send_json({
                "type": "error",
                "message": f"Server error: {str(e)}"
            })
        except:
            pass
    finally:
        logger.info("WebSocket connection closed")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Basic WebSocket endpoint for testing"""
    await websocket.accept()
    logger.info("WebSocket client connected")
    
    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f"Received: {data}")
            await websocket.send_text(f"Echo: {data}")
            
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
