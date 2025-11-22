# Testing Subtitle Burning Feature

## Quick Setup

### 1. Install FFmpeg

**Windows**:
```bash
# Download from https://ffmpeg.org/download.html
# Or use chocolatey:
choco install ffmpeg
```

**Verify installation**:
```bash
ffmpeg -version
```

### 2. Start Backend
```bash
cd backend
uvicorn main:app --reload
```

### 3. Start Frontend
```bash
cd frontend
npm run dev
```

## Testing Steps

1. **Upload a Video**
   - Go to http://localhost:3000/upload
   - Select a video file (MP4, AVI, MOV, etc.)
   - Click "Upload & Transcribe"

2. **Download Options**
   - After processing, click the "Download" dropdown
   - You'll see 4 options:
     - 📄 Text (.txt) - Plain text transcript
     - 📝 SRT Subtitles - SRT subtitle file
     - 🎬 VTT Subtitles - WebVTT subtitle file
     - 🔥 Burn Subtitles (Video) - **NEW!** Video with burned subtitles

3. **Burn Subtitles**
   - Click "🔥 Burn Subtitles (Video)"
   - Wait for processing (shows spinner)
   - Video with embedded subtitles will download automatically

## Expected Behavior

- **Processing Time**: Varies based on video length
  - Short video (< 1 min): ~10-30 seconds
  - Medium video (1-5 min): ~30-120 seconds
  - Long video (> 5 min): 2+ minutes

- **Output File**: `subtitled_[original_filename].mp4`
- **Subtitle Style**: Default FFmpeg styling (white text, black background)

## Troubleshooting

### "FFmpeg not found" error
- Ensure FFmpeg is installed and in PATH
- Restart terminal/IDE after installation
- Test: `ffmpeg -version`

### "Video file not found" error
- Check that the video exists in `backend/uploads/`
- Verify filename matches exactly

### Processing takes too long
- Normal for large videos
- Check backend logs for progress
- FFmpeg is CPU-intensive

### Subtitles don't appear
- Check that segments were generated during transcription
- Verify SRT file was created (check backend logs)
- Try with a different video format

## API Testing with cURL

```bash
# Assuming you have a video uploaded and transcribed
curl -X POST http://localhost:8000/burn-subtitles \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "your_video.mp4",
    "segments": [
      {"text": "Hello", "start": 0.0, "end": 1.0},
      {"text": "World", "start": 1.0, "end": 2.0}
    ]
  }' \
  --output subtitled_video.mp4
```

## File Locations

- **Uploaded videos**: `backend/uploads/`
- **Processed videos**: `backend/processed/`
- **Temporary SRT files**: System temp directory (auto-deleted)

## Notes

- The burn operation is **permanent** - subtitles cannot be removed
- Original video is preserved in `uploads/`
- For removable subtitles, use SRT/VTT files instead
- Audio is copied without re-encoding for faster processing
