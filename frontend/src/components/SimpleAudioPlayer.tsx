import React, { useRef, useState, useEffect } from 'react';
import { Marker } from '../types';

interface SimpleAudioPlayerProps {
    audioUrl: string;
    markers?: Marker[];
    onMarkerClick?: (marker: Marker) => void;
    onTimeUpdate?: (currentTime: number) => void;
}

const SimpleAudioPlayer: React.FC<SimpleAudioPlayerProps> = ({
    audioUrl,
    markers = [],
    onMarkerClick,
    onTimeUpdate,
}) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            const time = audio.currentTime;
            setCurrentTime(time);
            onTimeUpdate?.(time);
        };

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [onTimeUpdate]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const seekTo = (time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
        }
    };

    const togglePlayPause = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const progress = x / rect.width;
        const time = progress * duration;
        seekTo(time);
    };

    return (
        <div style={{
            width: '100%',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #e5e7eb'
        }}>
            {/* Audio element */}
            <audio ref={audioRef} src={audioUrl} preload="metadata" />

            {/* Controls */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
            }}>
                <button
                    onClick={togglePlayPause}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: isPlaying ? '#ef4444' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}
                >
                    {isPlaying ? '⏸️ Pause' : '▶️ Play'}
                </button>

                <span style={{ fontSize: '14px', color: '#6b7280', fontFamily: 'monospace' }}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                </span>
            </div>

            {/* Progress bar */}
            <div
                onClick={handleProgressClick}
                style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    position: 'relative',
                    marginBottom: '16px'
                }}
            >
                <div
                    style={{
                        width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                        height: '100%',
                        backgroundColor: '#3b82f6',
                        borderRadius: '4px',
                        transition: 'width 0.1s ease'
                    }}
                />
            </div>

            {/* Markers */}
            {markers.length > 0 && duration > 0 && (
                <div style={{ marginBottom: '16px' }}>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#374151' }}>
                        Markers ({markers.length})
                    </h5>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px'
                    }}>
                        {markers.map(marker => (
                            <button
                                key={marker.id}
                                onClick={() => {
                                    seekTo(marker.timestamp);
                                    onMarkerClick?.(marker);
                                }}
                                style={{
                                    padding: '4px 8px',
                                    backgroundColor: marker.color || '#f59e0b',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: '500'
                                }}
                                title={`Jump to ${formatTime(marker.timestamp)}`}
                            >
                                {marker.label} ({formatTime(marker.timestamp)})
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick seek buttons */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '12px'
            }}>
                <button
                    onClick={() => seekTo(Math.max(0, currentTime - 10))}
                    style={{
                        padding: '4px 8px',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                    ⏪ -10s
                </button>
                <button
                    onClick={() => seekTo(Math.max(0, currentTime - 5))}
                    style={{
                        padding: '4px 8px',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                    ⏪ -5s
                </button>
                <button
                    onClick={() => seekTo(Math.min(duration, currentTime + 5))}
                    style={{
                        padding: '4px 8px',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                    +5s ⏩
                </button>
                <button
                    onClick={() => seekTo(Math.min(duration, currentTime + 10))}
                    style={{
                        padding: '4px 8px',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                    +10s ⏩
                </button>
            </div>

            {/* Instructions */}
            <div style={{
                fontSize: '12px',
                color: '#6b7280',
                textAlign: 'center',
                padding: '8px',
                backgroundColor: '#f0f9ff',
                borderRadius: '4px',
                border: '1px solid #bae6fd'
            }}>
                🎵 <strong>Simple Audio Player:</strong> Click progress bar to seek • Use quick seek buttons for precision • Click markers to jump to timestamps
            </div>
        </div>
    );
};

export default SimpleAudioPlayer;
