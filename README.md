# VideoCaps - AI Real-Time Caption Generator

A real-time caption generation system using Next.js frontend and FastAPI backend with WebSocket communication.

## Project Structure

```
VideoCaps/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # Next.js 14+ app directory
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility functions
│   │   └── styles/          # CSS modules and global styles
│   ├── public/              # Static assets
│   └── package.json
│
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core configuration
│   │   ├── models/         # AI models and data models
│   │   ├── services/       # Business logic
│   │   ├── websocket/      # WebSocket handlers
│   │   └── utils/          # Utility functions
│   ├── transcription/      # Transcription pipeline
│   ├── requirements.txt
│   └── main.py
│
├── models/                  # Shared AI model files
│   ├── whisper/            # Whisper model files
│   └── custom/             # Custom trained models
│
├── utils/                   # Shared utilities
│   └── audio/              # Audio processing utilities
│
└── docker-compose.yml      # Docker orchestration
```

## Features

- 🎤 Real-time audio capture and processing
- 🤖 AI-powered speech-to-text transcription
- ⚡ WebSocket-based low-latency communication
- 🎨 Modern, responsive UI
- 🔄 Live caption updates
- 📊 Transcription history and export

## Tech Stack

### Frontend
- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type safety
- **WebSocket Client** - Real-time communication
- **Tailwind CSS** - Styling

### Backend
- **FastAPI** - High-performance Python web framework
- **WebSocket** - Real-time bidirectional communication
- **Whisper AI** - Speech recognition model
- **PyTorch** - Deep learning framework

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- FFmpeg (for audio processing)

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Docker Setup
```bash
docker-compose up --build
```

## API Endpoints

- `GET /` - Health check
- `GET /api/v1/health` - API health status
- `WS /ws/transcribe` - WebSocket endpoint for real-time transcription
- `POST /api/v1/upload` - Upload audio file for transcription
- `GET /api/v1/history` - Get transcription history

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/transcribe
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Backend (.env)
```
MODEL_NAME=whisper-base
MODEL_PATH=../models/whisper
MAX_AUDIO_LENGTH=300
CORS_ORIGINS=http://localhost:3000
```

## License

MIT
