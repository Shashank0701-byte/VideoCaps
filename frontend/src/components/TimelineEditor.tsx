'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface TimelineSegment {
    text: string;
    start: number;
    end: number;
    speaker?: string;
}

interface TimelineEditorProps {
    segments: TimelineSegment[];
    onSegmentUpdate?: (index: number, newStart: number, newEnd: number) => void;
    onSegmentsReorder?: (segments: TimelineSegment[]) => void;
    totalDuration: number;
    showWaveform?: boolean;
}

type DragMode = 'move' | 'resize-start' | 'resize-end' | null;

export default function TimelineEditor({
    segments,
    onSegmentUpdate,
    onSegmentsReorder,
    totalDuration,
    showWaveform = false,
}: TimelineEditorProps) {
    const [timelineSegments, setTimelineSegments] = useState<TimelineSegment[]>(segments);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragMode, setDragMode] = useState<DragMode>(null);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragStartTime, setDragStartTime] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [zoom, setZoom] = useState(1);
    const timelineRef = useRef<HTMLDivElement>(null);
    const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setTimelineSegments(segments);
    }, [segments]);

    // Playback simulation
    useEffect(() => {
        if (isPlaying) {
            playIntervalRef.current = setInterval(() => {
                setCurrentTime((prev) => {
                    if (prev >= totalDuration) {
                        setIsPlaying(false);
                        return 0;
                    }
                    return prev + 0.1;
                });
            }, 100);
        } else {
            if (playIntervalRef.current) {
                clearInterval(playIntervalRef.current);
            }
        }
        return () => {
            if (playIntervalRef.current) {
                clearInterval(playIntervalRef.current);
            }
        };
    }, [isPlaying, totalDuration]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 10);
        return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
    };

    const timeToPixels = (time: number) => {
        if (!timelineRef.current) return 0;
        const width = timelineRef.current.offsetWidth;
        return (time / totalDuration) * width * zoom;
    };

    const pixelsToTime = (pixels: number) => {
        if (!timelineRef.current) return 0;
        const width = timelineRef.current.offsetWidth;
        return (pixels / (width * zoom)) * totalDuration;
    };

    const getSpeakerColor = (speaker?: string) => {
        if (!speaker) return 'bg-blue-500';
        const colors = [
            'bg-blue-500',
            'bg-green-500',
            'bg-purple-500',
            'bg-yellow-500',
            'bg-pink-500',
            'bg-indigo-500',
        ];
        const speakerNum = parseInt(speaker.split('_')[1] || '0');
        return colors[speakerNum % colors.length];
    };

    const handleMouseDown = (
        e: React.MouseEvent,
        index: number,
        mode: DragMode
    ) => {
        e.preventDefault();
        setDraggedIndex(index);
        setDragMode(mode);
        setDragStartX(e.clientX);
        setDragStartTime(mode === 'resize-end' ? timelineSegments[index].end : timelineSegments[index].start);
    };

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (draggedIndex === null || dragMode === null || !timelineRef.current) return;

            const deltaX = e.clientX - dragStartX;
            const deltaTime = pixelsToTime(deltaX);
            const segment = timelineSegments[draggedIndex];

            let newStart = segment.start;
            let newEnd = segment.end;

            if (dragMode === 'move') {
                newStart = Math.max(0, dragStartTime + deltaTime);
                newEnd = newStart + (segment.end - segment.start);
                if (newEnd > totalDuration) {
                    newEnd = totalDuration;
                    newStart = newEnd - (segment.end - segment.start);
                }
            } else if (dragMode === 'resize-start') {
                newStart = Math.max(0, Math.min(dragStartTime + deltaTime, segment.end - 0.1));
            } else if (dragMode === 'resize-end') {
                newEnd = Math.min(totalDuration, Math.max(dragStartTime + deltaTime, segment.start + 0.1));
            }

            const updatedSegments = [...timelineSegments];
            updatedSegments[draggedIndex] = { ...segment, start: newStart, end: newEnd };
            setTimelineSegments(updatedSegments);
        },
        [draggedIndex, dragMode, dragStartX, dragStartTime, timelineSegments, totalDuration, pixelsToTime]
    );

    const handleMouseUp = useCallback(() => {
        if (draggedIndex !== null && onSegmentUpdate) {
            const segment = timelineSegments[draggedIndex];
            onSegmentUpdate(draggedIndex, segment.start, segment.end);
        }
        setDraggedIndex(null);
        setDragMode(null);
    }, [draggedIndex, timelineSegments, onSegmentUpdate]);

    useEffect(() => {
        if (draggedIndex !== null) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [draggedIndex, handleMouseMove, handleMouseUp]);

    const handleTimelineClick = (e: React.MouseEvent) => {
        if (!timelineRef.current || draggedIndex !== null) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickTime = pixelsToTime(clickX);
        setCurrentTime(clickTime);
    };

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center justify-between bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-4">
                    {/* Play/Pause */}
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                        {isPlaying ? (
                            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                            </svg>
                        ) : (
                            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        )}
                    </button>

                    {/* Time Display */}
                    <div className="text-white font-mono text-sm">
                        <span className="text-blue-400">{formatTime(currentTime)}</span>
                        <span className="text-gray-500"> / </span>
                        <span className="text-gray-400">{formatTime(totalDuration)}</span>
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm"
                            disabled={zoom <= 0.5}
                        >
                            −
                        </button>
                        <span className="text-white text-sm min-w-[60px] text-center">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button
                            onClick={() => setZoom(Math.min(4, zoom + 0.25))}
                            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm"
                            disabled={zoom >= 4}
                        >
                            +
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">{timelineSegments.length} segments</span>
                </div>
            </div>

            {/* Timeline */}
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <div className="min-w-full" style={{ width: `${zoom * 100}%` }}>
                    {/* Time Ruler */}
                    <div className="relative h-8 mb-2 border-b border-gray-700">
                        {Array.from({ length: Math.ceil(totalDuration / 10) + 1 }).map((_, i) => {
                            const time = i * 10;
                            if (time > totalDuration) return null;
                            return (
                                <div
                                    key={i}
                                    className="absolute top-0 h-full border-l border-gray-600"
                                    style={{ left: `${(time / totalDuration) * 100}%` }}
                                >
                                    <span className="text-xs text-gray-500 ml-1">{formatTime(time)}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Timeline Track */}
                    <div
                        ref={timelineRef}
                        className="relative h-32 bg-gray-800 rounded cursor-pointer"
                        onClick={handleTimelineClick}
                    >
                        {/* Playhead */}
                        <div
                            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                            style={{ left: `${(currentTime / totalDuration) * 100}%` }}
                        >
                            <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full" />
                        </div>

                        {/* Segments */}
                        {timelineSegments.map((segment, index) => {
                            const left = (segment.start / totalDuration) * 100;
                            const width = ((segment.end - segment.start) / totalDuration) * 100;
                            const isDragging = draggedIndex === index;

                            return (
                                <div
                                    key={index}
                                    className={`absolute top-2 bottom-2 rounded ${getSpeakerColor(
                                        segment.speaker
                                    )} ${isDragging ? 'opacity-75 ring-2 ring-white' : 'opacity-90'
                                        } hover:opacity-100 transition-opacity cursor-move group`}
                                    style={{
                                        left: `${left}%`,
                                        width: `${width}%`,
                                    }}
                                    onMouseDown={(e) => handleMouseDown(e, index, 'move')}
                                >
                                    {/* Resize Handle - Start */}
                                    <div
                                        className="absolute left-0 top-0 bottom-0 w-2 bg-white/30 hover:bg-white/50 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                            handleMouseDown(e, index, 'resize-start');
                                        }}
                                    />

                                    {/* Content */}
                                    <div className="px-2 py-1 h-full flex items-center justify-between overflow-hidden">
                                        <span className="text-white text-xs font-medium truncate flex-1">
                                            {segment.text.substring(0, 30)}
                                            {segment.text.length > 30 ? '...' : ''}
                                        </span>
                                        <span className="text-white/70 text-xs ml-2 whitespace-nowrap">
                                            {formatTime(segment.end - segment.start)}
                                        </span>
                                    </div>

                                    {/* Resize Handle - End */}
                                    <div
                                        className="absolute right-0 top-0 bottom-0 w-2 bg-white/30 hover:bg-white/50 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                            handleMouseDown(e, index, 'resize-end');
                                        }}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {/* Segment Details */}
                    <div className="mt-4 space-y-1 max-h-48 overflow-y-auto">
                        {timelineSegments.map((segment, index) => (
                            <div
                                key={index}
                                className={`flex items-center gap-3 p-2 rounded ${draggedIndex === index ? 'bg-gray-700' : 'bg-gray-800/50'
                                    } hover:bg-gray-700 transition-colors text-sm`}
                            >
                                <div className={`w-3 h-3 rounded-full ${getSpeakerColor(segment.speaker)}`} />
                                <span className="text-gray-400 font-mono min-w-[100px]">
                                    {formatTime(segment.start)} → {formatTime(segment.end)}
                                </span>
                                <span className="text-gray-200 flex-1 truncate">{segment.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-gray-800/50 rounded-lg p-3 text-sm text-gray-400">
                <p className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <strong>Tips:</strong> Drag segments to move them • Drag edges to resize • Click timeline to seek • Use zoom controls to adjust view
                </p>
            </div>
        </div>
    );
}
