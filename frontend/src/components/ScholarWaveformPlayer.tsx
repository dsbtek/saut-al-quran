import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Marker } from '../types';
import SimpleAudioPlayer from './SimpleAudioPlayer';

interface ScholarWaveformPlayerProps {
    audioUrl: string;
    markers?: Marker[];
    onMarkerAdd?: (timestamp: number) => void;
    onMarkerClick?: (marker: Marker) => void;
    onTimeUpdate?: (currentTime: number) => void;
    height?: number;
}

const ScholarWaveformPlayer: React.FC<ScholarWaveformPlayerProps> = ({
    audioUrl,
    markers = [],
    onMarkerAdd,
    onMarkerClick,
    onTimeUpdate,
    height = 128,
}) => {
    const waveformRef = useRef<HTMLDivElement>(null);
    const wavesurfer = useRef<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [useFallback, setUseFallback] = useState(false);

    // Initialize WaveSurfer
    useEffect(() => {
        if (!waveformRef.current) return;

        try {
            wavesurfer.current = WaveSurfer.create({
                container: waveformRef.current,
                waveColor: '#d1d5db',
                progressColor: '#3b82f6',
                cursorColor: '#ef4444',
                height,
                normalize: true,
                interact: true,
                cursorWidth: 2,
                barWidth: 2,
                barGap: 1,
                url: audioUrl,
            });

            // Event listeners
            wavesurfer.current.on('ready', () => {
                setIsLoading(false);
                setDuration(wavesurfer.current?.getDuration() || 0);
            });

            wavesurfer.current.on('play', () => setIsPlaying(true));
            wavesurfer.current.on('pause', () => setIsPlaying(false));

            wavesurfer.current.on('timeupdate', (time: number) => {
                setCurrentTime(time);
                onTimeUpdate?.(time);
            });

            wavesurfer.current.on('click', (relativeX: number) => {
                const time =
                    relativeX * (wavesurfer.current?.getDuration() || 0);
                setCurrentTime(time);
                onTimeUpdate?.(time);
            });

            wavesurfer.current.on('error', (error: Error) => {
                setError(error.message);
                setIsLoading(false);
            });
        } catch (err) {
            console.error('WaveSurfer initialization failed:', err);
            setError('Failed to initialize waveform');
            setIsLoading(false);
            setUseFallback(true);
        }

        return () => {
            wavesurfer.current?.destroy();
        };
    }, [audioUrl, height, onTimeUpdate]);

    // Handle zoom changes
    useEffect(() => {
        if (wavesurfer.current) {
            wavesurfer.current.zoom(zoom);
        }
    }, [zoom]);

    // Handle double-click to add markers
    const handleDoubleClick = useCallback(
        (e: React.MouseEvent) => {
            if (!wavesurfer.current || !onMarkerAdd) return;

            const rect = waveformRef.current?.getBoundingClientRect();
            if (!rect) return;

            const x = e.clientX - rect.left;
            const progress = x / rect.width;
            const time = progress * wavesurfer.current.getDuration();

            onMarkerAdd(time);
        },
        [onMarkerAdd],
    );

    // Playback controls
    const togglePlayPause = () => {
        if (wavesurfer.current) {
            wavesurfer.current.playPause();
        }
    };

    const seekTo = (time: number) => {
        if (wavesurfer.current && duration > 0) {
            const progress = time / duration;
            wavesurfer.current.seekTo(progress);
        }
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Zoom controls
    const zoomIn = () => setZoom((prev) => Math.min(prev * 1.5, 10));
    const zoomOut = () => setZoom((prev) => Math.max(prev / 1.5, 1));
    const resetZoom = () => setZoom(1);

    // Use fallback player if wavesurfer.js fails
    if (error || useFallback) {
        return (
            <div>
                {error && (
                    <div
                        style={{
                            padding: '10px',
                            marginBottom: '10px',
                            backgroundColor: '#fef3c7',
                            border: '1px solid #f59e0b',
                            borderRadius: '6px',
                            color: '#92400e',
                            fontSize: '14px',
                        }}
                    >
                        ⚠️ Advanced waveform unavailable. Using simple audio
                        player.
                    </div>
                )}
                <SimpleAudioPlayer
                    audioUrl={audioUrl}
                    markers={markers}
                    onMarkerClick={onMarkerClick}
                    onTimeUpdate={onTimeUpdate}
                />
            </div>
        );
    }

    return (
        <div
            style={{
                width: '100%',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #e5e7eb',
            }}
        >
            {/* Controls */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                    flexWrap: 'wrap',
                    gap: '8px',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                    }}
                >
                    <button
                        onClick={togglePlayPause}
                        disabled={isLoading}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: isPlaying ? '#ef4444' : '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                        }}
                    >
                        {isLoading
                            ? '⏳ Loading...'
                            : isPlaying
                            ? '⏸️ Pause'
                            : '▶️ Play'}
                    </button>

                    <span
                        style={{
                            fontSize: '14px',
                            color: '#6b7280',
                            fontFamily: 'monospace',
                        }}
                    >
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        Zoom:
                    </span>
                    <button
                        onClick={zoomOut}
                        style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                        }}
                    >
                        -
                    </button>
                    <span
                        style={{
                            fontSize: '12px',
                            minWidth: '40px',
                            textAlign: 'center',
                        }}
                    >
                        {Math.round(zoom * 100)}%
                    </span>
                    <button
                        onClick={zoomIn}
                        style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                        }}
                    >
                        +
                    </button>
                    <button
                        onClick={resetZoom}
                        style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                        }}
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Waveform container */}
            <div
                ref={waveformRef}
                onDoubleClick={handleDoubleClick}
                style={{
                    width: '100%',
                    cursor: 'pointer',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    minHeight: `${height}px`,
                }}
            />

            {/* Markers overlay */}
            {markers.length > 0 && duration > 0 && (
                <div
                    style={{
                        position: 'relative',
                        height: '40px',
                        marginTop: '8px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '4px',
                        border: '1px solid #e5e7eb',
                    }}
                >
                    {markers.map((marker) => (
                        <div
                            key={marker.id}
                            onClick={() => {
                                onMarkerClick?.(marker);
                                seekTo(marker.timestamp);
                            }}
                            style={{
                                position: 'absolute',
                                left: `${(marker.timestamp / duration) * 100}%`,
                                transform: 'translateX(-50%)',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                zIndex: 10,
                            }}
                        >
                            <div
                                style={{
                                    width: '3px',
                                    height: '25px',
                                    backgroundColor: marker.color || '#f59e0b',
                                    marginBottom: '2px',
                                    borderRadius: '1px',
                                }}
                            />
                            <span
                                style={{
                                    fontSize: '10px',
                                    color: '#374151',
                                    backgroundColor: 'white',
                                    padding: '2px 4px',
                                    borderRadius: '3px',
                                    border: '1px solid #d1d5db',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '80px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {marker.label}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Instructions */}
            <div
                style={{
                    marginTop: '12px',
                    fontSize: '12px',
                    color: '#6b7280',
                    textAlign: 'center',
                    padding: '8px',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '4px',
                    border: '1px solid #bae6fd',
                }}
            >
                🎯 <strong>Scholar Tools:</strong> Double-click waveform to add
                markers • Click markers to jump to timestamp • Use zoom for
                precision analysis
            </div>
        </div>
    );
};

export default ScholarWaveformPlayer;
