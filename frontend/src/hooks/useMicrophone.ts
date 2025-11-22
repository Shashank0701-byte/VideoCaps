import { useEffect, useRef, useState, useCallback } from 'react';

interface UseMicrophoneOptions {
    onAudioData?: (audioBlob: Blob) => void;
    interval?: number; // milliseconds
    mimeType?: string;
}

interface UseMicrophoneReturn {
    isRecording: boolean;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    error: string | null;
}

export function useMicrophone({
    onAudioData,
    interval = 250,
    mimeType = 'audio/webm;codecs=opus'
}: UseMicrophoneOptions = {}): UseMicrophoneReturn {
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalIdRef = useRef<number | null>(null);

    const startRecording = useCallback(async () => {
        try {
            setError(null);

            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000,
                },
            });

            streamRef.current = stream;

            // Check if mimeType is supported
            const supportedMimeType = MediaRecorder.isTypeSupported(mimeType)
                ? mimeType
                : 'audio/webm';

            // Create MediaRecorder
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: supportedMimeType,
            });

            mediaRecorderRef.current = mediaRecorder;

            // Handle audio data available
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 && onAudioData) {
                    onAudioData(event.data);
                }
            };

            // Handle errors
            mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event);
                setError('Recording error occurred');
                stopRecording();
            };

            // Start recording
            mediaRecorder.start();

            // Request data at specified interval
            intervalIdRef.current = window.setInterval(() => {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.requestData();
                }
            }, interval);

            setIsRecording(true);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to access microphone';
            setError(errorMessage);
            console.error('Error accessing microphone:', err);
        }
    }, [onAudioData, interval, mimeType]);

    const stopRecording = useCallback(() => {
        // Clear interval
        if (intervalIdRef.current) {
            clearInterval(intervalIdRef.current);
            intervalIdRef.current = null;
        }

        // Stop media recorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
        }

        // Stop all tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        setIsRecording(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopRecording();
        };
    }, [stopRecording]);

    return {
        isRecording,
        startRecording,
        stopRecording,
        error,
    };
}
