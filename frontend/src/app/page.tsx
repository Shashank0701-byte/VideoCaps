'use client';

import { useEffect } from 'react';
import { useMicrophone } from '@/hooks/useMicrophone';
import { useWebSocketTranscription } from '@/hooks/useWebSocketTranscription';

export default function Home() {
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/transcribe';

    // WebSocket transcription hook
    const {
        isConnected,
        captions,
        sendAudioChunk,
        connect,
        disconnect,
        error: wsError,
        clearCaptions,
    } = useWebSocketTranscription({
        url: WS_URL,
        onCaption: (caption) => {
            console.log('New caption:', caption.text);
        },
    });

    // Microphone hook
    const {
        isRecording,
        startRecording,
        stopRecording,
        error: micError,
    } = useMicrophone({
        onAudioData: (audioBlob) => {
            // Send audio chunk to WebSocket
            sendAudioChunk(audioBlob);
        },
        interval: 250, // Send audio every 250ms
    });

    // Connect to WebSocket on mount
    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    const handleStartCapture = async () => {
        clearCaptions();
        await startRecording();
    };

    const handleStopCapture = () => {
        stopRecording();
    };

    return (
        <div className="min-h-screen bg-gray-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-white mb-4">
                        AI Real-Time Caption Generator
                    </h1>
                    <p className="text-xl text-gray-400 mb-8">
                        Generate live captions using advanced AI speech recognition
                    </p>

                    {/* Connection Status */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div
                            className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'
                                }`}
                        />
                        <span className="text-sm text-gray-400">
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-4 justify-center">
                        {!isRecording ? (
                            <button
                                onClick={handleStartCapture}
                                disabled={!isConnected}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                            >
                                Start Recording
                            </button>
                        ) : (
                            <button
                                onClick={handleStopCapture}
                                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                            >
                                Stop Recording
                            </button>
                        )}

                        {isRecording && (
                            <div className="flex items-center gap-2 text-red-500">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                <span className="font-medium">Recording...</span>
                            </div>
                        )}
                    </div>

                    {/* Errors */}
                    {(wsError || micError) && (
                        <div className="mt-4 bg-red-900/50 border border-red-500 rounded-lg p-4 max-w-2xl mx-auto">
                            <p className="text-red-300">
                                {wsError || micError}
                            </p>
                        </div>
                    )}
                </div>

                {/* Captions Display */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-white mb-6">Live Captions</h2>

                    {captions.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                            No captions yet. Start recording to see live transcriptions.
                        </p>
                    ) : (
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {captions.map((caption, index) => (
                                <div
                                    key={index}
                                    className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                                >
                                    <p className="text-white text-lg">{caption.text}</p>
                                    <p className="text-gray-500 text-sm mt-2">
                                        {new Date(caption.timestamp).toLocaleTimeString()}
                                        {caption.language && ` • ${caption.language}`}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
