'use client';

import { useEffect } from 'react';
import Link from 'next/link';
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
        <div className="min-h-screen relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
                {/* Header */}
                <div className="text-center mb-16 animate-float">
                    <h1 className="text-6xl md:text-7xl font-bold mb-6">
                        <span className="gradient-text">VideoCaps AI</span>
                    </h1>
                    <p className="text-2xl text-gray-300 mb-4 font-light">
                        Real-Time Caption Generator
                    </p>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        Generate live captions using advanced AI speech recognition with speaker diarization
                    </p>

                    {/* Quick Links */}
                    <div className="flex gap-4 justify-center mt-8">
                        <Link href="/upload" className="glass glass-hover px-6 py-3 rounded-xl font-medium text-white flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Upload & Transcribe
                        </Link>
                    </div>
                </div>

                {/* Connection Status Card */}
                <div className="glass rounded-2xl p-6 mb-8 max-w-4xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-green-500 animate-glow' : 'bg-red-500'}`}></div>
                            <span className="text-lg font-medium text-white">
                                {isConnected ? 'WebSocket Connected' : 'Disconnected'}
                            </span>
                        </div>

                        {/* Controls */}
                        <div className="flex gap-4 items-center">
                            {!isRecording ? (
                                <button
                                    onClick={handleStartCapture}
                                    disabled={!isConnected}
                                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-blue-500/50 disabled:shadow-none"
                                >
                                    <span className="flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                                        </svg>
                                        Start Recording
                                    </span>
                                </button>
                            ) : (
                                <button
                                    onClick={handleStopCapture}
                                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-red-500/50"
                                >
                                    <span className="flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                                        </svg>
                                        Stop Recording
                                    </span>
                                </button>
                            )}

                            {isRecording && (
                                <div className="flex items-center gap-2 text-red-400 font-medium">
                                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                    <span>Recording...</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Errors */}
                    {(wsError || micError) && (
                        <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                            <p className="text-red-300 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {wsError || micError}
                            </p>
                        </div>
                    )}
                </div>

                {/* Captions Display */}
                <div className="glass rounded-2xl p-8 max-w-4xl mx-auto card-hover">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-white">Live Captions</h2>
                    </div>

                    {captions.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
                                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </div>
                            <p className="text-gray-400 text-lg">
                                No captions yet. Start recording to see live transcriptions.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {captions.map((caption, index) => (
                                <div
                                    key={index}
                                    className="glass-hover rounded-xl p-5 border border-gray-700/50"
                                >
                                    <p className="text-white text-lg leading-relaxed">{caption.text}</p>
                                    <div className="flex items-center gap-3 mt-3 text-sm text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {new Date(caption.timestamp).toLocaleTimeString()}
                                        </span>
                                        {caption.language && (
                                            <span className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                                </svg>
                                                {caption.language}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
