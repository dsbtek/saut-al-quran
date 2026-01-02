import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface Marker {
    id: string;
    time: number;
    label: string;
    color?: string;
}

interface LoopRegion {
    id: string;
    start: number;
    end: number;
    color?: string;
}

interface InteractiveWaveformProps {
    audioUrl: string;
    markers?: Marker[];
    loopRegions?: LoopRegion[];
    onMarkerAdd?: (time: number) => void;
    onMarkerClick?: (marker: Marker) => void;
    onRegionSelect?: (start: number, end: number) => void;
    onTimeUpdate?: (currentTime: number) => void;
    onDuration?: (duration: number) => void;
    height?: number;
    waveColor?: string;
    progressColor?: string;
    cursorColor?: string;
    responsive?: boolean;
}

const InteractiveWaveform: React.FC<any> = (props) => {
    const {
        audioUrl,
        markers = [],
        loopRegions = [],
        onMarkerAdd,
        onMarkerClick,
        onRegionSelect,
        onTimeUpdate,
        onDuration,
        height = 128,
        waveColor = '#d1d5db',
        progressColor = '#3b82f6',
        cursorColor = '#ef4444',
        responsive = true
    } = props;

    const waveformRef = useRef<HTMLDivElement>(null);
    const wavesurfer = useRef<WaveSurfer | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initialize WaveSurfer
    useEffect(() => {
        if (!waveformRef.current) return;

        try {
            wavesurfer.current = WaveSurfer.create({
                container: waveformRef.current,
                waveColor,
                progressColor,
                cursorColor,
                height,
                responsive,
                normalize: true,
                backend: 'WebAudio',
                interact: true,
                hideScrollbar: false,
                cursorWidth: 2,
                barWidth: 2,
                barGap: 1,
                barRadius: 1,
            });

            // Event listeners
            wavesurfer.current.on('ready', () => {
                setIsLoading(false);
                setDuration(wavesurfer.current?.getDuration() || 0);
            });

            wavesurfer.current.on('play', () => setIsPlaying(true));
            wavesurfer.current.on('pause', () => setIsPlaying(false));
            
            wavesurfer.current.on('audioprocess', (time: number) => {
                setCurrentTime(time);
                onTimeUpdate?.(time);
            });

            wavesurfer.current.on('seek', (progress: number) => {
                const time = progress * (wavesurfer.current?.getDuration() || 0);
                setCurrentTime(time);
                onTimeUpdate?.(time);
            });

            wavesurfer.current.on('error', (error: Error) => {
                setError(error.message);
                setIsLoading(false);
            });

            // Load audio
            wavesurfer.current.load(audioUrl);

        } catch (err) {
            setError('Failed to initialize waveform');
            setIsLoading(false);
        }

        return () => {
            wavesurfer.current?.destroy();
        };
    }, [audioUrl, height, waveColor, progressColor, cursorColor, responsive, onTimeUpdate]);

    // Handle zoom changes
    useEffect(() => {
        if (wavesurfer.current) {
            wavesurfer.current.zoom(zoom);
        }
    }, [zoom]);

    // Handle double-click to add markers
    const handleDoubleClick = (e: React.MouseEvent) => {
        if (!wavesurfer.current || !onMarkerAdd) return;

        const rect = waveformRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const progress = x / rect.width;
        const time = progress * wavesurfer.current.getDuration();
        
        onMarkerAdd(time);
    };

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
    const zoomIn = () => setZoom(prev => Math.min(prev * 1.5, 10));
    const zoomOut = () => setZoom(prev => Math.max(prev / 1.5, 1));
    const resetZoom = () => setZoom(1);

    // keep a stable ref to the onTimeUpdate callback so event listeners don't have to be reattached
    const onTimeUpdateRef = useRef<typeof props.onTimeUpdate | null>(null);
    const onDurationRef = useRef<typeof props.onDuration | null>(null);

    useEffect(() => {
        onTimeUpdateRef.current = props.onTimeUpdate ?? null;
    }, [props.onTimeUpdate]);

    useEffect(() => {
        onDurationRef.current = props.onDuration ?? null;
    }, [props.onDuration]);

    // attach listeners to audio element for loadedmetadata and timeupdate
    useEffect(() => {
        const audioEl = audioRef.current;
        if (!audioEl) return;

        const handleLoadedMetadata = () => {
            const d = audioEl.duration;
            if (onDurationRef.current) {
                try { onDurationRef.current(d); } catch (e) { /* swallow callback errors */ }
            }
        };

        // timeupdate is sufficient; we forward currentTime via stable ref
        const handleTimeUpdate = () => {
            const t = audioEl.currentTime;
            if (onTimeUpdateRef.current) {
                try { onTimeUpdateRef.current(t); } catch (e) { /* swallow callback errors */ }
            }
        };

        audioEl.addEventListener('loadedmetadata', handleLoadedMetadata);
        audioEl.addEventListener('timeupdate', handleTimeUpdate);

        // also call duration immediately if metadata already loaded
        if (!isNaN(audioEl.duration) && audioEl.duration > 0) {
            handleLoadedMetadata();
        }

        return () => {
            audioEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audioEl.removeEventListener('timeupdate', handleTimeUpdate);
        };
    }, [props.audioUrl]);

    if (error) {
        return (
            <div style={{ 
                padding: '20px', 
                textAlign: 'center', 
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#dc2626'
            }}>
                <p>Error loading audio: {error}</p>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', backgroundColor: '#f9fafb', borderRadius: '8px', padding: '16px' }}>
            {/* Controls */}
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '8px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                            fontWeight: '500'
                        }}
                    >
                        {isLoading ? '⏳' : isPlaying ? '⏸️ Pause' : '▶️ Play'}
                    </button>
                    
                    <span style={{ fontSize: '14px', color: '#6b7280', fontFamily: 'monospace' }}>
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>Zoom:</span>
                    <button onClick={zoomOut} style={{ padding: '4px 8px', fontSize: '12px' }}>-</button>
                    <span style={{ fontSize: '12px', minWidth: '40px', textAlign: 'center' }}>
                        {Math.round(zoom * 100)}%
                    </span>
                    <button onClick={zoomIn} style={{ padding: '4px 8px', fontSize: '12px' }}>+</button>
                    <button onClick={resetZoom} style={{ padding: '4px 8px', fontSize: '12px' }}>Reset</button>
                </div>
            </div>

            {/* Timeline ruler */}
            <div style={{ 
                height: '20px', 
                backgroundColor: '#e5e7eb', 
                marginBottom: '4px',
                position: 'relative',
                borderRadius: '4px'
            }}>
                {duration > 0 && Array.from({ length: Math.ceil(duration / 10) }, (_, i) => (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            left: `${(i * 10 / duration) * 100}%`,
                            height: '100%',
                            borderLeft: '1px solid #9ca3af',
                            fontSize: '10px',
                            color: '#6b7280',
                            paddingLeft: '2px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        {i * 10}s
                    </div>
                ))}
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
                    backgroundColor: 'white'
                }}
            />

            {/* Markers overlay */}
            {markers.length > 0 && (
                <div style={{ 
                    position: 'relative', 
                    height: '30px', 
                    marginTop: '8px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '4px'
                }}>
                    {markers.map(marker => (
                        <div
                            key={marker.id}
                            onClick={() => onMarkerClick?.(marker)}
                            style={{
                                position: 'absolute',
                                left: `${(marker.time / duration) * 100}%`,
                                transform: 'translateX(-50%)',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center'
                            }}
                        >
                            <div style={{
                                width: '2px',
                                height: '20px',
                                backgroundColor: marker.color || '#f59e0b',
                                marginBottom: '2px'
                            }} />
                            <span style={{
                                fontSize: '10px',
                                color: '#374151',
                                backgroundColor: 'white',
                                padding: '1px 4px',
                                borderRadius: '2px',
                                border: '1px solid #d1d5db',
                                whiteSpace: 'nowrap'
                            }}>
                                {marker.label}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Instructions */}
            <div style={{ 
                marginTop: '12px', 
                fontSize: '12px', 
                color: '#6b7280',
                textAlign: 'center'
            }}>
                Double-click on waveform to add markers • Click markers to edit • Use zoom controls for precision
            </div>

            <audio ref={audioRef} src={audioUrl} preload="metadata" style={{ display: 'none' }} />
        </div>
    );
};

export default InteractiveWaveform;
