import React, { useEffect, useRef, useState } from 'react';
import { Marker } from '../types';

interface WaveformPlayerProps {
    audioUrl: string;
    markers?: Marker[];
    onMarkerAdd?: (timestamp: number) => void;
    onMarkerClick?: (marker: Marker) => void;
    height?: number;
}

const WaveformPlayer: React.FC<WaveformPlayerProps> = ({
    audioUrl,
    markers = [],
    onMarkerAdd,
    onMarkerClick,
    height = 100,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadAudio = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(audioUrl);
                const arrayBuffer = await response.arrayBuffer();
                const audioContext = new (window.AudioContext ||
                    (window as any).webkitAudioContext)();
                const buffer = await audioContext.decodeAudioData(arrayBuffer);
                setAudioBuffer(buffer);
                setDuration(buffer.duration);
            } catch (error) {
                console.error('Error loading audio:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (audioUrl) {
            loadAudio();
        }
    }, [audioUrl]);

    useEffect(() => {
        if (audioBuffer && canvasRef.current) {
            drawWaveform();
        }
    }, [audioBuffer, currentTime, markers]);

    const drawWaveform = () => {
        const canvas = canvasRef.current;
        if (!canvas || !audioBuffer) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw waveform
        const data = audioBuffer.getChannelData(0);
        const step = Math.ceil(data.length / width);
        const amp = height / 2;

        ctx.fillStyle = '#e0e0e0';
        ctx.beginPath();
        ctx.moveTo(0, amp);

        for (let i = 0; i < width; i++) {
            let min = 1.0;
            let max = -1.0;
            for (let j = 0; j < step; j++) {
                const datum = data[i * step + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            ctx.lineTo(i, (1 + min) * amp);
        }

        for (let i = width - 1; i >= 0; i--) {
            let min = 1.0;
            let max = -1.0;
            for (let j = 0; j < step; j++) {
                const datum = data[i * step + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            ctx.lineTo(i, (1 + max) * amp);
        }

        ctx.closePath();
        ctx.fill();

        // Draw progress
        if (duration > 0) {
            const progressX = (currentTime / duration) * width;
            ctx.fillStyle = '#007bff';
            ctx.fillRect(0, 0, progressX, height);
            ctx.globalCompositeOperation = 'source-atop';

            // Redraw waveform in progress area
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(0, amp);

            for (let i = 0; i < progressX; i++) {
                let min = 1.0;
                let max = -1.0;
                for (let j = 0; j < step; j++) {
                    const datum = data[i * step + j];
                    if (datum < min) min = datum;
                    if (datum > max) max = datum;
                }
                ctx.lineTo(i, (1 + min) * amp);
            }

            for (let i = progressX - 1; i >= 0; i--) {
                let min = 1.0;
                let max = -1.0;
                for (let j = 0; j < step; j++) {
                    const datum = data[i * step + j];
                    if (datum < min) min = datum;
                    if (datum > max) max = datum;
                }
                ctx.lineTo(i, (1 + max) * amp);
            }

            ctx.closePath();
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
        }

        // Draw markers
        markers.forEach((marker) => {
            const markerX = (marker.timestamp / duration) * width;
            ctx.strokeStyle = '#ff4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(markerX, 0);
            ctx.lineTo(markerX, height);
            ctx.stroke();

            // Draw marker label
            ctx.fillStyle = '#ff4444';
            ctx.font = '12px Arial';
            ctx.fillText(marker.label, markerX + 5, 15);
        });

        // Draw current time indicator
        if (duration > 0) {
            const currentX = (currentTime / duration) * width;
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(currentX, 0);
            ctx.lineTo(currentX, height);
            ctx.stroke();
        }
    };

    const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        const audio = audioRef.current;
        if (!canvas || !audio || !duration) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const clickTime = (x / canvas.width) * duration;

        // Check if clicking on a marker
        const clickedMarker = markers.find((marker) => {
            const markerX = (marker.timestamp / duration) * canvas.width;
            return Math.abs(x - markerX) < 10;
        });

        if (clickedMarker && onMarkerClick) {
            onMarkerClick(clickedMarker);
        } else {
            // Seek to clicked position
            audio.currentTime = clickTime;
            setCurrentTime(clickTime);
        }
    };

    const handleDoubleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!onMarkerAdd || !duration) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const clickTime = (x / canvas.width) * duration;

        onMarkerAdd(clickTime);
    };

    const togglePlayPause = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isLoading) {
        return <div>Loading waveform...</div>;
    }

    return (
        <div
            style={{
                width: '100%',
                border: '1px solid #ddd',
                borderRadius: '4px',
                padding: '10px',
            }}
        >
            <canvas
                ref={canvasRef}
                width={800}
                height={height}
                style={{
                    width: '100%',
                    height: `${height}px`,
                    cursor: 'pointer',
                }}
                onClick={handleCanvasClick}
                onDoubleClick={handleDoubleClick}
            />

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '10px',
                }}
            >
                <button onClick={togglePlayPause} className="btn btn-primary">
                    {isPlaying ? '⏸️' : '▶️'}
                </button>

                <div style={{ fontSize: '14px' }}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                </div>
            </div>

            <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={() =>
                    setCurrentTime(audioRef.current?.currentTime || 0)
                }
                onLoadedMetadata={() =>
                    setDuration(audioRef.current?.duration || 0)
                }
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
            />

            {onMarkerAdd && (
                <div
                    style={{
                        marginTop: '10px',
                        fontSize: '12px',
                        color: '#666',
                    }}
                >
                    Double-click on waveform to add markers
                </div>
            )}
        </div>
    );
};

export default WaveformPlayer;
