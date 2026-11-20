import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Marker, LoopRegion } from '../types';

interface UnifiedWaveformPlayerProps {
    audioUrl: string;
    markers?: Marker[];
    loopRegions?: LoopRegion[];
    externalSeekTime?: number | null;
    onMarkerClick?: (marker: Marker) => void;
    onTimeUpdate?: (time: number) => void;
    onDuration?: (duration: number) => void;
    onAddMarkerAtTime?: (time: number) => void;
    height?: number;
}

const formatTime = (seconds: number): string => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const UnifiedWaveformPlayer: React.FC<UnifiedWaveformPlayerProps> = ({
    audioUrl,
    markers = [],
    loopRegions = [],
    externalSeekTime = null,
    onMarkerClick,
    onTimeUpdate,
    onDuration,
    onAddMarkerAtTime,
    height = 112,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [zoom, setZoom] = useState(1);
    const [activeLoop, setActiveLoop] = useState<{ start: number; end: number; label?: string } | null>(null);

    const activeLoopRef = useRef(activeLoop);
    activeLoopRef.current = activeLoop;

    useEffect(() => {
        if (!containerRef.current || !audioUrl) return;

        setIsLoading(true);
        setError(null);
        setIsPlaying(false);
        setCurrentTime(0);

        const ws = WaveSurfer.create({
            container: containerRef.current,
            waveColor: '#cbd5e1',
            progressColor: '#059669',
            cursorColor: '#d97706',
            cursorWidth: 2,
            height,
            barWidth: 2,
            barGap: 2,
            barRadius: 2,
            normalize: true,
        });

        wavesurferRef.current = ws;

        ws.on('ready', () => {
            const dur = ws.getDuration();
            setDuration(dur);
            setIsLoading(false);
            onDuration?.(dur);
        });

        ws.on('play', () => setIsPlaying(true));
        ws.on('pause', () => setIsPlaying(false));
        ws.on('finish', () => setIsPlaying(false));

        ws.on('timeupdate', (time: number) => {
            setCurrentTime(time);
            onTimeUpdate?.(time);

            const loop = activeLoopRef.current;
            if (loop && time >= loop.end) {
                ws.setTime(loop.start);
            }
        });

        ws.on('error', (err) => {
            setError(err instanceof Error ? err.message : 'Failed to load audio');
            setIsLoading(false);
        });

        ws.load(audioUrl);

        return () => {
            ws.destroy();
            wavesurferRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioUrl, height]);

    useEffect(() => {
        if (wavesurferRef.current && !isLoading && duration > 0) {
            try {
                wavesurferRef.current.zoom(zoom > 1 ? zoom * 30 : 0);
            } catch {
                // Ignore zoom if audio not ready
            }
        }
    }, [zoom, isLoading, duration]);

    useEffect(() => {
        if (wavesurferRef.current) {
            wavesurferRef.current.setPlaybackRate(playbackRate);
        }
    }, [playbackRate]);

    useEffect(() => {
        if (externalSeekTime !== null && wavesurferRef.current && duration > 0) {
            const clamped = Math.max(0, Math.min(externalSeekTime, duration));
            wavesurferRef.current.setTime(clamped);
            setCurrentTime(clamped);
        }
    }, [externalSeekTime, duration]);

    const togglePlay = () => {
        wavesurferRef.current?.playPause();
    };

    const skip = (delta: number) => {
        if (!wavesurferRef.current || duration <= 0) return;
        const next = Math.max(0, Math.min(currentTime + delta, duration));
        wavesurferRef.current.setTime(next);
        setCurrentTime(next);
    };

    const toggleLoopRegion = (loop: { start: number; end: number; label?: string }) => {
        if (
            activeLoop &&
            activeLoop.start === loop.start &&
            activeLoop.end === loop.end
        ) {
            setActiveLoop(null);
        } else {
            setActiveLoop(loop);
            if (wavesurferRef.current) {
                wavesurferRef.current.setTime(loop.start);
                wavesurferRef.current.play();
            }
        }
    };

    return (
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            {error && (
                <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="relative">
                {isLoading && (
                    <div className="flex h-28 items-center justify-center text-sm text-stone-500">
                        Loading audio waveform...
                    </div>
                )}
                <div ref={containerRef} className={isLoading ? 'hidden' : 'w-full'} />

                {/* Marker pins overlay */}
                {!isLoading && duration > 0 && markers.length > 0 && (
                    <div className="relative mt-1 h-6 w-full border-t border-stone-100">
                        {markers.map((marker) => {
                            const leftPct = Math.min(98, Math.max(0, (marker.timestamp / duration) * 100));
                            return (
                                <button
                                    key={marker.id}
                                    type="button"
                                    title={`${marker.label} (${formatTime(marker.timestamp)})`}
                                    onClick={() => {
                                        if (wavesurferRef.current) {
                                            wavesurferRef.current.setTime(marker.timestamp);
                                        }
                                        onMarkerClick?.(marker);
                                    }}
                                    style={{ left: `${leftPct}%`, backgroundColor: marker.color || '#d97706' }}
                                    className="absolute top-1 -translate-x-1/2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white shadow hover:scale-110 transition-transform"
                                >
                                    •
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Primary transport controls */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-3">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => skip(-5)}
                        disabled={isLoading}
                        className="rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                    >
                        -5s
                    </button>
                    <button
                        type="button"
                        onClick={togglePlay}
                        disabled={isLoading}
                        className="rounded-lg bg-emerald-800 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
                    >
                        {isPlaying ? 'Pause' : 'Play'}
                    </button>
                    <button
                        type="button"
                        onClick={() => skip(5)}
                        disabled={isLoading}
                        className="rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                    >
                        +5s
                    </button>
                    <span className="ml-2 font-mono text-xs text-stone-600">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-stone-500">Speed</span>
                        {[0.75, 1, 1.25].map((rate) => (
                            <button
                                key={rate}
                                type="button"
                                onClick={() => setPlaybackRate(rate)}
                                className={`rounded px-2 py-1 text-xs font-medium ${
                                    playbackRate === rate
                                        ? 'bg-emerald-100 text-emerald-900'
                                        : 'text-stone-600 hover:bg-stone-100'
                                }`}
                            >
                                {rate}x
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-stone-500">Zoom</span>
                        <input
                            type="range"
                            min={1}
                            max={5}
                            step={0.5}
                            value={zoom}
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            className="w-20 accent-emerald-700"
                        />
                    </div>

                    {onAddMarkerAtTime && (
                        <button
                            type="button"
                            onClick={() => onAddMarkerAtTime(currentTime)}
                            className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                        >
                            + Marker @ {formatTime(currentTime)}
                        </button>
                    )}
                </div>
            </div>

            {/* Saved Loop Regions */}
            {loopRegions.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
                    <span className="text-xs font-medium text-stone-500">Practice Loops:</span>
                    {loopRegions.map((lr) => {
                        const isActive =
                            activeLoop?.start === lr.start_time && activeLoop?.end === lr.end_time;
                        return (
                            <button
                                key={lr.id}
                                type="button"
                                onClick={() =>
                                    toggleLoopRegion({
                                        start: lr.start_time,
                                        end: lr.end_time,
                                        label: lr.label,
                                    })
                                }
                                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                                    isActive
                                        ? 'border-emerald-600 bg-emerald-700 text-white'
                                        : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                                }`}
                            >
                                🔁 {lr.label} ({formatTime(lr.start_time)}–{formatTime(lr.end_time)})
                            </button>
                        );
                    })}
                    {activeLoop && (
                        <button
                            type="button"
                            onClick={() => setActiveLoop(null)}
                            className="text-xs font-medium text-red-600 hover:underline"
                        >
                            Stop Loop
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default UnifiedWaveformPlayer;
