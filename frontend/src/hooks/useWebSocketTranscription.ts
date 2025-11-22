import { useEffect, useRef, useState, useCallback } from 'react';

interface Caption {
    text: string;
    timestamp: number;
    language?: string;
}

interface UseWebSocketTranscriptionOptions {
    url: string;
    onCaption?: (caption: Caption) => void;
    onError?: (error: string) => void;
}

interface UseWebSocketTranscriptionReturn {
    isConnected: boolean;
    captions: Caption[];
    sendAudioChunk: (audioBlob: Blob) => void;
    connect: () => void;
    disconnect: () => void;
    error: string | null;
    clearCaptions: () => void;
}

export function useWebSocketTranscription({
    url,
    onCaption,
    onError,
}: UseWebSocketTranscriptionOptions): UseWebSocketTranscriptionReturn {
    const [isConnected, setIsConnected] = useState(false);
    const [captions, setCaptions] = useState<Caption[]>([]);
    const [error, setError] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number | null>(null);

    const connect = useCallback(() => {
        try {
            setError(null);

            // Create WebSocket connection
            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('WebSocket connected');
                setIsConnected(true);
                setError(null);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'transcription') {
                        const caption: Caption = {
                            text: data.text,
                            timestamp: Date.now(),
                            language: data.language,
                        };

                        // Add caption to list
                        setCaptions((prev) => [...prev, caption]);

                        // Call callback if provided
                        if (onCaption) {
                            onCaption(caption);
                        }
                    } else if (data.type === 'error') {
                        const errorMsg = data.message || 'Unknown error';
                        setError(errorMsg);
                        if (onError) {
                            onError(errorMsg);
                        }
                    } else if (data.type === 'connection') {
                        console.log('Connection status:', data.message);
                    }
                } catch (err) {
                    console.error('Error parsing WebSocket message:', err);
                }
            };

            ws.onerror = (event) => {
                console.error('WebSocket error:', event);
                setError('WebSocket connection error');
                if (onError) {
                    onError('WebSocket connection error');
                }
            };

            ws.onclose = () => {
                console.log('WebSocket disconnected');
                setIsConnected(false);
                wsRef.current = null;

                // Auto-reconnect after 3 seconds
                reconnectTimeoutRef.current = window.setTimeout(() => {
                    console.log('Attempting to reconnect...');
                    connect();
                }, 3000);
            };
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to connect';
            setError(errorMsg);
            if (onError) {
                onError(errorMsg);
            }
        }
    }, [url, onCaption, onError]);

    const disconnect = useCallback(() => {
        // Clear reconnect timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        // Close WebSocket
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setIsConnected(false);
    }, []);

    const sendAudioChunk = useCallback((audioBlob: Blob) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            // Send audio blob as binary data
            wsRef.current.send(audioBlob);
        } else {
            console.warn('WebSocket is not connected. Cannot send audio chunk.');
        }
    }, []);

    const clearCaptions = useCallback(() => {
        setCaptions([]);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        isConnected,
        captions,
        sendAudioChunk,
        connect,
        disconnect,
        error,
        clearCaptions,
    };
}
