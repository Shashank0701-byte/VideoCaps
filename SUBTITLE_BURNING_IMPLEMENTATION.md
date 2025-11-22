# Subtitle Burning Feature - Implementation Summary

## Overview
Added functionality to burn subtitles directly onto video files using FFmpeg, allowing users to create videos with permanently embedded subtitles.

## Files Created

### Backend
1. **`backend/app/services/video_processor.py`**
   - Core video processing service
   - Handles FFmpeg integration
   - Manages temporary SRT file creation and cleanup
   - Processes videos with subtitle overlay

2. **`backend/app/services/VIDEO_PROCESSING.md`**
   - Comprehensive documentation
   - Installation instructions
   - API usage examples
   - Troubleshooting guide

3. **`backend/processed/.gitkeep`**
   - Directory for storing processed videos
   - Ensures directory is tracked in git

### Documentation
4. **`TESTING_BURN_SUBTITLES.md`**
   - Quick setup guide
   - Testing instructions
   - Expected behavior
   - Troubleshooting tips

## Files Modified

### Backend
1. **`backend/main.py`**
   - Added `/burn-subtitles` POST endpoint
   - Integrates with video_processor service
   - Returns processed video as FileResponse

2. **`backend/requirements.txt`**
   - Added FFmpeg installation notes
   - Documented system requirement

### Frontend
3. **`frontend/src/app/upload/page.tsx`**
   - Added `isBurning` state for loading indicator
   - Added `burnSubtitles()` async function
   - Updated download dropdown with 4th option: "🔥 Burn Subtitles (Video)"
   - Shows spinner during processing
   - Handles video download after processing

## Features Implemented

### Backend Features
✅ FFmpeg integration for subtitle burning
✅ Temporary SRT file generation
✅ Automatic cleanup of temp files
✅ Error handling and logging
✅ Security: filename sanitization
✅ Output directory management

### Frontend Features
✅ New "Burn Subtitles" button in dropdown
✅ Loading state with spinner animation
✅ Automatic video download after processing
✅ Error handling and user feedback
✅ Disabled state during processing

## API Endpoint

**POST** `/burn-subtitles`

**Request**:
```json
{
  "segments": [
    {
      "text": "Subtitle text",
      "start": 0.0,
      "end": 2.5,
      "speaker": "SPEAKER_00"
    }
  ],
  "filename": "original_video.mp4"
}
```

**Response**: Video file (MP4) with burned subtitles

## User Flow

1. User uploads video → transcription completes
2. User clicks "Download" dropdown
3. User selects "🔥 Burn Subtitles (Video)"
4. Frontend sends request to backend
5. Backend:
   - Generates SRT from segments
   - Runs FFmpeg to burn subtitles
   - Returns processed video
6. Frontend downloads video automatically
7. User receives `subtitled_[filename].mp4`

## Technical Details

### FFmpeg Command
```bash
ffmpeg -y -i input.mp4 -vf "subtitles='temp.srt'" -c:a copy output.mp4
```

### Directory Structure
```
backend/
├── uploads/          # Original videos
├── processed/        # Videos with burned subtitles
└── app/services/
    └── video_processor.py
```

### Processing Flow
1. Validate video file exists
2. Generate temporary SRT file
3. Execute FFmpeg subprocess
4. Save output to `processed/` directory
5. Clean up temporary SRT file
6. Return processed video path

## Requirements

### System Requirements
- **FFmpeg**: Must be installed and in PATH
- **Disk Space**: ~2x video file size (original + processed)
- **CPU**: FFmpeg is CPU-intensive

### Installation
```bash
# Windows
choco install ffmpeg

# macOS
brew install ffmpeg

# Linux
sudo apt install ffmpeg
```

## Error Handling

- ❌ Video file not found → 500 error with message
- ❌ FFmpeg not installed → Runtime error
- ❌ FFmpeg processing failed → Logs stderr output
- ❌ Temp file cleanup failed → Warning logged
- ✅ All errors displayed to user in frontend

## Performance Considerations

- **Short videos (< 1 min)**: ~10-30 seconds
- **Medium videos (1-5 min)**: ~30-120 seconds
- **Long videos (> 5 min)**: 2+ minutes

Processing time depends on:
- Video resolution
- Video codec
- CPU performance
- System load

## Security

- ✅ Filename sanitization with `os.path.basename()`
- ✅ Files only read from designated upload directory
- ✅ Output only written to designated processed directory
- ✅ Temporary files created in system temp directory
- ✅ Automatic cleanup of temporary files

## Future Enhancements

Potential improvements:
- [ ] Custom subtitle styling (font, size, color, position)
- [ ] Multiple output formats (not just MP4)
- [ ] Progress tracking for long videos
- [ ] Batch processing multiple videos
- [ ] GPU acceleration (NVIDIA NVENC)
- [ ] Subtitle positioning options
- [ ] Custom subtitle background/opacity
- [ ] Preview before processing

## Testing

See `TESTING_BURN_SUBTITLES.md` for:
- Setup instructions
- Testing steps
- Expected behavior
- Troubleshooting guide

## Dependencies

**No new Python packages required!**
- Uses only standard library (`subprocess`, `tempfile`, `pathlib`, `os`)
- Requires FFmpeg as external system dependency

## Backward Compatibility

✅ No breaking changes
✅ Existing download options (TXT, SRT, VTT) unchanged
✅ New feature is additive only
✅ Works alongside existing functionality

## Summary

This feature adds professional video subtitle burning capability to the application, allowing users to create videos with permanently embedded subtitles. The implementation is robust, secure, and provides excellent user experience with loading states and error handling.
