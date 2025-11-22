'use client';

import { useState, useRef, useEffect } from 'react';

interface TranscriptSegment {
    text: string;
    start: number;
    end: number;
    speaker?: string;
}

interface EditableTranscriptProps {
    segments: TranscriptSegment[];
    onSegmentEdit?: (index: number, newText: string) => void;
    onFullTextChange?: (newText: string) => void;
    showTimestamps?: boolean;
    showSpeakers?: boolean;
    editable?: boolean;
}

export default function EditableTranscript({
    segments,
    onSegmentEdit,
    onFullTextChange,
    showTimestamps = true,
    showSpeakers = true,
    editable = true,
}: EditableTranscriptProps) {
    const [editableSegments, setEditableSegments] = useState<TranscriptSegment[]>(segments);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editText, setEditText] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setEditableSegments(segments);
    }, [segments]);

    useEffect(() => {
        if (editingIndex !== null && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingIndex]);

    const formatTimestamp = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = (seconds % 60).toFixed(1);
        return `${mins}:${secs.padStart(4, '0')}`;
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

    const handleSegmentClick = (index: number, text: string) => {
        if (!editable) return;
        setEditingIndex(index);
        setEditText(text);
    };

    const handleSave = (index: number) => {
        const updatedSegments = [...editableSegments];
        updatedSegments[index] = {
            ...updatedSegments[index],
            text: editText,
        };
        setEditableSegments(updatedSegments);
        setEditingIndex(null);

        // Callback for individual segment edit
        if (onSegmentEdit) {
            onSegmentEdit(index, editText);
        }

        // Callback for full text change
        if (onFullTextChange) {
            const fullText = updatedSegments.map(s => s.text).join(' ');
            onFullTextChange(fullText);
        }
    };

    const handleCancel = () => {
        setEditingIndex(null);
        setEditText('');
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave(index);
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    const exportTranscript = () => {
        const text = editableSegments
            .map(seg => {
                let line = '';
                if (showTimestamps) line += `[${formatTimestamp(seg.start)}] `;
                if (showSpeakers && seg.speaker) line += `${formatSpeakerLabel(seg.speaker)}: `;
                line += seg.text;
                return line;
            })
            .join('\n');

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'edited-transcript.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    const copyToClipboard = () => {
        const text = editableSegments.map(s => s.text).join(' ');
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2">
                    <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                    </svg>
                    <span className="text-sm text-gray-300">
                        {editable ? 'Click any segment to edit' : 'Read-only mode'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={copyToClipboard}
                        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors flex items-center gap-1.5"
                        title="Copy to clipboard"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                        </svg>
                        Copy
                    </button>
                    <button
                        onClick={exportTranscript}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors flex items-center gap-1.5"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                        </svg>
                        Export
                    </button>
                </div>
            </div>

            {/* Editable Segments */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {editableSegments.map((segment, index) => (
                    <div
                        key={index}
                        className={`rounded-lg p-4 transition-all ${editingIndex === index
                                ? 'bg-blue-900/30 border-2 border-blue-500'
                                : editable
                                    ? 'bg-gray-800/50 hover:bg-gray-800 cursor-pointer border-2 border-transparent'
                                    : 'bg-gray-800/30 border-2 border-transparent'
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            {/* Timestamp */}
                            {showTimestamps && (
                                <span className="text-blue-400 font-mono text-sm mt-1 min-w-[60px] flex-shrink-0">
                                    {formatTimestamp(segment.start)}
                                </span>
                            )}

                            {/* Speaker */}
                            {showSpeakers && segment.speaker && (
                                <span
                                    className={`font-semibold text-sm mt-1 min-w-[90px] flex-shrink-0 ${getSpeakerColor(
                                        segment.speaker
                                    )}`}
                                >
                                    {formatSpeakerLabel(segment.speaker)}
                                </span>
                            )}

                            {/* Text Content */}
                            <div className="flex-1">
                                {editingIndex === index ? (
                                    <div className="space-y-2">
                                        <textarea
                                            ref={inputRef}
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, index)}
                                            className="w-full bg-gray-900 text-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                            rows={3}
                                        />
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleSave(index)}
                                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors flex items-center gap-1"
                                            >
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M5 13l4 4L19 7"
                                                    />
                                                </svg>
                                                Save
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <span className="text-xs text-gray-500 ml-auto">
                                                Press Enter to save, Esc to cancel
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <p
                                        onClick={() => handleSegmentClick(index, segment.text)}
                                        className={`text-gray-200 leading-relaxed ${editable ? 'hover:text-white' : ''
                                            }`}
                                    >
                                        {segment.text}
                                        {editable && (
                                            <svg
                                                className="inline-block ml-2 h-4 w-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                                />
                                            </svg>
                                        )}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Stats Footer */}
            <div className="bg-gray-800 rounded-lg p-3 flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center gap-4">
                    <span>{editableSegments.length} segments</span>
                    <span>•</span>
                    <span>{editableSegments.reduce((sum, seg) => sum + seg.text.split(' ').length, 0)} words</span>
                </div>
                {editingIndex !== null && (
                    <span className="text-blue-400 animate-pulse">Editing segment {editingIndex + 1}</span>
                )}
            </div>
        </div>
    );
}
