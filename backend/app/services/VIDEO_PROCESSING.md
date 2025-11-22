# Video Processing Service

This service handles burning subtitles directly into video files using FFmpeg.

## Features

- **Subtitle Burning**: Permanently embed subtitles into video files
- **Automatic SRT Generation**: Converts transcript segments to SRT format
- **FFmpeg Integration**: Uses FFmpeg for high-quality video processing
- **Temporary File Management**: Handles cleanup of temporary subtitle files

## Prerequisites

### FFmpeg Installation

FFmpeg must be installed and available in your system PATH.

#### Windows
1. Download FFmpeg from [ffmpeg.org](https://ffmpeg.org/download.html)
2. Extract to `C:\ffmpeg`
3. Add `C:\ffmpeg\bin` to your system PATH
4. Verify installation: `ffmpeg -version`

#### macOS
```bash
brew install ffmpeg
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg
```

## Usage

### Backend API

**Endpoint**: `POST /burn-subtitles`

**Request Body**:
```json
{
  "segments": [
    {
      "text": "Hello world",
      "start": 0.0,
      "end": 2.5,
      "speaker": "SPEAKER_00"
    }
  ],
  "filename": "video.mp4"
}
```

**Response**: Returns the processed video file with burned subtitles

### Frontend Integration

```typescript
const burnSubtitles = async () => {
    const response = await fetch(`${API_URL}/burn-subtitles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            segments: transcriptionSegments,
            filename: originalFilename,
        }),
    });
    
    const blob = await response.blob();
    // Download the processed video
};
```

## How It Works

1. **Input Validation**: Checks if the video file exists in the uploads directory
2. **SRT Generation**: Creates a temporary SRT subtitle file from transcript segments
3. **FFmpeg Processing**: Runs FFmpeg with subtitle overlay filter
4. **Output**: Saves processed video to the `processed` directory
5. **Cleanup**: Removes temporary SRT file

## FFmpeg Command

The service uses the following FFmpeg command structure:

```bash
ffmpeg -y -i input.mp4 -vf "subtitles='subtitles.srt'" -c:a copy output.mp4
```

**Flags**:
- `-y`: Overwrite output file if it exists
- `-i`: Input video file
- `-vf`: Video filter (subtitles overlay)
- `-c:a copy`: Copy audio stream without re-encoding

## Directory Structure

```
backend/
├── uploads/          # Original uploaded videos
├── processed/        # Videos with burned subtitles
└── app/
    └── services/
        └── video_processor.py
```

## Error Handling

The service handles:
- Missing video files
- FFmpeg execution errors
- Temporary file cleanup failures
- Invalid segment data

## Performance Considerations

- **Processing Time**: Depends on video length and resolution
- **Disk Space**: Requires space for both original and processed videos
- **CPU Usage**: FFmpeg is CPU-intensive for video encoding

## Limitations

- Only supports video files (not audio-only)
- Output format is always MP4
- Subtitle styling is basic (can be customized in FFmpeg command)
- Requires FFmpeg to be installed on the system

## Future Enhancements

- [ ] Custom subtitle styling (font, size, color)
- [ ] Multiple output format support
- [ ] Progress tracking for long videos
- [ ] Batch processing
- [ ] GPU acceleration support
- [ ] Subtitle positioning options
