'use client';

import { useState } from 'react';
import EditableTranscript from '@/components/EditableTranscript';
import TimelineEditor from '@/components/TimelineEditor';

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
            speaker?: string;
        }>;
    };
    translation?: {
        text: string;
        target_language: string;
        segments?: Array<{
            text: string;
            translated_text: string;
            start: number;
            end: number;
        }>;
    };
    analysis?: {
        summary: {
            summary: string;
            type: string;
            word_count?: number;
            compression_ratio?: number;
        };
        keywords: Array<{
            keyword: string;
            score: number;
            rank: number;
        }>;
        key_points: string[];
        statistics: {
            word_count: number;
            sentence_count: number;
        };
        segment_insights?: {
            total_duration: number;
            num_speakers: number;
            speakers: string[];
            avg_segment_duration: number;
        };
    };
    error?: string;
    message?: string;
}

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<TranscriptionResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [targetLanguage, setTargetLanguage] = useState<string>('none');
    const [isBurning, setIsBurning] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    // Popular languages for translation
    const popularLanguages = [
        { code: 'none', name: 'No Translation' },
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'it', name: 'Italian' },
        { code: 'pt', name: 'Portuguese' },
        { code: 'ru', name: 'Russian' },
        { code: 'ja', name: 'Japanese' },
        { code: 'ko', name: 'Korean' },
        { code: 'zh-cn', name: 'Chinese (Simplified)' },
        { code: 'zh-tw', name: 'Chinese (Traditional)' },
        { code: 'ar', name: 'Arabic' },
        { code: 'hi', name: 'Hindi' },
        { code: 'bn', name: 'Bengali' },
        { code: 'ur', name: 'Urdu' },
        { code: 'tr', name: 'Turkish' },
        { code: 'nl', name: 'Dutch' },
        { code: 'pl', name: 'Polish' },
        { code: 'vi', name: 'Vietnamese' },
        { code: 'th', name: 'Thai' },
    ];

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

            // Build URL with translation parameter if selected
            let url = `${API_URL}/upload`;
            if (targetLanguage && targetLanguage !== 'none') {
                url += `?translate_to=${targetLanguage}`;
            }

            const response = await fetch(url, {
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
    const downloadSubtitle = async (format: 'srt' | 'vtt') => {
        if (!result) return;
        try {
            const response = await fetch(`${API_URL}/download/${format}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    segments: result.transcription.segments,
                    filename: result.filename.replace(/\.[^/.]+$/, ''),
                    include_speaker: true,
                }),
            });
            if (!response.ok) throw new Error(`Failed to generate ${format.toUpperCase()} file`);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${result.filename.replace(/\.[^/.]+$/, '')}.${format}`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : `Failed to download ${format.toUpperCase()}`);
        }
    };

    const burnSubtitles = async () => {
        if (!result) return;

        setIsBurning(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/burn-subtitles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    segments: result.transcription.segments,
                    filename: result.filename,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to burn subtitles into video');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `subtitled_${result.filename}`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to burn subtitles');
        } finally {
            setIsBurning(false);
        }
    };

    const getSpeakerColor = (speaker?: string) => {
        if (!speaker) return 'text-blue-400';
        const colors = [
            'text-blue-400',
            'text-green-400',
            'text-purple-400',
            'text-yellow-400',
            'text-pink-400',
            'text-indigo-400',
        ];
        const speakerNum = parseInt(speaker.split('_')[1] || '0');
        return colors[speakerNum % colors.length];
    };

    const formatSpeakerLabel = (speaker?: string) => {
        if (!speaker) return '';
        const num = parseInt(speaker.split('_')[1] || '0');
        return `Speaker ${num + 1}`;
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
                        Upload audio or video files for AI-powered transcription, translation, and analysis
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
                            <label className="flex-1 cursor-pointer block">
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

                        {/* Language Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Translate To (Optional)
                            </label>
                            <select
                                value={targetLanguage}
                                onChange={(e) => setTargetLanguage(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {popularLanguages.map((lang) => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-gray-500 text-sm mt-2">
                                Select a language to translate the transcript
                            </p>
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
                            <div className="relative group">
                                <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 border border-gray-700">
                                    <button onClick={downloadTranscript} className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 rounded-t-lg flex items-center gap-2">
                                        <span>📄</span> Text (.txt)
                                    </button>
                                    <button onClick={() => downloadSubtitle('srt')} className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 flex items-center gap-2">
                                        <span>📝</span> SRT Subtitles
                                    </button>
                                    <button onClick={() => downloadSubtitle('vtt')} className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 flex items-center gap-2">
                                        <span>🎬</span> VTT Subtitles
                                    </button>
                                    <button
                                        onClick={burnSubtitles}
                                        disabled={isBurning}
                                        className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 rounded-b-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isBurning ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>🔥</span> Burn Subtitles (Video)
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Analysis Results */}
                        {result.analysis && (
                            <div className="mb-6 pb-6 border-b border-gray-800">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <svg
                                        className="h-5 w-5 text-purple-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                        />
                                    </svg>
                                    Analysis & Insights
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Summary */}
                                    {result.analysis.summary && result.analysis.summary.summary && (
                                        <div className="md:col-span-2">
                                            <h4 className="text-md font-semibold text-gray-300 mb-2 flex items-center gap-2">
                                                📝 Summary
                                                {result.analysis.summary.compression_ratio && (
                                                    <span className="text-xs text-gray-500">
                                                        ({result.analysis.summary.compression_ratio}x compression)
                                                    </span>
                                                )}
                                            </h4>
                                            <div className="bg-gray-800 rounded-lg p-4">
                                                <p className="text-gray-200 leading-relaxed">
                                                    {result.analysis.summary.summary}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Keywords */}
                                    {result.analysis.keywords && result.analysis.keywords.length > 0 && (
                                        <div>
                                            <h4 className="text-md font-semibold text-gray-300 mb-2">
                                                🏷️ Keywords
                                            </h4>
                                            <div className="bg-gray-800 rounded-lg p-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {result.analysis.keywords.slice(0, 8).map((kw, index) => (
                                                        <span
                                                            key={index}
                                                            className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-sm border border-blue-500/30"
                                                        >
                                                            {kw.keyword}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Statistics */}
                                    {result.analysis.statistics && (
                                        <div>
                                            <h4 className="text-md font-semibold text-gray-300 mb-2">
                                                📊 Statistics
                                            </h4>
                                            <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Words:</span>
                                                    <span className="text-white font-medium">
                                                        {result.analysis.statistics.word_count}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Sentences:</span>
                                                    <span className="text-white font-medium">
                                                        {result.analysis.statistics.sentence_count}
                                                    </span>
                                                </div>
                                                {result.analysis.segment_insights && (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-400">Speakers:</span>
                                                            <span className="text-white font-medium">
                                                                {result.analysis.segment_insights.num_speakers}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-400">Duration:</span>
                                                            <span className="text-white font-medium">
                                                                {Math.floor(result.analysis.segment_insights.total_duration / 60)}m{' '}
                                                                {Math.floor(result.analysis.segment_insights.total_duration % 60)}s
                                                            </span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Key Points */}
                                    {result.analysis.key_points && result.analysis.key_points.length > 0 && (
                                        <div className="md:col-span-2">
                                            <h4 className="text-md font-semibold text-gray-300 mb-2">
                                                💡 Key Points
                                            </h4>
                                            <div className="bg-gray-800 rounded-lg p-4">
                                                <ul className="space-y-2">
                                                    {result.analysis.key_points.map((point, index) => (
                                                        <li key={index} className="flex items-start gap-2 text-gray-200">
                                                            <span className="text-blue-400 mt-1">•</span>
                                                            <span>{point}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

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

                        {/* Segments with Speaker Labels */}
                        {result.transcription.segments && result.transcription.segments.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-white mb-3">
                                    Segments with Speakers
                                </h3>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {result.transcription.segments.map((segment, index) => (
                                        <div
                                            key={index}
                                            className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800 transition-colors"
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="text-blue-400 font-mono text-sm mt-1 min-w-[60px]">
                                                    {formatTimestamp(segment.start)}
                                                </span>
                                                {segment.speaker && (
                                                    <span className={`font-semibold text-sm mt-1 min-w-[90px] ${getSpeakerColor(segment.speaker)}`}>
                                                        {formatSpeakerLabel(segment.speaker)}
                                                    </span>
                                                )}
                                                <p className="text-gray-200 flex-1">{segment.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Editable Transcript */}
                        {result.transcription.segments && result.transcription.segments.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-white mb-3">
                                    Editable Transcript
                                </h3>
                                <EditableTranscript
                                    segments={result.transcription.segments}
                                    onSegmentEdit={(index, newText) => {
                                        const updatedSegments = [...result.transcription.segments];
                                        updatedSegments[index] = {
                                            ...updatedSegments[index],
                                            text: newText,
                                        };
                                        setResult({
                                            ...result,
                                            transcription: {
                                                ...result.transcription,
                                                segments: updatedSegments,
                                            },
                                        });
                                    }}
                                    onFullTextChange={(newText) => {
                                        setResult({
                                            ...result,
                                            transcription: {
                                                ...result.transcription,
                                                text: newText,
                                            },
                                        });
                                    }}
                                    showTimestamps={true}
                                    showSpeakers={true}
                                    editable={true}
                                />
                            </div>
                        )}

                        {/* Timeline Editor */}
                        {result.transcription.segments && result.transcription.segments.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-white mb-3">
                                    Timeline Editor
                                </h3>
                                <TimelineEditor
                                    segments={result.transcription.segments}
                                    totalDuration={result.duration}
                                    onSegmentUpdate={(index, newStart, newEnd) => {
                                        const updatedSegments = [...result.transcription.segments];
                                        updatedSegments[index] = {
                                            ...updatedSegments[index],
                                            start: newStart,
                                            end: newEnd,
                                        };
                                        setResult({
                                            ...result,
                                            transcription: {
                                                ...result.transcription,
                                                segments: updatedSegments,
                                            },
                                        });
                                    }}
                                    showWaveform={false}
                                />
                            </div>
                        )}



                        {/* Translation Results */}
                        {result.translation && (
                            <div className="mt-6 pt-6 border-t border-gray-800">
                                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                    <svg
                                        className="h-5 w-5 text-blue-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                                        />
                                    </svg>
                                    Translation ({result.translation.target_language.toUpperCase()})
                                </h3>
                                <div className="bg-gray-800 rounded-lg p-6 max-h-64 overflow-y-auto">
                                    <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                                        {result.translation.text}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
