'use client';

import { useState } from 'react';

interface TranscriptionResult {
    success: boolean;
    filename: string;
    duration: number;
    transcription: {
        text: string;
        language: string;
        segments: Array<{
            text: string;
            start: number;
            end: number;
        }>;
    };
    error?: string;
    message?: string;
}

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<TranscriptionResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }

        setIsUploading(true);
        setError(null);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.error) {
                setError(data.message || data.error);
            } else {
                setResult(data);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatTimestamp = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = (seconds % 60).toFixed(1);
        return `${mins}:${secs.padStart(4, '0')}`;
    };

    const downloadTranscript = () => {
        if (!result) return;

        const content = `Transcript: ${result.filename}\nDuration: ${formatDuration(result.duration)}\nLanguage: ${result.transcription.language}\n\n${result.transcription.text}`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcript-${result.filename}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-gray-950 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-white mb-4">
                        Upload & Transcribe
                    </h1>
                    <p className="text-xl text-gray-400">
                        Upload audio or video files to generate transcripts
                    </p>
                </div>

                {/* Upload Section */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-8">
                    <div className="space-y-6">
                        {/* File Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Select File
                            </label>
                            <div className="flex items-center gap-4">
                                <label className="flex-1 cursor-pointer">
                                    <div className="border-2 border-dashed border-gray-700 hover:border-gray-600 rounded-lg p-8 text-center transition-colors">
                                        <svg
                                            className="mx-auto h-12 w-12 text-gray-500 mb-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                            />
                                        </svg>
                                        {file ? (
                                            <div>
                                                <p className="text-white font-medium">{file.name}</p>
                                                <p className="text-gray-500 text-sm mt-1">
                                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-gray-400">
                                                    Click to select or drag and drop
                                                </p>
                                                <p className="text-gray-600 text-sm mt-1">
                                                    MP3, WAV, MP4, AVI, MOV, MKV, WebM
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        accept="audio/*,video/*"
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Upload Button */}
                        <button
                            onClick={handleUpload}
                            disabled={!file || isUploading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {isUploading ? (
                                <>
                                    <svg
                                        className="animate-spin h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <svg
                                        className="h-5 w-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                        />
                                    </svg>
                                    Upload & Transcribe
                                </>
                            )}
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mt-4 bg-red-900/50 border border-red-500 rounded-lg p-4">
                            <p className="text-red-300">{error}</p>
                        </div>
                    )}
                </div>

                {/* Results Section */}
                {result && (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
                        {/* File Info */}
                        <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-800">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    Transcription Complete
                                </h2>
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                    <span>📄 {result.filename}</span>
                                    <span>⏱️ {formatDuration(result.duration)}</span>
                                    <span>🌐 {result.transcription.language.toUpperCase()}</span>
                                </div>
                            </div>
                            <button
                                onClick={downloadTranscript}
                                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                    />
                                </svg>
                                Download
                            </button>
                        </div>

                        {/* Full Transcript */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-white mb-3">
                                Full Transcript
                            </h3>
                            <div className="bg-gray-800 rounded-lg p-6 max-h-64 overflow-y-auto">
                                <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                                    {result.transcription.text}
                                </p>
                            </div>
                        </div>

                        {/* Segments */}
                        {result.transcription.segments && result.transcription.segments.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3">
                                    Segments
                                </h3>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {result.transcription.segments.map((segment, index) => (
                                        <div
                                            key={index}
                                            className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800 transition-colors"
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="text-blue-400 font-mono text-sm mt-1">
                                                    {formatTimestamp(segment.start)}
                                                </span>
                                                <p className="text-gray-200 flex-1">{segment.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
