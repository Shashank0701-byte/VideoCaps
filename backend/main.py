from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
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


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload audio/video file for transcription.
    Accepts audio and video files, extracts audio, and returns full transcription.
    """
    import tempfile
    import os
    from pathlib import Path
    from app.models.whisper_model import transcribe_file
    from app.utils.ffmpeg_utils import extract_audio_from_video, convert_audio_format, get_audio_duration
    
    # Validate file type
    allowed_extensions = {'.mp3', '.wav', '.m4a', '.flac', '.ogg', '.mp4', '.avi', '.mov', '.mkv', '.webm'}
    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext not in allowed_extensions:
        return {
            "error": "Invalid file type",
            "message": f"Supported formats: {', '.join(allowed_extensions)}"
        }
    
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Save uploaded file
        input_path = os.path.join(temp_dir, f"input{file_ext}")
        with open(input_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        logger.info(f"Uploaded file: {file.filename} ({len(content)} bytes)")
        
        # Get duration
        duration = get_audio_duration(input_path)
        
        # Check if it's a video file
        video_extensions = {'.mp4', '.avi', '.mov', '.mkv', '.webm'}
        audio_path = input_path
        
        if file_ext in video_extensions:
            # Extract audio from video
            audio_path = os.path.join(temp_dir, "audio.wav")
            logger.info("Extracting audio from video...")
            
            if not extract_audio_from_video(input_path, audio_path):
                return {
                    "error": "Failed to extract audio from video",
                    "message": "Please ensure the video contains an audio track"
                }
        else:
            # Convert audio to proper format
            converted_path = os.path.join(temp_dir, "audio.wav")
            logger.info("Converting audio format...")
            
            if convert_audio_format(input_path, converted_path):
                audio_path = converted_path
        
        # Transcribe audio
        logger.info("Starting transcription...")
        result = transcribe_file(audio_path, language="en")
        
        if "error" in result:
            return {
                "error": "Transcription failed",
                "message": result["error"]
            }
        
        # Return results
        return {
            "success": True,
            "filename": file.filename,
            "duration": duration,
            "transcription": {
                "text": result["text"],
                "language": result["language"],
                "segments": result.get("segments", [])
            }
        }
        
    except Exception as e:
        logger.error(f"Error processing upload: {e}", exc_info=True)
        return {
            "error": "Processing failed",
            "message": str(e)
        }
    
    finally:
        # Cleanup temp files
        try:
            import shutil
            shutil.rmtree(temp_dir)
            logger.info("Cleaned up temporary files")
        except Exception as e:
            logger.error(f"Error cleaning up: {e}")


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
