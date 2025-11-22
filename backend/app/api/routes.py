from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """API health check endpoint"""
    return {
        "status": "healthy",
        "message": "API is running"
    }


@router.get("/status")
async def get_status():
    """Get system status"""
    return {
        "transcription": "ready",
        "model": "loaded"
    }
