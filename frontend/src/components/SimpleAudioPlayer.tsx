import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Marker } from '../types';

interface SimpleAudioPlayerProps {
    audioUrl: string;
    markers?: Marker[];
    onMarkerClick?: (m: Marker) => void;
    onTimeUpdate?: (t: number) => void;
}

const SimpleAudioPlayer: React.FC<SimpleAudioPlayerProps> = ({
    audioUrl,
    markers = [],
    onMarkerClick,
    onTimeUpdate
}) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [volume, setVolume] = useState(1);

    /** Safe time formatter */
    const formatTime = useCallback((seconds: number): string => {
        if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
            return "0:00";
        }
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, "0")}`;
    }, []);

    /** Handle audio events */
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleLoadStart = () => {
            setIsLoading(true);
            setError(null);
        };

        const handleLoadedMetadata = () => {
            console.log("Audio metadata loaded, duration:", audio.duration);
            setDuration(audio.duration);
            setIsLoading(false);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
            onTimeUpdate?.(audio.currentTime);
        };

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => setIsPlaying(false);

        const handleError = (e: Event) => {
            console.error("Audio error:", audio.error);
            setIsLoading(false);
            setIsPlaying(false);
            
            switch (audio.error?.code) {
                case MediaError.MEDIA_ERR_ABORTED:
                    setError("Audio loading was aborted");
                    break;
                case MediaError.MEDIA_ERR_NETWORK:
                    setError("Network error loading audio");
                    break;
                case MediaError.MEDIA_ERR_DECODE:
                    setError("Audio format not supported");
                    break;
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    setError("Audio format not supported");
                    break;
                default:
                    setError("Failed to load audio file");
            }
        };

        const handleCanPlay = () => {
            setIsLoading(false);
            setError(null);
        };

        // Attach event listeners
        audio.addEventListener('loadstart', handleLoadStart);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);
        audio.addEventListener('canplay', handleCanPlay);

        // Set initial volume
        audio.volume = volume;

        return () => {
            // Cleanup event listeners
            audio.removeEventListener('loadstart', handleLoadStart);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
            audio.removeEventListener('canplay', handleCanPlay);
        };
    }, [onTimeUpdate, volume]);

    /** Toggle play/pause with error handling */
    const togglePlayPause = async () => {
        const audio = audioRef.current;
        if (!audio) return;

        try {
            if (isPlaying) {
                audio.pause();
            } else {
                await audio.play();
            }
        } catch (err: any) {
            console.error("Playback error:", err);
            setError(`Playback failed: ${err.message}`);
        }
    };

    /** Seek to specific time */
    const seekTo = useCallback((time: number) => {
        const audio = audioRef.current;
        if (!audio) return;
        
        const safeTime = Math.max(0, Math.min(time, duration || 0));
        audio.currentTime = safeTime;
        setCurrentTime(safeTime);
    }, [duration]);

    /** Handle progress bar click */
    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!duration) return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        const progress = (e.clientX - rect.left) / rect.width;
        seekTo(progress * duration);
    };

    /** Handle quick seek buttons */
    const handleQuickSeek = (seconds: number) => {
        seekTo(currentTime + seconds);
    };

    /** Handle volume change */
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
    };

    /** Handle marker click */
    const handleMarkerClick = (marker: Marker) => {
        seekTo(marker.timestamp);
        onMarkerClick?.(marker);
    };

    /** Keyboard shortcuts */
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement) return;
            
            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    togglePlayPause();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    handleQuickSeek(-5);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    handleQuickSeek(5);
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [currentTime, duration]);

    return (
        <div className="w-full bg-white p-4 border rounded-lg shadow-sm">
            {/* Hidden audio element */}
            <audio 
                ref={audioRef} 
                src={audioUrl} 
                preload="metadata"
                onError={(e) => console.error("Audio element error:", e)}
            />

            {/* Error Display */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700">
                        <span className="text-lg">⚠️</span>
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                </div>
            )}

            {/* Main Controls */}
            <div className="flex items-center gap-4 mb-4">
                <button
                    onClick={togglePlayPause}
                    disabled={isLoading || !!error}
                    className={`flex items-center justify-center w-12 h-12 rounded-full text-white font-medium transition-all ${
                        isLoading ? 'bg-gray-400 cursor-not-allowed' :
                        error ? 'bg-gray-400 cursor-not-allowed' :
                        isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                    aria-label={isPlaying ? "Pause audio" : "Play audio"}
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : isPlaying ? (
                        <span className="text-lg">⏸</span>
                    ) : (
                        <span className="text-lg ml-1">▶</span>
                    )}
                </button>

                {/* Time Display */}
                <div className="flex items-center gap-2 min-w-[120px]">
                    <span className="font-mono text-sm text-gray-700 tabular-nums">
                        {formatTime(currentTime)}
                    </span>
                    <span className="text-gray-400">/</span>
                    <span className="font-mono text-sm text-gray-500 tabular-nums">
                        {formatTime(duration)}
                    </span>
                </div>

                {/* Volume Control */}
                <div className="flex items-center gap-2 ml-auto">
                    <span className="text-gray-500 text-sm">🔊</span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-20 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                    />
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
                <div
                    className="w-full h-3 bg-gray-200 rounded-full cursor-pointer relative group"
                    onClick={handleProgressClick}
                    role="slider"
                    aria-label="Audio progress"
                    aria-valuenow={currentTime}
                    aria-valuemin={0}
                    aria-valuemax={duration}
                >
                    <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-100"
                        style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                    />
                    {/* Hover indicator */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="h-full bg-blue-300 rounded-full" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
                    </div>
                </div>
            </div>

            {/* Markers Section */}
            {markers.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-blue-500 rounded" />
                        Markers ({markers.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {markers.map(marker => (
                            <button
                                key={marker.id}
                                onClick={() => handleMarkerClick(marker)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white transition-all hover:scale-105 active:scale-95 shadow-sm"
                                style={{ 
                                    backgroundColor: marker.color || '#f59e0b',
                                    opacity: currentTime >= marker.timestamp - 2 && currentTime <= marker.timestamp + 2 ? 1 : 0.9
                                }}
                                title={`Jump to ${formatTime(marker.timestamp)}`}
                            >
                                <span className="w-2 h-2 bg-white rounded-full" />
                                {marker.label}
                                <span className="text-xs opacity-90 font-mono">
                                    ({formatTime(marker.timestamp)})
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Seek Controls */}
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    {[-30, -10, 10, 30].map(seconds => (
                        <button
                            key={seconds}
                            onClick={() => handleQuickSeek(seconds)}
                            disabled={isLoading || !!error}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 text-sm rounded-lg font-medium transition-colors"
                            title={`Seek ${seconds > 0 ? '+' : ''}${seconds} seconds`}
                        >
                            {seconds > 0 ? '+' : ''}{seconds}s
                        </button>
                    ))}
                </div>

                {/* Keyboard Shortcuts Hint */}
                <div className="text-xs text-gray-500 text-right">
                    <div>Space: Play/Pause</div>
                    <div>←→: Seek 5s</div>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && !error && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700">
                        <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Loading audio...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SimpleAudioPlayer;